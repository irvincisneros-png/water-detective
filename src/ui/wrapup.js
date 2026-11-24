// Wrap-up sentence frame (word chips), then the results screen: stars, finished sentence, real-place card.
import { h, announce, reduced, sleep } from './dom.js';
import { icon } from './icons.js';
import { app, persist, toast, applyCaseTheme, soundButton, readButton, isoDay } from './core.js';
import { glossify, resetGloss } from './glossary.js';
import { notebookView } from './notebook.js';
import * as G from '../logic/game.js';
import * as save from '../state/save.js';
import { CASES } from '../data/cases.js';
import { wrapOrders } from '../logic/shuffle.js';
import { sfx } from '../audio/sfx.js';

export function renderWrapup(root) {
  const { c, state } = app;
  resetGloss(); applyCaseTheme(root, c);
  const orders = wrapOrders(c);
  let active = state.wrap.findIndex(x => x === null); if (active < 0) active = 0;
  const hint = h('p.chip-hint', { 'aria-live': 'polite' }), tray = h('div.chip-tray', { role: 'group', 'aria-label': 'Word chips' }), frame = h('p.frame');
  const finish = h('button.btn.primary.big#btn-finish', { type: 'button', hidden: true, onclick: done }, 'See my stars', h('span', { html: icon('arrow', 24) }));
  const top = h('header.topbar', h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), h('div.tb-spacer'), soundButton());
  const readTxt = () => `Finish the story. ${G.sentence(c, state.wrap).replace(/____/g, 'blank')}`;
  root.replaceChildren(top, h('main.wrap', h('h1', 'Tell the story'), h('p.lead', 'Fill the blanks to explain what happened. Tap a blank, then tap the word that fits.'), readButton(readTxt), h('div.paper', frame), hint, tray, finish));

  function paintFrame() {
    const parts = c.frame.text.split(/\{(\d+)\}/);
    frame.replaceChildren(...parts.map((p, i) => {
      if (i % 2 === 0) return p;
      const b = +p, val = state.wrap[b];
      return h('button.blank' + (val !== null ? '.filled' : '') + (active === b ? '.active' : ''), { type: 'button', 'data-blank': b, 'aria-label': val !== null ? `Blank ${b + 1}: ${c.frame.blanks[b].options[val]}` : `Blank ${b + 1}, empty`, onclick: () => { if (val === null) { active = b; paint(); tray.querySelector('.wchip')?.focus(); } } }, val !== null ? c.frame.blanks[b].options[val] : 'tap here');
    }));
    glossify(frame);
  }
  function paintTray() {
    const b = c.frame.blanks[active];
    if (state.wrap.every(x => x !== null)) { tray.replaceChildren(); return; }
    tray.replaceChildren(h('span.tray-label', `Blank ${active + 1} of ${c.frame.blanks.length}`), ...orders[active].map(i => h('button.wchip', { type: 'button', 'data-chip': b.options[i], onclick: e => choose(i, e.currentTarget) }, b.options[i])));
  }
  function choose(i, el) {
    const r = G.placeChip(state, active, i);
    if (!r.correct) {
      sfx.wrong(); el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
      hint.textContent = `Not quite. ${r.hint}`; announce(hint.textContent); return;
    }
    sfx.right(); hint.textContent = ''; persist();
    const next = state.wrap.findIndex(x => x === null);
    if (next >= 0) active = next;
    paint();
    if (r.complete) { announce('Story finished. Press See my stars.'); finish.hidden = false; finish.focus(); }
    else tray.querySelector('.wchip')?.focus();
  }
  function done() {
    const r = G.finishWrap(state);
    if (!r) return;
    const merged = save.recordResult(c.id, r.stars, r.sentence, isoDay());
    app.finished = { state: JSON.parse(JSON.stringify(state)), stars: r.stars, sentence: r.sentence, best: merged };
    app.go('results');
  }
  function paint() { paintFrame(); paintTray(); finish.hidden = !state.wrap.every(x => x !== null); }
  paint();
  if (!finish.hidden) finish.focus();
}

