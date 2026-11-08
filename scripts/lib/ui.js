'use strict';

/*
 * Design-system components (ported 1:1 from design-system/gen/comp*.py). Every function returns an HTML
 * string made of Tailwind classes. Text arguments are escaped; a paragraph given as { html } and arguments
 * named `html` / `*Html` are trusted markup. Photos are { src, alt, sizes, eager?, variants? } and are
 * rendered with picture() (AVIF + JPEG, srcset from the real files).
 */

const { esc } = require('./layout');
const { picture, photoSize, scaleSizes } = require('./images');

// widths of a service photo ("" = the 2000px file); see scripts/make-photo.sh
const VARIANTS = ['400', '560', '800', '1200', '1600', ''];

// A text value: plain strings are escaped, { html } is trusted.
const txt = (v) => (v && typeof v === 'object' && 'html' in v ? String(v.html) : esc(v == null ? '' : v));

function icon(name, cls = 'text-[22px]') {
  return `<span class="material-symbols-outlined ${cls}" aria-hidden="true">${esc(name)}</span>`;
}

// Components that always show a photo call this first, so a missing one fails the build with a clear message.
function needPhoto(photo, component) {
  if (!photo) throw new Error(`${component}: photo is required`);
}

function photoImg(photo, cls, eager) {
  return picture({
    src: photo.src,
    alt: photo.alt || '',
    sizes: photo.sizes,
    variants: photo.variants || VARIANTS,
    fallback: photo.fallback,
    eager: eager !== undefined ? eager : !!photo.eager,
    high: photo.high,
    cls,
    style: photo.style,
    root: photo.root,
  });
}


// ---------- honest `sizes` for photos in card grids ----------
// The page container is 100vw - 48px (px-6), 100vw - 64px from 1024px (lg:px-8), and 1216px at most (max-w-7xl).
// gridSizes(stops) builds the `sizes` of a photo that fills one grid cell: stops = [{ min, cols, gap }] by descending
// min-width in px (min 1024 also emits the 1280px cap); `phone` is what is declared below the last stop. Card photos
// on phones are lazy and decorative: they are declared 320px wide (a card is really viewport - 48px), so a 1.75x
// phone picks the 560w file instead of 800w and the hero keeps its bandwidth (a 3x phone still gets the 1200w file).
function gridSizes(stops, phone = '320px') {
  const out = [];
  const cell = (pad, cols, gap) => (cols === 1 ? `calc(100vw - ${pad}px)` : `calc((100vw - ${pad + gap * (cols - 1)}px) / ${cols})`);
  for (const { min, cols, gap = 0 } of stops) {
    if (min >= 1024) {
      out.push(`(min-width: 1280px) ${Math.round((1216 - gap * (cols - 1)) / cols)}px`);
      out.push(`(min-width: ${min}px) ${cell(64, cols, gap)}`);
    } else out.push(`(min-width: ${min}px) ${cell(48, cols, gap)}`);
  }
  out.push(phone);
  return out.join(', ');
}
// Side cards (photo column of 34% / 1/3 of the card, as tall as the text): a 4:3 photo covering such a tall column renders
// far wider than the column (up to ~1000 CSS px), so these are declared wide on purpose.
const SIDE_SIZES = '(min-width: 1024px) 56vw, (min-width: 640px) 90vw, 320px';

// `sizes` of a photo that covers a box (object-fit: cover): the picture renders max(box width, box height * aspect)
// wide. phone / sm = box height in px below 640px / 640-1023px (the box is full width); lg = { vw, h }: box width in
// vw and an estimated height in px from 1024px (the box is as tall as the text beside it). Hidden below lg: lg.only.
function coverSizes(photo, { phone, sm, lg }) {
  const d = photoSize(photo);
  if (!d) return photo.sizes;
  const ar = d.width / d.height;
  const wide = (h, min) => (h * ar > min ? `max(100vw, ${Math.round(h * ar)}px)` : '100vw');
  const big = `(min-width: 1024px) max(${lg.vw}vw, ${Math.round(lg.h * ar)}px)`;
  if (lg.only) return `${big}, 1px`;
  return `${big}, (min-width: 640px) ${wide(sm, 640)}, ${wide(phone, 320)}`;
}

