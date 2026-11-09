/* eslint-disable no-console */
'use strict';
/*
 * Photo sharpness check of every built page in headless Chrome (CDP). Needs the site served locally.
 *   node scripts/qa/qa-sharpness.js [baseUrl]
 * For each page at 390x900 @3x, 834x1112 @2x and 1440x1000 @2x every visible <img> is loaded (lazy images are
 * forced eager), then the source pixels it needs are computed: the rendered box width, or for object-fit: cover
 * the covering width max(boxW, boxH * naturalW / naturalH), times the device pixel ratio. FAIL when the file the
 * browser chose is < 0.9x the needed width although a larger variant exists in its srcset (= a wrong `sizes`).
 * WARN (does not fail) when even the largest variant is < 0.9x the needed width (= the source is too small).
 */
const { builtPages } = require('../../tests/helpers');
const { requireServer, launchChrome, connectPage } = require('./common');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const VIEWPORTS = [
  { w: 390, h: 900, dpr: 3, mobile: true },
  { w: 834, h: 1112, dpr: 2, mobile: true },
  { w: 1440, h: 1000, dpr: 2, mobile: false },
];
const PORT = 9361;
const TOLERANCE = 0.9;
const VERBOSE = !!process.env.QA_VERBOSE; // QA_VERBOSE=1 prints every image

function urlOf(rel) { return BASE + '/' + rel.replace(/index\.html$/, ''); }

// Runs in the page: one record per visible image.
async function collect() {
  const imgs = [...document.images];
  imgs.forEach((i) => { if (i.loading === 'lazy') i.loading = 'eager'; });
  await Promise.all(imgs.map((i) => (i.complete && i.currentSrc ? 0 : new Promise((r) => { i.addEventListener('load', r); i.addEventListener('error', r); setTimeout(r, 6000); }))));
  await new Promise((r) => setTimeout(r, 150));
  const dpr = devicePixelRatio;
  const out = [];
  for (const i of document.images) {
    const r = i.getBoundingClientRect();
    const cs = getComputedStyle(i);
    if (r.width < 4 || r.height < 4 || cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (!i.currentSrc || !i.naturalWidth) { out.push({ src: i.getAttribute('src'), broken: true }); continue; }
    let cover = r.width;
    if (cs.objectFit === 'cover' || cs.objectFit === 'none') cover = Math.max(r.width, (r.height * i.naturalWidth) / i.naturalHeight);
    const ext = i.currentSrc.split('?')[0].split('.').pop();
    const pic = i.parentElement && i.parentElement.tagName === 'PICTURE' ? i.parentElement : null;
    const sets = [i.srcset];
    if (pic) for (const s of pic.querySelectorAll('source')) sets.push(s.srcset);
    // naturalWidth of a srcset image is density-corrected by `sizes`, so the real file width comes from its w descriptor
    const cur = new URL(i.currentSrc).pathname;
    let largest = 0, chosen = 0;
    for (const set of sets) {
      for (const m of set.matchAll(/(\S+)\s+(\d+)w/g)) {
        if (!m[1].endsWith('.' + ext)) continue;
        largest = Math.max(largest, +m[2]);
        if (new URL(m[1], location.href).pathname === cur) chosen = +m[2];
      }
    }
    out.push({ src: new URL(i.currentSrc).pathname, box: Math.round(r.width) + 'x' + Math.round(r.height), fit: cs.objectFit, nat: chosen || i.naturalWidth, need: Math.round(cover * dpr), largest, sizes: i.sizes });
  }
  return out;
}
const COLLECT = `(${collect.toString()})()`;

(async () => {
  await requireServer(BASE);
  const ch = launchChrome(PORT, 'qa-sharpness');
  const fails = [];
  const warns = new Map();
  let cdp;
  let views = 0, imgCount = 0;
  try {
    cdp = await connectPage(PORT);
    const { send, ev } = cdp;
    await send('Page.enable');
    const pages = builtPages();
    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: vp.mobile });
      for (const rel of pages) {
        await send('Page.navigate', { url: urlOf(rel) });
        await sleep(400);
        await ev('new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r))');
        const list = (await ev(COLLECT)) || [];
        views++;
        const tag = `${vp.w}@${vp.dpr}x ${rel.replace(/index\.html$/, '')}`;
        for (const im of list) {
          imgCount++;
          if (VERBOSE) console.log(`${tag} ${im.src} box ${im.box} ${im.fit} have ${im.nat} need ${im.need} sizes="${im.sizes}"`);
          if (im.broken) { fails.push(`${tag}: image did not load (${im.src})`); continue; }
          const short = im.nat < TOLERANCE * im.need;
          if (short && im.largest > im.nat) fails.push(`${tag}: ${im.src} (${im.nat}w) needs ${im.need}px for a ${im.box} ${im.fit} box, ${im.largest}w exists -> fix sizes [sizes="${im.sizes}"]`);
          else if (short) {
            const key = im.src.replace(/-(400|480|560|640|800|1024|1200|2000)\./, '.');
            const w = warns.get(key) || { max: 0, nat: im.nat, need: 0, where: [] };
            w.need = Math.max(w.need, im.need); w.nat = Math.max(w.nat, im.nat);
            if (w.where.length < 3) w.where.push(tag);
            warns.set(key, w);
          }
        }
      }
    }
    console.log(`checked ${imgCount} images in ${views} page views (${pages.length} pages x ${VIEWPORTS.length} viewports)`);
  } finally {
    if (cdp) await cdp.close();
    ch.cleanup();
  }
  if (warns.size) {
    console.log('\nWARN: source too small (largest variant < 0.9x the needed width):');
    console.log('file'.padEnd(62) + 'have'.padStart(6) + 'need'.padStart(7) + '  first seen');
    for (const [k, w] of [...warns].sort((a, b) => b[1].need / b[1].nat - a[1].need / a[1].nat)) {
      console.log(k.padEnd(62) + String(w.nat).padStart(6) + String(w.need).padStart(7) + '  ' + w.where[0]);
    }
  }
  if (fails.length) { console.log('\nFAIL\n' + fails.join('\n')); process.exit(1); }
  console.log('\nPASS');
})();
