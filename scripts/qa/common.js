'use strict';
/* Shared helpers of the headless-Chrome QA scripts. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// Override with CHROME_PATH=/path/to/chrome (the default is the macOS Google Chrome).
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Exits with a clear message when the site is not being served at `base` (e.g. the preview on 8765).
async function requireServer(base) {
  try {
    // drain the body: an unread response leaves the pooled socket paused, and undici asserts when the server closes it
    const res = await fetch(base + '/', { signal: AbortSignal.timeout(5000), headers: { Connection: 'close' } });
    await res.arrayBuffer();
  } catch (e) {
    console.error(`QA: cannot reach ${base}/ (${e.cause?.code || e.message}). Serve the checkout there first, e.g. \`npx http-server -p 8765\` or \`python3 -m http.server 8765\`.`);
    process.exit(2);
  }
}

// Starts headless Chrome with a throw-away profile; call .cleanup() to kill it and delete the profile.
function launchChrome(port, tag) {
  if (!fs.existsSync(CHROME)) {
    console.error(`QA: Chrome not found at ${CHROME}. Set CHROME_PATH to a Chrome/Chromium binary.`);
    process.exit(2);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${tag}-${port}-`));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + dir, '--no-first-run', '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => {
    try { proc.kill(); } catch {}
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  };
  process.once('exit', cleanup);
  return { proc, cleanup };
}

// GET <url> as JSON over a one-shot connection (no keep-alive agent): a pooled socket left open to Chrome
// makes undici assert (`!this.paused`) in Parser.finish when Chrome is killed later.
function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent: false, headers: { Connection: 'close' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('timeout')));
  });
}

// One CDP WebSocket to the first page of the Chrome on `port` (retries while Chrome is starting up).
// onEvent(message) gets every message without a pending id. Returns { send, ev, close }; close() resolves
// once the socket is really closed, so Chrome can be killed afterwards without a dangling connection.
async function connectPage(port, onEvent = () => {}) {
  let url;
  for (let i = 0; i < 40 && !url; i++) {
    try { url = (await getJson(`http://127.0.0.1:${port}/json`)).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
    if (!url) await new Promise((r) => setTimeout(r, 250));
  }
  if (!url) throw new Error(`QA: no Chrome page target on port ${port}`);
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('CDP WebSocket error')); });
  const pend = new Map();
  let id = 0, closed = false;
  const closedP = new Promise((r) => { ws.onclose = () => { closed = true; for (const f of pend.values()) f({ error: { message: 'closed' } }); pend.clear(); r(); }; });
  ws.onerror = () => {};
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else onEvent(m);
  };
  const send = (method, params = {}) => new Promise((r) => {
    if (closed) return r({ error: { message: 'closed' }, result: {} });
    const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const close = async () => {
    if (!closed) { try { ws.close(); } catch {} }
    await Promise.race([closedP, new Promise((r) => setTimeout(r, 2000))]);
  };
  return { send, ev, close };
}

module.exports = { CHROME, requireServer, launchChrome, getJson, connectPage };