const STAR_INFO = [
  { name: 'Solved', ok: 'You named the right cause with at most one wrong try.' },
  { name: 'Evidence', ok: 'Both readings back up your cause.' },
  { name: 'Sharp detective', ok: 'Strong evidence, a rule-out, no extra tokens and no wrong tries.' },
];
function missingWhy(c, st, i) {
  const s = st.state;
  if (i === 0) return 'You named the wrong cause more than once. Test first, then name the cause.';
  if (i === 1) return 'Pick two readings from the right place and the right day. ' + (c.evidence.mustIncludeWhy || '');
  if (!st.stars[1]) return 'You need the Evidence star first.';
  if (s.topUps > 0) return 'You asked the ranger for more tokens.';
  if (s.wrongCauses > 0) return 'You had a wrong try.';
  return s.solved.ruleOut ? 'Your rule-out reading did not rule that suspect out.' : 'Rule out a different suspect with a reading.';
}

export function renderResults(root) {
  const st = app.finished, c = app.c;
  resetGloss(); applyCaseTheme(root, c);
  const stars = st.stars;
  const slots = STAR_INFO.map((s, i) => h('li.star-slot' + (stars[i] ? '.earned' : '.missed'), h('span.star-ico', { html: icon(stars[i] ? 'star' : 'star-empty', 78) }), h('strong', s.name), h('span.star-why', stars[i] ? s.ok : missingWhy(c, st, i))));
  const count = stars.filter(Boolean).length;
  const next = CASES.find(x => x.num === c.num + 1);
  const nb = h('details.nb-flags', h('summary', 'See your notebook with the guide flags'), notebookView({ c, state: { ...st.state, unseen: 0 }, flags: true }));
  const body = h('main.results',
    h('h1', !stars[0] ? 'Solved after a few guesses' : count === 3 ? 'Case closed. Full marks!' : 'Case closed!'),
    h('p.tokens-left', `Tokens left: ${st.state.tokens}${st.state.tokens === 1 ? '' : ''}${st.state.topUps ? ` (you asked the ranger for ${st.state.topUps * 3} more)` : ''}. Wrong tries: ${st.state.wrongCauses}.`),
    h('ul.stars', { 'aria-label': `${count} of 3 stars` }, slots),
    h('div.paper.story', h('h2', 'Your story'), h('p', st.sentence)),
    h('div.paper.real', h('h2', 'In the real world'), h('p', c.real.text), h('a.btn.ghost', { href: c.real.url, target: '_blank', rel: 'noopener' }, c.real.linkText, h('span', { html: icon('arrow', 20) }))),
    nb,
    h('div.res-actions', next ? h('button.btn.primary.big#btn-next', { type: 'button', onclick: () => { app.go('call', next.id); } }, `Next case: ${next.title}`, h('span', { html: icon('arrow', 24) })) : null,
      h('button.btn' + (next ? '.ghost' : '.primary.big'), { type: 'button', id: 'btn-report', onclick: () => app.go('report') }, 'Report card'),
      h('button.btn.ghost', { type: 'button', onclick: () => app.go('call', c.id) }, 'Play this case again'),
      h('button.btn.ghost', { type: 'button', onclick: () => app.go('title') }, h('span', { html: icon('home', 22) }), 'Title screen')));
  root.replaceChildren(h('header.topbar', h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), h('div.tb-spacer'), soundButton()), body);
  glossify(body.querySelector('.story'));
  announce(`Case closed. You earned ${count} of 3 stars.`);
  // stamp the stars one at a time
  const els = [...body.querySelectorAll('.star-slot')];
  if (reduced()) els.forEach(e => e.classList.add('stamped'));
  else els.forEach((e, i) => setTimeout(() => { e.classList.add('stamped'); if (stars[i]) { sfx.stamp(); sfx.star(i); } else sfx.tap(); }, 350 + i * 650));
  body.querySelector('#btn-next, #btn-report')?.setAttribute('data-autofocus', '');
}
