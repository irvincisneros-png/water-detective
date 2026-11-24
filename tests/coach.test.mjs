import test from 'node:test';
import assert from 'node:assert/strict';
import { STEPS } from '../src/ui/coach.js';
import { ICON_NAMES, hasIcon } from '../src/ui/icons.js';
import { CASES } from '../src/data/cases.js';

test('coach steps advance on the student own actions', () => {
  assert.equal(STEPS.length, 4);
  const ctx = { site: null, looked: false, tested: false };
  assert.equal(STEPS[0].done('x', ctx), false);
  assert.equal(STEPS[0].done('x', { ...ctx, site: 'C' }), true);
  assert.equal(STEPS[1].done('x', { ...ctx, looked: true }), true);
  assert.equal(STEPS[2].done('x', { ...ctx, tested: true }), true);
  assert.equal(STEPS[3].done('sync', ctx), false);
  assert.equal(STEPS[3].done('gotit', ctx), true);
});

test('every suspect icon and tool icon exists', () => {
  for (const c of CASES) for (const s of c.suspects) assert.ok(hasIcon(s.icon), s.icon);
  assert.ok(ICON_NAMES.length > 40);
});
