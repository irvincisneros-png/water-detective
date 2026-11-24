import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, selectSite, look, runTest, accuse, scoreStars } from '../src/logic/game.js';
import { caseById } from '../src/logic/readings.js';
import { CASES } from '../src/data/cases.js';
import { solve3, fillWrap, find } from './helpers.mjs';

for (const c of CASES) {
  test(`case ${c.num}: scripted shortest path earns 3 stars within budget and days`, () => {
    const { state: s, result } = solve3(c.id);
    assert.equal(result.correct, true);
    assert.deepEqual(result.stars, [true, true, true]);
    assert.ok(s.tokensSpent <= c.budget, `spent ${s.tokensSpent} of ${c.budget}`);
    assert.ok(s.day <= c.days);
    assert.equal(s.topUps, 0); assert.equal(s.wrongCauses, 0);
    const done = fillWrap(s);
    assert.deepEqual(done.stars, [true, true, true]); assert.equal(scoreStars(s).filter(Boolean).length, 3);
  });
  test(`case ${c.num}: free actions alone cannot reach star 2`, () => {
    const s = createState(c.id); s.step = 'investigate';
    for (const site of c.sites) { selectSite(s, site.id); look(s); }
    assert.equal(s.tokens, c.budget);
    const lookIds = s.entries.map(e => e.id).slice(0, 2);
    const right = c.suspects.find(x => x.correct).id;
    const r = accuse(s, { cause: right, evidence: lookIds });
    assert.equal(r.stars[1], false);
  });
  test(`case ${c.num}: the whole thing fits when you check every valid evidence rule`, () => {
    // every valid evidence rule is reachable as a notebook entry on some day within the limit
    for (const rule of c.evidence.valid) {
      const day = rule.minDay ?? 1;
      assert.ok(day <= c.days, `${rule.site}.${rule.param} day ${day}`);
    }
  });
}

test('case 2: day-1 evidence is not enough, and Day 1 readings rule out "always bad"', () => {
  const s = createState(2); s.step = 'investigate'; selectSite(s, 'B');
  runTest(s, 'clarity'); runTest(s, 'do');
  const r = accuse(s, { cause: 'runoff', evidence: [find(s, 'B', 'clarity').id, find(s, 'B', 'do').id], ruleOut: { suspect: 'always-bad', entry: find(s, 'B', 'do').id } });
  assert.equal(r.stars[1], false); assert.equal(r.stars[2], true);
  assert.match(r.evidence.items[0].why, /before the rain/);
});

test('budget is enough to take a generous set of readings in each case', () => {
  for (const c of CASES) assert.ok(c.budget >= 8);
  const s = createState(1); s.step = 'investigate';
  let spent = 0;
  for (const site of ['A', 'B', 'C', 'D']) { selectSite(s, site); for (const t of ['temp', 'do']) { if (runTest(s, t).ok) spent++; } }
  assert.equal(s.tokens, 0);
});
