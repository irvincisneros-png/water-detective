// localStorage persistence: key water-detective:v1, versioned, validated on load (bad data => fresh start).
// Storage is injectable so node tests can run it.
import { CASES, TOOLS } from '../data/cases.js';
import { createState } from '../logic/game.js';
import { caseById } from '../logic/readings.js';
const idOf = id => caseById(id)?.id ?? id;

export const KEY = 'water-detective:v1';
let store = null;
try { store = globalThis.localStorage ?? null; } catch { store = null; }
export const setStorage = s => { store = s; };

export const blank = () => ({ v: 1, settings: { muted: false, readAloud: true }, seenCoach: false, name: '', cases: {}, progress: {} });
let data = blank();
let memoryOnly = false;

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = v => Number.isInteger(v);
const num = v => typeof v === 'number' && Number.isFinite(v);

// Validate one in-progress state against its case. Returns a clean state or null.
export function sanitiseState(raw) {
  if (!isObj(raw)) return null;
  const c = CASES.find(x => x.id === raw.caseId);
  if (!c) return null;
  const s = createState(c.id), siteIds = c.sites.map(x => x.id);
  if (!['call', 'kit', 'investigate', 'board', 'wrapup', 'done'].includes(raw.step)) return null;
  if (!isInt(raw.day) || raw.day < 1 || raw.day > c.days) return null;
  if (!isInt(raw.tokens) || raw.tokens < 0 || raw.tokens > 99) return null;
  s.step = raw.step; s.day = raw.day; s.tokens = raw.tokens;
  s.site = siteIds.includes(raw.site) ? raw.site : null;
  const okParam = p => p === 'look' || p === 'n' || p === 'p' || (TOOLS[p] && c.tools.includes(p));
  if (!Array.isArray(raw.entries) || raw.entries.length > 400) return null;
  const ids = new Set();
  for (const e of raw.entries) {
    if (!isObj(e) || typeof e.id !== 'string' || ids.has(e.id) || !siteIds.includes(e.site) || !okParam(e.param)) return null;
    if (!isInt(e.day) || e.day < 1 || e.day > c.days || !(num(e.value) || typeof e.value === 'string')) return null;
    ids.add(e.id);
    const clean = { id: e.id, site: e.site, param: e.param, day: e.day, value: e.value, unit: typeof e.unit === 'string' ? e.unit : '', arrived: isInt(e.arrived) ? e.arrived : e.day };
    if (e.param === 'look') clean.art = Array.isArray(e.art) ? e.art.filter(a => typeof a === 'string') : [];
    if (e.param === 'bod') { if (!num(e.doNow) || !num(e.doAfter)) return null; clean.doNow = e.doNow; clean.doAfter = e.doAfter; }
    s.entries.push(clean);
  }
  if (!Array.isArray(raw.pending)) return null;
  for (const p of raw.pending) {
    if (!isObj(p) || typeof p.id !== 'string' || !['nutrients', 'bod', 'pest'].includes(p.tool) || !c.tools.includes(p.tool)) return null;
    if (!siteIds.includes(p.site) || !isInt(p.day) || !isInt(p.due) || p.due > c.days || p.day < 1 || p.due < p.day) return null;
    const clean = { id: p.id, tool: p.tool, site: p.site, day: p.day, due: p.due };
    if (p.tool === 'bod') { if (!num(p.doNow)) return null; clean.doNow = p.doNow; }
    s.pending.push(clean);
  }
  if (isObj(raw.revealed)) for (const k of Object.keys(raw.revealed)) if (siteIds.includes(k)) s.revealed[k] = true;
  s.nextId = isInt(raw.nextId) && raw.nextId > 0 ? raw.nextId : s.entries.length + s.pending.length + 1;
  for (const k of ['unseen', 'topUps', 'wrongCauses', 'tipsShown', 'tokensSpent']) s[k] = isInt(raw[k]) && raw[k] >= 0 ? raw[k] : 0;
  s.wrongList = Array.isArray(raw.wrongList) ? [...new Set(raw.wrongList.filter(i => typeof i === 'string' && c.suspects.some(x => x.id === i && !x.correct)))] : [];
  s.tipsShown = Math.min(s.tipsShown, c.hints.length);
  s.unseen = Math.min(s.unseen, s.entries.length);
  if (raw.solved != null) {
    const v = raw.solved;
    if (!isObj(v) || !c.suspects.some(x => x.id === v.cause && x.correct) || !Array.isArray(v.evidence) || !v.evidence.every(i => ids.has(i))) return null;
    if (!Array.isArray(v.stars) || v.stars.length !== 3 || !v.stars.every(b => typeof b === 'boolean')) return null;
    let ro = null;
    if (isObj(v.ruleOut) && c.suspects.some(x => x.id === v.ruleOut.suspect) && ids.has(v.ruleOut.entry)) ro = { suspect: v.ruleOut.suspect, entry: v.ruleOut.entry };
    s.solved = { cause: v.cause, evidence: v.evidence.slice(0, 2), ruleOut: ro, stars: v.stars };
  }
  if ((s.step === 'wrapup' || s.step === 'done') && !s.solved) return null;
  if (s.solved && s.step !== 'done') s.step = 'wrapup';
  const nb = c.frame.blanks.length;
  s.wrap = Array.from({ length: nb }, (_, i) => (Array.isArray(raw.wrap) && raw.wrap[i] === c.frame.blanks[i].correct ? raw.wrap[i] : null));
  s.wrapDone = s.step === 'done' && s.wrap.every(x => x !== null);
  if (s.step === 'done' && !s.wrapDone) s.step = 'wrapup';
  return s;
}

