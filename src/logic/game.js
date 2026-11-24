// Game rules. Pure: state in, state mutated, plain result objects out. No DOM.
import { caseById, sensorValue, nutrientValue, bodValue, pestValue, lookAt, paramInfo } from './readings.js';
import { TOOLS } from '../data/cases.js';
import { judgeEvidenceSet, judgeRuleOut } from './board.js';

export const TOPUP = 3;
export const WRONG_COST = 2;
export const STEPS = ['call', 'kit', 'investigate', 'board', 'wrapup', 'done'];

export function createState(caseId) {
  const c = caseById(caseId);
  return {
    v: 1, caseId: c.id, step: 'call', day: 1, tokens: c.budget, site: null,
    entries: [], pending: [], revealed: {}, nextId: 1, unseen: 0,
    topUps: 0, wrongCauses: 0, wrongList: [], tipsShown: 0,
    solved: null,      // { cause, evidence: [ids], ruleOut: {suspect, entry}|null, stars: [bool,bool,bool] }
    wrap: c.frame.blanks.map(() => null),   // chosen option index per blank (null = empty)
    wrapDone: false,
    tokensSpent: 0,
  };
}

const maxDay = c => c.days;
export const tokenCost = (state, toolId) => TOOLS[toolId].cost;
export const entryById = (state, id) => state.entries.find(e => e.id === id) || null;

function duplicate(state, toolId, site) {
  const param = toolId;
  const sameDay = e => e.site === site && e.day === state.day;
  if (toolId === 'nutrients') return state.entries.some(e => sameDay(e) && e.param === 'n') || state.pending.some(p => p.tool === toolId && p.site === site && p.day === state.day);
  if (toolId === 'bod' || toolId === 'pest') return state.pending.some(p => p.tool === toolId && p.site === site && p.day === state.day) || state.entries.some(e => sameDay(e) && e.param === param);
  return state.entries.some(e => sameDay(e) && e.param === param);
}

// Can this test be run right now? { ok, reason }
export function canTest(state, toolId, siteId = state.site) {
  const c = caseById(state.caseId), t = TOOLS[toolId];
  if (!t || !c.tools.includes(toolId)) return { ok: false, reason: 'Not part of this case' };
  if (!siteId) return { ok: false, reason: 'Tap a site on the map first' };
  if (t.cost > state.tokens) return { ok: false, reason: state.tokens === 0 ? 'Out of tokens' : `Needs ${t.cost} tokens` };
  if (t.delay && state.day + t.delay > maxDay(c)) return { ok: false, reason: t.delay >= 5 ? `Too late: a ${t.delay}-day test must start by Day ${maxDay(c) - t.delay}` : 'Lab result would arrive after the last day' };
  if (toolId !== 'look' && duplicate(state, toolId, siteId)) return { ok: false, reason: 'Already done here today' };
  return { ok: true, reason: '' };
}

function addEntry(state, e) {
  const entry = { id: `e${state.nextId++}`, arrived: state.day, ...e };
  state.entries.push(entry);
  state.unseen += 1;
  return entry;
}

// Long lab tests: the last day they can start. status: 'early' (plenty of time), 'last' (today is the last day), 'late'.
export function labStatus(state, toolId) {
  const c = caseById(state.caseId), t = TOOLS[toolId];
  if (!t.delay || t.delay < 5) return null;
  const deadline = maxDay(c) - t.delay;
  if (deadline < 1) return null;
  return { deadline, status: state.day < deadline ? 'early' : state.day === deadline ? 'last' : 'late', delay: t.delay };
}

export function selectSite(state, siteId) {
  const c = caseById(state.caseId);
  if (!c.sites.some(s => s.id === siteId)) return false;
  state.site = siteId;
  return true;
}

// Look is free. One notebook entry per site per day; it also reveals the site art.
export function look(state, siteId = state.site) {
  const c = caseById(state.caseId);
  if (!siteId || !c.sites.some(s => s.id === siteId)) return { ok: false, reason: 'Tap a site on the map first' };
  state.revealed[siteId] = true;
  const existing = state.entries.find(e => e.param === 'look' && e.site === siteId && e.day === state.day);
  if (existing) return { ok: true, existing: true, entry: existing };
  const l = lookAt(c, siteId, state.day);
  const entry = addEntry(state, { site: siteId, param: 'look', day: state.day, value: l.text, art: l.art, unit: '' });
  return { ok: true, entry };
}

// Spend tokens and record the reading (or send the sample to the lab).
export function runTest(state, toolId, siteId = state.site) {
  const chk = canTest(state, toolId, siteId);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  const c = caseById(state.caseId), t = TOOLS[toolId];
  state.tokens -= t.cost; state.tokensSpent += t.cost;
  const base = { site: siteId, day: state.day };
  if (toolId === 'nutrients' || toolId === 'bod' || toolId === 'pest') {
    const p = { id: `p${state.nextId++}`, tool: toolId, ...base, due: state.day + t.delay };
    if (toolId === 'bod') p.doNow = sensorValue(c, siteId, 'do', state.day);
    state.pending.push(p);
    return { ok: true, cost: t.cost, entries: [], pending: p };
  }
  const value = sensorValue(c, siteId, toolId, state.day);
  const entry = addEntry(state, { ...base, param: toolId, value, unit: t.unit });
  return { ok: true, cost: t.cost, entries: [entry], pending: null };
}

export function canNextDay(state) {
  const c = caseById(state.caseId);
  return state.day < maxDay(c) ? { ok: true, reason: '' } : { ok: false, reason: 'This is the last day' };
}

