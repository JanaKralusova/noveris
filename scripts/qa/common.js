'use strict';
/* Shared helpers of the headless-Chrome QA scripts. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// Override with CHROME_PATH=/path/to/chrome (the default is the macOS Google Chrome).
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Exits with a clear message when the site is not being served at `base` (e.g. the preview on 8765).
async function requireServer(base) {
  try {
    await fetch(base + '/', { signal: AbortSignal.timeout(5000) });
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

module.exports = { CHROME, requireServer, launchChrome };
