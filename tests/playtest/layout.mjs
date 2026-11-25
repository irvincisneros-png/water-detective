// Layout checks on small laptop / Chromebook sizes: the tray never runs off-screen, the top-up bar never hides tools,
// and browser Back on the title screen leaves the game.
import { launch } from './harness.mjs';
import assert from 'node:assert/strict';
const sizes = [[1366, 768], [1366, 657], [1280, 600]];
let failed = 0;
for (const [width, height] of sizes) {
  const t = await launch({ width, height, outDir: 'playtest-shots/layout', prefix: `${width}x${height}-` });
  try {
    await t.ev(() => window.__wd.saveMod.markSeenCoach());
    await t.ev(() => {
      window.__wd.start(3); const s = window.__wd.state, G = window.__wd.game;
      s.day = 2; s.tokens = 0; for (const x of window.__wd.c.sites) s.revealed[x.id] = true; s.site = 'C';
      s.pending.push({ id: 'p1', tool: 'bod', site: 'C', day: 1, due: 6, doNow: 4.2 });
      window.__wd.go('investigate');
    });
    await t.wait(400);
    await t.shot('case3-day2-pending');
    const m = await t.ev(() => {
      const r = s => document.querySelector(s)?.getBoundingClientRect();
      const tray = r('.tray'), chip = r('.wait-chip'), top = r('.topup'), tools = [...document.querySelectorAll('.tool')].map(e => e.getBoundingClientRect());
      const hit = top ? tools.filter(b => !(b.bottom <= top.top || b.top >= top.bottom || b.right <= top.left || b.left >= top.right)).length : 0;
      return { scrollH: document.documentElement.scrollHeight, innerH: innerHeight, trayBottom: tray.bottom, chipBottom: chip?.bottom, hasChip: !!chip, hit, tools: tools.length, banner: !!document.querySelector('.tray-banner:not([hidden])') };
    });
    assert.ok(m.hasChip, 'waiting chip exists');
    assert.ok(m.trayBottom <= m.innerH, `tray bottom ${m.trayBottom} within ${m.innerH}`);
    assert.ok(m.chipBottom <= m.innerH, `waiting chip bottom ${m.chipBottom} within ${m.innerH}`);
    assert.ok(m.scrollH <= m.innerH + 1, `no page scroll (${m.scrollH} vs ${m.innerH})`);
    assert.equal(m.hit, 0, 'top-up bar covers no tool');
    // every tool, including the last row, can be scrolled to and clicked
    for (const id of ['bod', 'pest']) { const loc = t.page.locator(`[data-tool="${id}"]`); await loc.scrollIntoViewIfNeeded(); assert.ok(await loc.isVisible()); }
    console.log(`PASS layout ${width}x${height}`);
  } catch (e) { failed++; await t.shot('fail'); console.error(`FAIL layout ${width}x${height}: ${e.message}`); }
  await t.close();
}
// browser Back on the title screen leaves the game
{
  const t = await launch({ outDir: 'playtest-shots/layout', prefix: 'back-' });
  try {
    const url = t.page.url();
    await t.page.locator('[data-case="1"][data-action="new"]').click(); await t.page.waitForSelector('#btn-start');
    await t.page.goBack(); await t.page.waitForSelector('[data-case="1"]');
    assert.equal(await t.ev(() => window.__wd.screen), 'title', 'Back from the call returns to the title');
    await t.page.goBack(); await t.wait(500);
    assert.notEqual(t.page.url(), url, 'Back on the title leaves the game');
    console.log('PASS back on title leaves the game');
  } catch (e) { failed++; console.error('FAIL back: ' + e.message); }
  await t.close();
}
process.exit(failed ? 1 : 0);
