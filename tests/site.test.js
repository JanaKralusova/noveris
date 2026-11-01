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

// Retired styles: none on any built page. The inlined Tailwind CSS (<style> blocks) is stripped before matching.
test('no retired styles (satin-*, editorial-*, legacy colours, dark:)', () => {
  const failures = [];
  for (const p of pages) {
    const html = read(p).replace(/<style[\s\S]*?<\/style>/g, '');
    const m = /satin-button|satin-gradient|editorial-|#735c00|#6d5b47|\bdark:/.exec(html);
    if (m) failures.push(`${p}: ${m[0]}`);
  }
  assert.deepStrictEqual(failures, []);
});
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

const PHOTO_WIDTHS = ['-400', '-560', '-800', '-1200', '-1600', ''];

// Height (or, with offset 7, width) from the JPEG frame header.
function jpegHeight(file, offset = 5) {
  const buf = fs.readFileSync(file);
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buf.readUInt16BE(i + offset);
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function checkPhoto(name, failures) {
  // a photo whose full-size file is narrower than a listed width (e.g. a 1536 px own image) has no file for that width
  const full = path.join(ROOT, 'assets/photos/services', `${name}.jpg`);
  const fullW = fs.existsSync(full) ? jpegHeight(full, 7) : Infinity;
  for (const w of PHOTO_WIDTHS.filter((x) => !x || Number(x.slice(1)) < fullW)) {
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
    for (const m of read(p).matchAll(/\/assets\/photos\/services\/([\w]+?)(?:-(?:400|560|800|1200|1600))?\.(?:jpg|avif)/g)) used.add(m[1]);
  }
  const failures = [];
  for (const n of used) checkPhoto(n, failures);
  assert.deepStrictEqual(failures, []);
});

test('photos are complete: every file stays within its size budget', () => {
  const KB = 1024;
  const budget = {
    jpg: { '-400': 55, '-560': 100, '-800': 160, '-1200': 300, '-1600': 480, '': 680 },
    avif: { '-400': 40, '-560': 65, '-800': 100, '-1200': 180, '-1600': 290, '': 420 },
  };
  const dir = path.join(ROOT, 'assets/photos/services');
  const failures = [];
  const files = fs.readdirSync(dir).filter((f) => /\.(jpg|avif)$/.test(f));
  assert.ok(files.length >= 400, `only ${files.length} photo files`);
  for (const f of files) {
    const m = /^[\w]+?(-400|-560|-800|-1200|-1600)?\.(jpg|avif)$/.exec(f);
    const max = budget[m[2]][m[1] || ''] * KB;
    const size = fs.statSync(path.join(dir, f)).size;
    if (size > max) failures.push(`${f}: ${size} B > ${max} B`);
  }
  assert.deepStrictEqual(failures, []);
});

test('article photos: every file stays within its size budget (articles 16-29 also have 1600 and 2000 px files)', () => {
  const KB = 1024;
  // scripts/make-article-photo.sh. Articles 1-15 (made earlier from 1600 px sources, no -1600 file) are only held
  // to a loose cap of 1 MB (jpg) / 400 KB (avif) per file.
  const budget = {
    jpg: { '-400': 70, '-640': 140, '-800': 210, '-1024': 330, '-1600': 620, '': 900 },
    avif: { '-400': 30, '-640': 60, '-800': 90, '-1024': 140, '-1600': 260, '': 380 },
  };
  const dir = path.join(ROOT, 'assets/articles');
  const failures = [];
  const files = fs.readdirSync(dir).filter((x) => /\.(jpg|avif)$/.test(x));
  assert.ok(files.length >= 29 * 10, `only ${files.length} article photo files`);
  for (const f of files) {
    const m = /^[\w-]+?(-400|-640|-800|-1024|-1600)?\.(jpg|avif)$/.exec(f);
    const slug = f.replace(/(-\d+)?\.(jpg|avif)$/, '');
    const legacy = !fs.existsSync(path.join(dir, `${slug}-1600.jpg`));
    const max = (legacy ? { jpg: 1024, avif: 400 }[m[2]] : budget[m[2]][m[1] || '']) * KB;
    const size = fs.statSync(path.join(dir, f)).size;
    if (size > max) failures.push(`${f}: ${size} B > ${max} B`);
  }
  assert.deepStrictEqual(failures, []);
});

