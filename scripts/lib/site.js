'use strict';

/*
 * Site model shared by the build scripts: page ids, URLs per language,
 * translations and the per-page head data (content/pages.json).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://noveris.sk';
const SITE_NAME = 'Noveris Legal';
const OG_IMAGES = {
  sk: { path: '/assets/og/og-sk.jpg', width: 1200, height: 630 },
  en: { path: '/assets/og/og-en.jpg', width: 1200, height: 630 },
};
const OG_ALT = {
  sk: 'Noveris Legal – advokátska kancelária v Bratislave',
  en: 'Noveris Legal – law firm in Bratislava',
};
// Firm contact data shown in the footer (and reused by the structured data).
const CONTACT = {
  phone: '+421 915 622 518',
  phoneHref: 'tel:+421915622518',
  email: 'kralusova@noveris.sk',
  street: 'Turčianska 42',
  postalCode: '821 09',
  city: 'Bratislava',
  address: 'Turčianska 42, 821 09 Bratislava',
};
const SITEMAP_LASTMOD = '2026-11-01';

// Page ids -> URL per language. A page without an `en` entry has no English counterpart.
// `hidden: true` = built and reachable by URL, but kept out of the nav, sitemap.xml and llms.txt
// and served with noindex. To launch such a page, delete `hidden: true` and rebuild.
const PAGES = {
  home:     { sk: '/',                          en: '/en/',          priority: '1.0', changefreq: 'monthly' },
  about:    { sk: '/o-nas/',                    en: '/en/about/',    priority: '0.8', changefreq: 'monthly' },
  services: { sk: '/sluzby/',                   en: '/en/services/', priority: '0.9', changefreq: 'monthly' },
  contact:  { sk: '/kontakt/',                  en: '/en/contact/',  priority: '0.8', changefreq: 'monthly' },
  privacy:  { sk: '/ochrana-osobnych-udajov/',                       priority: '0.3', changefreq: 'yearly' },
  owners:   { sk: '/nezisteni-vlastnici/',                           priority: '0.8', changefreq: 'monthly' },
};
const ARTICLES_URL = '/clanky/';

// Service pages (content/services/<id>.json, built by scripts/build-services.js).
// { sk, en, parent?, hidden?: { en: true }, order }. A page whose JSON has `en: null` has no English twin.
// hidden.en = the EN page is built and reachable by URL (for review), but served with noindex, without
// the hreflang pair / language switch, kept out of sitemap.xml and llms.txt and never linked (links to
// it fall back to the Slovak page). To launch it, delete `hidden` and rebuild.
const SERVICES = {
  'vysporiadanie-pozemkov': {
    sk: '/sluzby/vysporiadanie-pozemkov/', en: '/en/services/land-ownership-settlement/', hidden: { en: true }, order: 1,
  },
  'pozemky-pod-stavbami': {
    sk: '/sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/', en: '/en/services/land-ownership-settlement/land-under-buildings/',
    parent: 'vysporiadanie-pozemkov', hidden: { en: true }, order: 2,
  },
  'nehnutelnosti-a-development': {
    sk: '/sluzby/nehnutelnosti-a-development/', en: '/en/services/real-estate-and-development/', hidden: { en: true }, order: 3,
  },
  'zmluvna-agenda': { sk: '/sluzby/zmluvna-agenda/', en: '/en/services/contracts/', hidden: { en: true }, order: 4 },
  'obcianske-pravo': { sk: '/sluzby/obcianske-pravo/', en: '/en/services/civil-law/', hidden: { en: true }, order: 5 },
  'obchodne-pravo': { sk: '/sluzby/obchodne-pravo/', en: '/en/services/corporate-law/', hidden: { en: true }, order: 6 },
  'riesenie-sporov': { sk: '/sluzby/riesenie-sporov/', en: '/en/services/dispute-resolution/', hidden: { en: true }, order: 7 },
};

function loadTranslations() {
  return require(path.join(ROOT, 'translations.js'));
}

function loadPagesData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'pages.json'), 'utf8'));
}

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, ...parts), 'utf8'));
}

function loadSiteCopy() {
  return readJson('content', 'site-copy.json');
}

// Client-supplied values (see the comment block in scripts/build.js). Every field may be empty.
function loadSiteConfig() {
  const c = readJson('content', 'site.config.json');
  const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  return {
    sakNumber: String(c.sakNumber || '').trim(),
    openingHours: list(c.openingHours),
    sameAs: { organization: list((c.sameAs || {}).organization), person: list((c.sameAs || {}).person) },
    googleSiteVerification: String(c.googleSiteVerification || '').trim(),
    bingSiteVerification: String(c.bingSiteVerification || '').trim(),
    umamiWebsiteId: String(c.umamiWebsiteId || '').trim(),
    umamiScriptUrl: String(c.umamiScriptUrl || '').trim(),
    showReviews: c.showReviews === true,
  };
}

// Material Symbols used anywhere in the templates / generators, alphabetically sorted.
// Scanning the sources (not the output) keeps the list identical for every build entry point.
function iconNames() {
  const files = [];
  const walk = (dir, filter) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f, filter);
      else if (filter(f)) files.push(f);
    }
  };
  walk(path.join(ROOT, 'templates'), (f) => /\.html$/.test(f));
  walk(path.join(ROOT, 'scripts'), (f) => /\.js$/.test(f));
  const names = new Set();
  // icons passed to ui.js icon() / chip() as string literals
  const call = /\b(?:(?:icon|chip)\(\s*|(?:icon|homeIcon):\s*)['"]([a-z0-9_]+)['"]/g;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    let c;
    while ((c = call.exec(src))) names.add(c[1]);
  }
  // `"icon": "<name>"` values in the service page data
  const svcDir = path.join(ROOT, 'content', 'services');
  if (fs.existsSync(svcDir)) {
    for (const f of fs.readdirSync(svcDir).filter((n) => n.endsWith('.json'))) {
      const src = fs.readFileSync(path.join(svcDir, f), 'utf8');
      for (const m of src.matchAll(/"icon"\s*:\s*"([a-z0-9_]+)"/g)) names.add(m[1]);
    }
  }
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /material-symbols-outlined[^"'`>]*["'`]?[^>]*>\s*([a-z0-9_]+)\s*</g;
    let m;
    while ((m = re.exec(src))) names.add(m[1]);
  }
  return [...names].sort();
}

// Fail the build when a page uses an icon that is not in the self-hosted Material Symbols subset
// (assets/fonts/material-symbols.icons.json; regeneration steps are in fonts.css).
let iconsChecked = false;
function checkIcons() {
  if (iconsChecked) return;
  iconsChecked = true;
  const have = new Set(readJson('assets', 'fonts', 'material-symbols.icons.json'));
  const missing = iconNames().filter((n) => !have.has(n));
  if (missing.length) {
    throw new Error(`Material Symbols icon(s) not in the self-hosted subset: ${missing.join(', ')}.\n` +
      'Regenerate assets/fonts/material-symbols-outlined-subset.woff2 and assets/fonts/material-symbols.icons.json (see the comment at the top of fonts.css).');
  }
}

// "/o-nas/" -> "<root>/o-nas/index.html"; "/" -> "<root>/index.html"
function urlToFile(outRoot, url) {
  return path.join(outRoot, url.replace(/^\//, ''), 'index.html');
}

function abs(url) {
  return /^https?:\/\//.test(url) ? url : SITE + url;
}

module.exports = { ROOT, SITE, SITE_NAME, CONTACT, OG_IMAGES, OG_ALT, SITEMAP_LASTMOD, loadSiteCopy, loadSiteConfig, iconNames, checkIcons, PAGES, SERVICES, ARTICLES_URL, loadTranslations, loadPagesData, urlToFile, abs };
