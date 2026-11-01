'use strict';

/*
 * Shared page chrome (head, header/nav, mobile menu, footer, inline scripts).
 * Used by build-pages.js and build-articles.js so the navigation is identical
 * everywhere. All paths are root-absolute.
 */

const fs = require('fs');
const path = require('path');
const { ROOT, SITE, CONTACT, loadSiteConfig, SITE_NAME, PAGES, ARTICLES_URL, abs, loadTranslations, checkIcons } = require('./site');

const PRELOAD_FONTS = ['newsreader.woff2', 'manrope.woff2', 'material-symbols-outlined-subset.woff2'];
const ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const LOCALES = { sk: 'sk_SK', en: 'en_US' };
const UI = {
  sk: { navLabel: 'Hlavná navigácia', menu: 'Menu', closeMenu: 'Zavrieť menu', toSk: 'SK: Prepnúť na slovenčinu', toEn: 'EN: Switch to English' },
  en: { navLabel: 'Main navigation', menu: 'Menu', closeMenu: 'Close menu', toSk: 'SK: Prepnúť na slovenčinu', toEn: 'EN: Switch to English' },
};

function esc(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// All CSS is inlined into every page (zero render-blocking requests): fonts.css (@font-face + icon rules),
// tailwind-output.css (build it first: `npm run build` does) and styles.css.
let cssCache = null;
function inlineCss() {
  if (cssCache) return cssCache;
  const read = (f) => {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) throw new Error(`${f} is missing: run \`npm run build:css\` before the site build (npm run build does).`);
    return fs.readFileSync(p, 'utf8');
  };
  const min = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};:,>])\s*/g, '$1').replace(/;}/g, '}').trim();
  cssCache = [min(read('fonts.css')), read('tailwind-output.css').trim(), min(read('styles.css'))].join('');
  if (/<\/style/i.test(cssCache)) throw new Error('CSS contains </style');
  return cssCache;
}

// Fonts used above the fold on every page.
const PRELOADS = PRELOAD_FONTS.map((f) => `<link rel="preload" href="/assets/fonts/${f}" as="font" type="font/woff2" crossorigin/>`);

