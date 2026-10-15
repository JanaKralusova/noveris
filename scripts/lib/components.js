'use strict';

/* Markup components shared by the page and article generators. */

const { esc } = require('./layout');
const { picture } = require('./images');

// Rendered width of an article tile (measured): the grid is 1 column (viewport - 64px padding), 2 columns
// from 768px (gap 40px), 3 columns from 1024px (gap 48px), capped at 395px once the container maxes out.
const TILE_SIZES = '(min-width: 1456px) 395px, (min-width: 1024px) calc((100vw - 160px) / 3), (min-width: 768px) calc((100vw - 104px) / 2), calc(100vw - 64px)';
// Article hero: full container width (viewport - 64px), capped at 1024px.
const HERO_SIZES = '(min-width: 1088px) 1024px, calc(100vw - 64px)';
// Article images exist in these widths ("" = the 1600px original); the default <img src> is the 800px JPEG.
// The 400/640/1024 variants are pre-cropped to 3:2 (the aspect the tiles and hero display with object-cover),
// so no bytes are wasted on cropped-away pixels; 640 covers a 412px phone at DPR 1.75, 1024 the desktop hero.
const ARTICLE_VARIANTS = ['400', '640', '800', '1024', ''];

function articleImage(a, { sizes, eager, cls, root }) {
  return picture({ src: `/assets/articles/${a.image}`, variants: ARTICLE_VARIANTS, fallback: '800', sizes, alt: a.imageAlt, eager, cls, root });
}

// level: heading level of the tile title (2 when the tile grid directly follows the H1).
// lang: page language; tiles always link to Slovak articles, so they are marked lang="sk" on other pages.
function tile(a, { level = 3, lang = 'sk', root, eager = false } = {}) {
  const langAttr = lang === 'sk' ? '' : ' lang="sk"';
  return `<a href="/clanky/${esc(a.slug)}/"${langAttr} class="group flex flex-col h-full bg-surface-container-lowest editorial-shadow rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4 focus-visible:ring-offset-background">
<div class="overflow-hidden bg-surface-container">
${articleImage(a, { sizes: TILE_SIZES, eager, cls: 'aspect-[3/2] object-cover w-full transition-transform duration-700 ease-out group-hover:scale-105', root })}
</div>
<div class="flex flex-col flex-1 p-8">
<h${level} class="font-headline text-2xl leading-snug text-on-surface mb-4 group-hover:text-secondary transition-colors duration-300">${esc(a.title)}</h${level}>
<p class="font-body text-on-surface-variant leading-relaxed line-clamp-3">${esc(a.excerpt)}</p>
</div>
</a>`;
}

// date desc, then order asc
function latest(articles, n) {
  return [...articles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.order - b.order)).slice(0, n);
}

module.exports = { TILE_SIZES, HERO_SIZES, articleImage, tile, latest };
