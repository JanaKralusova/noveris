#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/*
 * Full static site build (CSS is built separately by `npm run build:css`):
 *   pages (SK + EN + 404) -> articles -> sitemap.xml -> llms.txt
 *
 * This script owns sitemap.xml and the generated blocks of llms.txt.
 *
 * Content sources
 *   content/pages.json          title/description (+ keywords) of every page, per language
 *   content/site-copy.json      shared copy: articles listing, disclaimer, author bio, home
 *                               "latest articles" section, service link text
 *   content/articles/*.md       articles (JSON front matter + markdown)
 *   content/pages/*.md          service landing pages, published at /sluzby/<file name>/
 *
 * content/site.config.json – values supplied by the client. Every field may stay empty;
 * an empty value omits the related markup/field everywhere (nothing is emitted for it).
 *   sakNumber               registration number in the Slovak Bar Association; when set it adds
 *                           Person.identifier + Person.memberOf (JSON-LD) and a line in the
 *                           article author box
 *   openingHours            array of schema.org OpeningHoursSpecification objects, e.g.
 *                           [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday"],
 *                              "opens": "09:00", "closes": "17:00" }] -> Organization.openingHoursSpecification
 *   sameAs.organization     profile URLs of the firm (LinkedIn, Google Business, ...) -> Organization.sameAs
 *   sameAs.person           profile URLs of Jana Králusová -> Person.sameAs
 *   googleSiteVerification  content of <meta name="google-site-verification"> (SK home page only)
 *   bingSiteVerification    content of <meta name="msvalidate.01"> (SK home page only)
 */

const fs = require('fs');
const path = require('path');
const { ROOT, SITE, PAGES, ARTICLES_URL, SITEMAP_LASTMOD, abs } = require('./lib/site');
const { esc } = require('./lib/layout');
const buildPages = require('./build-pages');
const buildArticles = require('./build-articles');
const services = buildArticles.loadServices(path.join(ROOT, 'content', 'pages'));

// ---------------------------------------------------------------- sitemap

function urlEntry({ loc, lastmod, changefreq, priority, alternates, image }) {
  const alt = (alternates || [])
    .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`).join('');
  const img = image
    ? `\n    <image:image>\n      <image:loc>${esc(image.loc)}</image:loc>\n      <image:title>${esc(image.title)}</image:title>\n    </image:image>`
    : '';
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${alt}${img}\n  </url>`;
}

function buildSitemap(outRoot, articles) {
  const entries = [];
  for (const id of Object.keys(PAGES)) {
    const p = PAGES[id];
    const pair = p.en
      ? [{ hreflang: 'sk', href: abs(p.sk) }, { hreflang: 'en', href: abs(p.en) }, { hreflang: 'x-default', href: abs(p.sk) }]
      : null;
    for (const lang of ['sk', 'en']) {
      if (!p[lang]) continue;
      entries.push(urlEntry({ loc: abs(p[lang]), lastmod: SITEMAP_LASTMOD, changefreq: p.changefreq, priority: p.priority, alternates: pair }));
    }
  }
  for (const svc of services) {
    entries.push(urlEntry({ loc: abs(svc.url), lastmod: svc.date, changefreq: 'monthly', priority: '0.8' }));
  }
  const latest = articles.map((a) => a.date).sort().pop();
  entries.push(urlEntry({ loc: abs(ARTICLES_URL), lastmod: latest, changefreq: 'weekly', priority: '0.8' }));
  for (const a of articles) {
    entries.push(urlEntry({
      loc: `${SITE}${ARTICLES_URL}${a.slug}/`, lastmod: a.date, changefreq: 'monthly', priority: '0.7',
      image: { loc: `${SITE}/assets/articles/${a.image}.jpg`, title: a.title },
    }));
  }
  fs.writeFileSync(path.join(outRoot, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`);
}

// ---------------------------------------------------------------- llms.txt

function replaceBlock(text, name, block, insertAt) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const full = `${start}\n${block}\n${end}`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (re.test(text)) return text.replace(re, () => full);
  return insertAt(text, full);
}

function updateLlms(outRoot, articles) {
  const file = path.join(outRoot, 'llms.txt');
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');

  const link = (label, url) => `- [${label}](${abs(url)})`;
  const pagesEn = `## Website Pages\n${[
    link('Home', PAGES.home.en), link('About', PAGES.about.en), link('Services', PAGES.services.en),
    link('Contact', PAGES.contact.en), ...services.map((s) => link(`${s.h1} (Slovak)`, s.url)), link('Articles (Slovak)', ARTICLES_URL),
    link('Privacy policy (Slovak)', PAGES.privacy.sk),
  ].join('\n')}\nSlovak versions: ${abs(PAGES.home.sk)}, ${abs(PAGES.about.sk)}, ${abs(PAGES.services.sk)}, ${abs(PAGES.contact.sk)}.`;
  const pagesSk = `## Stránky webu\n${[
    link('Domov', PAGES.home.sk), link('O nás', PAGES.about.sk), link('Služby', PAGES.services.sk),
    ...services.map((s) => link(s.h1, s.url)),
    link('Články', ARTICLES_URL), link('Kontakt', PAGES.contact.sk),
    link('Ochrana osobných údajov', PAGES.privacy.sk),
  ].join('\n')}\nAnglické verzie: ${abs(PAGES.home.en)}, ${abs(PAGES.about.en)}, ${abs(PAGES.services.en)}, ${abs(PAGES.contact.en)}.`;

  const list = articles.map((a) => `- [${a.title}](${SITE}/clanky/${a.slug}/): ${a.description}`).join('\n');
  const artEn = `## Articles (Články)\nPractical articles in Slovak. Full text of all articles: ${SITE}/llms-full.txt. Each article also has a markdown copy at <article URL>index.md.\n\n${list}`;
  const artSk = `## Články\nPraktické články o právnych situáciách. Úplné znenie všetkých článkov: ${SITE}/llms-full.txt. Každý článok má aj markdown kópiu na <URL článku>index.md.\n\n${list}`;

  const before = (marker) => (t, blk) => {
    const i = t.indexOf(marker);
    return i === -1 ? t.trimEnd() + '\n\n' + blk + '\n' : t.slice(0, i) + blk + '\n\n' + t.slice(i);
  };
  text = replaceBlock(text, 'pages-en', pagesEn, before('<!-- articles-en:start -->'));
  text = replaceBlock(text, 'pages-sk', pagesSk, before('<!-- articles-sk:start -->'));
  text = replaceBlock(text, 'articles-en', artEn, (t, blk) => {
    const i = t.indexOf('\n---\n');
    return i === -1 ? t.trimEnd() + '\n\n' + blk + '\n' : t.slice(0, i).trimEnd() + '\n\n' + blk + '\n' + t.slice(i);
  });
  text = replaceBlock(text, 'articles-sk', artSk, (t, blk) => t.trimEnd() + '\n\n' + blk + '\n');
  fs.writeFileSync(file, text);
}

// ---------------------------------------------------------------- main

buildPages.main();
const articles = buildArticles.main();
const outRoot = path.resolve(process.env.ARTICLES_OUT_DIR || ROOT);
buildSitemap(outRoot, articles);
updateLlms(outRoot, articles);
console.log('build: sitemap.xml + llms.txt updated');