// Chromium prerenders same-origin links on hover (moderate eagerness); other browsers ignore the block.
const SPECULATION_RULES = {
  prerender: [{
    where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/*.pdf' } }, { not: { selector_matches: '[rel~=nofollow]' } }] },
    eagerness: 'moderate',
  }],
};

// Cookieless Umami analytics. Emitted only when umamiWebsiteId is set in content/site.config.json; with it empty
// the pages carry no analytics markup at all. data-domains keeps local / tunnel / preview hosts out of the stats.
let analyticsCache;
function analytics() {
  if (analyticsCache !== undefined) return analyticsCache;
  const { umamiWebsiteId: id, umamiScriptUrl: url } = loadSiteConfig();
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('site.config.json: umamiWebsiteId is not a UUID.');
  analyticsCache = id ? { id, url } : null;
  return analyticsCache;
}

// Page scripts call track(); it is a no-op when Umami is absent or blocked. Page scripts only reference it in
// `analytics:start/end` blocks, which build-pages.js drops again when analytics is off.
const ANALYTICS_HELPER = `function track(name, data) { if (window.umami) umami.track(name, data); }
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
  if (a) track(a.protocol === 'tel:' ? 'phone-click' : 'email-click', { page: location.pathname });
});`;

// The page view is sent by hand: pages prerendered by SPECULATION_RULES on hover are counted only once shown.
const PAGEVIEW = "document.prerendering ? document.addEventListener('prerenderingchange', function () { umami.track(); }, { once: true }) : umami.track()";

function analyticsHead() {
  const a = analytics();
  if (!a) return [];
  return [
    `<script defer src="${esc(a.url)}" data-website-id="${esc(a.id)}" data-domains="noveris.sk,www.noveris.sk" data-auto-track="false" onload="${PAGEVIEW}"></script>`,
    `<script>\n${ANALYTICS_HELPER}\n</script>`,
  ];
}

function jsonLd(obj) {
  return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

function navItems(lang) {
  const t = loadTranslations()[lang];
  return [
    { id: 'home', href: PAGES.home[lang], label: t['nav.home'] },
    { id: 'about', href: PAGES.about[lang], label: t['nav.about'] },
    { id: 'services', href: PAGES.services[lang], label: t['nav.services'] },
    { id: 'articles', href: ARTICLES_URL, label: t['nav.articles'] },
    ...(PAGES.owners[lang] && !PAGES.owners.hidden ? [{ id: 'owners', href: PAGES.owners[lang], label: t['nav.owners'] }] : []),
    { id: 'contact', href: PAGES.contact[lang], label: t['nav.contact'] },
  ];
}

// ---------------------------------------------------------------- head

// head: { title, description, canonical?, keywords?, robots?, og: {...}, alternates?: [{hreflang, href}],
//         mdAlt?: url, jsonlds?: [], rawHead?: string }
function renderHead(lang, h) {
  checkIcons();
  const og = h.og;
  const lines = [];
  lines.push(
    '<meta charset="utf-8"/>',
    '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>',
    `<title>${esc(h.title)}</title>`,
  );
  if (h.rawHead) lines.push(h.rawHead);
  for (const m of (h.verification || [])) lines.push(m);
  lines.push('', '<!-- SEO Meta Tags -->', `<meta name="description" content="${esc(h.description)}"/>`);
  if (h.keywords) lines.push(`<meta name="keywords" content="${esc(h.keywords)}"/>`);
  lines.push(
    `<meta name="author" content="${esc(og.author || 'Noveris Legal, s.r.o.')}"/>`,
    `<meta name="robots" content="${esc(h.robots || ROBOTS)}"/>`,
  );
  if (h.canonical) lines.push(`<link rel="canonical" href="${esc(h.canonical)}"/>`);
  if (h.mdAlt) lines.push(`<link rel="alternate" type="text/markdown" href="${esc(h.mdAlt)}"/>`);
  lines.push('<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM summary"/>');

  if (h.alternates && h.alternates.length) {
    lines.push('', '<!-- Multilingual -->');
    for (const a of h.alternates) lines.push(`<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`);
  }

  if (h.canonical) {
    lines.push('', '<!-- Open Graph / Facebook -->',
      `<meta property="og:type" content="${esc(og.type || 'website')}"/>`,
      `<meta property="og:url" content="${esc(h.canonical)}"/>`,
      `<meta property="og:title" content="${esc(og.title)}"/>`,
      `<meta property="og:description" content="${esc(h.description)}"/>`,
      `<meta property="og:image" content="${esc(og.image)}"/>`);
    if (og.imageWidth) lines.push(`<meta property="og:image:width" content="${og.imageWidth}"/>`, `<meta property="og:image:height" content="${og.imageHeight}"/>`);
    if (og.imageAlt) lines.push(`<meta property="og:image:alt" content="${esc(og.imageAlt)}"/>`);
    lines.push(`<meta property="og:site_name" content="${SITE_NAME}"/>`,
      `<meta property="og:locale" content="${LOCALES[lang]}"/>`);
    for (const alt of (og.alternateLocales || [])) lines.push(`<meta property="og:locale:alternate" content="${alt}"/>`);
    for (const x of (og.extra || [])) lines.push(x);

    lines.push('', '<!-- Twitter Card -->',
      '<meta name="twitter:card" content="summary_large_image"/>',
      `<meta name="twitter:title" content="${esc(og.title)}"/>`,
      `<meta name="twitter:description" content="${esc(h.description)}"/>`,
      `<meta name="twitter:image" content="${esc(og.image)}"/>`);
    if (og.imageAlt) lines.push(`<meta name="twitter:image:alt" content="${esc(og.imageAlt)}"/>`);
  }

  lines.push('', '<!-- Theme & Favicon -->',
    '<meta name="theme-color" content="#fcf9f2"/>',
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"/>',
    '<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"/>',
    '<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png"/>',
    ...PRELOADS,
    ...(h.lcpImage ? [`<link rel="preload" as="image" type="image/avif" imagesrcset="${h.lcpImage.srcset}" imagesizes="${h.lcpImage.sizes}" fetchpriority="high"/>`] : []),
    `<style>${inlineCss()}</style>`,
    `<script type="speculationrules">${JSON.stringify(SPECULATION_RULES)}</script>`,
    ...analyticsHead());

  if (h.jsonlds && h.jsonlds.length) {
    lines.push('', '<!-- Structured Data (JSON-LD) -->');
    for (const j of h.jsonlds) lines.push(`<script type="application/ld+json">\n${typeof j === 'string' ? j : jsonLd(j)}\n</script>`);
  }
  return `<head>\n${lines.join('\n')}\n</head>`;
}

// ---------------------------------------------------------------- header

// switchTo: { sk: url, en: url } or null (page has no counterpart => no switch)
function logo(lang, h) {
  return `<a href="${PAGES.home[lang]}" class="inline-flex shrink-0"><img src="/assets/logo.svg" alt="Noveris Legal" width="821" height="277" class="${h} w-auto invert"/></a>`;
}

function renderHeader(lang, active, switchTo) {
  const { button } = require('./ui'); // lazy: ui.js requires this module
  const ui = UI[lang];
  const t = loadTranslations()[lang];
  const items = navItems(lang);

  const desktop = items.map((it) => (it.id === active
    ? `<a href="${it.href}" aria-current="page" class="flex h-16 items-center border-b-2 border-copper font-label text-[14px] font-medium text-ink">${it.label}</a>`
    : `<a href="${it.href}" class="flex h-16 items-center border-b-2 border-transparent font-label text-[14px] font-medium text-body transition-colors hover:text-copper">${it.label}</a>`)).join('\n');

  const mobile = items.map((it) => {
    const on = it.id === active;
    return `<a href="${it.href}" class="block border-b border-line py-3.5 font-label text-[15px] font-medium ${on ? 'text-copper' : 'text-ink'}"${on ? ' aria-current="page"' : ''}>${it.label}</a>`;
  }).join('\n');

  let langSwitch = '';
  if (switchTo) {
    const link = (code, label, aria) => {
      const on = lang === code;
      const cls = on ? 'text-ink' : 'text-muted transition-colors hover:text-copper';
      return `<a href="${switchTo[code]}" hreflang="${code}" lang="${code}" aria-label="${aria}" class="${cls}"${on ? ' aria-current="true"' : ''}>${label}</a>`;
    };
    langSwitch = `<div class="flex items-center gap-2 font-label text-[12px] font-semibold tracking-wider">${link('en', 'EN', ui.toEn)}<span class="text-line" aria-hidden="true">|</span>${link('sk', 'SK', ui.toSk)}</div>
`;
  }

  return `<!-- ===== HEADER ===== -->
<header class="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
<nav class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8" aria-label="${ui.navLabel}">
${logo(lang, 'h-7')}
<div class="hidden items-center gap-7 lg:flex" id="nav-links">
${desktop}
</div>
<div class="flex items-center gap-4">
${langSwitch}<button type="button" id="mobile-menu-btn" onclick="toggleMobileMenu()" class="-mr-2 p-2 text-ink lg:hidden" aria-label="${ui.menu}" aria-expanded="false">
<span class="material-symbols-outlined text-[26px]" aria-hidden="true">menu</span>
</button>
</div>
</nav>
</header>

<!-- Mobile menu drawer – kept outside <header>: the header's backdrop-filter
     makes it the containing block for fixed children in Safari, which would
     collapse this drawer to the header's height. -->
<div id="mobile-menu" inert class="pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity duration-300 lg:hidden">
<div class="absolute inset-0 bg-ink/40" onclick="toggleMobileMenu()"></div>
<div id="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="${ui.menu}" class="absolute right-0 top-0 h-full translate-x-full transition-transform duration-300 ease-out">
<div class="flex h-full w-72 flex-col border-l border-line bg-paper shadow-2xl">
<div class="flex h-16 items-center justify-between border-b border-line px-6">
<span class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">${ui.menu}</span>
<button type="button" id="mobile-menu-close" onclick="toggleMobileMenu()" aria-label="${ui.closeMenu}" class="-mr-2 p-2 text-ink"><span class="material-symbols-outlined text-[26px]" aria-hidden="true">close</span></button>
</div>
<div class="flex-1 overflow-y-auto px-6 py-2">
${mobile}
</div>
<div class="border-t border-line p-6">${button(t['home.hero.cta'], PAGES.contact[lang], { full: true })}</div>
</div>
</div>
</div>`;
}

// ---------------------------------------------------------------- footer + scripts

function renderFooter(lang) {
  const t = loadTranslations()[lang];
  const copy = t['footer.copy'].replace('{year}', `<span id="footer-year">${new Date().getFullYear()}</span>`);
  const menu = navItems(lang).map((it) => `<a href="${it.href}" class="py-1 lg:whitespace-nowrap font-label text-[14px] text-body transition-colors hover:text-copper">${it.label}</a>`).join('\n');
  const row = (ic, text, href) => `<li class="flex items-center gap-3 text-[14px] text-body"><span class="material-symbols-outlined text-[20px] text-copper" aria-hidden="true">${ic}</span><span>${href ? `<a href="${href}" class="hover:text-copper">${text}</a>` : text}</span></li>`;
  return `<!-- ===== FOOTER ===== -->
<footer class="border-t border-line bg-paper"><div class="mx-auto max-w-7xl px-6 lg:px-8">
<div class="grid gap-10 py-12 md:grid-cols-3 md:gap-0 lg:grid-cols-[1fr_1.4fr_1fr]">
<div class="md:pr-10">${logo(lang, 'h-8')}<p class="mt-4 text-[14px] text-body">${t['footer.tagline']}</p></div>
<nav aria-label="${t['footer.nav']}" class="md:border-l md:border-line md:px-10"><div class="grid grid-cols-2 gap-x-6">
${menu}
</div></nav>
<ul class="space-y-3 md:border-l md:border-line md:pl-10">
${row('call', CONTACT.phone, CONTACT.phoneHref)}
${row('mail', CONTACT.email, `mailto:${CONTACT.email}`)}
${row('location_on', CONTACT.address)}
</ul></div>
<div class="flex flex-col gap-2 border-t border-line py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between" id="footer-copy">
<p>${copy}</p><a href="${PAGES.privacy.sk}"${lang === 'sk' ? '' : ' hreflang="sk" lang="sk"'} class="hover:text-copper hover:underline">${t['footer.privacy']}</a>
</div></div></footer>

<script>
(function () {
    var y = document.getElementById('footer-year');
    if (y) y.textContent = new Date().getFullYear();

    window.toggleMobileMenu = function () {
        var menu = document.getElementById('mobile-menu');
        var panel = document.getElementById('mobile-menu-panel');
        var btn = document.getElementById('mobile-menu-btn');
        var isOpen = menu.classList.contains('pointer-events-auto');
        if (isOpen) {
            panel.classList.add('translate-x-full');
            menu.classList.remove('opacity-100', 'pointer-events-auto');
            menu.classList.add('opacity-0', 'pointer-events-none');
            menu.setAttribute('inert', '');
            btn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            btn.focus();
        } else {
            menu.classList.remove('opacity-0', 'pointer-events-none');
            menu.classList.add('opacity-100', 'pointer-events-auto');
            panel.classList.remove('translate-x-full');
            menu.removeAttribute('inert');
            btn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            document.getElementById('mobile-menu-close').focus();
        }
    };
    document.addEventListener('keydown', function (e) {
        var m = document.getElementById('mobile-menu');
        if (!m || !m.classList.contains('pointer-events-auto')) return;
        if (e.key === 'Escape') { window.toggleMobileMenu(); return; }
        if (e.key !== 'Tab') return;
        // Keep Tab inside the open drawer panel.
        var f = document.getElementById('mobile-menu-panel').querySelectorAll('a[href], button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1], cur = document.activeElement;
        if (!m.contains(cur)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    });
})();
</script>`;
}

// ---------------------------------------------------------------- document

// opts: { generated, lang, active, switchTo, head, main, bodyScripts? }
function renderDocument({ generated, lang, active, switchTo, head, main, bodyScripts }) {
  // The eager (LCP) <picture> is preloaded with the very same AVIF srcset/sizes, so the browser fetches the candidate it will use.
  const m = /<picture>\s*<source type="image\/avif" srcset="([^"]*)" sizes="([^"]*)"\/>\s*<img [^>]*fetchpriority="high"/.exec(main);
  if (m) head = { ...head, lcpImage: { srcset: m[1], sizes: m[2] } };
  return `<!DOCTYPE html>
${generated}
<html class="light" lang="${lang}">
${renderHead(lang, head)}
<body class="bg-paper text-body font-body text-[15px] leading-[1.6] antialiased">

${renderHeader(lang, active, switchTo)}

<main>
${main.trim()}
</main>

${renderFooter(lang)}
${bodyScripts ? '\n' + bodyScripts.trim() + '\n' : ''}
</body>
</html>
`;
}

// hreflang alternates for a page id (only for real pairs)
function alternatesFor(id) {
  const p = PAGES[id];
  if (!p || !p.en) return [];
  return [
    { hreflang: 'sk', href: abs(p.sk) },
    { hreflang: 'en', href: abs(p.en) },
    { hreflang: 'x-default', href: abs(p.sk) },
  ];
}

module.exports = { SITE, analytics, esc, jsonLd, ROBOTS, LOCALES, renderHead, renderHeader, renderFooter, renderDocument, alternatesFor };
