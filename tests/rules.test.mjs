import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, selectSite, look, runTest, canTest, nextDay, canNextDay, topUp, accuse, scoreStars, placeChip, finishWrap, sentence, nextTip, WRONG_COST } from '../src/logic/game.js';
import { sensorValue, formatReading, caseById } from '../src/logic/readings.js';
import { judgeEvidence, judgeRuleOut, ruleMatches, modelEvidence } from '../src/logic/board.js';
import { labStatus, nextArrival, waitForResults } from '../src/logic/game.js';
import { wrapOrders, suspectOrder, seededOrder } from '../src/logic/shuffle.js';
import { CASES } from '../src/data/cases.js';
import { find, advance, must } from './helpers.mjs';

const fresh = id => { const s = createState(id); s.step = 'investigate'; return s; };

test('a test needs a site and spends the right tokens', () => {
  const s = fresh(1);
  assert.equal(canTest(s, 'temp').ok, false);
  selectSite(s, 'B');
  const r = must(runTest(s, 'temp'));
  assert.equal(s.tokens, 5); assert.equal(r.entries[0].value, 22.0);
  assert.equal(formatReading('temp', 22.0), '22.0 °C');
  assert.equal(canTest(s, 'temp').reason, 'Already done here today');
});

test('look is free and makes one entry per site per day', () => {
  const s = fresh(1); selectSite(s, 'C');
  const a = look(s), b = look(s);
  assert.equal(s.tokens, 6); assert.equal(s.entries.length, 1); assert.equal(b.existing, true);
  assert.deepEqual(a.entry.art, ['bloom', 'deadfish']); assert.ok(s.revealed.C);
});

test('wrong cause costs 2 tokens and never goes below 0', () => {
  const s = fresh(1);
  const r = accuse(s, { cause: 'soil', evidence: [] });
  assert.equal(r.correct, false); assert.equal(r.lost, WRONG_COST); assert.equal(s.tokens, 4); assert.match(r.why, /creek mouth/);
  s.tokens = 1;
  const r2 = accuse(s, { cause: 'oil', evidence: [] });
  assert.equal(s.tokens, 0); assert.equal(r2.lost, 1);
  const r3 = accuse(s, { cause: 'heat', evidence: [] });
  assert.equal(s.tokens, 0); assert.equal(r3.lost, 0); assert.equal(s.wrongCauses, 3);
});

test('out of tokens blocks tests; ranger top-up gives 3 and blocks star 3', () => {
  const s = fresh(1); selectSite(s, 'C'); look(s);
  s.tokens = 0;
  assert.equal(canTest(s, 'do').reason, 'Out of tokens');
  topUp(s); assert.equal(s.tokens, 3); assert.equal(s.topUps, 1);
  must(runTest(s, 'nutrients')); advance(s, 1);
  selectSite(s, 'B'); look(s);
  const r = accuse(s, { cause: 'fertiliser', evidence: [find(s, 'C', 'n').id, find(s, 'C', 'p').id], ruleOut: { suspect: 'oil', entry: find(s, 'B', 'look').id } });
  assert.deepEqual(r.stars, [true, true, false]);
});

test('lab results arrive on the right day', () => {
  const s = fresh(1); selectSite(s, 'C'); must(runTest(s, 'nutrients'));
  assert.equal(s.pending.length, 1); assert.equal(s.pending[0].due, 2);
  assert.equal(s.entries.length, 0);
  const r = nextDay(s);
  assert.equal(r.arrived.length, 2); assert.deepEqual(r.arrived.map(e => [e.param, e.value, e.day]), [['n', 900, 1], ['p', 95, 1]]);
  assert.equal(s.pending.length, 0);
});

test('labs are refused when the result would arrive after the last day', () => {
  const s = fresh(1); selectSite(s, 'C'); advance(s, 2);
  assert.equal(s.day, 3);
  assert.equal(canTest(s, 'nutrients').reason, 'Lab result would arrive after the last day');
  const t = fresh(3); selectSite(t, 'C'); advance(t, 2);
  assert.equal(canTest(t, 'bod').ok, false); assert.equal(canTest(t, 'pest').ok, false);
  advance(t, -0 || 0);
  const u = fresh(3); selectSite(u, 'C'); advance(u, 1);
  assert.equal(canTest(u, 'bod').ok, true); advance(u, 1);
  assert.equal(canTest(u, 'bod').ok, false);
});

