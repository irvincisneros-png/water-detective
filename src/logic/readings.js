// Pure lookups into the authored case data. No DOM, no randomness.
import { CASES, TOOLS } from '../data/cases.js';

export const caseById = id => CASES.find(c => c.id === id || c.num === id) || null;
const pick = (v, day) => (Array.isArray(v) ? v[Math.min(Math.max(day, 1), v.length) - 1] : v);

// Instrument reading for a site on a day (temp, ph, phStrip, sal, do, turb, clarity).
export const sensorValue = (c, site, param, day) => pick(c.readings[site]?.[param], day);
export const nutrientValue = (c, site, day) => pick(c.labs.nutrients[site], day);   // { n, p }
export const bodValue = (c, site) => c.labs.bod?.[site];
export const pestValue = (c, site) => c.labs.pest?.[site];
export const lookAt = (c, site, day) => pick(c.looks[site], day);                    // { text, art }
export const hasTool = (c, toolId) => c.tools.includes(toolId);
export const siteOf = (c, id) => c.sites.find(s => s.id === id);

const PARAMS = {
  n: { label: 'Total nitrogen', unit: 'µg/L', tool: 'nutrients', decimals: 0 },
  p: { label: 'Total phosphorus', unit: 'µg/L', tool: 'nutrients', decimals: 0 },
  look: { label: 'Look', unit: '', tool: 'look', decimals: 0 },
};
const DECIMALS = { temp: 1, ph: 1, phStrip: 1, sal: 0, do: 1, turb: 0, clarity: 0, bod: 1 };
export function paramInfo(param) {
  if (PARAMS[param]) return PARAMS[param];
  const t = TOOLS[param];
  return { label: t.label || t.name, unit: t.unit, tool: param, decimals: DECIMALS[param] ?? 0 };
}
export function formatValue(param, value) {
  if (typeof value !== 'number') return String(value);
  return value.toFixed(paramInfo(param).decimals);
}
export function formatReading(param, value) {
  const u = paramInfo(param).unit;
  return u ? `${formatValue(param, value)} ${u}` : formatValue(param, value);
}