export function sanitise(parsed) {
  const d = blank(), p = isObj(parsed) ? parsed : {};
  if (p.v !== 1) return d;
  const st = isObj(p.settings) ? p.settings : {};
  d.settings = { muted: typeof st.muted === 'boolean' ? st.muted : false, readAloud: typeof st.readAloud === 'boolean' ? st.readAloud : true };
  d.seenCoach = p.seenCoach === true;
  d.name = typeof p.name === 'string' ? p.name.slice(0, 40) : '';
  if (isObj(p.cases)) for (const c of CASES) {
    const r = p.cases[c.id];
    if (!isObj(r) || !Array.isArray(r.stars) || r.stars.length !== 3 || !r.stars.every(b => typeof b === 'boolean')) continue;
    d.cases[c.id] = { stars: r.stars, sentence: typeof r.sentence === 'string' ? r.sentence.slice(0, 600) : '', date: typeof r.date === 'string' ? r.date.slice(0, 20) : '' };
  }
  if (isObj(p.progress)) for (const c of CASES) {
    const s = sanitiseState(p.progress[c.id]);
    if (s && s.caseId === c.id) d.progress[c.id] = s;
  }
  return d;
}

export function load() {
  try {
    const raw = store?.getItem(KEY);
    data = raw ? sanitise(JSON.parse(raw)) : blank();
  } catch { memoryOnly = true; data = blank(); }
  return data;
}
export function persist() { try { store?.setItem(KEY, JSON.stringify(data)); } catch { memoryOnly = true; } }
export const get = () => data;
export const isMemoryOnly = () => memoryOnly;
export function reset() { data = blank(); persist(); }

export const starCount = id => (data.cases[idOf(id)]?.stars || []).filter(Boolean).length;
export const totalStars = () => CASES.reduce((n, c) => n + starCount(c.id), 0);
export const hasFinished = id => !!data.cases[idOf(id)];
export function setSetting(k, v) { data.settings[k] = v; persist(); }
export function setName(n) { data.name = String(n).slice(0, 40); persist(); }
export function markSeenCoach() { data.seenCoach = true; persist(); }
export function saveProgress(state) { data.progress[state.caseId] = JSON.parse(JSON.stringify(state)); persist(); }
export function clearProgress(caseId) { delete data.progress[idOf(caseId)]; persist(); }
export const progressFor = caseId => data.progress[idOf(caseId)] || null;
// Keep the best stars per star slot: best kept.
export function recordResult(caseKey, stars, sentence, date) {
  const caseId = idOf(caseKey);
  const prev = data.cases[caseId]?.stars || [false, false, false];
  const merged = stars.map((b, i) => b || prev[i]);
  data.cases[caseId] = { stars: merged, sentence, date };
  delete data.progress[caseId];
  persist();
  return merged;
}