// `sizes` of a photo shown whole (object-contain) at a given box height: phone / sm below 640px / 640-1023px, lg from 1024px.
function containSizes(photo, { phone, sm, lg }) {
  const d = photoSize(photo);
  if (!d) return photo.sizes;
  const w = (h) => Math.round((h * d.width) / d.height);
  return `(min-width: 1024px) ${w(lg)}px, (min-width: 640px) ${w(sm)}px, ${w(phone)}px`;
}

const withSizes = (item, sizes) => (item && item.photo ? { ...item, photo: { ...item.photo, sizes } } : item);

// ---------- atoms ----------
function eyebrow(text, { dark = false } = {}) {
  const c = dark ? 'text-copper-light' : 'text-copper';
  return `<p class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] ${c}">${esc(text)}</p>`;
}

function chip(name) {
  return `<span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-chip text-copper">${icon(name)}</span>`;
}

const BTN = 'inline-flex items-center gap-3 rounded-btn px-6 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200';
const BTN_FULL = BTN.replace('inline-flex', 'flex w-full justify-center whitespace-nowrap').replace('gap-3', 'gap-2').replace('px-6', 'px-4').replace('tracking-[0.12em]', 'tracking-[0.08em]');
const BTN_VARIANTS = {
  primary: 'bg-forest text-white hover:bg-forest-dark',
  outline: 'border border-forest text-forest hover:bg-forest hover:text-white',
  onDark: 'bg-white text-forest hover:bg-sand',
};
// attrs: trusted extra attributes for the <a> (e.g. 'hreflang="sk"'); full: block-level, full width, centred.
const xattr = (attrs) => (attrs ? ` ${attrs}` : '');
function button(text, href, { variant = 'primary', attrs = '', full = false } = {}) {
  const v = BTN_VARIANTS[variant];
  if (!v) throw new Error(`Unknown button variant: ${variant}`);
  return `<a href="${esc(href)}"${xattr(attrs)} class="${full ? BTN_FULL : BTN} ${v}">${esc(text)}${icon('arrow_forward', 'text-[18px]')}</a>`;
}

function linkArrow(text, href, attrs = '') {
  return `<a href="${esc(href)}"${xattr(attrs)} class="group inline-flex items-center gap-2 font-label text-[14px] font-semibold text-ink transition-colors hover:text-copper">${esc(text)}`
    + '<span class="material-symbols-outlined text-[18px] text-copper transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">arrow_forward</span></a>';
}

function breadcrumb(items, label = 'Omrvinková navigácia') {
  const lis = items.map((it, i) => (i === items.length - 1
    ? `<li aria-current="page" class="text-body">${esc(it.name)}</li>`
    : `<li class="flex items-center gap-1.5"><a href="${esc(it.url)}"${xattr(it.attrs)} class="hover:text-copper hover:underline">${esc(it.name)}</a>${icon('chevron_right', 'text-[16px]')}</li>`));
  return `<nav aria-label="${esc(label)}"><ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-label text-[12px] text-muted">${lis.join('')}</ol></nav>`;
}

const linkBlock = (link, pad) => (link ? `<div class="${pad}">${linkArrow(link.text, link.href, link.attrs)}</div>` : '');
const paras = (list, cls) => (list || []).map((p) => `<p class="${cls}">${txt(p)}</p>`).join('');

// ---------- sections ----------
const BG = { paper: 'bg-paper', sand: 'bg-sand', white: 'bg-white' };
function section(innerHtml, { bg = 'paper', pad = 'py-12 md:py-16' } = {}) {
  if (!BG[bg]) throw new Error(`section: unknown bg "${bg}" (expected ${Object.keys(BG).join(', ')})`);
  return `<section class="${BG[bg]} ${pad}"><div class="mx-auto max-w-7xl px-6 lg:px-8">${innerHtml}</div></section>`;
}

function sectionHeader({ eyebrow: eb, title, note } = {}) {
  const n = note ? `<p class="max-w-sm text-[13px] leading-normal text-muted md:text-[14px] md:text-right">${txt(note)}</p>` : '';
  return '<div class="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-10"><div>'
    + (eb ? eyebrow(eb) : '')
    + `<h2 class="mt-2 font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]">${esc(title)}</h2></div>${n}</div>`;
}

