const test = require('node:test');
const assert = require('node:assert');
const { builtPages, read, internalRefs, resolves } = require('./helpers');

const pages = builtPages();

test('found built pages', () => {
  assert.ok(pages.length > 10, `only ${pages.length} pages found`);
});

// Pages that are not built yet; links to them may dangle until then (remove each entry when its page exists).
const PENDING = new Set([]);

test('every internal link and image resolves', () => {
  const failures = [];
  for (const p of pages) {
    for (const u of new Set(internalRefs(read(p)))) {
      if (PENDING.has(u)) continue;
      if (!resolves(u)) failures.push(`${p} -> ${u}`);
    }
  }
  assert.deepStrictEqual(failures, []);
});

test('no third-party hosts', () => {
  const bad = pages.filter((p) => /fonts\.googleapis|fonts\.gstatic|images\.unsplash|images\.pexels/.test(read(p)));
  assert.deepStrictEqual(bad, []);
});

test('JSON-LD parses', () => {
  const failures = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const p of pages) {
    let m;
    while ((m = re.exec(read(p)))) {
      try { JSON.parse(m[1]); } catch (e) { failures.push(`${p}: ${e.message}`); }
    }
  }
  assert.deepStrictEqual(failures, []);
});

test('exactly one h1', () => {
  const bad = [];
  for (const p of pages) {
    const n = (read(p).match(/<h1[\s>]/gi) || []).length;
    if (n !== 1) bad.push(`${p}: ${n} h1`);
  }
  assert.deepStrictEqual(bad, []);
});

test('no fake contact data', () => {
  const bad = pages.filter((p) => /905 123 456|office@noveris\.sk/.test(read(p)));
  assert.deepStrictEqual(bad, []);
});

function altHref(html, lang) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (/rel=["']alternate["']/i.test(tag) && new RegExp(`hreflang=["']${lang}["']`, 'i').test(tag)) {
      const m = tag.match(/href=["']([^"']*)["']/i);
      if (m) return m[1];
    }
  }
  return null;
}

function toRel(url) {
  let p = url.replace(/^https?:\/\/[^/]+/, '').split('#')[0].split('?')[0];
  if (p.endsWith('/')) p += 'index.html';
  return p.replace(/^\//, '');
}

test('hreflang pairs', () => {
  const failures = [];
  for (const p of pages) {
    const html = read(p);
    const en = altHref(html, 'en');
    if (!en || p.startsWith('en/')) continue;
    const target = toRel(en);
    if (!pages.includes(target)) { failures.push(`${p}: en target ${en} not built`); continue; }
    const back = altHref(read(target), 'sk');
    if (!back) { failures.push(`${p}: ${target} has no hreflang=sk`); continue; }
    if (toRel(back) !== p) failures.push(`${p}: ${target} points back to ${back}`);
  }
  assert.deepStrictEqual(failures, []);
});

test('sitemap lists only indexable pages', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  assert.ok(locs.length > 0);
  const failures = [];
  for (const loc of locs) {
    const rel = toRel(loc);
    if (!resolves('/' + rel)) { failures.push(`${loc} does not resolve`); continue; }
    if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(read(rel))) failures.push(`${loc} is noindex`);
  }
  assert.deepStrictEqual(failures, []);
});

// Enabled in later redesign tasks.
test.todo('no retired styles (/satin-button|satin-gradient|#735c00|#6d5b47|\\bdark:/)');
test('footer has real contact data (tel:+421915622518, kralusova@noveris.sk)', () => {
  const failures = [];
  for (const p of pages) {
    const m = /<footer[\s\S]*?<\/footer>/.exec(read(p));
    if (!m) { failures.push(`${p}: no footer`); continue; }
    for (const need of ['href="tel:+421915622518"', 'href="mailto:kralusova@noveris.sk"', 'Turčianska 42, 821 09 Bratislava']) {
      if (!m[0].includes(need)) failures.push(`${p}: footer lacks ${need}`);
    }
  }
  assert.deepStrictEqual(failures, []);
});

// ---- photos are complete ----
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./helpers');

const PHOTO_WIDTHS = ['-400', '-800', '-1200', ''];

function jpegHeight(file) {
  const buf = fs.readFileSync(file);
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buf.readUInt16BE(i + 5);
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function checkPhoto(name, failures) {
  for (const w of PHOTO_WIDTHS) {
    const base = path.join(ROOT, 'assets/photos/services', `${name}${w}`);
    for (const ext of ['jpg', 'avif']) {
      if (!fs.existsSync(`${base}.${ext}`)) failures.push(`missing ${name}${w}.${ext}`);
    }
    if (fs.existsSync(`${base}.avif`)) {
      const head = fs.readFileSync(`${base}.avif`).subarray(4, 12).toString('latin1');
      if (head !== 'ftypavif') failures.push(`${name}${w}.avif is not an AVIF (ftypavif box missing)`);
    }
    if (fs.existsSync(`${base}.jpg`) && jpegHeight(`${base}.jpg`) % 2 !== 0) {
      failures.push(`${name}${w}.jpg has an odd height`);
    }
  }
}

test('photos are complete: every name in CREDITS.md has all widths in both formats', () => {
  const credits = read('assets/photos/CREDITS.md');
  const names = [...credits.matchAll(/^\| (\w+) \|/gm)].map((m) => m[1]).filter((n) => n !== 'Name');
  assert.ok(names.length >= 50, `only ${names.length} photos in CREDITS.md`);
  const failures = [];
  for (const n of names) checkPhoto(n, failures);
  assert.deepStrictEqual(failures, []);
});

test('photos are complete: every /assets/photos/services/ photo used by built pages', () => {
  const used = new Set();
  for (const p of pages) {
    for (const m of read(p).matchAll(/\/assets\/photos\/services\/([\w]+?)(?:-(?:400|800|1200))?\.(?:jpg|avif)/g)) used.add(m[1]);
  }
  const failures = [];
  for (const n of used) checkPhoto(n, failures);
  assert.deepStrictEqual(failures, []);
});

test('photos are complete: every file stays within its size budget', () => {
  const KB = 1024;
  const budget = {
    jpg: { '-400': 35, '-800': 90, '-1200': 180, '': 300 },
    avif: { '-400': 25, '-800': 60, '-1200': 110, '': 180 },
  };
  const dir = path.join(ROOT, 'assets/photos/services');
  const failures = [];
  const files = fs.readdirSync(dir).filter((f) => /\.(jpg|avif)$/.test(f));
  assert.ok(files.length >= 400, `only ${files.length} photo files`);
  for (const f of files) {
    const m = /^[\w]+?(-400|-800|-1200)?\.(jpg|avif)$/.exec(f);
    const max = budget[m[2]][m[1] || ''] * KB;
    const size = fs.statSync(path.join(dir, f)).size;
    if (size > max) failures.push(`${f}: ${size} B > ${max} B`);
  }
  assert.deepStrictEqual(failures, []);
});
