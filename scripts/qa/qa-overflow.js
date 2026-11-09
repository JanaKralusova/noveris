/* eslint-disable no-console */
'use strict';
/*
 * Overflow and console check of every built page in headless Chrome (CDP). Needs the site served locally.
 *   node scripts/qa/qa-overflow.js [baseUrl]
 * For each page at 390, 1024 and 1440 px: no horizontal overflow, no console errors / exceptions / failed loads.
 * At 390 px the mobile menu is opened (drawer must be visible) and closed again.
 */
const { builtPages } = require('../../tests/helpers');
const { requireServer, launchChrome, connectPage } = require('./common');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const WIDTHS = [390, 1024, 1440];
const PORT = 9360;

function urlOf(rel) { return BASE + '/' + rel.replace(/index\.html$/, ''); }

(async () => {
  await requireServer(BASE);
  const ch = launchChrome(PORT, 'qa-overflow');
  const fails = [];
  let cdp;
  try {
    let logs = [];
    cdp = await connectPage(PORT, (m) => {
      if (m.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('console.error: ' + m.params.args.map((a) => a.value || a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    });
    const { send, ev } = cdp;
    await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');

    const pages = builtPages();
    let n = 0;
    for (const w of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w === 390 });
      for (const rel of pages) {
        const url = urlOf(rel);
        logs = [];
        await send('Page.navigate', { url });
        await sleep(700);
        await ev('new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r))');
        await sleep(300);
        const m = await ev('({sw: document.documentElement.scrollWidth, iw: innerWidth})');
        n++;
        if (!m || m.sw > m.iw) fails.push(`${w}px ${rel}: horizontal overflow (scrollWidth ${m && m.sw} > ${m && m.iw})`);
        if (w === 390) {
          const has = await ev('!!document.getElementById("mobile-menu-btn")');
          if (!has) fails.push(`${w}px ${rel}: no #mobile-menu-btn`);
          else {
            await ev('document.getElementById("mobile-menu-btn").click()'); await sleep(450);
            const vis = await ev('(function(){var d=document.getElementById("mobile-menu"),p=document.getElementById("mobile-menu-panel");if(!d||!p)return "nodrawer";var r=p.getBoundingClientRect();return parseFloat(getComputedStyle(d).opacity)>0.9&&r.width>0&&r.left<innerWidth&&r.right>0&&d.getAttribute("aria-hidden")!=="true"})()');
            if (vis !== true) fails.push(`${w}px ${rel}: drawer not visible after opening (${vis})`);
            await ev('document.getElementById("mobile-menu-btn").click()'); await sleep(450);
            const closed = await ev('(function(){var d=document.getElementById("mobile-menu"),b=document.getElementById("mobile-menu-btn");return parseFloat(getComputedStyle(d).opacity)<0.1&&getComputedStyle(d).pointerEvents==="none"&&b.getAttribute("aria-expanded")==="false"&&document.activeElement===b})()');
            if (closed !== true) fails.push(`${w}px ${rel}: drawer did not close (or focus not returned to the menu button)`);
          }
        }
        for (const l of logs) fails.push(`${w}px ${rel}: ${l}`);
      }
    }
    console.log(`checked ${n} page views (${pages.length} pages x ${WIDTHS.length} widths)`);
  } finally {
    if (cdp) await cdp.close();
    ch.cleanup();
  }
  if (fails.length) { console.log('FAIL\n' + fails.join('\n')); process.exit(1); }
  console.log('PASS');
})();
