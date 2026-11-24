// Saves map-only screenshots of every case on every day, after Look at each site, to playtest-shots/story/ for review.
import { launch } from './harness.mjs';
import { mkdirSync } from 'node:fs';
const out = 'playtest-shots/story';
mkdirSync(out, { recursive: true });
const t = await launch({ outDir: out, prefix: 'tmp-' });
await t.ev(() => window.__wd.saveMod.markSeenCoach());
for (const num of [1, 2, 3]) {
  const days = await t.ev(n => window.__wd.CASES[n - 1].days, num);
  for (let day = 1; day <= days; day++) {
    await t.ev(([n, day]) => { window.__wd.start(n); const s = window.__wd.state; s.day = day; for (const x of window.__wd.c.sites) s.revealed[x.id] = true; s.site = window.__wd.c.sites[0].id; window.__wd.go('investigate'); }, [num, day]);
    await t.wait(400);
    await t.page.locator('.mapbox').screenshot({ path: `${out}/case${num}-day${day}.png` });
  }
}
const errs = t.errors.filter(e => !/favicon/i.test(e));
await t.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('saved story screenshots to', out);
