const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, resolves } = require('./helpers');
const { SERVICES } = require('../scripts/lib/site');
const { hasLang } = require('../scripts/build-services');

const count = (s, re) => (s.match(re) || []).length;
const AREAS = ['vysporiadanie-pozemkov', 'nehnutelnosti-a-development', 'zmluvna-agenda', 'obcianske-pravo', 'obchodne-pravo', 'riesenie-sporov'];

test('services page: six "Viac o službe" links that resolve, no debt collection card', () => {
  const html = read('sluzby/index.html');
  const links = [...html.matchAll(/<a href="([^"]+)"[^>]*>Viac o službe/g)].map((m) => m[1]);
  assert.strictEqual(links.length, 6);
  assert.deepStrictEqual(links, AREAS.map((id) => SERVICES[id].sk));
  for (const u of links) assert.ok(resolves(u), `${u} does not resolve`);
  assert.ok(!/<h[1-6][^>]*>\s*Vymáhanie pohľadávok/.test(html));
});

test('home page: six service links plus the two specialisation links', () => {
  const html = read('index.html');
  const i = html.indexOf('<section data-band="specialisation"');
  const band = html.slice(i, html.indexOf('</section>', i));
  const rest = html.slice(0, i) + html.slice(i + band.length);
  const links = [...rest.matchAll(/<a href="(\/sluzby\/[^"]+)"[^>]*>Viac o službe/g)].map((m) => m[1]);
  assert.strictEqual(links.length, 6);
  const bandLinks = [...band.matchAll(/<a href="(\/sluzby\/[^"]+)"/g)].map((m) => m[1]);
  assert.strictEqual(bandLinks.length, 2);
  links.push(...bandLinks);
  for (const u of links) assert.ok(resolves(u), `${u} does not resolve`);
  assert.ok(html.includes('Zobraziť všetky oblasti poradenstva'));
});

test('EN services page: six area cards; links go to the Slovak page while the EN page is not visible', () => {
  const html = read('en/services/index.html');
  assert.strictEqual(count(html, /<article /g), 6);
  for (const id of AREAS) {
    const visible = hasLang(id, 'en');
    const want = visible ? SERVICES[id].en : SERVICES[id].sk;
    const re = new RegExp(`<a href="${want}"([^>]*)>(More[^<]*)`);
    const m = re.exec(html);
    assert.ok(m, `no card link to ${want}`);
    if (visible) assert.strictEqual(m[2], 'More');
    else {
      assert.ok(/hreflang="sk"/.test(m[1]), `${id}: missing hreflang="sk"`);
      assert.strictEqual(m[2], 'More (in Slovak)');
    }
  }
});

test('EN home page: service cards follow the same rule', () => {
  const html = read('en/index.html');
  assert.strictEqual(count(html, /More \(in Slovak\)|>More</g), 6);
});

test('contact page keeps the form contract', () => {
  for (const f of ['kontakt/index.html', 'en/contact/index.html']) {
    const html = read(f);
    assert.ok(html.includes('action="https://api.web3forms.com/submit"'), f);
    for (const [id, name] of [['contact-name', 'name'], ['contact-email', 'email'], ['contact-phone', 'phone'], ['contact-message', 'message']]) {
      assert.ok(new RegExp(`id="${id}" name="${name}"`).test(html), `${f}: ${id}/${name}`);
    }
    assert.ok(/name="access_key"/.test(html), f);
    for (const id of ['contact-form', 'contact-submit-btn', 'form-status', 'name-error', 'email-error', 'phone-error', 'message-error']) {
      assert.ok(html.includes(`id="${id}"`), `${f}: ${id}`);
    }
  }
});

// Template pages (not articles / owners) carry no retired styles. The inlined Tailwind CSS still
// holds legacy token values, so <style> blocks are stripped before matching.
const TEMPLATE_PAGES = ['index.html', 'o-nas/index.html', 'sluzby/index.html', 'kontakt/index.html', 'ochrana-osobnych-udajov/index.html', '404.html',
  'en/index.html', 'en/about/index.html', 'en/services/index.html', 'en/contact/index.html'];
const RETIRED = /satin-button|satin-gradient|editorial-|#735c00|#6d5b47|\bdark:|\b(?:text|bg|border)-(?:on-surface|surface-container|primary|secondary|outline)\b/;

test('no retired styles on the template pages', () => {
  const failures = [];
  for (const f of TEMPLATE_PAGES) {
    const html = read(f).replace(/<style[\s\S]*?<\/style>/g, '');
    const m = RETIRED.exec(html);
    if (m) failures.push(`${f}: ${m[0]}`);
  }
  assert.deepStrictEqual(failures, []);
});

test('template pages are built', () => {
  for (const f of TEMPLATE_PAGES) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
});

// ---- one hero for every page, home specialisation band
const { builtPages } = require('./helpers');
const HERO = /<section class="relative overflow-hidden bg-paper"><div class="(?:fade-photo |relative flex h-80 )[^"]*">[\s\S]*?<h1 /;

test('every built page except 404 has the shared fade-photo hero with an h1', () => {
  const missing = builtPages().filter((p) => !/404\.html$/.test(p) && !HERO.test(read(p)));
  assert.deepStrictEqual(missing, []);
});

test('SK home: specialisation band (h2) links to both core service pages, before the profile section', () => {
  const html = read('index.html');
  const i = html.indexOf('<section data-band="specialisation"');
  assert.ok(i > 0);
  const band = html.slice(i, html.indexOf('</section>', i));
  assert.ok(/<h2 [^>]*>Aj zložité vlastnícke vzťahy majú svoje riešenia\.<\/h2>/.test(band));
  assert.ok(band.includes('href="/sluzby/vysporiadanie-pozemkov/"'));
  assert.ok(band.includes('href="/sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/"'));
  assert.ok(i < html.indexOf('Osobný prístup'));
});

test('EN home has the band only when the EN service pages are visible', () => {
  const html = read('en/index.html');
  const both = hasLang('vysporiadanie-pozemkov', 'en') && hasLang('pozemky-pod-stavbami', 'en');
  assert.strictEqual(html.includes('data-band="specialisation"'), both);
});

test('article pages: no big full-width image block, hero photo is the article photo, og:image unchanged', () => {
  const dir = path.join(ROOT, 'clanky');
  const slugs = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'index.html')));
  assert.ok(slugs.length >= 29);
  for (const slug of slugs) {
    const html = read(`clanky/${slug}/index.html`);
    assert.ok(!html.includes('aspect-[16/8]'), `${slug}: old big image`);
    assert.ok(HERO.test(html), `${slug}: no shared hero`);
    const og = /property="og:image" content="([^"]+)"/.exec(html)[1];
    assert.ok(/\/assets\/articles\/[\w.-]+\.jpg$/.test(og), `${slug}: og:image ${og}`);
    const name = og.split('/').pop().replace('.jpg', '');
    assert.ok(html.includes(`/assets/articles/${name}-640.jpg`) || html.includes(`/assets/articles/${name}-800.jpg`), `${slug}: hero photo`);
  }
});
