import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, TOOLS, GUIDE } from '../src/data/cases.js';
import { GUIDE_ROWS, guideFlag } from '../src/data/guide.js';
import { GLOSSARY } from '../src/data/glossary.js';
import { KIT, KIT_NEEDED } from '../src/data/kit.js';

const paramsOf = c => new Set([...c.tools.filter(t => !['look', 'nutrients', 'bod', 'pest'].includes(t)), 'n', 'p', 'look', 'bod', 'pest']);

test('three cases, one per module', () => {
  assert.deepEqual(CASES.map(c => c.module), ['M1', 'M5', 'M6']);
  assert.deepEqual(CASES.map(c => c.map), ['lagoon-open', 'reserve', 'lagoon-closed']);
});

for (const c of CASES) {
  test(`case ${c.num}: suspects, rules and sites are consistent`, () => {
    assert.equal(c.suspects.length, 4);
    assert.equal(c.suspects.filter(s => s.correct).length, 1);
    const sites = new Set(c.sites.map(s => s.id)), params = paramsOf(c);
    const check = r => { assert.ok(sites.has(r.site), `site ${r.site}`); assert.ok(params.has(r.param), `param ${r.param}`); };
    c.evidence.valid.forEach(check);
    for (const s of c.suspects) { if (!s.correct) { assert.ok(s.wrongWhy); assert.ok(s.ruleOut.length >= 1); s.ruleOut.forEach(check); } }
    for (const k of Object.keys(c.evidence.notes)) { const [site] = k.split('.'); assert.ok(sites.has(site), k); }
    for (const p of c.evidence.mustInclude || []) assert.ok(params.has(p));
    assert.equal(c.hints.length, 3);
  });
  test(`case ${c.num}: every wrap-up blank has exactly one correct chip`, () => {
    const used = [...c.frame.text.matchAll(/\{(\d+)\}/g)].map(m => +m[1]);
    assert.deepEqual(used, c.frame.blanks.map((_, i) => i));
    for (const b of c.frame.blanks) {
      assert.ok(b.options.length >= 2 && b.options.length <= 3);
      assert.ok(Number.isInteger(b.correct) && b.correct >= 0 && b.correct < b.options.length);
      assert.equal(new Set(b.options).size, b.options.length);
      assert.ok(b.hint);
    }
  });
  test(`case ${c.num}: every reading has a unit (or is a unitless tool) and every site has data`, () => {
    for (const t of c.tools) assert.ok(TOOLS[t], t);
    for (const s of c.sites) {
      assert.ok(c.looks[s.id], `look ${s.id}`);
      for (const t of c.tools) {
        if (['look', 'nutrients', 'bod', 'pest'].includes(t)) continue;
        const v = c.readings[s.id][t];
        assert.ok(v !== undefined, `${s.id}.${t}`);
        assert.ok(TOOLS[t].unit !== undefined);
        if (Array.isArray(v)) assert.equal(v.length, c.days, `${s.id}.${t} per day`);
        if (t !== 'phStrip' && t !== 'ph') assert.ok(TOOLS[t].unit, `${t} needs a unit`);
      }
      if (c.tools.includes('nutrients')) assert.ok(c.labs.nutrients[s.id]);
      for (const k of ['looks']) if (Array.isArray(c[k][s.id])) assert.equal(c[k][s.id].length, c.days);
    }
    assert.equal(c.weather.length, c.days);
    assert.ok(c.real.url.startsWith('https://') && c.real.text && c.real.linkText);
  });
  test(`case ${c.num}: budget and days are sane`, () => { assert.ok(c.budget >= 8 && c.days >= 3); });
}

test('pH strip chart is 6.0 to 8.5 in 0.5 steps', () => {
  assert.deepEqual(TOOLS.phStrip.chart, [6.0, 6.5, 7.0, 7.5, 8.0, 8.5]);
  const c = CASES[1];
  for (const s of c.sites) for (const v of [].concat(c.readings[s.id].phStrip)) assert.ok(TOOLS.phStrip.chart.includes(v));
});

test('guide values match the spec table', () => {
  assert.deepEqual(GUIDE.estuary, { label: 'Estuary or salty water', ph: [7.0, 8.5], turb: [0.5, 10], n: 300, p: 30, doLow: 4 });
  assert.equal(GUIDE.fresh.n, 350); assert.equal(GUIDE.fresh.p, 25); assert.deepEqual(GUIDE.fresh.ph, [6.5, 8.5]); assert.equal(GUIDE.fresh.turb, null);
  const row = n => GUIDE_ROWS.find(r => r.name === n);
  assert.equal(row('pH').estuary, '7.0 to 8.5'); assert.equal(row('pH').fresh, '6.5 to 8.5');
  assert.equal(row('Total nitrogen').estuary, '300 µg/L or less'); assert.equal(row('Total phosphorus').fresh, '25 µg/L or less');
  assert.equal(row('Dissolved oxygen').estuary, 'under 4 mg/L is low');
  assert.equal(row('Turbidity').fresh, '(no value on the card)');
});

test('guide flags', () => {
  assert.equal(guideFlag('estuary', { param: 'n', value: 900 }).flag, 'high');
  assert.equal(guideFlag('fresh', { param: 'p', value: 24 }).flag, 'ok');
  assert.equal(guideFlag('fresh', { param: 'p', value: 58 }).flag, 'high');
  assert.equal(guideFlag('estuary', { param: 'do', value: 2.9 }).flag, 'low');
  assert.equal(guideFlag('fresh', { param: 'turb', value: 30 }), null);
  assert.equal(guideFlag('estuary', { param: 'sal', value: 30 }), null);
  assert.equal(guideFlag('fresh', { param: 'phStrip', value: 7.0 }).flag, 'ok');
});

test('glossary covers the science words and the kit has exactly three safe items', () => {
  for (const t of ['pH', 'Salinity', 'ppt', 'Dissolved oxygen', 'Turbidity', 'NTU', 'Clarity', 'Nutrients', 'Algae bloom', 'BOD', 'Microbes', 'Estuary', 'Stormwater', 'Runoff', 'Guide value']) assert.ok(GLOSSARY.some(g => g.term === t), t);
  assert.equal(KIT.length, 6); assert.equal(KIT.filter(k => k.safe).length, KIT_NEEDED);
});

test('case 3 day-1 readings are the course practice set', () => {
  const r = CASES[2].readings, l = CASES[2].labs;
  assert.equal(r.C.do[0], 4.2); assert.equal(r.C.turb, 35); assert.equal(r.C.sal, 4);
  assert.equal(l.bod.C, 2.5); assert.equal(l.bod.A, 1.0);
});
