const test = require('node:test');
const assert = require('node:assert');
const { read } = require('./helpers');

const PAGE = 'sluzby/vysporiadanie-pozemkov/index.html';
const TITLES = [
  'Pozemky so Slovenským pozemkovým fondom a vo vlastníctve štátu',
  'Pozemky zapísané na zosnulé osoby',
  'Pozemky s viacerými spoluvlastníkmi',
  'Duplicitné vlastníctvo a spochybnená hodnovernosť údajov katastra',
  'Pozemky zapísané na zaniknuté spoločnosti',
  'Pozemky pod stavbami a v areáloch',
];

test('vysporiadanie-pozemkov page exists with one h1', () => {
  const html = read(PAGE);
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.strictEqual(h1.length, 1);
  assert.strictEqual(h1[0][1], 'Vysporiadanie pozemkov a vlastníckych vzťahov');
});

test('contains all six card titles verbatim', () => {
  const html = read(PAGE);
  for (const t of TITLES) assert.ok(html.includes(`>${t}</h3>`), t);
});

test('links to the sub-page and the cost article', () => {
  const html = read(PAGE);
  assert.ok(html.includes('href="/sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/"'));
  assert.ok(html.includes('href="/clanky/kolko-stoji-vysporiadanie-pozemku/"'));
});

test('JSON-LD has a Service and a 3-item BreadcrumbList with absolute URLs', () => {
  const html = read(PAGE);
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
  const nodes = ld['@graph'];
  assert.ok(nodes.some((n) => n['@type'] === 'Service'));
  const bc = nodes.find((n) => n['@type'] === 'BreadcrumbList');
  assert.strictEqual(bc.itemListElement.length, 3);
  for (const i of bc.itemListElement) assert.match(i.item, /^https:\/\/noveris\.sk\//);
});

test('sitemap lists the page; no EN twin / hreflang', () => {
  assert.ok(read('sitemap.xml').includes('<loc>https://noveris.sk/sluzby/vysporiadanie-pozemkov/</loc>'));
  assert.ok(!read(PAGE).includes('hreflang='));
});

test('header item "Služby" is the current page', () => {
  assert.match(read(PAGE), /<a [^>]*aria-current="page"[^>]*>\s*Služby\s*<\/a>/);
});
