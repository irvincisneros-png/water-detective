// Case-board rules: is a reading valid evidence, does it rule a suspect out, and what do we tell the student.
import { siteOf, formatReading, sensorValue, nutrientValue, bodValue } from './readings.js';

// A why-string may contain {value}: show the student's own reading.
export const fillValue = (why, entry) => why.replace(/\{value\}/g, entry.param === 'look' ? '' : formatReading(entry.param, entry.value));

// Does a rule { site, param, minDay?, maxDay? } match a notebook entry? Entry day = the day the sample was taken.
export function ruleMatches(rule, entry) {
  if (rule.site !== entry.site || rule.param !== entry.param) return false;
  if (rule.minDay != null && entry.day < rule.minDay) return false;
  if (rule.maxDay != null && entry.day > rule.maxDay) return false;
  return true;
}

// Feedback for one evidence reading: { valid, why }.
export function judgeEvidence(c, entry) {
  const hit = c.evidence.valid.find(r => ruleMatches(r, entry));
  if (hit) return { valid: true, why: fillValue(hit.why, entry) };
  const n = c.evidence.notes;
  const why = n[`${entry.site}.${entry.param}@${entry.day}`] ?? n[`${entry.site}.${entry.param}`] ?? n[`${entry.site}.*`] ?? c.evidence.defaultWhy;
  return { valid: false, why };
}

// Whole evidence pick: two distinct readings, both valid, and at least one of the "must include" params.
export function judgeEvidenceSet(c, entries) {
  const items = entries.map(e => ({ entry: e, ...judgeEvidence(c, e) }));
  const must = c.evidence.mustInclude;
  const distinct = new Set(entries.map(e => e.id)).size === entries.length;
  const hasMust = !must || entries.some(e => must.includes(e.param));
  const allValid = items.length === 2 && items.every(i => i.valid) && distinct;
  return { items, allValid, hasMust, star: allValid && hasMust, mustWhy: allValid && !hasMust ? c.evidence.mustIncludeWhy : null };
}

// Does this reading rule out this (wrong) suspect? { valid, why }.
export function judgeRuleOut(c, suspectId, entry) {
  const s = c.suspects.find(x => x.id === suspectId);
  if (!s || s.correct) return { valid: false, why: 'That is the real cause, so you cannot rule it out. Pick a different suspect.' };
  const hit = (s.ruleOut || []).find(r => ruleMatches(r, entry));
  if (hit) return { valid: true, why: fillValue(hit.why, entry) };
  return { valid: false, why: `That reading does not rule out "${s.title}". Think about what that cause would change in the water.` };
}

export const describeSite = (c, id) => siteOf(c, id)?.name ?? id;

// What strong evidence looks like: every valid reading, and the student's own matching reading if they took one.
// For readings they did not take, show what the authored reading would have been.
export function modelEvidence(c, entries) {
  return c.evidence.valid.map(rule => {
    const mine = entries.find(e => ruleMatches(rule, e)) || null;
    let sample = mine;
    if (!mine) {
      const day = rule.minDay ?? rule.maxDay ?? 1;
      let value;
      if (rule.param === 'n' || rule.param === 'p') value = nutrientValue(c, rule.site, day)[rule.param];
      else if (rule.param === 'bod') value = bodValue(c, rule.site);
      else value = sensorValue(c, rule.site, rule.param, day);
      sample = { param: rule.param, value, site: rule.site, day };
    }
    return { rule, entry: mine, sample, why: fillValue(rule.why, sample) };
  });
}