test('next day stops at the last day', () => {
  const s = fresh(1); advance(s, 2);
  assert.equal(canNextDay(s).ok, false); assert.equal(nextDay(s).ok, false); assert.equal(s.day, 3);
});

test('BOD = DO now minus DO after 5 days; result arrives after 5 days', () => {
  const s = fresh(3); selectSite(s, 'C');
  must(runTest(s, 'bod'));
  assert.equal(s.pending[0].doNow, 4.2); assert.equal(s.pending[0].due, 6);
  advance(s, 4); assert.equal(find(s, 'C', 'bod'), undefined);
  advance(s, 1);
  const e = find(s, 'C', 'bod');
  assert.equal(e.value, 2.5); assert.equal(e.doNow, 4.2); assert.equal(Math.round((e.doNow - e.doAfter) * 10) / 10, e.value); assert.equal(e.doAfter, 1.7);
});

test('BOD uses the dissolved oxygen of the day the bottles were filled', () => {
  const s = fresh(3); selectSite(s, 'C'); advance(s, 1);
  must(runTest(s, 'bod')); assert.equal(s.pending[0].doNow, 3.3);
  advance(s, 5); const e = find(s, 'C', 'bod'); assert.equal(e.day, 2); assert.equal(e.doAfter, 0.8);
});

test('pesticide result after 5 days', () => {
  const s = fresh(3); selectSite(s, 'C'); must(runTest(s, 'pest')); assert.equal(s.tokens, 4);
  advance(s, 5); assert.equal(find(s, 'C', 'pest').value, 'Not found');
});

test('readings vary by day where authored and stay the same where not', () => {
  const c = caseById(2);
  assert.equal(sensorValue(c, 'B', 'clarity', 1), 80); assert.equal(sensorValue(c, 'B', 'clarity', 3), 15);
  assert.equal(sensorValue(c, 'B', 'do', 5), 3.1); assert.equal(sensorValue(c, 'C', 'phStrip', 4), 6.5);
  assert.equal(sensorValue(c, 'A', 'clarity', 2), 90);
  const s = fresh(2); selectSite(s, 'B'); must(runTest(s, 'nutrients')); advance(s, 2);
  must(runTest(s, 'nutrients')); advance(s, 1);
  assert.deepEqual(s.entries.filter(e => e.param === 'n').map(e => [e.day, e.value]), [[1, 330], [3, 900]]);
  const c3 = caseById(3);
  assert.equal(sensorValue(c3, 'C', 'do', 3), 3.0); assert.equal(sensorValue(c3, 'C', 'do', 4), 4.6); assert.equal(sensorValue(c3, 'C', 'ph', 5), 7.2);
});

test('evidence judging uses day-aware rules and specific notes', () => {
  const c = caseById(2);
  assert.equal(judgeEvidence(c, { site: 'B', param: 'clarity', day: 2 }).valid, true);
  const d1 = judgeEvidence(c, { site: 'B', param: 'clarity', day: 1 });
  assert.equal(d1.valid, false); assert.match(d1.why, /before the rain/);
  assert.match(judgeEvidence(c, { site: 'B', param: 'do', day: 3 }).why, /not yet under 4/);
  assert.equal(judgeEvidence(c, { site: 'B', param: 'do', day: 4 }).valid, true);
  assert.match(judgeEvidence(c, { site: 'A', param: 'sal', day: 1 }).why, /Saltmarsh Pool/);
  assert.equal(judgeEvidence(c, { site: 'B', param: 'look', day: 1 }).why, c.evidence.defaultWhy);
  const c1 = caseById(1);
  assert.match(judgeEvidence(c1, { site: 'A', param: 'n', day: 1 }).why, /cleanest site/);
  assert.match(judgeEvidence(c1, { site: 'C', param: 'turb', day: 1 }).why, /algae or soil/);
});

