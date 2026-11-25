// Case board: pick the cause, two supporting readings, an optional rule-out, then check.
import { h, announce } from './dom.js';
import { icon } from './icons.js';
import { app, persist, toast, clearToast, applyCaseTheme, soundButton, dropsMeter, readButton } from './core.js';
import { notebookView, entryPlain, entryLabel, entryValueText } from './notebook.js';
import { glossify, resetGloss } from './glossary.js';
import { openDialog } from './dialog.js';
import * as G from '../logic/game.js';
import { modelEvidence } from '../logic/board.js';
import { suspectOrder } from '../logic/shuffle.js';
import { paramInfo } from '../logic/readings.js';
import { sfx } from '../audio/sfx.js';

const STAR_NAMES = ['Solved', 'Evidence', 'Sharp detective'];

export function renderBoard(root) {
  const { c, state } = app;
  resetGloss(); applyCaseTheme(root, c);
  const sel = { cause: null, evidence: [], roSuspect: null, roEntry: null };
  let prevTokens = state.tokens;
  const tokEl = h('div.tb-tokens');
  const top = h('header.topbar', h('button.btn.tb-btn', { type: 'button', id: 'btn-back', onclick: () => { sfx.tap(); app.go('investigate'); } }, h('span.flip', { html: icon('arrow', 22) }), h('span.lbl', 'Back to the map')),
    h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), tokEl, h('div.tb-spacer'), soundButton());

  const status = h('p.check-status', { 'aria-live': 'polite' });
  const checkBtn = h('button.btn.primary.big#check', { type: 'button', onclick: doCheck }, h('span', { html: icon('check', 24) }), 'Check my answer');
  const resultBox = h('div.result', { hidden: true, tabindex: '-1' });

  // step 1: suspect cards (seeded order, built once and updated in place so keyboard focus is never lost)
  const suspects = h('div.suspects', { role: 'radiogroup', 'aria-label': 'Who or what caused it?' });
  const cards = {};
  for (const idx of suspectOrder(c)) {
    const s = c.suspects[idx];
    const input = h('input.sr-radio', { type: 'radio', name: 'cause', value: s.id, id: `sus-${s.id}`, 'data-suspect': s.id, onchange: () => pickCause(s.id) });
    const card = h('article.suspect', { onclick: e => { if (e.target.closest('.gloss') || input.disabled) return; input.checked = true; pickCause(s.id); input.focus(); } }, input,
      h('label', { for: `sus-${s.id}` }, h('span.sus-ico', { html: icon(s.icon, 40) }), h('strong', s.title)), h('p', s.line), h('span.tried-tag', { html: icon('x', 16) + ' Already tried' }));
    cards[s.id] = { card, input }; suspects.append(card);
  }
  glossify(suspects);
  const s1 = h('section.step', h('h2', h('span.step-n', '1'), 'What caused it?'), h('p.step-help', 'Pick the cause you think is most likely. You get one wrong try before the Solved star is lost.'), suspects);
  // step 2: evidence
  const evBox = h('div.ev-box'), evCount = h('span.ev-count');
  const s2 = h('section.step.ev', h('h2', h('span.step-n', '2'), 'Pick 2 readings that show it', evCount), h('p.step-help', 'Choose from your notebook. Readings from the right place and the right day are strongest.'), evBox);
  // step 3: rule-out
  const roChips = h('div.ro-chips', { role: 'radiogroup', 'aria-label': 'Suspect to rule out' }), roBox = h('div.ev-box');
  const s3 = h('section.step.ro', h('h2', h('span.step-n', '3'), 'Optional: rule one out'), h('p.step-help', 'Pick a different suspect, then one reading that shows it is not the cause.'), roChips, roBox);

  const readTxt = () => `Solve the case. ${c.suspects.map(s => `${s.title}. ${s.line}`).join(' ')} Step 2. Pick two readings from your notebook that show the cause. Step 3. Optionally, rule out one other suspect.`;
  const intro = h('div.board-intro', h('h1', 'Solve the case'), h('p.lead', 'Name the cause, then back it up with your readings.'), readButton(readTxt));
  const cols = h('div.board-cols', h('div.col.left', s1), h('div.col.right', s2), h('div.col.low', s3));
  const foot = h('div.board-foot', status, checkBtn);
  root.replaceChildren(top, h('main.board', intro, cols, resultBox, foot));

  function pickCause(id) {
    if (state.wrongList.includes(id)) return;
    sel.cause = id; sfx.tap();
    if (sel.roSuspect === id) { sel.roSuspect = null; sel.roEntry = null; }
    paint();
  }
  const tried = id => state.wrongList.includes(id);
  function syncSuspects() {
    for (const s of c.suspects) {
      const { card, input } = cards[s.id], on = sel.cause === s.id, t = tried(s.id);
      card.classList.toggle('on', on); card.classList.toggle('tried', t);
      input.checked = on; input.disabled = t;
    }
  }
  function paintEvidence() {
    const set = new Set(sel.evidence), focusId = document.activeElement?.closest?.('#ev-list .nb-row')?.dataset.id;
    evBox.id = 'ev-list';
    evBox.replaceChildren(notebookView({ c, state, selectable: true, selected: set, onToggle: e => {
      if (set.has(e.id)) sel.evidence = sel.evidence.filter(i => i !== e.id);
      else if (sel.evidence.length >= 2) { toast('You can only pick 2 readings. Tap one you picked to remove it first.', { kind: 'warn' }); return; }
      else sel.evidence.push(e.id);
      sfx.tap(); paint(); evBox.querySelector(`[data-id="${e.id}"]`)?.focus();
    } }));
    evCount.textContent = `${sel.evidence.length} of 2`;
    if (focusId) evBox.querySelector(`[data-id="${focusId}"]`)?.focus();
  }
  function paintRule() {
    const others = c.suspects.filter(s => s.id !== sel.cause);
    roChips.replaceChildren(h('button.chip' + (sel.roSuspect ? '' : '.on'), { type: 'button', role: 'radio', 'aria-checked': String(!sel.roSuspect), onclick: () => { sel.roSuspect = null; sel.roEntry = null; paint(); } }, 'No rule-out'),
      ...others.map(s => h('button.chip' + (sel.roSuspect === s.id ? '.on' : ''), { type: 'button', role: 'radio', 'aria-checked': String(sel.roSuspect === s.id), 'data-ro': s.id, onclick: () => { sel.roSuspect = s.id; sel.roEntry = null; sfx.tap(); paint(); } }, s.title)));
    roBox.hidden = !sel.roSuspect;
    if (sel.roSuspect) roBox.replaceChildren(notebookView({ c, state, selectable: true, selected: new Set(sel.roEntry ? [sel.roEntry] : []), onToggle: e => { sel.roEntry = sel.roEntry === e.id ? null : e.id; sfx.tap(); paint(); roBox.querySelector(`[data-id="${e.id}"]`)?.focus(); } }));
  }
  function problem() {
    if (!sel.cause) return state.wrongList.length ? 'Pick a different cause (step 1).' : 'Pick what caused it (step 1).';
    if (sel.evidence.length < 2) return `Pick ${2 - sel.evidence.length} more ${sel.evidence.length === 1 ? 'reading' : 'readings'} (step 2).`;
    if (sel.roSuspect && !sel.roEntry) return 'Pick a reading for your rule-out, or choose "No rule-out".';
    return '';
  }
  function paint() {
    tokEl.replaceChildren(dropsMeter(state.tokens, c.budget + G.TOPUP * state.topUps, prevTokens), h('span.tok-n', h('strong', String(state.tokens)), h('span.sr-only', ' tokens left')));
    prevTokens = state.tokens;
    syncSuspects(); paintEvidence(); paintRule();
    const p = problem();
    checkBtn.setAttribute('aria-disabled', String(!!p)); checkBtn.classList.toggle('disabled', !!p);
    status.textContent = p || (state.wrongCauses ? 'Ready. Another wrong cause costs 2 tokens.' : 'Ready. A wrong cause costs 2 tokens, so be sure.');
  }

  function wrongDialog(r) {
    const msg = `The council paid for a check that found nothing.${r.lost ? ` You lost ${r.lost} ${r.lost === 1 ? 'token' : 'tokens'}.` : ''}`;
    const extra = state.wrongCauses === 1 ? 'You can still earn the Solved star if your next try is right.' : 'The Solved star is gone for this case, but you can still close it.';
    const d = openDialog({ title: 'Not this one', cls: 'wrong-dlg', onClose: () => { paint(); document.querySelector('.suspect:not(.tried) input')?.focus(); },
      body: [h('p.res-main', msg), h('p.res-why', r.why), h('p.note', extra)],
      actions: [h('button.btn.ghost', { type: 'button', onclick: () => { d.close(); app.go('investigate'); } }, 'Back to the map to test more'), h('button.btn.primary', { type: 'button', id: 'btn-try', 'data-autofocus': '', onclick: () => d.close() }, 'Try again')] });
    glossify(d.body, { local: true });
    announce(`Not this one. ${msg} ${r.why}`);
  }

  function doCheck() {
    const p = problem();
    if (p) { sfx.wrong(); toast(p, { kind: 'warn' }); return; }
    clearToast();
    const r = G.accuse(state, { cause: sel.cause, evidence: sel.evidence, ruleOut: sel.roSuspect ? { suspect: sel.roSuspect, entry: sel.roEntry } : null });
    persist();
    if (!r.correct) {
      sfx.wrong(); sel.cause = null; sel.roSuspect = null; sel.roEntry = null;
      paint(); wrongDialog(r);
      return;
    }
    sfx.right();
    showRight(r);
    document.getElementById('btn-back')?.remove();
  }

  function starReason(i, r) {
    if (r.stars[i]) return '';
    if (i === 0) return 'Two wrong tries lose this star. Next time, test first, then name the cause.';
    if (i === 1) return r.evidence.mustWhy || 'Your two readings do not both show the cause yet (see below).';
    if (!r.stars[1]) return 'You need the Evidence star first.';
    if (r.topUps > 0) return 'You asked the ranger for more tokens.';
    if (r.wrongCauses > 0) return 'You had a wrong try.';
    return r.ruleOut && !r.ruleOut.valid ? 'Your rule-out reading did not rule that suspect out.' : 'Rule out a different suspect with a reading.';
  }

  function showRight(r) {
    const entryText = e => `${c.sites.find(s => s.id === e.site)?.name}: ${entryLabel(e)}${e.param === 'look' ? '' : ' ' + entryValueText(e)}, Day ${e.day}`;
    const items = r.evidence.items.map(i => h('li.' + (i.valid ? 'ok' : 'weak'), h('span.fb-ico', { html: icon(i.valid ? 'check' : 'warn', 22) }), h('span.fb-body', h('strong', entryText(i.entry)), h('span', i.why))));
    const stars = h('ul.star-line', { 'aria-label': 'Your stars so far' }, STAR_NAMES.map((n, i) => h('li' + (r.stars[i] ? '.on' : '.off'), h('span', { html: icon(r.stars[i] ? 'star' : 'star-empty', 34) }), h('span', h('strong', n), starReason(i, r) ? h('small', starReason(i, r)) : null))));
    const kids = [h('h2', { tabindex: '-1', id: 'res-h' }, r.guessed ? 'Solved after a few guesses' : 'You found the cause!'), h('p.res-main', c.suspects.find(s => s.id === sel.cause).title), stars, h('h3', 'Your evidence'), h('ul.fb', items)];
    if (r.evidence.mustWhy) kids.push(h('p.res-why', r.evidence.mustWhy));
    if (!r.stars[1]) {
      const me = modelEvidence(c, state.entries);
      kids.push(h('h3', 'Strong evidence would be'), h('p.note', 'Any two of these would earn the Evidence star.'), h('ul.fb.model', me.map(m => h('li.' + (m.entry ? 'ok' : 'weak'), h('span.fb-ico', { html: icon(m.entry ? 'check' : 'x', 22) }),
        h('span.fb-body', h('strong', `${c.sites.find(s => s.id === m.rule.site)?.name}: ${paramInfo(m.rule.param).label}${m.rule.minDay ? ` (Day ${m.rule.minDay} or later)` : ''}`), h('span', m.why), m.entry ? null : h('em', "You didn't test this."))))));
    }
    if (r.ruleOut) { const re = state.entries.find(e => e.id === sel.roEntry); kids.push(h('h3', 'Your rule-out'), h('ul.fb', h('li.' + (r.ruleOut.valid ? 'ok' : 'weak'), h('span.fb-ico', { html: icon(r.ruleOut.valid ? 'check' : 'warn', 22) }), h('span.fb-body', h('strong', entryText(re)), h('span', r.ruleOut.why))))); }
    kids.push(h('button.btn.primary.big#btn-continue', { type: 'button', onclick: () => { sfx.tap(); app.go('wrapup'); } }, 'Continue', h('span', { html: icon('arrow', 24) })));
    resultBox.hidden = false; resultBox.className = 'result good';
    resultBox.replaceChildren(...kids);
    glossify(resultBox);
    announce(`${r.guessed ? 'Solved after a few guesses' : 'You found the cause'}. You have ${r.stars.filter(Boolean).length} of 3 stars so far. Read your feedback, then continue.`);
    foot.hidden = true; cols.hidden = true; intro.hidden = true;
    window.scrollTo(0, 0);
    document.getElementById('res-h')?.focus();
  }

  paint();
  return () => {};
}
