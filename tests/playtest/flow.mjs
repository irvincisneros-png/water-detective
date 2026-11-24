// Plays each case start to finish through the real UI: 1366x768 and 375x667, by mouse and by keyboard.
// Fails on any console error. Screenshots go to playtest-shots/ (git-ignored).
// Usage: node tests/playtest/flow.mjs [--case 1|2|3] [--vp desktop|mobile] [--mode mouse|keyboard] [--reduced]
import { launch } from './harness.mjs';
import { CASES } from '../../src/data/cases.js';
import assert from 'node:assert/strict';

const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const onlyCase = arg('case'), onlyVp = arg('vp'), onlyMode = arg('mode'), reducedOnly = process.argv.includes('--reduced');
const results = [];

async function playCase({ num, vp, mode, reduced = false }) {
  const mobile = vp === 'mobile', kb = mode === 'keyboard';
  const tag = `c${num}-${vp}-${mode}${reduced ? '-reduced' : ''}-`;
  const t = await launch({ mobile, prefix: tag, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const { page } = t;
  const c = CASES[num - 1];
  const act = async sel => {
    const loc = page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded();
    if (kb) { await loc.focus(); await page.keyboard.press('Enter'); } else await loc.click();
  };
  const idOf = (site, param, day) => t.ev(([s, p, d]) => window.__wd.state.entries.find(e => e.site === s && e.param === p && (d == null || e.day === d))?.id, [site, param, day]);
  const benchGone = () => page.waitForSelector('.bench-dlg', { state: 'detached', timeout: 15000 }).catch(async e => { const cap = await page.locator('.bench-cap').innerText().catch(() => '?'); await t.shot('stuck'); throw new Error(`bench stuck: "${cap}" ${e.message.split('\n')[0]}`); });
  const site = async id => { await act(`[data-site="${id}"]`); };
  const testTool = async (tool, value) => {
    await act(`[data-tool="${tool}"]`);
    await page.waitForSelector('.bench-dlg');
    if (tool === 'phStrip') {
      await page.waitForSelector('.swatch', { state: 'visible' });
      const wrong = value === 6 ? 8.5 : 6;
      await page.locator(`[data-swatch="${wrong}"]`).click({ force: true });
      assert.match(await page.locator('.bench-cap').innerText(), /Look again/);
      await act(`[data-swatch="${value}"]`);
    } else if (tool === 'clarity') {
      const btn = page.locator('.pour');
      const ms = typeof value === 'number' ? value / 36 * 1000 + 350 : 3300;
      if (kb) { await btn.focus(); await page.keyboard.down('Space'); await t.wait(Math.min(ms, 1200)); await page.keyboard.up('Space'); await t.wait(150); const finished = await page.locator('.bench-cap').innerText().then(x => /disappeared|100 cm/.test(x)).catch(() => true); if (!finished) { await page.keyboard.down('Space'); await t.wait(ms); await page.keyboard.up('Space'); } }
      else { const b = await btn.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await t.wait(ms); await page.mouse.up(); }
    } else if (!kb && !reduced) { await page.locator('.bench-stage').click({ position: { x: 20, y: 20 } }).catch(() => {}); }
    await page.waitForSelector('#btn-save-reading', { timeout: 20000 });
    if (!seenBench.has(tool)) { seenBench.add(tool); await t.shot(`bench-${tool}`); }
    assert.equal(await page.locator('.bench-hint').count(), 0, 'skip hint removed once finished');
    await act('#btn-save-reading');
    await benchGone();
  };
  const seenBench = new Set();
  const dismissResults = async () => {
    if (await page.locator('#btn-results-ok').count()) { await t.shot('results-in'); await act('#btn-results-ok'); await page.waitForSelector('.results-dlg', { state: 'detached' }); }
  };
  const nextDay = async () => { await act('#next-day'); await t.wait(reduced ? 200 : 1300); await dismissResults(); };
  const tab = async name => { await act(`[data-tab="${name}"]`); };

  await t.wait(400);
  await t.shot('title');
  await act(`[data-case="${num}"][data-action="new"]`);
  await page.waitForSelector('#btn-start');
  await t.shot('call');
  await act('#btn-start');
  await page.waitForSelector('.kit-item');
  await t.shot('kit');
  for (const k of ['thongs', 'gloves', 'buddy', 'pole']) { await act(`[data-kit="${k}"]`); if (k === 'thongs') { assert.match(await page.locator('.kit-msg').innerText(), /Not this one/); await t.shot('kit-wrong'); } }
  await t.shot('kit-done');
  await act('#btn-kit-go');
  await page.waitForSelector('.mapbox');
  await t.wait(600);
  if (num === 1) { assert.ok(await page.locator('#coach').count(), 'coach marks show in case 1'); await t.shot('coach'); await page.locator('.cskip').click(); assert.equal(await page.locator('#coach').count(), 0); }
  else assert.equal(await page.locator('#coach').count(), 0);

  const wx = c.weather;
  if (num === 1) {
    await site('C'); await act('#btn-look'); await t.shot('look-c');
    await testTool('do', c.readings.C.do); await t.shot('after-do');
    await testTool('nutrients'); await t.shot('lab-sent');
    await site('B'); await act('#btn-look');
    await testTool('temp'); await testTool('sal');
    await t.shot('map-two-sites');
    await nextDay(); await t.shot('day2');
    await tab('notebook'); await t.shot('notebook');
    assert.ok((await t.ev(() => window.__wd.state.entries.filter(e => e.param === 'n' || e.param === 'p').length)) === 2, 'nutrient results arrived');
  }
  if (num === 2) {
    await site('B'); await act('#btn-look');
    await testTool('phStrip', 7.5); await t.shot('strip-done');
    await testTool('clarity', 80); await t.shot('clarity-done');
    // save / resume mid-case
    if (!mobile && !kb && !reduced) {
      const before = await t.ev(() => JSON.stringify(window.__wd.state));
      await page.reload(); await page.waitForFunction(() => window.__wd);
      await act('[data-case="2"][data-action="continue"]'); await page.waitForSelector('.mapbox');
      assert.deepEqual(JSON.parse(await t.ev(() => JSON.stringify(window.__wd.state))), JSON.parse(before), 'Continue restores exactly');
      await t.shot('resumed');
    }
    await site('A'); await testTool('sal', c.readings.A.sal[0]);
    await site('B');
    await nextDay(); await t.shot('rain-day');
    await act('#btn-look'); await testTool('clarity', 30); await testTool('nutrients');
    await nextDay(); await nextDay();
    await tab('notebook'); await act('#btn-graph'); await page.waitForSelector('.graph-svg'); await t.shot('graph');
    await page.keyboard.press('Escape'); await page.waitForSelector('.graph-dlg', { state: 'detached' });
  }
  if (num === 3) {
    await site('C'); await act('#btn-look'); await testTool('do', c.readings.C.do[0]); await testTool('bod'); await t.shot('bod-sent');
    await site('B'); await act('#btn-look');
    await site('C');
    await nextDay(); assert.match(await page.locator('.tray-banner').innerText(), /Last day to start 5-day lab tests/); await t.shot('last-day-banner');
    await act('#wait-results'); await t.wait(reduced ? 200 : 2200);
    assert.match(await page.locator('[data-testid="bod-eq"]').innerText(), /4\.2[\s\S]*1\.7[\s\S]*2\.5/, 'BOD subtraction shown');
    await t.shot('bod-results-card');
    await dismissResults();
    await t.shot('day6');
    await tab('notebook'); await t.shot('notebook-bod');
    assert.ok(await t.ev(() => !!window.__wd.state.entries.find(e => e.param === 'bod')), 'BOD arrived');
  }

  // ── case board: one wrong cause first, then the right one
  await act('#solve'); await page.waitForSelector('.suspect');
  await t.shot('board-empty');
  const right = c.suspects.find(s => s.correct).id, wrong = c.suspects.find(s => !s.correct).id;
  const ids = num === 1 ? [await idOf('C', 'n'), await idOf('C', 'p')] : num === 2 ? [await idOf('B', 'clarity', 2), await idOf('B', 'n', 2)] : [await idOf('C', 'bod'), await idOf('C', 'do')];
  const ruleSus = num === 1 ? 'oil' : num === 2 ? 'always-bad' : 'oil';
  const ruleEntry = num === 1 ? await idOf('B', 'look') : num === 2 ? await idOf('B', 'clarity', 1) : await idOf('C', 'look');
  const pickCause = id => page.locator(`#sus-${id}`).check({ force: true });
  const withWrong = !kb;   // mouse runs make one wrong try first (loses the Sharp detective star)
  if (withWrong) {
    await pickCause(wrong);
    for (const id of ids) await act(`.step.ev .nb-row[data-id="${id}"]`);
    await act('#check'); await page.waitForSelector('.wrong-dlg');
    assert.match(await page.locator('.wrong-dlg').innerText(), /council paid for a check/);
    await t.shot('board-wrong');
    await act('#btn-try'); await page.waitForSelector('.wrong-dlg', { state: 'detached' });
    assert.equal(await page.locator(`#sus-${wrong}`).isDisabled(), true, 'wrong cause is locked');
    assert.equal(await page.locator('#check').getAttribute('aria-disabled'), 'true', 'check disabled until selection changes');
    await t.shot('board-after-wrong');
  } else {
    for (const id of ids) await act(`.step.ev .nb-row[data-id="${id}"]`);
  }
  await pickCause(right);
  await act(`[data-ro="${ruleSus}"]`);
  await act(`.step.ro .nb-row[data-id="${ruleEntry}"]`);
  await t.shot('board-ready');
  await act('#check'); await page.waitForSelector('.result.good');
  await t.shot('board-right');
  await act('#btn-continue');
  await page.waitForSelector('.blank');
  await t.shot('wrapup');
  c.frame.blanks.forEach(() => {});
  for (let i = 0; i < c.frame.blanks.length; i++) {
    const b = c.frame.blanks[i], wrongOpt = b.options.findIndex((_, k) => k !== b.correct);
    if (i === 0) { await act(`[data-chip="${b.options[wrongOpt]}"]`); assert.match(await page.locator('.chip-hint').innerText(), /Not quite/); await t.shot('chip-wrong'); }
    await act(`[data-chip="${b.options[b.correct]}"]`);
  }
  await t.shot('wrapup-done');
  await act('#btn-finish');
  await page.waitForSelector('.stars');
  await t.wait(reduced ? 200 : 2600);
  await t.shot('results');
  const stars = await t.ev(id => window.__wd.save.cases[id]?.stars, c.id);
  assert.deepEqual(stars, kb ? [true, true, true] : [true, true, false], kb ? 'three stars' : 'one wrong try loses Sharp detective');
  await act('#btn-report'); await page.waitForSelector('.report-sheet');
  await t.shot('report');
  assert.match(await page.locator('.report-sheet').innerText(), /real water scientist/);

  const errs = t.errors.filter(e => !/favicon/i.test(e));
  const remote = t.requests.filter(u => !u.startsWith('http://localhost') && !u.startsWith('data:'));
  await t.close();
  assert.deepEqual(errs, [], 'console errors: ' + errs.join(' | '));
  assert.deepEqual(remote, [], 'no network calls to other hosts');
  return tag.replace(/-$/, '');
}

const runs = [];
for (const vp of ['desktop', 'mobile']) for (const mode of ['mouse', 'keyboard']) for (const num of [1, 2, 3]) {
  if ((onlyCase && +onlyCase !== num) || (onlyVp && onlyVp !== vp) || (onlyMode && onlyMode !== mode) || reducedOnly) continue;
  runs.push({ num, vp, mode });
}
if (reducedOnly || (!onlyCase && !onlyVp && !onlyMode)) runs.push({ num: reducedOnly && onlyCase ? +onlyCase : 3, vp: 'desktop', mode: 'mouse', reduced: true });
let failed = 0;
for (const r of runs) {
  const t0 = Date.now();
  try { const name = await playCase(r); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { failed++; console.error(`FAIL c${r.num}-${r.vp}-${r.mode}${r.reduced ? '-reduced' : ''}: ${e.message.split('\n').slice(0, 6).join('\n')}`); }
}
console.log(`\n${runs.length - failed}/${runs.length} playthroughs passed`);
process.exit(failed ? 1 : 0);
