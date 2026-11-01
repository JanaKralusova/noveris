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

// ---- the other six pages ----
const fs = require('node:fs');
const path = require('node:path');
const JANA = fs.readFileSync(path.join(__dirname, '..', 'design-system', 'gen', 'jana-texty.txt'), 'utf8').split('\n').map((l) => l.trim());
const OTHERS = [
  { id: 'pozemky-pod-stavbami', url: 'sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami', h1: 'Vysporiadanie pozemkov pod stavbami a v areáloch', band: 'Potrebujete vysporiadať pozemky pod stavbou alebo v areáli?' },
  { id: 'nehnutelnosti-a-development', url: 'sluzby/nehnutelnosti-a-development', h1: 'Nehnuteľnosti a development', band: 'Potrebujete právnu pomoc v oblasti nehnuteľností?' },
  { id: 'zmluvna-agenda', url: 'sluzby/zmluvna-agenda', h1: 'Zmluvná agenda', band: 'Potrebujete pripraviť alebo posúdiť zmluvu?' },
  { id: 'obcianske-pravo', url: 'sluzby/obcianske-pravo', h1: 'Občianske právo', band: 'Potrebujete právnu pomoc v občianskoprávnej záležitosti?' },
  { id: 'obchodne-pravo', url: 'sluzby/obchodne-pravo', h1: 'Obchodné právo', band: 'Potrebujete právnu pomoc v oblasti obchodného práva?' },
  { id: 'riesenie-sporov', url: 'sluzby/riesenie-sporov', h1: 'Riešenie sporov', band: 'Potrebujete vyriešiť právny spor?' },
];

for (const p of OTHERS) {
  test(`${p.id}: H1 and closing band match jana-texty.txt`, () => {
    assert.ok(JANA.includes(p.h1), `H1 not in jana-texty.txt: ${p.h1}`);
    assert.ok(JANA.includes(p.band), `band not in jana-texty.txt: ${p.band}`);
    const html = read(`${p.url}/index.html`);
    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.strictEqual(h1.length, 1);
    assert.strictEqual(h1[0][1], p.h1);
    const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
    assert.strictEqual(h2[h2.length - 1], p.band);
    assert.ok(read('sitemap.xml').includes(`<loc>https://noveris.sk/${p.url}/</loc>`));
    assert.ok(!html.includes('hreflang='));
  });
}

test('pozemky-pod-stavbami has a 4-item breadcrumb', () => {
  const html = read('sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/index.html');
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
  const bc = ld['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
  assert.strictEqual(bc.itemListElement.length, 4);
});

test('cross-links between the service pages', () => {
  assert.ok(read('sluzby/obchodne-pravo/index.html').includes('href="/sluzby/zmluvna-agenda/"'));
  assert.ok(read('sluzby/nehnutelnosti-a-development/index.html').includes('href="/sluzby/vysporiadanie-pozemkov/"'));
  assert.ok(read('sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/index.html').includes('href="/sluzby/vysporiadanie-pozemkov/"'));
});
