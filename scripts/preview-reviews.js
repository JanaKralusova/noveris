#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/*
 * Local comparison page for the three home reviews band variants (a, b, c), rendered with the DEMO data.
 *
 *   node scripts/preview-reviews.js      ->  _preview/reviews/index.html
 *
 * _preview/ is git-ignored and never deployed. The page uses the normal site layout (header, footer, inline CSS),
 * is noindex, and puts each variant under a small label bar, between the real latest-articles section and the
 * closing contact band of the home page. Run `npm run build:css` first when new classes were added.
 */

const fs = require('fs');
const path = require('path');
const site = require('./lib/site');
const layout = require('./lib/layout');
const { reviewsBand, applyLatest, applyContactBand } = require('./build-pages');
const { loadArticles } = require('./build-articles');

const { ROOT } = site;
const VARIANTS = [
  ['a', 'Variant A — Cards'],
  ['b', 'Variant B — Sand band, serif quote cards'],
  ['c', 'Variant C — Hairline editorial row'],
];

function labelBar(text) {
  return `<div class="border-y border-line bg-sand"><p class="mx-auto max-w-7xl px-6 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted lg:px-8">${layout.esc(text)}</p></div>`;
}

function build() {
  const lang = 'sk';
  const t = site.loadTranslations()[lang];
  const demo = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'reviews.demo.json'), 'utf8'));
  const tpl = fs.readFileSync(path.join(ROOT, 'templates/pages/home.html'), 'utf8');
  // The real latest-articles section of the home template (the one with the {{latest:*}} tokens).
  const latestTpl = tpl.split(/(?=<section)/).find((s) => s.includes('{{latest:tiles}}'));
  if (!latestTpl) throw new Error('home.html: latest-articles section not found');
  const latestSection = latestTpl.slice(0, latestTpl.indexOf('</section>') + '</section>'.length);
  const articles = loadArticles(path.join(ROOT, 'content', 'articles'));
  const latest = applyLatest(latestSection, lang, site.loadSiteCopy(), articles, t);
  const contact = applyContactBand('{{contactBand:band1}}', t, lang);
  const bands = VARIANTS.map(([v, label]) => labelBar(label) + reviewsBand(lang, t, demo, { variant: v })).join('\n');
  const main = `${latest}\n${bands}\n${labelBar('Closing contact band (context)')}\n${contact}`;
  const html = layout.renderDocument({
    generated: '<!-- Local preview: not part of the site -->',
    lang,
    active: null,
    switchTo: null,
    head: {
      title: 'Reviews band variants (preview)',
      description: 'Local comparison page, not deployed.',
      robots: 'noindex',
      og: {},
    },
    main,
    bodyScripts: '',
  });
  const dest = path.join(ROOT, '_preview', 'reviews', 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log(`preview-reviews: wrote ${path.relative(ROOT, dest)}`);
}

build();
