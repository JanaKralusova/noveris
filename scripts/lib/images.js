'use strict';

/*
 * Responsive <picture> markup for the site photos and article images:
 * AVIF source + JPEG fallback, each in several widths (srcset).
 * Dimensions are read from the real files so width/height always match.
 */

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./site');

const cache = new Map();

// Pixel size of a baseline/progressive JPEG, read from its SOF marker.
function jpegSize(file) {
  if (cache.has(file)) return cache.get(file);
  let size = null;
  if (fs.existsSync(file)) {
    const buf = fs.readFileSync(file);
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        size = { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
        break;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  cache.set(file, size);
  return size;
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * opts: src ("/assets/photos/home", no extension), sizes, alt, eager, cls, style,
 *       root (where the files live; defaults to the repo root), and the variants:
 *         small    suffix of the small variant ("480"); with the full file this gives two widths, or
 *         variants array of suffixes in ascending order, "" meaning the full-size file
 *                  (e.g. ["400", "800", "1200", ""] -> -400, -800, -1200 and the 1600w original);
 *       art       { media, variants } extra <source media> candidates (variants as above);
 *       fallback  suffix used for the default <img src> (the eager image falls back to the largest variant
 *                  unless `fallback` is given).
 */
function picture({ src, small = '480', variants, art, fallback, sizes, alt, eager = false, cls = '', style = '', root = ROOT }) {
  const sufs = variants || [small, ''];
  const dims = (suffix) => {
    const f = `${src}${suffix ? '-' + suffix : ''}.jpg`;
    return jpegSize(path.join(root, f)) || jpegSize(path.join(ROOT, f));
  };
  const full = dims('');
  if (!full) throw new Error(`image not found: ${src}.jpg`);
  const base = esc(src);
  const entries = sufs.map((suffix) => {
    const d = suffix === '' ? full : dims(suffix);
    return { suffix, w: d ? d.width : Number(suffix) };
  });
  const list = (ext, es = entries) => es.map((e) => `${base}${e.suffix ? '-' + e.suffix : ''}.${ext} ${e.w}w`).join(', ');
  // Art direction: `art` = { media, variants } adds <source media> candidates (e.g. a taller crop for phones).
  const artEntries = art && art.variants.map((suffix) => {
    const d = suffix === '' ? full : dims(suffix);
    return { suffix, w: d ? d.width : Number(suffix) };
  });
  const artSources = art
    ? `<source media="${esc(art.media)}" type="image/avif" srcset="${list('avif', artEntries)}" sizes="${esc(sizes)}"/>\n<source media="${esc(art.media)}" srcset="${list('jpg', artEntries)}" sizes="${esc(sizes)}"/>\n`
    : '';
  const defSuffix = fallback !== undefined ? fallback : (eager ? '' : sufs[0]);
  const attrs = [
    `src="${base}${defSuffix ? '-' + defSuffix : ''}.jpg"`,
    `srcset="${list('jpg')}"`,
    `sizes="${esc(sizes)}"`,
    `alt="${esc(alt)}"`,
    `width="${full.width}"`,
    `height="${full.height}"`,
    eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"',
  ];
  if (cls) attrs.push(`class="${esc(cls)}"`);
  if (style) attrs.push(`style="${esc(style)}"`);
  return `<picture>
${artSources}<source type="image/avif" srcset="${list('avif')}" sizes="${esc(sizes)}"/>
<img ${attrs.join(' ')}/>
</picture>`;
}

module.exports = { jpegSize, picture };