test('rule-out rules respect minDay and maxDay and refuse the real cause', () => {
  const c = caseById(2);
  assert.equal(judgeRuleOut(c, 'always-bad', { site: 'B', param: 'clarity', day: 1 }).valid, true);
  assert.equal(judgeRuleOut(c, 'always-bad', { site: 'B', param: 'clarity', day: 2 }).valid, false);
  assert.equal(judgeRuleOut(c, 'runoff', { site: 'B', param: 'clarity', day: 1 }).valid, false);
  assert.equal(judgeRuleOut(c, 'too-cold', { site: 'C', param: 'temp', day: 3 }).valid, true);
  assert.ok(ruleMatches({ site: 'A', param: 'x' }, { site: 'A', param: 'x', day: 9 }));
});

test('case 1 needs a nutrient reading for star 2; case 3 needs a BOD reading', () => {
  const s = fresh(1); selectSite(s, 'C'); look(s); must(runTest(s, 'do')); must(runTest(s, 'nutrients')); advance(s, 1);
  const r = accuse(s, { cause: 'fertiliser', evidence: [find(s, 'C', 'do').id, find(s, 'C', 'look').id] });
  assert.equal(r.stars[1], false);
  const s2 = fresh(3); selectSite(s2, 'C'); must(runTest(s2, 'do')); must(runTest(s2, 'turb')); must(runTest(s2, 'sal'));
  const r2 = accuse(s2, { cause: 'oxygen-used', evidence: [find(s2, 'C', 'do').id, find(s2, 'C', 'turb').id] });
  assert.equal(r2.stars[1], false); assert.match(r2.evidence.mustWhy, /BOD/);
});

test('guessing: one wrong try still earns star 1; two or more lose it', () => {
  const run = wrongs => {
    const s = fresh(3); selectSite(s, 'C'); look(s);
    for (let i = 0; i < wrongs; i++) accuse(s, { cause: ['oil', 'weed-spray', 'too-salty'][i] });
    return accuse(s, { cause: 'oxygen-used', evidence: [] });
  };
  assert.equal(run(0).stars[0], true); assert.equal(run(1).stars[0], true);
  const r2 = run(2); assert.equal(r2.stars[0], false); assert.equal(r2.guessed, true);
});

test('the same wrong cause is never charged twice', () => {
  const s = fresh(1);
  const a = accuse(s, { cause: 'soil' }), b = accuse(s, { cause: 'soil' }), c = accuse(s, { cause: 'soil' });
  assert.equal(a.lost, 2); assert.equal(b.repeat, true); assert.equal(b.lost, 0); assert.equal(c.lost, 0);
  assert.equal(s.tokens, 4); assert.equal(s.wrongCauses, 1); assert.deepEqual(s.wrongList, ['soil']);
});

test('star 3 needs star 2, a valid rule-out, no top-up and no wrong tries', () => {
  const build = ({ wrong = 0, topUp = false, evidence = 'good' } = {}) => {
    const s = fresh(1); selectSite(s, 'C'); look(s); selectSite(s, 'B'); look(s);
    must(runTest(s, 'nutrients', 'C')); must(runTest(s, 'do', 'C')); advance(s, 1);
    if (topUp) topUp_(s);
    for (let i = 0; i < wrong; i++) accuse(s, { cause: ['soil', 'oil'][i] });
    const ev = evidence === 'good' ? [find(s, 'C', 'n').id, find(s, 'C', 'p').id] : [find(s, 'C', 'do').id, find(s, 'C', 'look').id];
    return accuse(s, { cause: 'fertiliser', evidence: ev, ruleOut: { suspect: 'oil', entry: find(s, 'B', 'look').id } }).stars;
  };
  const topUp_ = s => topUp(s);
  assert.deepEqual(build(), [true, true, true]);
  assert.deepEqual(build({ wrong: 1 }), [true, true, false]);
  assert.deepEqual(build({ topUp: true }), [true, true, false]);
  assert.deepEqual(build({ evidence: 'weak' }), [true, false, false]);
  assert.deepEqual(build({ wrong: 2 }), [false, true, false]);
});

