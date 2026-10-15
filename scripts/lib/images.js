'use strict';

/*
 * Responsive <picture> markup for the site photos and article images:
 * AVIF source + JPEG fallback, each in a small and a full-size variant.
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
 * opts: src ("/assets/photos/home", no extension), small (suffix of the small variant, "480"),
 *       sizes, alt, eager, cls, style, root (where the files live; defaults to the repo root).
 */
function picture({ src, small = '480', sizes, alt, eager = false, cls = '', style = '', root = ROOT }) {
  const full = jpegSize(path.join(root, `${src}.jpg`)) || jpegSize(path.join(ROOT, `${src}.jpg`));
  const sm = jpegSize(path.join(root, `${src}-${small}.jpg`)) || jpegSize(path.join(ROOT, `${src}-${small}.jpg`));
  if (!full) throw new Error(`image not found: ${src}.jpg`);
  const base = esc(src);
  const smW = sm ? sm.width : Number(small);
  const attrs = [
    `src="${base}${eager ? '' : '-' + small}.jpg"`,
    `srcset="${base}-${small}.jpg ${smW}w, ${base}.jpg ${full.width}w"`,
    `sizes="${esc(sizes)}"`,
    `alt="${esc(alt)}"`,
    `width="${full.width}"`,
    `height="${full.height}"`,
    eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"',
  ];
  if (cls) attrs.push(`class="${esc(cls)}"`);
  if (style) attrs.push(`style="${esc(style)}"`);
  return `<picture>
<source type="image/avif" srcset="${base}-${small}.avif ${smW}w, ${base}.avif ${full.width}w" sizes="${esc(sizes)}"/>
<img ${attrs.join(' ')}/>
</picture>`;
}

module.exports = { jpegSize, picture };