test('structured data and llms.txt list the six current service areas', () => {
  for (const f of ['index.html', 'en/index.html']) {
    const html = read(f);
    const m = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    const org = JSON.parse(m[1])['@graph'].find((n) => n.hasOfferCatalog);
    assert.strictEqual(org.hasOfferCatalog.itemListElement.length, 6, f);
    assert.ok(!JSON.stringify(org.hasOfferCatalog).includes('Vymáhanie pohľadávok'), f);
  }
  const llms = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'llms.txt'), 'utf8');
  for (const id of ['vysporiadanie-pozemkov', 'nehnutelnosti-a-development', 'zmluvna-agenda', 'obcianske-pravo', 'obchodne-pravo', 'riesenie-sporov']) {
    assert.ok(llms.includes(`https://noveris.sk/sluzby/${id}/`), id);
  }
  assert.ok(!/\*\*(Debt Recovery \(Vymáhanie|Vymáhanie pohľadávok)/.test(llms));
});

test('EN footer marks the Slovak-only privacy link as Slovak; SK footer does not', () => {
  const layout = require('../scripts/lib/layout');
  const link = (h) => /<a href="\/ochrana-osobnych-udajov\/"[^>]*>/.exec(h.slice(h.indexOf('<footer')))[0];
  assert.ok(link(layout.renderFooter('en')).includes('hreflang="sk" lang="sk"'));
  assert.ok(!link(layout.renderFooter('sk')).includes('hreflang'));
});

test('footer contact data comes from CONTACT', () => {
  const { CONTACT } = require('../scripts/lib/site');
  const f = require('../scripts/lib/layout').renderFooter('sk');
  for (const v of [CONTACT.phone, CONTACT.phoneHref, CONTACT.email, CONTACT.address]) assert.ok(f.includes(v), v);
});

test('every indexable page has a unique title (<= 65 chars) and meta description (70-160 chars, unique)', () => {
  const dec = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const titles = new Map(), descs = new Map(), failures = [];
  for (const p of pages) {
    const html = read(p);
    if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
    const t = /<title>([\s\S]*?)<\/title>/.exec(html);
    const d = /<meta\s+name=["']description["']\s+content="([^"]*)"/.exec(html);
    if (!t || !d) { failures.push(`${p}: missing title or description`); continue; }
    const title = dec(t[1]).trim(), desc = dec(d[1]).trim();
    if (title.length > 65) failures.push(`${p}: title ${title.length} chars`);
    if (desc.length < 70 || desc.length > 160) failures.push(`${p}: description ${desc.length} chars`);
    if (titles.has(title)) failures.push(`${p}: title duplicates ${titles.get(title)}`);
    if (descs.has(desc)) failures.push(`${p}: description duplicates ${descs.get(desc)}`);
    titles.set(title, p); descs.set(desc, p);
  }
  assert.deepStrictEqual(failures, []);
});

test('every <ol>/<ul> in the built pages has only <li> children', () => {
  const failures = [];
  for (const p of pages) {
    const html = read(p).replace(/<script[\s\S]*?<\/script>/g, '');
    for (const m of html.matchAll(/<\/li>\s*<(?!\/?li\b|\/[ou]l\b)[a-z]/gi)) failures.push(`${p}: non-li after </li> near "${html.slice(m.index, m.index + 60)}"`);
    for (const m of html.matchAll(/<[ou]l\b[^>]*>\s*<(?!li\b)[a-z]/gi)) failures.push(`${p}: non-li first child in list near "${html.slice(m.index, m.index + 60)}"`);
  }
  assert.deepStrictEqual(failures, []);
});