// The one hero of every page: text left, photo right (full-bleed, fades into the page), photo above the text on phones.
// crumbs: optional breadcrumb; title (escaped) or titleHtml (trusted, e.g. with the italic accent span); intro: paragraphs;
// topHtml: trusted block above the breadcrumb; actionsHtml / extraHtml: trusted blocks after the intro / after the buttons;
// size 'long' = smaller H1 for long titles; tall = minimum height for pages with little text; photo.style = object-position.
function hero({ crumbs, crumbsLabel, label, title, titleHtml, intro = [], bold, after, cta, actionsHtml = '', extraHtml = '', topHtml = '', size, tall = false, contain = false, photo }) {
  needPhoto(photo, 'hero');
  const ps = paras(intro, 'text-[15px] leading-[1.6] text-body md:text-[16px]');
  const b = bold ? `<p class="text-[15px] font-bold leading-[1.6] text-ink md:text-[16px]">${txt(bold)}</p>` : '';
  const a = after ? `<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">${txt(after)}</p>` : '';
  const c = cta ? `<div class="pt-7">${button(cta.text, cta.href)}</div>` : '';
  const act = actionsHtml ? `<div class="flex flex-wrap items-center gap-4 pt-7">${actionsHtml}</div>` : '';
  const lab = label ? eyebrow(label).replace('<p class="', '<p class="mt-5 ') : '';
  const h1Mt = label ? 'mt-2' : 'mt-5';
  const h1Size = size === 'long' ? 'text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.15]' : 'text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1]';
  const body = intro.length || bold || after ? `<div class="mt-5 space-y-3">${ps}${b}${a}</div>` : '';
  const crumb = crumbs ? breadcrumb(crumbs, crumbsLabel) : '';
  return '<section class="relative overflow-hidden bg-paper">'
    + (contain
      // whole portrait: contained next to the text, flush with the bottom edge; its left and right edges fade into the page (.fade-portrait)
      ? `<div class="relative flex h-80 justify-center sm:h-[26rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%] lg:justify-start lg:pl-2 xl:pl-6">${photoImg({ ...photo, sizes: containSizes(photo, { phone: 320, sm: 416, lg: 640 }) }, 'fade-portrait h-full w-auto max-w-full object-contain object-bottom', true)}</div>`
      : `<div class="fade-photo relative h-52 sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">${photoImg({ ...photo, sizes: coverSizes(photo, { phone: 208, sm: 288, lg: { vw: 52, h: 560 } }) }, 'h-full w-full object-cover', true)}</div>`)
    + `<div class="relative mx-auto max-w-7xl px-6 pb-12 pt-2 lg:px-8 lg:py-14${tall ? ' lg:min-h-[29rem]' : ''}"><div class="lg:w-[50%]">`
    + `${topHtml}${crumb}${lab}<h1 class="${h1Mt} font-headline ${h1Size} tracking-tight text-ink">${titleHtml !== undefined ? titleHtml : esc(title)}</h1>`
    + `${body}${c}${act}${extraHtml}</div></div></section>`;
}

// Quote card for the home hero.
function heroQuote({ text, cite }) {
  return `<figure class="mt-8 rounded-card border border-line bg-card p-5 shadow-soft"><blockquote class="font-headline text-[1.125rem] italic leading-snug text-ink md:text-[1.25rem]">${txt(text)}</blockquote>`
    + `<figcaption class="mt-3 font-label text-[12px] text-muted">${txt(cite)}</figcaption></figure>`;
}

// Linked tiles: the photo and the title link to the card's page (the photo link is hidden from keyboard and
// screen readers, the title link is the real one); the card root carries `group`, so hovering anywhere zooms
// the photo, turns the title copper and nudges the arrow. Without a link the tile stays plain.
const ZOOM = ' transition-transform duration-500 group-hover:scale-[1.03]';
const tileGroup = (link) => (link ? 'group ' : '');
const tilePhoto = (link, cls, photo, imgCls) => (link
  ? `<a href="${esc(link.href)}"${xattr(link.attrs)} tabindex="-1" aria-hidden="true" class="block ${cls.replace(/\boverflow-hidden\s?/, '').trim()} overflow-hidden">${photoImg(photo, imgCls + ZOOM)}</a>`
  : `<div class="${cls}">${photoImg(photo, imgCls)}</div>`);
const tileTitle = (link, title) => (link
  ? `<a href="${esc(link.href)}"${xattr(link.attrs)} class="transition-colors group-hover:text-copper">${esc(title)}</a>` : esc(title));

