import test from 'node:test';
import assert from 'node:assert/strict';
import { STEPS } from '../src/ui/coach.js';
import { ICON_NAMES, hasIcon } from '../src/ui/icons.js';
import { CASES } from '../src/data/cases.js';

test('coach steps advance on the student own actions', () => {
  assert.equal(STEPS.length, 7);
  assert.deepEqual(STEPS.map(x => x.id), ['site', 'look', 'test', 'notebook', 'guide', 'next', 'solve']);
  for (const st of STEPS) assert.ok(st.target && st.side);
  const ctx = { site: null, looked: false, tested: false };
  assert.equal(STEPS[0].done('x', ctx), false);
  assert.equal(STEPS[0].done('x', { ...ctx, site: 'C' }), true);
  assert.equal(STEPS[1].done('x', { ...ctx, looked: true }), true);
  assert.equal(STEPS[2].done('x', { ...ctx, tested: true }), true);
  assert.equal(STEPS[3].done('sync', ctx), false);
  assert.equal(STEPS[3].done('x', { ...ctx, sawNotebook: true }), true);
  assert.equal(STEPS[4].done('x', { ...ctx, sawGuide: true }), true);
  assert.equal(STEPS[5].done('x', { ...ctx, nextDayed: true }), true);
  assert.equal(STEPS[6].done('sync', ctx), false);
  assert.equal(STEPS[6].done('gotit', ctx), true);
  assert.equal(STEPS[3].done('gotit', ctx), true);
});

test('every suspect icon and tool icon exists', () => {
  for (const c of CASES) for (const s of c.suspects) assert.ok(hasIcon(s.icon), s.icon);
  assert.ok(ICON_NAMES.length > 40);
});
