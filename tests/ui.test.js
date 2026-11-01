const test = require('node:test');
const assert = require('node:assert');
const ui = require('../scripts/lib/ui');

const photo = { src: '/assets/photos/home', variants: ['480', ''], alt: 'Test', sizes: '100vw' };
const count = (s, re) => (s.match(re) || []).length;

test('eyebrow is copper and escaped', () => {
  const h = ui.eyebrow('A<b>');
  assert.ok(h.includes('text-copper'));
  assert.ok(h.includes('A&lt;b&gt;'));
  assert.ok(ui.eyebrow('x', { dark: true }).includes('text-copper-light'));
});

test('button variants', () => {
  assert.ok(ui.button('Ok', '/a/', { variant: 'primary' }).includes('bg-forest'));
  assert.ok(ui.button('Ok', '/a/', { variant: 'onDark' }).includes('bg-white'));
  assert.ok(ui.button('Ok', '/a/', { variant: 'outline' }).includes('border-forest'));
  assert.throws(() => ui.button('Ok', '/a/', { variant: 'x' }));
});

test('breadcrumb: last item is plain text with aria-current', () => {
  const h = ui.breadcrumb([{ name: 'A', url: '/' }, { name: 'B', url: '/b/' }, { name: 'C', url: '/c/' }]);
  assert.strictEqual(count(h, /<a /g), 2);
  assert.ok(h.includes('aria-current="page"'));
});

test('hero has one h1, an eager photo and the CTA', () => {
  const h = ui.hero({
    crumbs: [{ name: 'Domov', url: '/' }, { name: 'Služby', url: '/sluzby/' }],
    label: 'Právna expertíza', title: 'Nadpis', intro: ['Úvod'], bold: 'B', after: 'A',
    cta: { text: 'Dohodnite si konzultáciu', href: '/kontakt/' }, photo,
  });
  assert.strictEqual(count(h, /<h1/g), 1);
  assert.ok(h.includes('fetchpriority="high"'));
  assert.ok(h.includes('href="/kontakt/"'));
  assert.ok(h.indexOf('Právna expertíza') < h.indexOf('<h1'));
});

test('cardSide with a link', () => {
  const h = ui.cardSide({ icon: 'gavel', title: 'T', paras: ['p'], photo, link: { text: 'Viac', href: '/x/' } });
  assert.ok(h.includes('href="/x/"'));
  assert.ok(h.includes('arrow_forward'));
  assert.ok(h.includes('loading="lazy"'));
});

test('stepsH numbers the steps', () => {
  const h = ui.stepsH([{ title: 'a', text: 'x' }, { title: 'b', text: 'y' }, { title: 'c', text: 'z' }]);
  for (const n of ['01', '02', '03']) assert.ok(h.includes(n));
});

test('text is escaped, { html } is trusted', () => {
  const h = ui.prose({ title: 'T<', paras: ['a<i>', { html: '<b>x</b>' }] });
  assert.ok(h.includes('T&lt;') && h.includes('a&lt;i&gt;') && h.includes('<b>x</b>'));
});

test('contactBand is forest with the CTA', () => {
  const h = ui.contactBand({ title: 'T', paras: ['p'], cta: { text: 'Napíšte nám', href: '/kontakt/' }, photo });
  assert.ok(h.includes('bg-forest'));
  assert.ok(h.includes('Napíšte nám'));
  assert.ok(h.includes('Kontakt'));
});

test('renderSections maps types and rejects unknown ones', () => {
  const h = ui.renderSections([
    { type: 'cardsTop', items: [1, 2, 3].map((i) => ({ icon: 'gavel', title: 'T' + i, paras: ['p'], photo })) },
    { type: 'quote', text: 'Q', bg: 'sand' },
  ]);
  assert.strictEqual(count(h, /<article/g), 3);
  assert.ok(h.includes('lg:col-span-2') && h.includes('bg-sand'));
  assert.throws(() => ui.renderSections([{ type: 'nope' }]), /Unknown section type: nope/);
});
