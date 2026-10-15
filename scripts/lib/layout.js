'use strict';

/*
 * Shared page chrome (head, header/nav, mobile menu, footer, inline scripts).
 * Used by build-pages.js and build-articles.js so the navigation is identical
 * everywhere. All paths are root-absolute.
 */

const { SITE, SITE_NAME, PAGES, ARTICLES_URL, abs, loadTranslations, iconNames } = require('./site');

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
    { id: 'contact', href: PAGES.contact[lang], label: t['nav.contact'] },
  ];
}

// ---------------------------------------------------------------- head

// head: { title, description, canonical?, keywords?, robots?, og: {...}, alternates?: [{hreflang, href}],
//         mdAlt?: url, jsonlds?: [], rawHead?: string }
function renderHead(lang, h) {
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
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>',
    `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&icon_names=${iconNames().join(',')}&display=swap" rel="stylesheet"/>`,
    '<link href="/tailwind-output.css" rel="stylesheet"/>',
    '<link href="/styles.css" rel="stylesheet"/>');

  if (h.jsonlds && h.jsonlds.length) {
    lines.push('', '<!-- Structured Data (JSON-LD) -->');
    for (const j of h.jsonlds) lines.push(`<script type="application/ld+json">\n${typeof j === 'string' ? j : jsonLd(j)}\n</script>`);
  }
  return `<head>\n${lines.join('\n')}\n</head>`;
}

// ---------------------------------------------------------------- header

// switchTo: { sk: url, en: url } or null (page has no counterpart => no switch)
function renderHeader(lang, active, switchTo) {
  const ui = UI[lang];
  const t = loadTranslations()[lang];
  const items = navItems(lang);

  const desktop = items.map((it) => {
    const on = it.id === active;
    const state = on
      ? 'text-[#735c00] dark:text-[#d0c5af] border-b border-[#735c00] pb-1'
      : 'text-[#6d5b47] dark:text-[#d0c5af]';
    return `<a class="nav-link font-label tracking-widest uppercase text-sm ${state} hover:text-[#735c00] transition-colors duration-300" href="${it.href}"${on ? ' aria-current="page"' : ''}>${it.label}</a>`;
  }).join('\n');

  const mobile = items.map((it) => {
    const on = it.id === active;
    const state = on ? 'text-[#735c00] font-bold' : 'text-[#6d5b47] hover:text-[#735c00]';
    return `<a class="nav-link-mobile font-label tracking-widest uppercase text-sm ${state} transition-colors" href="${it.href}"${on ? ' aria-current="page"' : ''}>${it.label}</a>`;
  }).join('\n');

  let langSwitch = '';
  if (switchTo) {
    const link = (code, label, aria) => {
      const on = lang === code;
      const cls = on ? 'text-[#735c00] font-bold' : 'text-[#6d5b47] dark:text-[#d0c5af] hover:text-[#735c00] transition-colors duration-300';
      return `<a href="${switchTo[code]}" hreflang="${code}" lang="${code}" aria-label="${aria}" class="${cls}"${on ? ' aria-current="true"' : ''}>${label}</a>`;
    };
    langSwitch = `${link('en', 'EN', ui.toEn)}
<span class="text-outline-variant opacity-50" aria-hidden="true">|</span>
${link('sk', 'SK', ui.toSk)}
`;
  }

  return `<!-- ===== HEADER ===== -->
<header class="bg-[#fcf9f2]/80 dark:bg-[#1c1c18]/80 backdrop-blur-md sticky top-0 w-full z-50 border-b border-outline-variant/20 px-8">
<nav class="flex justify-between items-center w-full py-6 max-w-7xl mx-auto" aria-label="${ui.navLabel}">
<div class="flex items-center shrink-0">
<a href="${PAGES.home[lang]}"><img alt="Noveris Legal Logo" width="95" height="32" class="h-8 w-auto object-contain invert dark:invert-0" src="/assets/logo.svg"/></a>
</div>
<div class="hidden md:flex items-center justify-center space-x-12 flex-1" id="nav-links">
${desktop}
</div>
<div class="flex items-center space-x-4 font-label tracking-widest text-xs shrink-0">
${langSwitch}<button id="mobile-menu-btn" onclick="toggleMobileMenu()" class="md:hidden ml-4 text-primary p-1" aria-label="${ui.menu}" aria-expanded="false">
<span class="material-symbols-outlined text-2xl" aria-hidden="true">menu</span>
</button>
</div>
</nav>
</header>

<!-- Mobile menu drawer — kept outside <header>: the header's backdrop-filter
     makes it the containing block for fixed children in Safari, which would
     collapse this drawer to the header's height. -->
<div id="mobile-menu" class="md:hidden fixed inset-0 z-[60] pointer-events-none opacity-0 transition-opacity duration-300">
<div class="absolute inset-0 bg-black/40" onclick="toggleMobileMenu()"></div>
<div id="mobile-menu-panel" class="absolute top-0 right-0 h-full w-72 bg-surface shadow-2xl translate-x-full transition-transform duration-300 ease-out flex flex-col">
<div class="flex justify-between items-center px-8 py-6 border-b border-outline-variant/20">
<span class="font-label uppercase tracking-widest text-xs text-outline">${ui.menu}</span>
<button onclick="toggleMobileMenu()" aria-label="${ui.closeMenu}" class="text-primary p-1">
<span class="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
</button>
</div>
<div class="flex flex-col px-8 py-8 space-y-6 flex-1">
${mobile}
</div>
<div class="px-8 py-6 border-t border-outline-variant/20">
<a href="${PAGES.contact[lang]}" class="satin-button block text-center text-white px-8 py-4 rounded-md font-label uppercase tracking-widest text-sm">${t['home.hero.cta']}</a>
</div>
</div>
</div>`;
}

// ---------------------------------------------------------------- footer + scripts

function renderFooter(lang) {
  const t = loadTranslations()[lang];
  const copy = t['footer.copy'].replace('{year}', `<span id="footer-year">${new Date().getFullYear()}</span>`);
  return `<!-- ===== FOOTER ===== -->
<footer class="bg-[#dcdad3] dark:bg-[#2a2621] w-full px-8 py-12 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
<div class="text-xl font-serif text-[#6d5b47] dark:text-[#fcf9f2]">
<a href="${PAGES.home[lang]}"><img alt="Noveris Legal Logo" width="71" height="24" class="h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity invert dark:invert-0" src="/assets/logo.svg"/></a>
</div>
<div class="text-[#6d5b47] dark:text-[#fcf9f2] font-body text-xs" id="footer-copy">
    ${copy}
</div>
</footer>

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
            btn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        } else {
            menu.classList.remove('opacity-0', 'pointer-events-none');
            menu.classList.add('opacity-100', 'pointer-events-auto');
            panel.classList.remove('translate-x-full');
            btn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    };
})();
</script>`;
}

// ---------------------------------------------------------------- document

// opts: { generated, lang, active, switchTo, head, main, bodyScripts? }
function renderDocument({ generated, lang, active, switchTo, head, main, bodyScripts }) {
  return `<!DOCTYPE html>
${generated}
<html class="light" lang="${lang}">
${renderHead(lang, head)}
<body class="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed">

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

module.exports = { SITE, esc, jsonLd, ROBOTS, LOCALES, renderHead, renderHeader, renderFooter, renderDocument, alternatesFor };
