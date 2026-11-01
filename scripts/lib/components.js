'use strict';

/* Markup components shared by the page and article generators. */

const { articleCard } = require('./ui');
const { picture } = require('./images');

// Rendered width of an article tile: the grid is 1 column (viewport - 48px padding), 2 columns from 768px
// (gap 20px), 3 columns from 1024px (gap 24px), capped at 389px once the 1216px container maxes out.
const TILE_SIZES = '(min-width: 1280px) 389px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 768px) calc((100vw - 68px) / 2), calc(100vw - 48px)';
// Article hero: full container width (viewport - 48px), capped at 1216px.
const HERO_SIZES = '(min-width: 1280px) 1216px, calc(100vw - 48px)';
// Article photo in the page hero: the box is ~52vw wide on lg and as tall as the text, so the 3:2 photo can render wider than 52vw.
const ARTICLE_HERO_SIZES = '(min-width: 1024px) 62vw, 100vw';
// Article images exist in these widths ("" = the 1600px original); the default <img src> is the 800px JPEG.
// The 400/640/1024 variants are pre-cropped to 3:2 (the aspect the tiles and hero display with object-cover),
// so no bytes are wasted on cropped-away pixels; 640 covers a 412px phone at DPR 1.75, 1024 the desktop hero.
const ARTICLE_VARIANTS = ['400', '640', '800', '1024', ''];

function articleImage(a, { sizes, eager, cls, root }) {
  return picture({ src: `/assets/articles/${a.image}`, variants: ARTICLE_VARIANTS, fallback: '800', sizes, alt: a.imageAlt, eager, cls, root });
}

// level: heading level of the tile title (2 when the tile grid directly follows the H1).
// lang: page language; tiles always link to Slovak articles, so they are marked lang="sk" on other pages.
function tile(a, { level = 3, lang = 'sk', root, eager = false, high = eager } = {}) {
  return articleCard({
    photo: { src: `/assets/articles/${a.image}`, variants: ARTICLE_VARIANTS, fallback: '800', sizes: TILE_SIZES, alt: a.imageAlt, eager, high, root },
    title: a.title,
    text: a.excerpt,
    href: `/clanky/${a.slug}/`,
    attrs: lang === 'sk' ? '' : 'lang="sk"',
    level,
  });
}

// date desc, then order asc
function latest(articles, n) {
  return [...articles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.order - b.order)).slice(0, n);
}

module.exports = { TILE_SIZES, HERO_SIZES, ARTICLE_HERO_SIZES, ARTICLE_VARIANTS, articleImage, tile, latest };
