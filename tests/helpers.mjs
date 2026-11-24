import { createState, selectSite, look, runTest, nextDay, accuse, placeChip, finishWrap } from '../src/logic/game.js';
import { caseById } from '../src/logic/readings.js';

export const find = (s, site, param, day) => s.entries.find(e => e.site === site && e.param === param && (day == null || e.day === day));
export function advance(s, n) { for (let i = 0; i < n; i++) { const r = nextDay(s); if (!r.ok) throw new Error(r.reason); } }
export function must(r) { if (!r.ok) throw new Error('step failed: ' + r.reason); return r; }

// Scripted shortest 3-star path for each case. Returns { state, result }.
export function solve3(caseId, { stopBeforeAccuse = false } = {}) {
  const num = caseById(caseId).num;
  const s = createState(caseId); s.step = 'investigate';
  if (num === 1) {
    selectSite(s, 'C'); look(s); selectSite(s, 'B'); look(s);
    must(runTest(s, 'nutrients', 'C')); advance(s, 1);
    if (stopBeforeAccuse) return { state: s };
    return { state: s, result: accuse(s, { cause: 'fertiliser', evidence: [find(s, 'C', 'n').id, find(s, 'C', 'p').id], ruleOut: { suspect: 'oil', entry: find(s, 'B', 'look').id } }) };
  }
  if (num === 2) {
    selectSite(s, 'B'); must(runTest(s, 'clarity')); advance(s, 1);
    must(runTest(s, 'clarity')); must(runTest(s, 'nutrients')); advance(s, 1);
    if (stopBeforeAccuse) return { state: s };
    const day2 = find(s, 'B', 'clarity', 2), n2 = find(s, 'B', 'n', 2), day1 = find(s, 'B', 'clarity', 1);
    return { state: s, result: accuse(s, { cause: 'runoff', evidence: [day2.id, n2.id], ruleOut: { suspect: 'always-bad', entry: day1.id } }) };
  }
  selectSite(s, 'C'); look(s); must(runTest(s, 'do')); must(runTest(s, 'bod')); advance(s, 5);
  if (stopBeforeAccuse) return { state: s };
  return { state: s, result: accuse(s, { cause: 'oxygen-used', evidence: [find(s, 'C', 'bod').id, find(s, 'C', 'do').id], ruleOut: { suspect: 'oil', entry: find(s, 'C', 'look').id } }) };
}
export function fillWrap(s) {
  const c = caseById(s.caseId);
  c.frame.blanks.forEach((b, i) => placeChip(s, i, b.correct));
  return finishWrap(s);
}
