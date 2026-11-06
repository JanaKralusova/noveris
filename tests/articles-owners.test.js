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

test('29 article pages: one H1, .article-body, Article and FAQ JSON-LD as on main', () => {
  assert.strictEqual(slugs.length, 29);
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

test('articles 20-29 exist: one H1 each, FAQ JSON-LD when there is a "Časté otázky" section, no utm_ in external links', () => {
  const dir = path.join(ROOT, 'content/articles');
  const files = fs.readdirSync(dir).filter((f) => /^2\d-.*\.md$/.test(f)).sort();
  assert.deepStrictEqual(files.map((f) => f.slice(0, 2)), ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29']);
  const failures = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const slug = f.replace(/^\d+-/, '').replace(/\.md$/, '');
    if (!slugs.includes(slug)) { failures.push(`${f}: no built page clanky/${slug}/`); continue; }
    const html = read(`clanky/${slug}/index.html`);
    if (count(html, /<h1[\s>]/g) !== 1) failures.push(`${slug}: H1 count`);
    const hasFaq = /^##\s+Časté otázky\s*$/m.test(src);
    if (hasFaq !== /"@type":\s*"FAQPage"/.test(html)) failures.push(`${slug}: FAQ JSON-LD does not match the "Časté otázky" section`);
    for (const m of src.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) if (/utm_/i.test(m[1])) failures.push(`${f}: utm_ in ${m[1]}`);
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) if (/utm_/i.test(m[1])) failures.push(`${slug}: utm_ in built link ${m[1]}`);
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

test('owner page: search wording says katastrálne územie, no request note', () => {
  const html = read('nezisteni-vlastnici/index.html');
  assert.ok(html.includes('Priezvisko, katastrálne územie alebo číslo LV'));
  assert.ok(!html.includes('doručená advokátke'));
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