// Advance the clock; lab samples whose day has come land in the notebook.
export function nextDay(state) {
  const chk = canNextDay(state);
  if (!chk.ok) return { ok: false, reason: chk.reason, arrived: [] };
  const c = caseById(state.caseId);
  state.day += 1;
  const arrived = [], keep = [];
  for (const p of state.pending) {
    if (p.due > state.day) { keep.push(p); continue; }
    if (p.tool === 'nutrients') {
      const v = nutrientValue(c, p.site, p.day);
      arrived.push(addEntry(state, { site: p.site, param: 'n', day: p.day, value: v.n, unit: 'µg/L' }));
      arrived.push(addEntry(state, { site: p.site, param: 'p', day: p.day, value: v.p, unit: 'µg/L' }));
    } else if (p.tool === 'bod') {
      const bod = bodValue(c, p.site), after = Math.round((p.doNow - bod) * 10) / 10;
      arrived.push(addEntry(state, { site: p.site, param: 'bod', day: p.day, value: bod, unit: 'mg/L', doNow: p.doNow, doAfter: after }));
    } else if (p.tool === 'pest') {
      arrived.push(addEntry(state, { site: p.site, param: 'pest', day: p.day, value: pestValue(c, p.site), unit: '' }));
    }
  }
  state.pending = keep;
  return { ok: true, arrived };
}

export const nextArrival = state => (state.pending.length ? Math.min(...state.pending.map(p => p.due)) : null);
// Jump to the day the next waiting result arrives. Returns { ok, days, arrived }.
export function waitForResults(state) {
  const due = nextArrival(state);
  if (due == null) return { ok: false, reason: 'Nothing is waiting', arrived: [], days: 0 };
  const arrived = []; let days = 0;
  while (state.day < due) { const r = nextDay(state); if (!r.ok) break; arrived.push(...r.arrived); days++; }
  return { ok: true, arrived, days };
}

export function topUp(state) {
  state.tokens += TOPUP; state.topUps += 1;
  return { ok: true, tokens: state.tokens };
}
export const needsTopUp = state => state.tokens < 2;

export function nextTip(state) {
  const c = caseById(state.caseId);
  if (state.tipsShown < c.hints.length) state.tipsShown += 1;
  return c.hints.slice(0, state.tipsShown);
}

export function scoreStars(state) {
  const s = state.solved;
  if (!s) return [false, false, false];
  return s.stars;
}

// payload: { cause, evidence: [entryId, entryId], ruleOut: { suspect, entry } | null }
export function accuse(state, payload) {
  const c = caseById(state.caseId);
  const suspect = c.suspects.find(s => s.id === payload.cause);
  if (!suspect) return { ok: false, reason: 'Pick a cause first' };
  if (!suspect.correct) {
    if (state.wrongList.includes(suspect.id)) return { ok: true, correct: false, repeat: true, lost: 0, why: suspect.wrongWhy, tokens: state.tokens };
    const before = state.tokens;
    state.tokens = Math.max(0, state.tokens - WRONG_COST);
    state.wrongCauses += 1; state.wrongList.push(suspect.id);
    return { ok: true, correct: false, lost: before - state.tokens, why: suspect.wrongWhy, tokens: state.tokens, tries: state.wrongCauses };
  }
  const evEntries = (payload.evidence || []).map(id => entryById(state, id)).filter(Boolean);
  const ev = judgeEvidenceSet(c, evEntries);
  let ro = null, roEntry = null;
  if (payload.ruleOut?.suspect && payload.ruleOut?.entry) {
    roEntry = entryById(state, payload.ruleOut.entry);
    if (roEntry) ro = { suspect: payload.ruleOut.suspect, ...judgeRuleOut(c, payload.ruleOut.suspect, roEntry) };
  }
  // Stars: Solved (at most one wrong try), Evidence, Sharp detective (Evidence + valid rule-out + no top-up + no wrong tries).
  const star1 = state.wrongCauses <= 1, star2 = ev.star;
  const star3 = star2 && !!ro?.valid && state.topUps === 0 && state.wrongCauses === 0;
  state.solved = {
    cause: suspect.id, evidence: evEntries.map(e => e.id),
    ruleOut: ro ? { suspect: ro.suspect, entry: roEntry.id } : null,
    stars: [star1, star2, star3],
  };
  state.step = 'wrapup';
  state.wrap = c.frame.blanks.map(() => null);
  return { ok: true, correct: true, evidence: ev, ruleOut: ro, stars: state.solved.stars, topUps: state.topUps, wrongCauses: state.wrongCauses, guessed: state.wrongCauses >= 2 };
}

// Wrap-up chips. Returns { ok, correct, hint }.
export function placeChip(state, blank, option) {
  const c = caseById(state.caseId), b = c.frame.blanks[blank];
  if (!b || option < 0 || option >= b.options.length) return { ok: false };
  if (option !== b.correct) return { ok: true, correct: false, hint: b.hint };
  state.wrap[blank] = option;
  return { ok: true, correct: true, complete: state.wrap.every(x => x !== null) };
}
export function sentence(c, wrap) {
  return c.frame.text.replace(/\{(\d+)\}/g, (_, i) => {
    const o = wrap?.[+i];
    return o == null ? '____' : c.frame.blanks[+i].options[o];
  });
}
export function finishWrap(state) {
  if (!state.wrap.every(x => x !== null)) return null;
  const c = caseById(state.caseId);
  state.wrapDone = true; state.step = 'done';
  return { stars: scoreStars(state), sentence: sentence(c, state.wrap) };
}

// Everything reachable cheaply: handy for tests and for the "what to do next" nudge.
export const paramLabel = p => paramInfo(p).label;
