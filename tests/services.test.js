const test = require('node:test');
const assert = require('node:assert');
const { read } = require('./helpers');
const site = require('../scripts/lib/site');

const PAGE = 'sluzby/vysporiadanie-pozemkov/index.html';
const TITLES = [
  'Pozemky so Slovenským pozemkovým fondom a vo vlastníctve štátu',
  'Pozemky pod stavbami a v areáloch',
  'Pozemky zapísané na zosnulé osoby',
  'Pozemky s viacerými spoluvlastníkmi',
  'Duplicitné vlastníctvo a spochybnená hodnovernosť údajov katastra',
  'Pozemky zapísané na zaniknuté spoločnosti',
];

test('vysporiadanie-pozemkov page exists with one h1', () => {
  const html = read(PAGE);
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.strictEqual(h1.length, 1);
  assert.strictEqual(h1[0][1], 'Vysporiadanie pozemkov a vlastníckych vzťahov');
});

test('contains all six card titles verbatim', () => {
  const html = read(PAGE);
  for (const t of TITLES) assert.ok(html.includes(`>${t}</h3>`) || html.includes(`>${t}</a></h3>`), t);
});

test('side cards keep the order, land under buildings is second', () => {
  const html = read(PAGE);
  const h3 = [...html.matchAll(/<h3[^>]*>(?:<a[^>]*>)?([^<]+)/g)].map((m) => m[1]);
  assert.deepStrictEqual(h3.filter((t) => TITLES.includes(t)), TITLES);
  assert.strictEqual(h3.filter((t) => TITLES.includes(t))[1], 'Pozemky pod stavbami a v areáloch');
});

test('services index h1 sets "dôvere" in italic copper', () => {
  const html = read('sluzby/index.html');
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1];
  assert.ok(h1.includes('<span class="italic text-copper">dôvere</span>'), h1);
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

// ---- English drafts (hidden until Jana approves them) ----
const EN = [
  { id: 'vysporiadanie-pozemkov', url: '/en/services/land-ownership-settlement/' },
  { id: 'pozemky-pod-stavbami', url: '/en/services/land-ownership-settlement/land-under-buildings/' },
  { id: 'nehnutelnosti-a-development', url: '/en/services/real-estate-and-development/' },
  { id: 'zmluvna-agenda', url: '/en/services/contracts/' },
  { id: 'obcianske-pravo', url: '/en/services/civil-law/' },
  { id: 'obchodne-pravo', url: '/en/services/corporate-law/' },
  { id: 'riesenie-sporov', url: '/en/services/dispute-resolution/' },
];
const EN_URLS = EN.map((p) => p.url);
const svcJson = (id) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'services', `${id}.json`), 'utf8'));

for (const p of EN) {
  test(`EN draft ${p.url}: built, noindex, no hreflang pair, no Slovak UI leftovers`, () => {
    const html = read(`${p.url.slice(1)}index.html`);
    assert.match(html, /<html[^>]*lang="en"/);
    assert.match(html, /<meta name="robots" content="noindex"\/>/);
    assert.ok(!/rel="alternate" hreflang=/.test(html), 'has hreflang alternates');
    assert.ok(!html.includes('og:locale:alternate'), 'has og:locale:alternate');
    assert.ok(!/href="\/kontakt\/"/.test(html), 'links to the Slovak contact page');
    for (const sk of ['Omrvinková', 'Dohodnite si', '>Kontakt<', 'Domov']) assert.ok(!html.includes(sk), `Slovak leftover: ${sk}`);
    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.strictEqual(h1.length, 1);
    assert.strictEqual(h1[0][1], require('../scripts/lib/layout').esc(svcJson(p.id).en.sections[0].title));
  });

  test(`EN draft ${p.id}: same structure, photos and icons as the Slovak page; meta in pages.json`, () => {
    const { sk, en } = svcJson(p.id);
    assert.ok(en && Array.isArray(en.sections), 'en is not filled in');
    // Strip the translatable text: what is left (types, icons, photo names, counts, layout props) must match.
    const shape = (v, key) => {
      if (Array.isArray(v)) return v.map((x) => shape(x, key));
      if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k], k)]));
      if (typeof v === 'string' && !['type', 'icon', 'name', 'side', 'bg', 'cls', 'pad'].includes(key)) return 'T';
      return v;
    };
    const skShape = shape(sk);
    // the EN contact bands carry an explicit "Contact" eyebrow (the component defaults to "Kontakt")
    for (const s of skShape.sections) if (s.type === 'contactBand') s.eyebrow = 'T';
    assert.deepStrictEqual(shape(en), skShape);
    const meta = site.loadPagesData()[p.id].en;
    // the " | Noveris Legal" suffix is dropped when it would push the title over 65 characters
    const full = `${en.sections[0].title} | Noveris Legal`;
    assert.strictEqual(meta.title, full.length > 65 ? en.sections[0].title : full);
    assert.ok(meta.description && meta.description.length <= 160, `description length ${meta.description && meta.description.length}`);
  });
}