test('why strings fill in the student\'s own reading', () => {
  const s = fresh(2); selectSite(s, 'B'); advance(s, 1); must(runTest(s, 'clarity'));
  const r = judgeEvidence(caseById(2), find(s, 'B', 'clarity'));
  assert.equal(r.valid, true); assert.match(r.why, /only 30 cm/); assert.doesNotMatch(r.why, /\{value\}/);
  assert.match(judgeRuleOut(caseById(2), 'too-cold', { site: 'C', param: 'temp', day: 1, value: 16 }).why, /16\.0 °C/);
  const me = modelEvidence(caseById(2), s.entries);
  assert.equal(me.length, 4); assert.ok(me.find(m => m.rule.param === 'clarity').entry); assert.equal(me.find(m => m.rule.param === 'n').entry, null);
});

test('long lab tests: Start by Day 2 in case 3, then too late', () => {
  const s = fresh(3); selectSite(s, 'C');
  assert.deepEqual(labStatus(s, 'bod'), { deadline: 2, status: 'early', delay: 5 });
  assert.equal(labStatus(s, 'temp'), null); assert.equal(labStatus(s, 'nutrients'), null);
  advance(s, 1); assert.equal(labStatus(s, 'bod').status, 'last'); assert.equal(canTest(s, 'bod').ok, true);
  advance(s, 1); assert.equal(labStatus(s, 'bod').status, 'late');
  assert.match(canTest(s, 'bod').reason, /Too late: a 5-day test must start by Day 2/);
  assert.equal(labStatus(fresh(1), 'nutrients'), null);
});

test('wait for results jumps to the day the next result arrives', () => {
  const s = fresh(3); selectSite(s, 'C'); must(runTest(s, 'bod'));
  assert.equal(nextArrival(s), 6);
  const r = waitForResults(s);
  assert.equal(r.days, 5); assert.equal(s.day, 6); assert.equal(r.arrived.length, 1); assert.equal(r.arrived[0].param, 'bod');
  assert.equal(waitForResults(s).ok, false);
});

test('seeded shuffles are stable, and the right answer is not first everywhere', () => {
  for (const c of CASES) {
    const a = wrapOrders(c), b = wrapOrders(c);
    assert.deepEqual(a, b);
    a.forEach((o, i) => assert.deepEqual([...o].sort(), c.frame.blanks[i].options.map((_, k) => k)));
    assert.ok(a.some((o, i) => o[0] !== c.frame.blanks[i].correct), `${c.id}: not correct-first everywhere`);
    const so = suspectOrder(c); assert.deepEqual(so, suspectOrder(c)); assert.notEqual(so[0], c.suspects.findIndex(x => x.correct)); assert.deepEqual([...so].sort(), [0, 1, 2, 3]);
  }
  assert.deepEqual(seededOrder(5, 'x'), seededOrder(5, 'x')); assert.notDeepEqual(seededOrder(8, 'x'), seededOrder(8, 'y'));
});

test('wrap-up chips: wrong wobbles with a hint, right fills; sentence completes', () => {
  const s = fresh(1); s.solved = { cause: 'fertiliser', evidence: [], ruleOut: null, stars: [true, false, false] }; s.step = 'wrapup'; s.wrap = [null, null, null];
  const bad = placeChip(s, 0, 1); assert.equal(bad.correct, false); assert.ok(bad.hint); assert.equal(s.wrap[0], null);
  assert.equal(finishWrap(s), null);
  placeChip(s, 0, 0); placeChip(s, 1, 0); const last = placeChip(s, 2, 0);
  assert.equal(last.complete, true);
  const r = finishWrap(s);
  assert.match(r.sentence, /^Rain washed fertiliser from lawns/); assert.match(r.sentence, /dropped, so fish died\.$/);
  assert.equal(s.step, 'done');
  assert.equal(sentence(caseById(1), [null, null, null]).includes('____'), true);
});

test('tips unlock one at a time up to three', () => {
  const s = fresh(2);
  assert.equal(nextTip(s).length, 1); assert.equal(nextTip(s).length, 2); assert.equal(nextTip(s).length, 3); assert.equal(nextTip(s).length, 3);
});
