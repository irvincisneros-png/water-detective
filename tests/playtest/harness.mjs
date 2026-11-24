// Playwright harness (borrowed from the LifeLens repo's node_modules, like the sibling projects).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const candidates = [process.env.PLAYWRIGHT_PATH, path.resolve(import.meta.dirname, '../../../LifeLens/node_modules/playwright'), path.resolve(import.meta.dirname, '../../../sealed/node_modules/playwright'), 'playwright'].filter(Boolean);
let pw;
for (const c of candidates) { try { pw = require(c); break; } catch { /* next */ } }
if (!pw) throw new Error('Playwright not found. Set PLAYWRIGHT_PATH to a node_modules/playwright folder.');

export async function launch({ url = process.env.URL ?? 'http://localhost:8494/', outDir = 'playtest-shots', mobile = false, width = 1366, height = 768, prefix = '', reducedMotion = 'no-preference' } = {}) {
  mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch({ headless: !process.env.HEADED, channel: process.env.PW_CHANNEL ?? 'chrome' });
  const ctx = await browser.newContext(mobile ? { viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion } : { viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(String(e.stack ?? e)));
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await page.goto(url);
  try { await page.waitForFunction(() => window.__wd, null, { timeout: 15000 }); } catch { console.error('Game did not boot. Errors:\n' + errors.join('\n')); await browser.close(); process.exit(1); }
  let n = 0;
  return {
    page, browser, errors, requests,
    async shot(name) { const p = path.join(outDir, `${prefix}${String(++n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: p, fullPage: mobile }); return p; },
    wait: ms => page.waitForTimeout(ms),
    ev: (fn, arg) => page.evaluate(fn, arg),
    async close() { await browser.close(); },
  };
}
