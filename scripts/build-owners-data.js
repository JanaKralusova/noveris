#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/*
 * Builds the static search index for the "Nezistení vlastníci" page from SPF's
 * list of unknown land owners (~5 M CSV rows -> ~1.6 M records).
 *
 *   npm run build:owners        (= node --max-old-space-size=6144 scripts/build-owners-data.js)
 *   node scripts/build-owners-data.js --top 30   # also print the most frequent tokens
 *
 * Not part of `npm run build` (it is heavy) – run it only when SPF publishes new data:
 *   1. update content/owners.json (the 7 CSV URLs and "asOf")
 *   2. delete in/nezisteni-vlastnici/ (gitignored) so the files are downloaded again
 *   3. npm run build:owners, then npm run build (stats line on the page) and commit data/
 *
 * Reads   content/owners.json, in/nezisteni-vlastnici/*.csv
 * Writes  data/nezisteni-vlastnici/ (deleted and recreated)
 *   meta.json     counts, chunk size and the 2-letter prefixes that are split into 3-letter shards
 *   areas.json    [name, code, firstRecordId, recordCount] per cadastral area, in record order
 *   r/<n>.txt     records, 256 per chunk: areaIdx \t main \t notes \t spf \t lv,lv,...
 *   t/<xx>.txt    token shards: token \t mainIds \t noteIds (ids delta-encoded, base36)
 * The client search algorithm that consumes this lives in templates/partials/owners-search.js.
 * Zero dependencies.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const { ROOT } = require('./lib/site');

const CONFIG = path.join(ROOT, 'content', 'owners.json');
const IN_DIR = path.join(ROOT, 'in', 'nezisteni-vlastnici');
const OUT_DIR = path.join(ROOT, 'data', 'nezisteni-vlastnici');

const CHUNK_SIZE = 256;
const MAX_SHARD_GZIP = 40 * 1024; // a query downloads one shard per word; never split deeper than 3 letters
const MIN_TOKEN = 3;

// Note abbreviations repeated in thousands of rows; they would make shards huge and match
// nothing a person searches for. Personal names stay searchable.
const STOP_WORDS = new Set((
  'rod rodena rodeny man manz manzel manzelka zom zomr zomrel zomrela nar nepoz mal malol malolety ' +
  'maloleta spf vdova vdovec nezn neznamy neznama napos naposl bytom syn dcera ded prot ' +
  'sur muz lsr pkv psc zena sr bez ulica ul pozemok rodne cislo'
).split(/\s+/));

function fail(msg) {
  console.error('build-owners-data: ERROR: ' + msg);
  process.exit(1);
}

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// NFD, strip combining marks, lowercase – the same normalisation the page uses.
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ---------------------------------------------------------------- display split
// Ported from the mockup's parse(): "main" is the name before the first "(", "notes" the
// parenthesised groups that follow (the text after them just repeats the notes).
function parse(raw) {
  const spf = raw.includes('SPF');
  const s = raw.split(/\s+D:/)[0];
  const i = s.indexOf('(');
  if (i < 0) return { main: s.replace(/[\s,;]+$/, ''), notes: '', spf };
  const groups = [];
  let k = i;
  while (k < s.length && s[k] === '(') {
    let depth = 0;
    let j = k;
    for (; j < s.length; j++) {
      if (s[j] === '(') depth++;
      if (s[j] === ')' && --depth === 0) break;
    }
    const g = s.slice(k + 1, j).trim();
    if (g && !groups.includes(g)) groups.push(g);
    k = j + 1;
    while (s[k] === ' ') k++;
  }
  const notes = groups.join('; ').replace(/\bSPF\b/g, '').replace(/[()]/g, ' ')
    .replace(/\s*;\s*/g, '; ').replace(/\s+/g, ' ').replace(/^[\s,;.]+|[\s,;.]+$/g, '');
  return { main: s.slice(0, i).replace(/[\s,;]+$/, ''), notes, spf };
}

// Searchable tokens of an already normalised string.
function tokenize(normalised) {
  const out = [];
  for (const t of normalised.split(/[^a-z0-9]+/)) {
    if (t.length >= MIN_TOKEN && /[a-z]/.test(t) && !STOP_WORDS.has(t)) out.push(t);
  }
  return out;
}

