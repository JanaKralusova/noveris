const test = require('node:test');
const assert = require('node:assert');
const { builtPages, read, internalRefs, resolves } = require('./helpers');

const pages = builtPages();

test('found built pages', () => {
  assert.ok(pages.length > 10, `only ${pages.length} pages found`);
});

test('every internal link and image resolves', () => {
  const failures = [];
  for (const p of pages) {
    for (const u of new Set(internalRefs(read(p)))) {
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
test.todo('footer has real contact data (tel:+421915622518, kralusova@noveris.sk)');