// Large specialisation card (home band): big photo, title, text, arrow link.
function cardFeature({ title, text, photo, link }) {
  needPhoto(photo, 'cardFeature');
  return `<article class="${tileGroup(link)}flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft">`
    + tilePhoto(link, 'aspect-[16/10] overflow-hidden', photo, 'h-full w-full object-cover')
    + `<div class="flex flex-1 flex-col p-6 md:p-8"><h3 class="font-headline text-[1.5rem] leading-snug text-ink md:text-[1.75rem]">${tileTitle(link, title)}</h3>`
    + `<p class="mt-3 flex-1 text-[15px] leading-[1.6] text-body md:text-[16px]">${txt(text)}</p>${linkBlock(link, 'pt-5')}</div></article>`;
}

function cardSide({ icon: ic, title, paras: ps, photo, link }) {
  needPhoto(photo, 'cardSide');
  return `<article class="${tileGroup(link)}flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft sm:flex-row">`
    + `<div class="flex-1 p-6">${chip(ic)}<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">${tileTitle(link, title)}</h3>`
    + `<div class="mt-3 space-y-3">${paras(ps, 'text-[14px] leading-[1.6] text-body md:text-[15px]')}</div>${linkBlock(link, 'pt-4')}</div>`
    + `${tilePhoto(link, 'relative order-first h-44 sm:order-last sm:h-auto sm:w-[34%] sm:shrink-0', photo, 'absolute inset-0 h-full w-full object-cover')}</article>`;
}

function cardTop({ icon: ic, title, paras: ps, photo, link }) {
  needPhoto(photo, 'cardTop');
  return `<article class="${tileGroup(link)}overflow-hidden rounded-card border border-line bg-card shadow-soft">${tilePhoto(link, 'h-40', photo, 'h-full w-full object-cover')}`
    + `<div class="p-6">${chip(ic)}<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">${tileTitle(link, title)}</h3>`
    + `<div class="mt-3 space-y-3">${paras(ps, 'text-[14px] leading-[1.6] text-body md:text-[15px]')}</div>${linkBlock(link, 'pt-4')}</div></article>`;
}

function cardCompact({ icon: ic, title, text, photo }) {
  needPhoto(photo, 'cardCompact');
  return `<article class="h-full overflow-hidden rounded-card border border-line bg-card shadow-soft"><div class="h-28">${photoImg(photo, 'h-full w-full object-cover')}</div>`
    + `<div class="p-4">${chip(ic)}<h3 class="mt-3 font-headline text-[1.125rem] leading-snug text-ink">${esc(title)}</h3><p class="mt-2 text-[13px] leading-normal text-body">${txt(text)}</p></div></article>`;
}

function cardIcon({ icon: ic, title, text, href, linkText = 'Viac o službe', attrs = '' }) {
  return `<article class="group flex flex-col rounded-card border border-line bg-card p-6 shadow-soft">${chip(ic)}`
    + `<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">${tileTitle({ href, attrs }, title)}</h3>`
    + `<p class="mt-3 flex-1 text-[14px] leading-[1.6] text-body md:text-[15px]">${txt(text)}</p><div class="pt-5">${linkArrow(linkText, href, attrs)}</div></article>`;
}

// Article tile (home page): photo is { src, variants, sizes, alt }; attrs go on both links (e.g. 'lang="sk"').
function articleCard({ photo, title, text, href, linkText = 'Čítať článok', attrs = '', level = 3 }) {
  needPhoto(photo, 'articleCard');
  const x = xattr(attrs);
  // the 3:2 box shows a slice of any photo wider than 3:2
  const d = photoSize(photo);
  if (d) photo = { ...photo, sizes: scaleSizes(photo.sizes, d.width / d.height / 1.5) };
  return `<article${x} class="group flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft">`
    + `<a href="${esc(href)}"${x} tabindex="-1" aria-hidden="true" class="block aspect-[3/2] overflow-hidden">${photoImg(photo, 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]')}</a>`
    + `<div class="flex flex-1 flex-col p-6"><h${level} class="font-headline text-[1.375rem] leading-snug text-ink"><a href="${esc(href)}"${x} class="transition-colors group-hover:text-copper">${esc(title)}</a></h${level}>`
    + `<p class="mt-3 flex-1 text-[14px] leading-[1.6] text-body">${txt(text)}</p><div class="pt-4">${linkArrow(linkText, href, attrs)}</div></div></article>`;
}

const num = (i) => String(i + 1).padStart(2, '0');
const NUM = 'grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-sand-deep font-headline text-[1.125rem] text-forest';

