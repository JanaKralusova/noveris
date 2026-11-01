const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ROOT, read } = require('./helpers');

const count = (s, re) => (s.match(re) || []).length;
const slugs = fs.readdirSync(path.join(ROOT, 'clanky'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort();

function mainHtml(slug) {
  try {
    return execFileSync('git', ['show', `main:clanky/${slug}/index.html`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { return null; }
}

test('19 article pages: one H1, .article-body, Article and FAQ JSON-LD as on main', () => {
  assert.strictEqual(slugs.length, 19);
  const failures = [];
  for (const s of slugs) {
    const html = read(`clanky/${s}/index.html`);
    if (count(html, /<h1[\s>]/g) !== 1) failures.push(`${s}: H1 count`);
    if (!/class="[^"]*\barticle-body\b/.test(html)) failures.push(`${s}: no .article-body`);
    if (count(html, /"@type":\s*"Article"/g) !== 1) failures.push(`${s}: Article JSON-LD`);
    const old = mainHtml(s);
    if (old === null) continue; // not on main (new article)
    for (const k of ['Article', 'FAQPage', 'BreadcrumbList']) {
      const re = new RegExp(`"@type":\\s*"${k}"`, 'g');
      if (count(html, re) !== count(old, re)) failures.push(`${s}: ${k} count ${count(html, re)} vs main ${count(old, re)}`);
    }
  }
  assert.deepStrictEqual(failures, []);
});

test('article pages: author box, disclaimer, related articles, closing contact band', () => {
  const failures = [];
  for (const s of slugs) {
    const html = read(`clanky/${s}/index.html`);
    if (!html.includes('Obsah článku') && count(html, /<h2 id=/g) >= 2) failures.push(`${s}: no TOC`);
    if (!html.includes('Článok má všeobecný informačný charakter')) failures.push(`${s}: no disclaimer`);
    if (!html.includes('Súvisiace články')) failures.push(`${s}: no related`);
    if (!html.includes('/assets/photos/services/band4')) failures.push(`${s}: no band4`);
  }
  assert.deepStrictEqual(failures, []);
});

test('owner page: every id used by owners-search.js exists, plus the vysporiadanie link', () => {
  const html = read('nezisteni-vlastnici/index.html');
  const js = fs.readFileSync(path.join(ROOT, 'templates/partials/owners-search.js'), 'utf8');
  const ids = new Set([...js.matchAll(/\$\('([a-z0-9-]+)'\)/g)].map((m) => m[1]));
  assert.ok(ids.size > 10);
  const missing = [...ids].filter((id) => !html.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, []);
  assert.ok(html.includes('href="/sluzby/vysporiadanie-pozemkov/"'));
  assert.ok(html.includes('Prečítajte si viac o možnostiach vysporiadania pozemkov a vlastníckych vzťahov.'));
});

test('owner page script keeps the highlight colour #f0dcc8 and no retired classes', () => {
  const js = fs.readFileSync(path.join(ROOT, 'templates/partials/owners-search.js'), 'utf8');
  assert.ok(js.includes('#f0dcc8'));
  assert.ok(!/editorial-|satin-|\b(?:text|bg|border)-(?:on-surface|surface-container|primary|secondary|outline)\b|secondary-fixed/.test(js));
});
