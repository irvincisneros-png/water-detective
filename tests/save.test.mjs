import test from 'node:test';
import assert from 'node:assert/strict';
import * as save from '../src/state/save.js';
import { solve3 } from './helpers.mjs';
import { createState, selectSite, runTest, look, nextDay } from '../src/logic/game.js';

const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; };

test('round trip: stars, settings, name and an in-progress case restore exactly', () => {
  const st = mem(); save.setStorage(st); save.load();
  save.setSetting('muted', true); save.setName('Sam');
  const { state } = solve3(3, { stopBeforeAccuse: true });
  state.step = 'board'; save.saveProgress(state);
  save.recordResult(1, [true, true, false], 'Rain washed fertiliser.', '2026-11-25');
  save.load();
  const d = save.get();
  assert.equal(d.settings.muted, true); assert.equal(d.name, 'Sam');
  assert.deepEqual(d.cases['green-water'].stars, [true, true, false]);
  assert.deepEqual(save.progressFor(3), JSON.parse(JSON.stringify(state)));
  assert.equal(save.starCount(1), 2);
});

test('best stars are kept per slot', () => {
  save.setStorage(mem()); save.load(); save.reset();
  save.recordResult(2, [true, true, false], 's', 'd'); save.recordResult(2, [true, false, true], 's2', 'd2');
  assert.deepEqual(save.get().cases['which-pond'].stars, [true, true, true]);
});

test('corrupt data gives a fresh start', () => {
  for (const raw of ['{not json', 'null', '[]', '{"v":2}', '{"v":1,"cases":5,"progress":"x"}', '42']) {
    const st = mem(); st._m.set(save.KEY, raw); save.setStorage(st);
    const d = save.load();
    assert.deepEqual(d, save.blank(), raw);
  }
});

test('bad in-progress state is dropped but the rest of the save survives', () => {
  const { state } = solve3(1, { stopBeforeAccuse: true }); state.step = 'board';
  const bads = [
    { ...state, day: 99 }, { ...state, tokens: -3 }, { ...state, caseId: 77 }, { ...state, step: 'nope' },
    { ...state, entries: [{ id: 'x', site: 'Z', param: 'temp', day: 1, value: 1 }] },
    { ...state, entries: 'oops' }, { ...state, step: 'wrapup', solved: null },
    { ...state, pending: [{ id: 'p1', tool: 'bod', site: 'C', day: 1, due: 6, doNow: 1 }] },
  ];
  for (const b of bads) {
    const st = mem(); st._m.set(save.KEY, JSON.stringify({ v: 1, settings: { muted: true }, seenCoach: true, cases: {}, progress: { 'green-water': b } })); save.setStorage(st);
    const d = save.load();
    assert.equal(d.progress['green-water'], undefined);
    assert.equal(d.settings.muted, true); assert.equal(d.seenCoach, true);
  }
});

test('an in-progress case with a waiting lab sample restores', () => {
  const s = createState(2); s.step = 'investigate'; selectSite(s, 'B'); runTest(s, 'nutrients'); runTest(s, 'clarity'); look(s);
  const st = mem(); save.setStorage(st); save.load(); save.saveProgress(s); save.load();
  const r = save.progressFor(2);
  assert.deepEqual(r, JSON.parse(JSON.stringify(s)));
  nextDay(r); assert.equal(r.entries.filter(e => e.param === 'n').length, 1);
});

test('storage that throws never crashes the game', () => {
  save.setStorage({ getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); } });
  const d = save.load(); assert.deepEqual(d, save.blank());
  save.setSetting('muted', true); assert.equal(save.isMemoryOnly(), true);
});