function stepsH(steps) {
  const cols = steps.map((s, i) => {
    const arrow = i < steps.length - 1
      ? `<span class="absolute -right-[22px] top-3 hidden text-muted md:block" aria-hidden="true">${icon('arrow_forward', 'text-[20px]')}</span>` : '';
    return `<li class="relative flex flex-1 items-start gap-4"><span class="${NUM}">${num(i)}</span>`
      + `<div><h3 class="font-headline text-[1.25rem] leading-snug text-ink md:text-[1.375rem]">${esc(s.title)}</h3><p class="mt-2 text-[14px] leading-[1.6] text-body md:text-[15px]">${txt(s.text)}</p></div>${arrow}</li>`;
  });
  return `<ol class="flex flex-col gap-8 md:flex-row md:gap-6">${cols.join('')}</ol>`;
}

function stepsV(steps) {
  const out = steps.map((s, i) => {
    const line = i === steps.length - 1 ? '' : '<span class="absolute left-[21px] top-12 h-[calc(100%-2rem)] w-px bg-line" aria-hidden="true"></span>';
    return `<li class="relative flex gap-4 pb-7 last:pb-0">${line}<span class="${NUM}">${num(i)}</span>`
      + `<div class="pt-1"><h3 class="font-headline text-[1.25rem] leading-snug text-ink">${esc(s.title)}</h3><p class="mt-1 text-[14px] leading-[1.6] text-body">${txt(s.text)}</p></div></li>`;
  });
  return `<ol>${out.join('')}</ol>`;
}

// extraHtml: trusted markup shown after the paragraphs and the link (e.g. a callout).
function splitBand({ eyebrow: eb, title, paras: ps, photo, link, extraHtml = '', callout: co, side = 'left', bg = 'sand' }) {
  needPhoto(photo, 'splitBand');
  if (co && !extraHtml) extraHtml = callout(co);
  const fade = side === 'left' ? 'fade-photo-l' : 'fade-photo';
  const pos = side === 'left' ? 'lg:left-0' : 'lg:right-0';
  const pad = side === 'left' ? 'lg:ml-auto lg:w-[52%] lg:pl-12' : 'lg:w-[52%] lg:pr-12';
  const extra = extraHtml ? `<div class="pt-5">${extraHtml}</div>` : '';
  return `<section class="relative overflow-hidden ${BG[bg] || bg}"><div class="${fade} relative h-48 sm:h-64 lg:absolute lg:inset-y-0 ${pos} lg:h-auto lg:w-[48%]">${photoImg({ ...photo, sizes: coverSizes(photo, { phone: 192, sm: 256, lg: { vw: 48, h: 640 } }) }, 'h-full w-full object-cover')}</div>`
    + `<div class="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16"><div class="${pad}">${eb ? eyebrow(eb) : ''}`
    + `<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2.25rem]">${esc(title)}</h2><div class="mt-4 space-y-3">${paras(ps, 'text-[15px] leading-[1.6] text-body md:text-[16px]')}</div>${linkBlock(link, 'pt-5')}${extra}</div></div></section>`;
}

function callout({ icon: ic, text }) {
  return `<div class="flex items-start gap-4 rounded-card border border-line bg-card p-5 shadow-soft">${chip(ic)}<p class="pt-1.5 text-[15px] font-bold leading-[1.5] text-ink">${txt(text)}</p></div>`;
}

function iconList(items) {
  const li = items.map((it) => `<li class="flex items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-chip text-copper">${icon(it.icon, 'text-[20px]')}</span><span class="text-[14px] leading-snug text-body md:text-[15px]">${txt(it.text)}</span></li>`);
  return `<ul class="space-y-3">${li.join('')}</ul>`;
}

function splitTextList({ eyebrow: eb, title, intro, items, outro = [], link, photo }) {
  const o = paras(outro, 'text-[14px] leading-[1.6] text-body md:text-[15px]');
  const l = link ? `<div class="mt-4">${linkArrow(link.text, link.href, link.attrs)}</div>` : '<div class="mt-4"></div>';
  const ph = photo ? `<div class="mt-6 overflow-hidden rounded-card"><div class="h-48">${photoImg(photo, 'h-full w-full object-cover')}</div></div>` : '';
  return `<div>${eyebrow(eb)}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2rem]">${esc(title)}</h2>`
    + `<p class="mt-4 mb-5 text-[14px] leading-[1.6] text-body md:text-[15px]">${txt(intro)}</p>${iconList(items)}`
    + `<div class="mt-5 space-y-3">${o}</div>${l}${ph}</div>`;
}