// LVs are strings kept as written; sort numerically, non-numeric ones last.
function lvCompare(a, b) {
  const na = Number(a);
  const nb = Number(b);
  const fa = Number.isFinite(na);
  const fb = Number.isFinite(nb);
  if (fa && fb) return na - nb || (a < b ? -1 : a > b ? 1 : 0);
  if (fa !== fb) return fa ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

// ---------------------------------------------------------------- input
async function ensureCsvs(files) {
  fs.mkdirSync(IN_DIR, { recursive: true });
  const paths = [];
  for (const url of files) {
    // Saved under the short name ("A_G.csv"), the part before the first "-".
    const file = path.join(IN_DIR, decodeURIComponent(path.basename(new URL(url).pathname)).split('-')[0] + '.csv');
    paths.push(file);
    if (fs.existsSync(file)) continue;
    console.log('Downloading ' + url);
    const res = await fetch(url);
    if (!res.ok) fail('download failed (' + res.status + '): ' + url);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return paths;
}

async function main() {
  if (!fs.existsSync(CONFIG)) fail('missing ' + path.relative(ROOT, CONFIG));
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  if (!config.asOf || !config.sourcePage || !Array.isArray(config.files) || !config.files.length) {
    fail('content/owners.json needs asOf, sourcePage and files[]');
  }
  const csvs = await ensureCsvs(config.files);
  const collator = new Intl.Collator('sk');

  // Token strings are interned to ints so a record's tokens are a small Int32Array.
  const tokenIds = new Map();
  const tokenList = [];
  const intern = (t) => {
    let id = tokenIds.get(t);
    if (id === undefined) { id = tokenList.length; tokenIds.set(t, id); tokenList.push(t); }
    return id;
  };

  const areas = new Map(); // code -> { name, code, recs: [] }
  const finished = new Set();
  let rows = 0;
  let skipped = 0;
  let cur = null; // the area being read (the CSVs list each area contiguously)
  let curRecs = null;

  const flush = () => {
    if (!cur) return;
    for (const r of curRecs.values()) {
      const toks = new Int32Array(r.toks.size);
      let n = 0;
      for (const [t, isMain] of r.toks) toks[n++] = t * 2 + (isMain ? 1 : 0);
      cur.recs.push({
        main: r.main, notes: r.notes, spf: r.spf, lvs: [...r.lvs].sort(lvCompare), toks, id: 0,
      });
    }
    finished.add(cur.code);
    cur = null;
    curRecs = null;
  };

  for (const file of csvs) {
    const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
    let first = true;
    for await (let line of rl) {
      if (first) { first = false; line = line.replace(/^\uFEFF/, ''); continue; } // header
      if (!line) continue;
      // Owner text can contain unquoted ";" – split on the first 3 only.
      const a = line.indexOf(';');
      const b = line.indexOf(';', a + 1);
      const c = line.indexOf(';', b + 1);
      if (a < 0 || b < 0 || c < 0) { skipped++; continue; }
      const clean = (s) => s.replace(/[\t\r\n]+/g, ' ').trim();
      const name = clean(line.slice(0, a));
      const code = clean(line.slice(a + 1, b));
      const lv = clean(line.slice(b + 1, c));
      const raw = clean(line.slice(c + 1));
      // Rows with an empty owner text (7) are kept: they still carry an area and an LV.
      if (!name || !code || !lv) { skipped++; continue; }
      rows++;

      if (!cur || cur.code !== code) {
        flush();
        if (finished.has(code)) fail('area ' + code + ' (' + name + ') is not contiguous in ' + path.basename(file));
        cur = areas.get(code);
        if (!cur) { cur = { name, code, recs: [] }; areas.set(code, cur); }
        else if (cur.name !== name) console.warn('area ' + code + ' has two names: ' + cur.name + ' / ' + name);
        curRecs = new Map();
      }

      const p = parse(raw);
      const nMain = norm(p.main);
      const key = nMain + '|' + norm(p.notes);
      let rec = curRecs.get(key);
      if (!rec) {
        rec = { main: p.main, notes: p.notes, spf: false, lvs: new Set(), toks: new Map(), mainToks: new Set(tokenize(nMain)) };
        curRecs.set(key, rec);
      }
      if (p.spf) rec.spf = true;
      rec.lvs.add(lv);
      // Tokens come from the FULL raw text so nothing searchable is lost; the flag says whether
      // the token occurs in the main name ("main" posting) or only in the notes.
      for (const t of tokenize(norm(raw))) {
        const id = intern(t);
        if (!rec.toks.has(id)) rec.toks.set(id, rec.mainToks.has(t));
      }
    }
  }
  flush();

  // ---------------------------------------------------------------- order + ids
  // Records sorted by area name, code, main, notes -> each area is a contiguous id range.
  const areaList = [...areas.values()].sort((x, y) => collator.compare(x.name, y.name) || (x.code < y.code ? -1 : 1));
  const records = [];
  const areaRows = [];
  for (const area of areaList) {
    area.recs.sort((x, y) => collator.compare(x.main, y.main) || collator.compare(x.notes, y.notes));
    areaRows.push([area.name, area.code, records.length, area.recs.length]);
    for (const r of area.recs) { r.area = areaRows.length - 1; records.push(r); }
    area.recs = null;
  }

  // ---------------------------------------------------------------- postings
  const mainP = new Map();
  const noteP = new Map();
  const freq = new Int32Array(tokenList.length);
  for (let id = 0; id < records.length; id++) {
    for (const v of records[id].toks) {
      const t = v >> 1;
      freq[t]++;
      const m = v & 1 ? mainP : noteP;
      const l = m.get(t);
      if (l) l.push(id); else m.set(t, [id]);
    }
  }
  const top = arg('top');
  if (top) {
    const order = Array.from(freq.keys()).sort((x, y) => freq[y] - freq[x]).slice(0, Number(top));
    console.log('Most frequent tokens (records):');
    for (const t of order) console.log('  ' + tokenList[t] + ' ' + freq[t]);
  }

  // ---------------------------------------------------------------- write
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, 'r'), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 't'), { recursive: true });
  const write = (rel, text) => fs.writeFileSync(path.join(OUT_DIR, rel), text);

  for (let c = 0; c * CHUNK_SIZE < records.length; c++) {
    const lines = [];
    for (const r of records.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)) {
      lines.push([r.area, r.main, r.notes, r.spf ? 1 : 0, r.lvs.join(',')].join('\t'));
    }
    write('r/' + c + '.txt', lines.join('\n') + '\n');
  }

  const delta = (ids) => {
    if (!ids) return '';
    let prev = 0;
    return ids.map((id) => { const d = id - prev; prev = id; return d.toString(36); }).join(',');
  };
  const sortedTokens = Array.from(tokenList.keys()).sort((x, y) => (tokenList[x] < tokenList[y] ? -1 : 1));
  const shards = new Map(); // 2-char prefix -> [[token, line]]
  for (const t of sortedTokens) {
    const tok = tokenList[t];
    const line = tok + '\t' + delta(mainP.get(t)) + '\t' + delta(noteP.get(t));
    const pre = tok.slice(0, 2);
    if (!shards.has(pre)) shards.set(pre, []);
    shards.get(pre).push([tok, line]);
  }
  const split = [];
  for (const [pre, items] of shards) {
    const text = items.map((x) => x[1]).join('\n') + '\n';
    if (zlib.gzipSync(text, { level: 6 }).length <= MAX_SHARD_GZIP) { write('t/' + pre + '.txt', text); continue; }
    split.push(pre);
    const sub = new Map();
    for (const [tok, line] of items) {
      const k = tok.slice(0, 3);
      if (!sub.has(k)) sub.set(k, []);
      sub.get(k).push(line);
    }
    for (const [k, lines] of sub) write('t/' + k + '.txt', lines.join('\n') + '\n');
  }
  split.sort();

  write('areas.json', JSON.stringify(areaRows) + '\n');
  write('meta.json', JSON.stringify({
    asOf: config.asOf, sourcePage: config.sourcePage, rows, records: records.length,
    areas: areaRows.length, chunkSize: CHUNK_SIZE, split,
  }, null, 2) + '\n');

  // ---------------------------------------------------------------- summary
  let files = 0;
  let rawBytes = 0;
  let gzBytes = 0;
  const big = { t: ['', 0], r: ['', 0] };
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { walk(f); continue; }
      const buf = fs.readFileSync(f);
      const gz = zlib.gzipSync(buf, { level: 6 }).length;
      files++;
      rawBytes += buf.length;
      gzBytes += gz;
      const kind = path.basename(dir);
      if (big[kind] && gz > big[kind][1]) big[kind] = [kind + '/' + e.name, gz];
    }
  };
  walk(OUT_DIR);
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  console.log('Rows: ' + rows + (skipped ? ' (skipped ' + skipped + ' malformed)' : ''));
  console.log('Records: ' + records.length + ', areas: ' + areaRows.length + ', tokens: ' + tokenList.length);
  console.log('Files: ' + files + ', raw ' + mb(rawBytes) + ', gzip ' + mb(gzBytes));
  console.log('Largest token shard (gzip): ' + big.t[0] + ' ' + (big.t[1] / 1024).toFixed(0) + ' KB');
  console.log('Largest record chunk (gzip): ' + big.r[0] + ' ' + (big.r[1] / 1024).toFixed(1) + ' KB');
  console.log('Split prefixes (' + split.length + '): ' + split.join(' '));
}

main().catch((e) => fail(e.stack || String(e)));
