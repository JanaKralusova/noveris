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

test('home page: six service links', () => {
  const html = read('index.html');
  const links = [...html.matchAll(/<a href="(\/sluzby\/[^"]+)"[^>]*>Viac o službe/g)].map((m) => m[1]);
  assert.strictEqual(links.length, 6);
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
