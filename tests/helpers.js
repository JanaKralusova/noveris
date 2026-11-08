const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDED = new Set(['_preview', 'design-system', 'node_modules', 'in', 'templates', 'data', '.git', '.superpowers']);

function builtPages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!dir && EXCLUDED.has(e.name)) continue;
        walk(rel);
      } else if (e.name === 'index.html' || (e.name === '404.html' && !dir)) {
        out.push(rel);
      }
    }
  })('');
  return out.sort();
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function internalRefs(html) {
  const refs = [];
  const re = /\s(href|src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) {
    const attr = m[1].toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[3];
    const urls = attr === 'srcset'
      ? val.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
      : [val.trim()];
    for (const u of urls) if (u.startsWith('/') && !u.startsWith('//')) refs.push(u);
  }
  return refs;
}

function resolves(url) {
  let p = url.split('#')[0].split('?')[0];
  try { p = decodeURIComponent(p); } catch {}
  if (p.endsWith('/')) p += 'index.html';
  const abs = path.join(ROOT, p);
  if (!abs.startsWith(ROOT)) return false;
  try { return fs.statSync(abs).isFile(); } catch { return false; }
}

module.exports = { ROOT, builtPages, read, internalRefs, resolves };
