/* eslint-disable no-console */
'use strict';
/*
 * End-to-end check of the owner search in headless Chrome (CDP). Needs the site served locally.
 *   node scripts/qa/owners-e2e.js [url] [mobile|desktop]
 * Types "Hanušk", expects 360 results, picks the first card (it must appear in the panel) and, on desktop,
 * checks that the panel submit button is reachable (inside the viewport) after scrolling to the bottom.
 */
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = process.argv[2] || 'http://127.0.0.1:8765/nezisteni-vlastnici/?q=Hanušk&test';
const MODE = process.argv[3] || 'both';

async function run(mode, port) {
  const mobile = mode === 'mobile';
  const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + path.join(os.tmpdir(), 'owners-e2e-' + port), '--no-first-run', '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' });
  const fails = [];
  try {
    await sleep(4000);
    const tabs = await (await fetch(`http://localhost:${port}/json`)).json();
    const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => { ws.onopen = r; });
    let id = 0; const pend = new Map(); const logs = [];
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.result?.value;
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', mobile ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true } : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    if (mobile) {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    }
    await send('Page.navigate', { url: URL }); await sleep(4000);
    await ev("document.getElementById('owners-q').focus()");
    if (!(await ev("document.getElementById('owners-q').value"))) {
      for (const c of 'Hanušk') { await send('Input.insertText', { text: c }); await sleep(120); }
    }
    await sleep(5000);
    const status = await ev("document.getElementById('owners-status').textContent");
    const cards = await ev("document.querySelectorAll('.owners-card').length");
    console.log(`[${mode}] status: ${status} | cards: ${cards}`);
    if (!/360/.test(status)) fails.push(`${mode}: expected 360 results, got "${status}"`);
    // pick the first card: it must show up in the panel
    const name = await ev("document.querySelector('.owners-card h3').textContent");
    await ev("document.querySelector('.owners-card .owners-pick').click()");
    await sleep(500);
    const sel = await ev("document.getElementById('owners-selected').textContent");
    const pressed = await ev("document.querySelector('.owners-card .owners-pick').getAttribute('aria-pressed')");
    console.log(`[${mode}] picked: ${name} | panel: ${sel.replace(/\s+/g, ' ').slice(0, 80)} | pressed: ${pressed}`);
    if (!sel.includes(name.trim())) fails.push(`${mode}: first card not in panel`);
    if (pressed !== 'true') fails.push(`${mode}: pick not pressed`);
    if (mobile) {
      const bar = await ev("(function(){var b=document.getElementById('owners-mbar');return !b.classList.contains('hidden') && getComputedStyle(b).display!=='none'})()");
      console.log(`[${mode}] mobile bar visible: ${bar}`);
      if (!bar) fails.push('mobile: bar not visible after pick');
    } else {
      await ev('window.scrollTo(0, document.documentElement.scrollHeight)'); await sleep(600);
      const r = await ev("(function(){var r=document.getElementById('owners-submit').getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh:innerHeight}})()");
      console.log(`[${mode}] submit rect after scrolling to bottom:`, JSON.stringify(r));
      if (!(r.top >= 0 && r.bottom <= r.vh)) fails.push('desktop: submit button not in viewport at page bottom');
      await ev("window.scrollTo(0, 900)"); await sleep(400);
      const r2 = await ev("(function(){var r=document.getElementById('owners-submit').getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh:innerHeight}})()");
      console.log(`[${mode}] submit rect mid-page:`, JSON.stringify(r2));
    }
    if (logs.length) { console.log(logs.join('\n')); fails.push(`${mode}: page exceptions`); }
    ws.close();
  } finally { ch.kill(); }
  return fails;
}

(async () => {
  const modes = MODE === 'both' ? ['mobile', 'desktop'] : [MODE];
  let all = [];
  for (const [i, m] of modes.entries()) all = all.concat(await run(m, 9340 + i));
  if (all.length) { console.log('FAIL\n' + all.join('\n')); process.exit(1); }
  console.log('PASS');
})();