function twoCol(left, right) {
  const col = (c) => `<div>${eyebrow(c.eyebrow)}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2rem]">${esc(c.title)}</h2>`
    + `<div class="mt-4 space-y-3 text-[15px] leading-[1.6] text-body md:text-[16px]">${(c.paras || []).map((p) => `<p>${txt(p)}</p>`).join('')}${c.steps ? stepsV(c.steps) : ''}${c.html || ''}</div></div>`;
  return `<div class="grid gap-10 md:grid-cols-2 md:gap-14">${col(left)}${col(right)}</div>`;
}

function relatedBand({ eyebrow: eb, title, text, link, photo }) {
  needPhoto(photo, 'relatedBand');
  return `<div class="${tileGroup(link)}flex flex-col overflow-hidden rounded-card border border-line bg-sand sm:flex-row"><div class="flex-1 p-6 md:p-8">${eyebrow(eb)}`
    + `<h3 class="mt-2 font-headline text-[1.5rem] leading-snug text-ink md:text-[1.75rem]">${tileTitle(link, title)}</h3><p class="mt-3 text-[15px] leading-[1.6] text-body">${txt(text)}</p>${linkBlock(link, 'pt-4')}</div>`
    + `${tilePhoto(link, 'relative h-40 sm:h-auto sm:w-[32%]', photo, 'absolute inset-0 h-full w-full object-cover')}</div>`;
}

function prose({ eyebrow: eb, title, paras: ps, bg = 'paper' }) {
  return section(`<div class="max-w-3xl">${eb ? eyebrow(eb) : ''}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2.25rem]">${esc(title)}</h2>`
    + `<div class="mt-4 space-y-3">${paras(ps, 'text-[15px] leading-[1.6] text-body md:text-[16px]')}</div></div>`, { bg });
}

function quote({ text, cite }) {
  return `<figure class="border-l-2 border-copper pl-6"><blockquote class="font-headline text-[1.375rem] italic leading-[1.4] text-ink md:text-[1.75rem]">${txt(text)}</blockquote>`
    + (cite ? `<figcaption class="mt-3 font-label text-[13px] text-muted">${txt(cite)}</figcaption>` : '') + '</figure>';
}

function contactBand({ eyebrow: eb = 'Kontakt', title, paras: ps, cta, photo }) {
  const ph = photo
    ? `<div class="fade-photo-dark absolute inset-y-0 right-0 hidden w-1/2 opacity-60 lg:block">${photoImg({ ...photo, sizes: coverSizes(photo, { lg: { vw: 50, h: 340, only: true } }) }, 'h-full w-full object-cover')}</div>` : '';
  return `<section class="relative overflow-hidden bg-forest">${ph}`
    + `<div class="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14"><div class="lg:w-[55%]">${eyebrow(eb, { dark: true })}`
    + `<h2 class="mt-2 font-headline text-[1.875rem] leading-[1.2] text-white md:text-[2.25rem]">${esc(title)}</h2><div class="mt-4 space-y-3">${paras(ps, 'text-[15px] leading-[1.6] text-white/90 md:text-[16px]')}</div>`
    + `<div class="pt-7">${button(cta.text, cta.href, { variant: 'onDark' })}</div></div></div></section>`;
}

// ---------- page assembly ----------
const spanCls = { 2: 'lg:col-span-2', 3: 'lg:col-span-3' };
const spanCell = (inner, n) => `<div class="flex flex-col ${spanCls[n]} [&>article]:flex-1">${inner}</div>`;

