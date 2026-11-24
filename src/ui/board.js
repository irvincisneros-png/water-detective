// Case board: pick the cause, two supporting readings, an optional rule-out, then check.
import { h, announce } from './dom.js';
import { icon } from './icons.js';
import { app, persist, toast, applyCaseTheme, soundButton, dropsMeter, readButton } from './core.js';
import { notebookView, entryPlain, entryLabel, entryValueText } from './notebook.js';
import { glossify, resetGloss } from './glossary.js';
import * as G from '../logic/game.js';
import { WRONG_COST } from '../logic/game.js';
import { sfx } from '../audio/sfx.js';

export function renderBoard(root) {
  const { c, state } = app;
  resetGloss(); applyCaseTheme(root, c);
  const sel = { cause: null, evidence: [], roSuspect: null, roEntry: null };
  let prevTokens = state.tokens, result = null;
  const tokEl = h('div.tb-tokens');
  const top = h('header.topbar', h('button.btn.tb-btn', { type: 'button', id: 'btn-back', onclick: () => { sfx.tap(); app.go('investigate'); } }, h('span.flip', { html: icon('arrow', 22) }), h('span.lbl', 'Back to the map')),
    h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), tokEl, h('div.tb-spacer'), soundButton());

  const status = h('p.check-status', { 'aria-live': 'polite' });
  const checkBtn = h('button.btn.primary.big#check', { type: 'button', onclick: doCheck }, h('span', { html: icon('check', 24) }), 'Check my answer');
  const resultBox = h('div.result', { hidden: true, 'aria-live': 'polite' });

  // step 1
  const suspects = h('div.suspects', { role: 'radiogroup', 'aria-label': 'Who or what caused it?' });
  const s1 = h('section.step', h('h2', h('span.step-n', '1'), 'What caused it?'), h('p.step-help', 'Pick the cause you think is most likely.'), suspects);
  // step 2
  const evBox = h('div.ev-box'), evCount = h('span.ev-count');
  const s2 = h('section.step.ev', h('h2', h('span.step-n', '2'), 'Pick 2 readings that show it', evCount), h('p.step-help', 'Choose from your notebook. Readings from the right place and the right day are strongest.'), evBox);
  // step 3
  const roChips = h('div.ro-chips', { role: 'radiogroup', 'aria-label': 'Suspect to rule out' });
  const roSelect = h('select#ro-reading', { 'aria-label': 'A reading that rules it out', onchange: e => { sel.roEntry = e.target.value || null; paint(); } });
  const s3 = h('section.step.ro', h('h2', h('span.step-n', '3'), 'Optional: rule one out'), h('p.step-help', 'Pick a different suspect, then one reading that shows it is not the cause.'), roChips, h('label.ro-pick', h('span', 'The reading that rules it out'), roSelect));

  const readTxt = () => `Solve the case. ${s1.querySelector('h2').textContent}. ${c.suspects.map(s => `${s.title}. ${s.line}`).join(' ')} Step 2. Pick two readings from your notebook that show the cause. Step 3. Optionally, rule out one other suspect.`;
  const intro = h('div.board-intro', h('p.lead', 'Name the cause, then back it up with your readings.'), readButton(readTxt));
  const cols = h('div.board-cols', h('div.col.left', s1, s3), h('div.col.right', s2));
  const foot = h('div.board-foot', status, checkBtn);
  root.replaceChildren(top, h('main.board', intro, cols, resultBox, foot));

  function paintSuspects() {
    suspects.replaceChildren(...c.suspects.map(s => {
      const on = sel.cause === s.id;
      const input = h('input.sr-radio', { type: 'radio', name: 'cause', value: s.id, id: `sus-${s.id}`, checked: on, 'data-suspect': s.id, onchange: () => pickCause(s.id) });
      return h('article.suspect' + (on ? '.on' : ''), { onclick: e => { if (e.target.closest('.gloss')) return; input.checked = true; pickCause(s.id); input.focus(); } }, input,
        h('label', { for: `sus-${s.id}` }, h('span.sus-ico', { html: icon(s.icon, 40) }), h('strong', s.title)), h('p', s.line));
    }));
    glossify(suspects);
  }
  function pickCause(id) { sel.cause = id; sfx.tap(); if (sel.roSuspect === id) { sel.roSuspect = null; sel.roEntry = null; } result = null; resultBox.hidden = true; paint(); }
  function paintEvidence() {
    const set = new Set(sel.evidence);
    evBox.replaceChildren(notebookView({ c, state, selectable: true, selected: set, onToggle: e => {
      if (set.has(e.id)) sel.evidence = sel.evidence.filter(i => i !== e.id);
      else if (sel.evidence.length >= 2) { toast('You can only pick 2 readings. Tap one you picked to remove it first.', { kind: 'warn' }); return; }
      else sel.evidence.push(e.id);
      sfx.tap(); paint(); const row = evBox.querySelector(`[data-id="${e.id}"]`); row?.focus();
    } }));
    evCount.textContent = `${sel.evidence.length} of 2`;
  }
  function paintRule() {
    const others = c.suspects.filter(s => s.id !== sel.cause);
    roChips.replaceChildren(h('button.chip' + (sel.roSuspect ? '' : '.on'), { type: 'button', role: 'radio', 'aria-checked': String(!sel.roSuspect), onclick: () => { sel.roSuspect = null; sel.roEntry = null; paint(); } }, 'No rule-out'),
      ...others.map(s => h('button.chip' + (sel.roSuspect === s.id ? '.on' : ''), { type: 'button', role: 'radio', 'aria-checked': String(sel.roSuspect === s.id), 'data-ro': s.id, onclick: () => { sel.roSuspect = s.id; sel.roEntry = null; sfx.tap(); paint(); } }, s.title)));
    s3.querySelector('.ro-pick').hidden = !sel.roSuspect;
    roSelect.replaceChildren(h('option', { value: '' }, 'Choose a reading…'), ...state.entries.map(e => h('option', { value: e.id, selected: sel.roEntry === e.id }, entryPlain(c, e))));
    roSelect.value = sel.roEntry || '';
  }
  function problem() {
    if (!sel.cause) return 'Pick what caused it (step 1).';
    if (sel.evidence.length < 2) return `Pick ${2 - sel.evidence.length} more ${sel.evidence.length === 1 ? 'reading' : 'readings'} (step 2).`;
    if (sel.roSuspect && !sel.roEntry) return 'Pick a reading for your rule-out, or choose "No rule-out".';
    return '';
  }
  function paint() {
    tokEl.replaceChildren(dropsMeter(state.tokens, c.budget + G.TOPUP * state.topUps, prevTokens), h('span.tok-n', h('strong', state.tokens), h('span.sr-only', ' tokens left')));
    prevTokens = state.tokens;
    paintSuspects(); paintEvidence(); paintRule();
    const p = problem();
    checkBtn.setAttribute('aria-disabled', String(!!p)); checkBtn.classList.toggle('disabled', !!p);
    status.textContent = p || 'Ready. A wrong cause costs 2 tokens, so be sure.';
  }

  function doCheck() {
    const p = problem();
    if (p) { sfx.wrong(); toast(p, { kind: 'warn' }); return; }
    const r = G.accuse(state, { cause: sel.cause, evidence: sel.evidence, ruleOut: sel.roSuspect ? { suspect: sel.roSuspect, entry: sel.roEntry } : null });
    persist();
    if (!r.correct) {
      sfx.wrong();
      const msg = `The council paid for a check that found nothing.${r.lost ? ` You lost ${r.lost} ${r.lost === 1 ? 'token' : 'tokens'}.` : ''}`;
      resultBox.hidden = false; resultBox.className = 'result bad';
      resultBox.replaceChildren(h('h2', 'Not this one'), h('p.res-main', msg), h('p.res-why', r.why), h('button.btn.primary', { type: 'button', id: 'btn-try', onclick: () => { sel.cause = null; resultBox.hidden = true; paint(); document.querySelector('.suspect input')?.focus(); } }, 'Try again'));
      announce(`Not this one. ${msg} ${r.why}`);
      glossify(resultBox);
      paint(); resultBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    sfx.right();
    resultBox.hidden = false; resultBox.className = 'result good';
    const items = r.evidence.items.map(i => h('li.' + (i.valid ? 'ok' : 'weak'), h('span.fb-ico', { html: icon(i.valid ? 'check' : 'warn', 22) }), h('span.fb-body', h('strong', `${entryLabelFull(i.entry)}`), h('span', i.why))));
    const kids = [h('h2', 'You found the cause!'), h('p.res-main', c.suspects.find(s => s.id === sel.cause).title), h('h3', 'Your evidence'), h('ul.fb', items)];
    if (r.evidence.mustWhy) kids.push(h('p.res-why', r.evidence.mustWhy));
    if (r.ruleOut) kids.push(h('h3', 'Your rule-out'), h('ul.fb', h('li.' + (r.ruleOut.valid ? 'ok' : 'weak'), h('span.fb-ico', { html: icon(r.ruleOut.valid ? 'check' : 'warn', 22) }), h('span.fb-body', h('strong', entryLabelFull(state.entries.find(e => e.id === sel.roEntry))), h('span', r.ruleOut.why)))));
    kids.push(h('button.btn.primary.big#btn-continue', { type: 'button', onclick: () => { sfx.tap(); app.go('wrapup'); } }, 'Continue', h('span', { html: icon('arrow', 24) })));
    resultBox.replaceChildren(...kids);
    glossify(resultBox);
    announce('You found the cause! Read your feedback, then continue.');
    foot.hidden = true; cols.classList.add('locked'); intro.hidden = true;
    resultBox.scrollIntoView({ block: 'start' });
    document.getElementById('btn-continue')?.focus();
  }
  const entryLabelFull = e => `${c.sites.find(s => s.id === e.site)?.name}: ${entryLabel(e)}${e.param === 'look' ? '' : ' ' + entryValueText(e)}, Day ${e.day}`;

  paint();
  return () => {};
}
