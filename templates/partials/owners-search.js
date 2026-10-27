<script>
(function () {
  'use strict';

  /*
   * Search over the static index in /data/nezisteni-vlastnici/ (written by scripts/build-owners-data.js).
   * A query word matches the START of a token of the owner text (name, maiden name, notes) or a whole
   * word of the cadastral area name; every word must match (AND). Only the token shard of each word and
   * the record chunks of the rendered results are downloaded. Words of 1-6 digits are LV (title deed)
   * numbers: they filter the text results by the records' LV list. Results are ranked by exact, then
   * prefix matches in the name, and can be narrowed to one cadastral area.
   */
  var BASE = '/data/nezisteni-vlastnici/';
  var PAGE = 50;
  // Keep in sync with STOP_WORDS in scripts/build-owners-data.js (such words are not in the index).
  var STOP = new Set(('rod rodena rodeny man manz manzel manzelka zom zomr zomrel zomrela nar nepoz mal malol malolety ' +
    'maloleta spf vdova vdovec nezn neznamy neznama napos naposl bytom syn dcera ded prot ' +
    'sur muz lsr pkv psc zena sr bez ulica ul pozemok rodne cislo').split(/\s+/));
  var ACCESS_KEY = 'bfe1ae07-8f6f-4183-afb5-1ef348205f74';
  var NO_NAME = '(meno neuvedené)';

  var ICON = {
    add: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    close: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    land: '<svg class="w-5 h-5 text-secondary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 18 6-9 4 5 3-4 5 8z"/><circle cx="17" cy="6" r="1.5"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  var input = $('owners-q'), statusEl = $('owners-status'), resultsEl = $('owners-results'), moreBtn = $('owners-more');
  var form = $('owners-form'), selList = $('owners-selected'), selEmpty = $('owners-empty'), selLabel = $('owners-sel-label');
  var msgEl = $('owners-message'), submitBtn = $('owners-submit'), formStatus = $('owners-form-status');
  var areaWrap = $('owners-area-wrap'), areaSel = $('owners-area');
  var thanks = $('owners-thanks'), mbar = $('owners-mbar'), panel = $('owners-panel');
  var params = new URLSearchParams(location.search);

  // ---------------------------------------------------------------- helpers

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return n.toLocaleString('sk-SK').replace(/\s/g, ' '); }
  function plural(n, one, few, many) { return n === 1 ? one : n >= 2 && n <= 4 ? few : many; }

  // Text words (index tokens) and LV numbers of a query.
  function parseQuery(q) {
    var seen = new Set(), nums = new Set();
    norm(q).split(/[^a-z0-9]+/).forEach(function (t) {
      if (/^[0-9]{1,6}$/.test(t)) nums.add(+t);
      else if (t.length >= 3 && /[a-z]/.test(t) && !STOP.has(t)) seen.add(t);
    });
    return { toks: Array.from(seen), nums: nums };
  }

  // Wrap the starts of words that begin with a query token in <mark>. Works on the normalised text
  // but marks the original characters (normalising may change the length).
  function hl(text, toks) {
    if (!text) return '';
    var n = '', map = [];
    for (var i = 0; i < text.length; i++) {
      var c = norm(text[i]);
      for (var j = 0; j < c.length; j++) { n += c[j]; map.push(i); }
    }
    var marks = new Array(text.length).fill(false);
    toks.forEach(function (t) {
      var p = -1;
      while ((p = n.indexOf(t, p + 1)) > -1) {
        if (p > 0 && /[a-z0-9]/.test(n[p - 1])) continue;
        for (var k = p; k < p + t.length; k++) marks[map[k]] = true;
      }
    });
    var out = '', open = false;
    for (var x = 0; x < text.length; x++) {
      if (marks[x] && !open) { out += '<mark class="bg-secondary-fixed text-inherit rounded-sm px-px">'; open = true; }
      if (!marks[x] && open) { out += '</mark>'; open = false; }
      out += esc(text[x]);
    }
    return out + (open ? '</mark>' : '');
  }

  function lvText(r) { return 'LV č. ' + r.lvs.join(', '); }
  function lvHTML(r) { // the LV numbers that were searched for are marked
    return 'LV č. ' + r.lvs.map(function (lv) {
      return /^[0-9]+$/.test(lv) && nums.has(+lv) ? '<mark class="bg-secondary-fixed text-inherit rounded-sm px-px">' + esc(lv) + '</mark>' : esc(lv);
    }).join(', ');
  }
  function mainText(r) { return r.main || NO_NAME; }

  // ---------------------------------------------------------------- index access

  var meta = null, areas = null, areaByWord = null, indexPromise = null;
  var shardCache = new Map(), chunkCache = new Map();

  function getJson(file) {
    return fetch(BASE + file).then(function (r) {
      if (!r.ok) throw new Error(file + ' ' + r.status);
      return r.json();
    });
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = Promise.all([getJson('meta.json'), getJson('areas.json')]).then(function (v) {
        meta = v[0]; areas = v[1];
        areaByWord = new Map();
        areas.forEach(function (a, ai) {
          norm(a[0]).split(/[^a-z0-9]+/).forEach(function (w) {
            if (!w) return;
            var l = areaByWord.get(w);
            if (!l) areaByWord.set(w, l = []);
            if (l[l.length - 1] !== ai) l.push(ai);
          });
        });
      }, function (e) { indexPromise = null; throw e; });
    }
    return indexPromise;
  }

  function getShard(t) {
    var key = meta.split.indexOf(t.slice(0, 2)) !== -1 ? t.slice(0, 3) : t.slice(0, 2);
    if (!shardCache.has(key)) {
      shardCache.set(key, fetch(BASE + 't/' + key + '.txt').then(function (r) {
        if (r.status === 404) return []; // no token starts with this prefix
        if (!r.ok) throw new Error('t/' + key + ' ' + r.status);
        return r.text().then(function (s) { return s.split('\n'); });
      }).catch(function (e) { shardCache.delete(key); throw e; }));
    }
    return shardCache.get(key);
  }

  function decode(s, into) {
    if (!s) return;
    var prev = 0, parts = s.split(',');
    for (var i = 0; i < parts.length; i++) { prev += parseInt(parts[i], 36); into.add(prev); }
  }

  function areaOf(id) { // last area whose first record id is <= id
    var lo = 0, hi = areas.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (areas[mid][2] <= id) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  // Per query token: ids of records whose name part (main) / notes start with it, those whose name has
  // exactly this word, plus areas named by it.
  function tokenSets(t) {
    return getShard(t).then(function (lines) {
      var main = new Set(), note = new Set(), exact = new Set();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.lastIndexOf(t, 0) !== 0) continue;
        var f = line.split('\t');
        decode(f[1], main); decode(f[2], note);
        if (f[0] === t) decode(f[1], exact);
      }
      var kAreas = new Set(areaByWord.get(t) || []);
      var size = main.size + note.size;
      kAreas.forEach(function (ai) { size += areas[ai][3]; });
      return { t: t, main: main, exact: exact, note: note, kAreas: kAreas, size: size };
    });
  }

  // Resolves to the ids of all matching records, best first: more exact name words, then more prefix
  // name words, then by id (one integer key per id, bucketed - no sort comparator over 200k results).
  function find(toks) {
    return loadIndex().then(function () { return Promise.all(toks.map(tokenSets)); }).then(function (sets) {
      sets.sort(function (a, b) { return a.size - b.size; });
      var first = sets[0], cand = new Set();
      first.main.forEach(function (id) { cand.add(id); });
      first.note.forEach(function (id) { cand.add(id); });
      first.kAreas.forEach(function (ai) { for (var i = 0; i < areas[ai][3]; i++) cand.add(areas[ai][2] + i); });
      var sorted = Int32Array.from(cand).sort();
      var buckets = {}, keys = [];
      for (var n = 0; n < sorted.length; n++) {
        var id = sorted[n], ai = areaOf(id), ok = true, e = 0, p = 0;
        for (var i = 0; i < sets.length; i++) {
          var s = sets[i], inMain = s.main.has(id);
          if (inMain) { p++; if (s.exact.has(id)) e++; }
          else if (!s.note.has(id) && !s.kAreas.has(ai)) { ok = false; break; }
        }
        if (!ok) continue;
        var key = e * 1000 + p, b = buckets[key];
        if (!b) { buckets[key] = b = []; keys.push(key); }
        b.push(id);
      }
      keys.sort(function (a, b) { return b - a; });
      var out = [];
      keys.forEach(function (k) { var b = buckets[k]; for (var i = 0; i < b.length; i++) out.push(b[i]); });
      return out;
    });
  }

  function getChunk(c) {
    if (!chunkCache.has(c)) {
      chunkCache.set(c, fetch(BASE + 'r/' + c + '.txt').then(function (r) {
        if (!r.ok) throw new Error('r/' + c + ' ' + r.status);
        return r.text();
      }).then(function (s) { return s.split('\n'); }).catch(function (e) { chunkCache.delete(c); throw e; }));
    }
    return chunkCache.get(c);
  }

  function getRecord(id) {
    return getChunk(Math.floor(id / meta.chunkSize)).then(function (lines) {
      var f = lines[id % meta.chunkSize].split('\t'), a = areas[+f[0]];
      return { id: id, ku: a[0], code: a[1], main: f[1], notes: f[2], spf: f[3] === '1', lvs: f[4] ? f[4].split(',') : [] };
    });
  }

  // ---------------------------------------------------------------- selection + request panel

  var selected = new Map(); // id -> { rec, query }
  var messageEdited = false;
  var query = '', toks = [], nums = new Set(), ids = [], shown = 0, seq = 0;
  var textIds = [], facetIds = [], lvDone = false, area = ''; // text results, ids the area list is built from, selected area code

  function buildMessage() {
    var items = Array.from(selected.values());
    if (!items.length) return '';
    var queries = [];
    items.forEach(function (s) { if (s.query && queries.indexOf(s.query) === -1) queries.push(s.query); });
    var lines = items.map(function (s) {
      var r = s.rec;
      return '• ' + mainText(r) + (r.notes ? ' (' + r.notes + ')' : '') + ' – k. ú. ' + r.ku + ' (' + r.code + '), ' + lvText(r);
    });
    return 'Dobrý deň,\n\nv zozname nezistených vlastníkov na noveris.sk som vyhľadával(a) ' +
      queries.map(function (q) { return '„' + q + '“'; }).join(', ') + ' a našiel(a) som ' +
      (items.length === 1 ? 'tento záznam' : 'tieto záznamy') + ':\n' + lines.join('\n') +
      '\n\nMám záujem o pomoc s vysporiadaním. Prosím o konzultáciu.\n\nĎakujem';
  }

  function renderPanel() {
    var items = Array.from(selected.values());
    selLabel.textContent = 'Vybrané záznamy' + (items.length ? ' (' + items.length + ')' : '');
    selEmpty.classList.toggle('hidden', items.length > 0);
    selList.classList.toggle('hidden', !items.length);
    selList.innerHTML = items.map(function (s) {
      var r = s.rec;
      return '<li class="flex items-start gap-3 py-3 border-b border-outline-variant/30 last:border-0">' + ICON.land +
        '<div class="flex-1 min-w-0"><div class="font-medium break-words">' + esc(mainText(r)) + '</div>' +
        '<div class="text-xs text-outline">k. ú. ' + esc(r.ku) + ' · ' + esc(lvText(r)) + (r.spf ? ' · spravuje SPF' : '') + '</div></div>' +
        '<button type="button" class="owners-rm text-outline hover:text-on-surface" data-id="' + r.id + '" aria-label="Odstrániť záznam ' + esc(mainText(r)) + '">' + ICON.close + '</button></li>';
    }).join('');
    submitBtn.disabled = !items.length;
    mbar.textContent = 'Pokračovať k žiadosti (' + items.length + ')';
    mbar.classList.toggle('hidden', !items.length || panelVisible);
    if (!messageEdited) msgEl.value = buildMessage();
  }

  function paintPick(card, on) {
    card.className = cardClass(on);
    var b = card.querySelector('.owners-pick');
    b.className = pickClass(on);
    b.innerHTML = (on ? ICON.check : ICON.add) + (on ? 'Vybrané' : 'Riešiť');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function setSelected(rec, on) {
    if (on) selected.set(rec.id, { rec: rec, query: query }); else selected.delete(rec.id);
    var card = resultsEl.querySelector('[data-id="' + rec.id + '"]');
    if (card) paintPick(card, on);
    if (on) showForm();
    renderPanel();
  }

  function showForm() { // after a successful send the form is replaced by the thank-you note
    thanks.classList.add('hidden');
    form.classList.remove('hidden');
  }

  selList.addEventListener('click', function (e) {
    var b = e.target.closest('.owners-rm');
    if (!b) return;
    var s = selected.get(+b.dataset.id);
    if (s) setSelected(s.rec, false);
  });

  var panelVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      panelVisible = es[0].isIntersecting;
      mbar.classList.toggle('hidden', !selected.size || panelVisible);
    }).observe(panel);
  }

  msgEl.addEventListener('input', function () { messageEdited = true; });

  // ---------------------------------------------------------------- results

  function cardClass(on) {
    return 'owners-card bg-white rounded-xl p-5 flex gap-4 items-start border editorial-shadow transition-colors ' + (on ? 'border-secondary' : 'border-transparent');
  }
  function pickClass(on) {
    return 'owners-pick shrink-0 w-28 font-label uppercase tracking-widest text-[11px] py-2.5 rounded-lg flex items-center justify-center gap-1 ' +
      (on ? 'bg-secondary text-white' : 'border border-secondary/40 text-secondary hover:bg-secondary-fixed/40');
  }

  function cardHTML(r) {
    var on = selected.has(r.id);
    return '<div class="' + cardClass(on) + '" data-id="' + r.id + '">' +
      '<div class="flex-1 min-w-0">' +
      '<div class="font-label uppercase tracking-widest text-[10px] text-secondary">' + hl(r.ku, toks) + ' · k. ú. ' + esc(r.code) + '</div>' +
      '<div class="font-headline text-xl mt-1 break-words">' + (r.main ? hl(r.main, toks) : '<span class="text-outline">' + NO_NAME + '</span>') + '</div>' +
      (r.notes ? '<div class="text-sm text-on-surface-variant mt-1 break-words">' + hl(r.notes, toks) + '</div>' : '') +
      '<div class="text-xs text-outline mt-2 tabular-nums">' + lvHTML(r) + (r.spf ? ' · spravuje SPF' : '') + '</div>' +
      '</div>' +
      '<button type="button" class="' + pickClass(on) + '" data-id="' + r.id + '" aria-pressed="' + on + '">' +
      (on ? ICON.check : ICON.add) + (on ? 'Vybrané' : 'Riešiť') + '</button></div>';
  }

  var visible = new Map(); // id -> record, for the cards on screen

  resultsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.owners-pick');
    if (!b) return;
    var rec = visible.get(+b.dataset.id);
    if (rec) setSelected(rec, !selected.has(rec.id));
  });

  function setStatus(text, error) {
    statusEl.textContent = text;
    statusEl.className = 'text-sm mb-4 min-h-[1.25rem] ' + (error ? 'text-error' : 'text-outline');
  }

  function countText() {
    return fmt(ids.length) + ' ' + plural(ids.length, 'výsledok', 'výsledky', 'výsledkov');
  }

  function renderMore() {
    var left = ids.length - shown;
    moreBtn.classList.toggle('hidden', left <= 0);
    moreBtn.textContent = 'Zobraziť ďalšie (' + fmt(Math.min(PAGE, left)) + ' z ' + fmt(left) + ')';
  }

  function showPage(mySeq, replace) {
    var slice = ids.slice(shown, shown + PAGE);
    moreBtn.disabled = true;
    return Promise.all(slice.map(getRecord)).then(function (recs) {
      if (mySeq !== seq) return;
      if (replace) { resultsEl.innerHTML = ''; visible.clear(); }
      recs.forEach(function (r) { visible.set(r.id, r); });
      resultsEl.insertAdjacentHTML('beforeend', recs.map(cardHTML).join(''));
      shown += slice.length;
      moreBtn.disabled = false;
      renderMore();
    });
  }

  function failed(mySeq) {
    return function () {
      if (mySeq !== seq) return;
      moreBtn.disabled = false;
      setStatus('Vyhľadávanie sa nepodarilo načítať. Skontrolujte pripojenie a skúste to prosím znova.', true);
    };
  }

  moreBtn.addEventListener('click', function () {
    var mySeq = seq;
    showPage(mySeq, false).catch(failed(mySeq));
  });

  function syncUrl() {
    var p = new URLSearchParams(location.search);
    if (query) p.set('q', query); else p.delete('q');
    if (query && area) p.set('ku', area); else p.delete('ku');
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  // ---------------------------------------------------------------- LV filter + area filter

  var MAX_LV_CHUNKS = 60;

  function chunksOf(list) {
    var seen = new Set();
    for (var i = 0; i < list.length; i++) seen.add(Math.floor(list[i] / meta.chunkSize));
    return Array.from(seen);
  }

  // Keeps the records whose LV list contains any of the searched numbers.
  function lvFilter(list) {
    return Promise.all(chunksOf(list).map(function (c) { return getChunk(c).then(function (l) { return [c, l]; }); })).then(function (pairs) {
      var lines = new Map(pairs);
      return list.filter(function (id) {
        var f = lines.get(Math.floor(id / meta.chunkSize))[id % meta.chunkSize].split('\t')[4];
        return !!f && f.split(',').some(function (lv) { return /^[0-9]+$/.test(lv) && nums.has(+lv); });
      });
    });
  }

  function inArea(list, code) {
    var ai = areaIndex(code), a = areas[ai];
    return list.filter(function (id) { return id >= a[2] && id < a[2] + a[3]; });
  }

  function areaIndex(code) {
    for (var i = 0; i < areas.length; i++) if (areas[i][1] === code) return i;
    return -1;
  }

  // Fills the cadastral-area select from the result ids (counts per area, in area order).
  function renderAreas() {
    var counts = new Map();
    facetIds.forEach(function (id) { var ai = areaOf(id); counts.set(ai, (counts.get(ai) || 0) + 1); });
    var list = Array.from(counts.keys()).sort(function (a, b) { return a - b; });
    if (area && !counts.has(areaIndex(area))) area = '';
    if (list.length < 2) { areaWrap.classList.add('hidden'); areaSel.innerHTML = ''; return; }
    var names = {};
    list.forEach(function (ai) { names[areas[ai][0]] = (names[areas[ai][0]] || 0) + 1; });
    areaSel.innerHTML = '<option value="">Všetky k. ú. (' + fmt(facetIds.length) + ')</option>' + list.map(function (ai) {
      var a = areas[ai];
      return '<option value="' + esc(a[1]) + '">' + esc(a[0] + (names[a[0]] > 1 ? ' – ' + a[1] : '')) + ' (' + fmt(counts.get(ai)) + ')</option>';
    }).join('');
    areaSel.value = area;
    areaWrap.classList.remove('hidden');
  }

  // Applies the selected area (and, for broad LV searches, the LV numbers) and renders the first page.
  function show(mySeq) {
    var wide = false, p;
    if (nums.size && !lvDone) {
      if (area) p = lvFilter(inArea(facetIds, area));
      else { wide = true; p = Promise.resolve(facetIds); }
    } else {
      p = Promise.resolve(area ? inArea(facetIds, area) : facetIds);
    }
    return p.then(function (list) {
      if (mySeq !== seq) return;
      ids = list;
      shown = 0; resultsEl.innerHTML = ''; visible.clear();
      moreBtn.classList.add('hidden');
      if (!ids.length) {
        setStatus('Pre „' + query + '“ sme nenašli žiadny záznam. Skúste kratší tvar mena alebo iný pravopis.', false);
        return;
      }
      if (wide) setStatus(countText() + ' – číslo LV sme nepoužili, hľadanie je príliš široké. Doplňte obec alebo vyberte katastrálne územie.', false);
      else if (!area && ids.length > 1000) setStatus(countText() + ' – zúžte hľadanie: doplňte meno alebo obec, alebo vyberte katastrálne územie.', false);
      else setStatus(countText(), false);
      return showPage(mySeq, true);
    });
  }

  function run() {
    var mySeq = ++seq;
    query = input.value.trim().replace(/\s+/g, ' ');
    var pq = parseQuery(query);
    toks = pq.toks; nums = pq.nums;
    ids = []; shown = 0; textIds = []; facetIds = [];
    resultsEl.innerHTML = ''; visible.clear();
    moreBtn.classList.add('hidden');
    areaWrap.classList.add('hidden');
    if (!toks.length) {
      if (!query) area = '';
      syncUrl();
      setStatus(!query ? '' : nums.size ? 'Pre hľadanie podľa čísla LV zadajte aj obec (katastrálne územie), napr. „Ábelová 436“.'
        : 'Zadajte aspoň 3 písmená priezviska, rodného mena alebo obce.', false);
      return;
    }
    syncUrl();
    setStatus('Hľadám…', false);
    find(toks).then(function (found) {
      if (mySeq !== seq) return;
      var narrowed = null;
      if (nums.size && chunksOf(found).length > MAX_LV_CHUNKS) {
        // Too broad for the LV filter: a word that names a cadastral area ("Ábelová 436") means that area,
        // so look for the number only in the records of those areas (kept only if something matches).
        var named = new Set();
        toks.forEach(function (t) { (areaByWord.get(t) || []).forEach(function (ai) { named.add(ai); }); });
        var inNamed = found.filter(function (id) { return named.has(areaOf(id)); });
        if (inNamed.length && chunksOf(inNamed).length <= MAX_LV_CHUNKS) narrowed = lvFilter(inNamed);
      }
      return Promise.resolve(narrowed).then(function (hit) {
        if (hit && hit.length) { textIds = found = hit; lvDone = true; return hit; }
        textIds = found;
        lvDone = nums.size > 0 && chunksOf(found).length <= MAX_LV_CHUNKS;
        return lvDone ? lvFilter(found) : found;
      }).then(function (list) {
        if (mySeq !== seq) return;
        facetIds = list;
        renderAreas(); // drops the selected area when it has no results any more
        syncUrl();
        return show(mySeq);
      });
    }).catch(failed(mySeq));
  }

  areaSel.addEventListener('change', function () {
    area = areaSel.value;
    syncUrl();
    var mySeq = ++seq;
    show(mySeq).catch(failed(mySeq));
  });

  // Words typed so far: fetch their token shards now so the debounced search finds them cached.
  function prefetch() {
    loadIndex().then(function () {
      norm(input.value).split(/[^a-z0-9]+/).forEach(function (w) {
        if (!/^[a-z]{2,}$/.test(w) || STOP.has(w)) return;
        if (w.length === 2 && meta.split.indexOf(w) !== -1) return;
        getShard(w).catch(function () {});
      });
    }, function () {});
  }

  var timer = null;
  input.addEventListener('focus', function () { loadIndex().catch(function () {}); });
  input.addEventListener('input', function () {
    prefetch();
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); run(); } });

  // ---------------------------------------------------------------- sending

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var phoneRegex = /^\+?[0-9\s()\-]{7,20}$/;

  function validField(el, errorId, ok) {
    $(errorId).classList.toggle('hidden', ok);
    el.classList.toggle('!border-error', !ok);
    return ok;
  }

  function setFormStatus(text, cls) {
    formStatus.textContent = text;
    formStatus.className = 'mt-4 font-body text-sm ' + cls;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formStatus.classList.add('hidden');
    var name = $('owners-name'), email = $('owners-email'), phone = $('owners-phone');
    var ok = true;
    ok = validField(name, 'owners-name-error', name.value.trim() !== '') && ok;
    ok = validField(email, 'owners-email-error', email.value.trim() !== '' && emailRegex.test(email.value)) && ok;
    ok = validField(phone, 'owners-phone-error', phone.value.trim() === '' || phoneRegex.test(phone.value.trim())) && ok;
    ok = validField(msgEl, 'owners-message-error', msgEl.value.trim() !== '') && ok;
    if (!ok || !selected.size) return;

    var items = Array.from(selected.values());
    var kus = [];
    items.forEach(function (s) { if (kus.indexOf(s.rec.ku) === -1) kus.push(s.rec.ku); });
    var queries = [];
    items.forEach(function (s) { if (s.query && queries.indexOf(s.query) === -1) queries.push(s.query); });
    // Leads sent from a test/preview host (or with ?test) are marked so they are not mistaken for real ones.
    var isTest = !/^(www\.)?noveris\.sk$/.test(location.hostname) || params.has('test');
    var formData = new FormData(form);
    formData.set('subject', (isTest ? '[TEST] ' : '') + 'Nezistení vlastníci – žiadosť z webu (k. ú. ' + kus.join(', ') + ')');
    formData.set('search_queries', queries.join(' | '));
    formData.set('records', items.map(function (s) {
      var r = s.rec;
      return mainText(r) + (r.notes ? ' (' + r.notes + ')' : '') + ' – k. ú. ' + r.ku + ' (' + r.code + '), ' + lvText(r);
    }).join('\n'));

    var originalText = submitBtn.firstElementChild.textContent;
    submitBtn.firstElementChild.textContent = 'Odosiela sa...';
    submitBtn.disabled = true;
    formStatus.classList.add('hidden');

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          Array.from(selected.values()).forEach(function (s) { setSelected(s.rec, false); });
          messageEdited = false;
          form.reset();
          msgEl.value = '';
          form.classList.add('hidden');
          thanks.classList.remove('hidden');
          thanks.focus();
        } else {
          setFormStatus('✗ Správu sa nepodarilo odoslať. Skúste to prosím znova.', 'text-error');
        }
      })
      .catch(function () {
        setFormStatus('✗ Nastala chyba. Kontaktujte nás prosím priamo e-mailom.', 'text-error');
      })
      .then(function () {
        submitBtn.firstElementChild.textContent = originalText;
        submitBtn.disabled = !selected.size;
      });
  });

  // ---------------------------------------------------------------- start

  renderPanel();
  var q0 = params.get('q');
  if (q0) { input.value = q0; area = params.get('ku') || ''; run(); }
})();
</script>
