// Guide card rows (built from GUIDE in cases.js) and pure flag logic used after a case ends.
import { GUIDE } from './cases.js';

const rng = r => `${r[0].toFixed(1)} to ${r[1].toFixed(1)}`;
export const GUIDE_ROWS = [
  { name: 'pH', estuary: rng(GUIDE.estuary.ph), fresh: rng(GUIDE.fresh.ph) },
  { name: 'Turbidity', estuary: `${GUIDE.estuary.turb[0]} to ${GUIDE.estuary.turb[1]} NTU`, fresh: '(no value on the card)' },
  { name: 'Total nitrogen', estuary: `${GUIDE.estuary.n} µg/L or less`, fresh: `${GUIDE.fresh.n} µg/L or less` },
  { name: 'Total phosphorus', estuary: `${GUIDE.estuary.p} µg/L or less`, fresh: `${GUIDE.fresh.p} µg/L or less` },
  { name: 'Dissolved oxygen', estuary: `under ${GUIDE.estuary.doLow} mg/L is low`, fresh: `under ${GUIDE.fresh.doLow} mg/L is low` },
  { name: 'Temperature, salinity', estuary: 'no single guide: depends on the animals', fresh: 'same' },
];

// entry: { param, value }; waterType: 'estuary' | 'fresh'. Returns null, or { flag: 'high'|'low'|'ok', text }.
export function guideFlag(waterType, entry) {
  const g = GUIDE[waterType], v = entry.value;
  if (!g || typeof v !== 'number') return null;
  switch (entry.param) {
    case 'ph': case 'phStrip':
      return v < g.ph[0] ? { flag: 'low', text: `Below the guide (${rng(g.ph)})` } : v > g.ph[1] ? { flag: 'high', text: `Above the guide (${rng(g.ph)})` } : { flag: 'ok', text: 'Inside the guide' };
    case 'turb':
      if (!g.turb) return null;
      return v < g.turb[0] ? { flag: 'low', text: 'Below the guide' } : v > g.turb[1] ? { flag: 'high', text: `Over the guide (${g.turb[1]} NTU)` } : { flag: 'ok', text: 'Inside the guide' };
    case 'n': return v > g.n ? { flag: 'high', text: `Over the guide (${g.n} µg/L)` } : { flag: 'ok', text: 'Inside the guide' };
    case 'p': return v > g.p ? { flag: 'high', text: `Over the guide (${g.p} µg/L)` } : { flag: 'ok', text: 'Inside the guide' };
    case 'do': return v < g.doLow ? { flag: 'low', text: `Low: under ${g.doLow} mg/L` } : { flag: 'ok', text: 'Healthy oxygen' };
    default: return null;
  }
}