test('EN drafts are not in sitemap.xml or llms.txt', () => {
  const sitemap = read('sitemap.xml');
  const llms = read('llms.txt');
  for (const u of EN_URLS) {
    assert.ok(!sitemap.includes(`https://noveris.sk${u}`), `sitemap lists ${u}`);
    assert.ok(!llms.includes(`https://noveris.sk${u}`), `llms.txt lists ${u}`);
  }
});

test('no built page links to an EN draft', () => {
  const { builtPages } = require('./helpers');
  const bad = [];
  for (const rel of builtPages()) {
    const html = read(rel);
    // <a> links only: a hidden page's own <link rel="canonical"> is not a link to it
    const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1].replace('https://noveris.sk', ''));
    for (const u of EN_URLS) if (hrefs.includes(u)) bad.push(`${rel} -> ${u}`);
  }
  assert.deepStrictEqual(bad, []);
});

test('SERVICES: all seven have their EN URL and hidden.en', () => {
  for (const p of EN) {
    assert.strictEqual(site.SERVICES[p.id].en, p.url);
    assert.deepStrictEqual(site.SERVICES[p.id].hidden, { en: true });
  }
});

// Removing hidden.en launches a page: it gets the hreflang pair, loses noindex, and enters the sitemap list.
test('visible EN page code path: unhiding pairs the page with its Slovak twin', () => {
  const services = require('../scripts/build-services');
  const id = 'zmluvna-agenda';
  const saved = site.SERVICES[id].hidden;
  const ctx = { pages: site.loadPagesData() };
  try {
    assert.ok(!services.hasLang(id, 'en'));
    assert.ok(services.outputs().some((o) => o.id === id && o.lang === 'en' && o.hidden));
    delete site.SERVICES[id].hidden;
    assert.ok(services.hasLang(id, 'en'));
    assert.ok(services.outputs().some((o) => o.id === id && o.lang === 'en' && !o.hidden));
    const en = services.render(id, 'en', ctx);
    const sk = services.render(id, 'sk', ctx);
    assert.ok(!en.includes('content="noindex"'));
    assert.ok(en.includes('<link rel="alternate" hreflang="sk" href="https://noveris.sk/sluzby/zmluvna-agenda/"/>'));
    assert.ok(sk.includes('<link rel="alternate" hreflang="en" href="https://noveris.sk/en/services/contracts/"/>'));
    assert.ok(sk.includes('href="/en/services/contracts/" hreflang="en"'), 'SK page has no language switch to EN');
  } finally {
    site.SERVICES[id].hidden = saved;
  }
});

test('EN links to a hidden EN page fall back to the Slovak page', () => {
  const html = read('en/services/land-ownership-settlement/index.html');
  assert.ok(html.includes('href="/sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/" hreflang="sk" lang="sk"'));
  const sub = read('en/services/land-ownership-settlement/land-under-buildings/index.html');
  assert.ok(sub.includes('href="/sluzby/vysporiadanie-pozemkov/" hreflang="sk" lang="sk"'));
  assert.ok(sub.includes('<a href="/sluzby/vysporiadanie-pozemkov/" hreflang="sk" lang="sk" class="hover:text-copper hover:underline">'), 'breadcrumb parent');
});