// Grid wrappers as in the mockups; the layout follows the number of cards.
function cardGrid(kind, items) {
  const n = items.length;
  if (kind === 'side') {
    // 5 -> 2+2 plus the last card full width.
    const rest = n === 5 ? items.slice(0, 4) : items;
    const last = n === 5 ? `<div class="mt-5 lg:mt-6">${cardSide(withSizes(items[4], SIDE_SIZES))}</div>` : '';
    return `<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">${rest.map((c) => cardSide(withSizes(c, SIDE_SIZES))).join('')}</div>${last}`;
  }
  if (kind === 'compact') {
    const cols = n === 5 ? 'sm:grid-cols-2 lg:grid-cols-5' : n === 3 ? 'md:grid-cols-3' : n === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
    const stops = n === 5 ? [{ min: 1024, cols: 5, gap: 20 }, { min: 640, cols: 2, gap: 20 }]
      : n === 3 ? [{ min: 768, cols: 3, gap: 20 }, { min: 640, cols: 1 }]
        : n === 2 ? [{ min: 640, cols: 2, gap: 20 }]
          : [{ min: 1024, cols: 3, gap: 20 }, { min: 640, cols: 2, gap: 20 }];
    const sizes = gridSizes(stops);
    return `<div class="grid gap-5 ${cols}">${items.map((c) => `<div>${cardCompact(withSizes(c, sizes))}</div>`).join('')}</div>`;
  }
  if (kind === 'icon') {
    const cols = n === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3';
    return `<div class="grid gap-5 ${cols} lg:gap-6">${items.map(cardIcon).join('')}</div>`;
  }
  // top: 3 -> 2+2+2, 5 -> 2+2+2+3+3 (six columns); other counts use plain columns.
  if (n === 3 || n === 5) {
    // six columns on lg: a card spans 2 (a third of the row) or 3 (a half); below lg it is one column
    const third = gridSizes([{ min: 1024, cols: 3, gap: 24 }, { min: 640, cols: 1 }]);
    const half = gridSizes([{ min: 1024, cols: 2, gap: 24 }, { min: 640, cols: 1 }]);
    const cells = items.map((c, i) => spanCell(cardTop(withSizes(c, n === 3 || i < 3 ? third : half)), n === 3 || i < 3 ? 2 : 3));
    return `<div class="grid gap-5 lg:grid-cols-6 lg:gap-6">${cells.join('')}</div>`;
  }
  const two = n === 2 || n === 4;
  const cols = two ? 'lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';
  const sizes = gridSizes(two ? [{ min: 1024, cols: 2, gap: 24 }, { min: 640, cols: 1 }]
    : [{ min: 1024, cols: 3, gap: 24 }, { min: 768, cols: 2, gap: 20 }, { min: 640, cols: 1 }]);
  return `<div class="grid gap-5 ${cols} lg:gap-6">${items.map((c) => cardTop(withSizes(c, sizes))).join('')}</div>`;
}

// Sections that draw their own full-width <section>; all others are wrapped in section() with bg / pad.
const SELF = {
  hero: (s) => hero(s),
  splitBand: (s) => splitBand(s),
  contactBand: (s) => contactBand(s),
  prose: (s) => prose(s),
};
const INNER = {
  cardSide: (s) => cardSide(s),
  cardsSide: (s) => cardGrid('side', s.items),
  cardsTop: (s) => cardGrid('top', s.items),
  cardsCompact: (s) => cardGrid('compact', s.items),
  cardsIcon: (s) => cardGrid('icon', s.items),
  stepsH: (s) => stepsH(s.steps),
  stepsV: (s) => stepsV(s.steps),
  splitTextList: (s) => splitTextList(s),
  callout: (s) => callout(s),
  iconList: (s) => iconList(s.items),
  twoCol: (s) => twoCol(s.left, s.right),
  relatedBand: (s) => relatedBand(s),
  quote: (s) => quote(s),
  // grid: { cls, items: [section objects] } laid out with the given grid classes.
  grid: (s) => `<div class="${esc(s.cls || 'grid gap-8 lg:grid-cols-2 lg:gap-12')}">${s.items.map((it) => renderOne(it, true)).join('')}</div>`,
};

function renderOne(s, bare = false) {
  if (SELF[s.type]) return SELF[s.type](s);
  if (!INNER[s.type]) throw new Error(`Unknown section type: ${s.type}`);
  const inner = INNER[s.type](s) + (s.callout ? `<div class="mt-8">${callout(s.callout)}</div>` : '');
  if (bare) return inner;
  const head = s.header ? sectionHeader(s.header) : '';
  const opts = { bg: s.bg || 'paper' };
  if (s.pad) opts.pad = s.pad;
  return section(head + inner, opts);
}

function renderSections(sections) {
  return sections.map((s) => renderOne(s)).join('\n');
}

module.exports = {
  icon, photoImg, eyebrow, button, linkArrow, breadcrumb, chip, section, sectionHeader, hero, heroQuote, cardFeature,
  cardSide, cardTop, cardCompact, cardIcon, articleCard, stepsH, stepsV, splitBand, splitTextList,
  callout, iconList, twoCol, relatedBand, prose, quote, contactBand, cardGrid, renderSections,
};
