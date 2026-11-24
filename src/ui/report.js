// Report card: all three cases with stars and completed sentences. Printable on one A4 page.
import { h, announce } from './dom.js';
import { icon } from './icons.js';
import { app, toast, soundButton, todayText } from './core.js';
import * as save from '../state/save.js';
import { CASES } from '../data/cases.js';
import { sfx } from '../audio/sfx.js';

export function reportText() {
  const d = save.get();
  const lines = [`Water Detective report card`, `Name: ${d.name || '________'}`, `Date: ${todayText()}`, ''];
  for (const c of CASES) {
    const r = d.cases[c.id], n = r ? r.stars.filter(Boolean).length : 0;
    lines.push(`Case ${c.num}: ${c.title} (${c.moduleName}): ${r ? `${n} of 3 stars` : 'not done yet'}`);
    if (r?.sentence) lines.push(`  ${r.sentence}`);
  }
  lines.push('', 'You tested water like a real water scientist.');
  return lines.join('\n');
}

export function renderReport(root) {
  const d = save.get();
  const name = h('input#rc-name', { type: 'text', maxlength: '40', placeholder: 'Type your name', value: d.name, 'aria-label': 'Your name', oninput: e => { save.setName(e.target.value); nameOut.textContent = e.target.value || '________________'; } });
  const nameOut = h('span.print-name', d.name || '________________');
  const rows = CASES.map(c => {
    const r = d.cases[c.id], st = r?.stars || [false, false, false];
    return h('article.rc-case' + (r ? '' : '.todo'), { style: { '--ink': c.accent.ink, '--bg': c.accent.bg, '--pop': c.accent.pop } },
      h('div.rc-head', h('span.rc-mod', c.module), h('h2', `Case ${c.num}: ${c.title}`), h('span.rc-stars', { role: 'img', 'aria-label': `${st.filter(Boolean).length} of 3 stars` }, st.map(b => h('span', { html: icon(b ? 'star' : 'star-empty', 34) })))),
      h('p.rc-place', `${c.moduleName} · ${c.place}`),
      r ? h('p.rc-sentence', r.sentence) : h('p.rc-sentence.none', 'Not done yet.'));
  });
  const sheet = h('section.report-sheet', h('div.rc-title', h('h1', 'Water Detective'), h('p', 'Report card')), h('div.rc-who', h('label', 'Name ', name, nameOut), h('span.rc-date', todayText())), h('div.rc-list', rows), h('p.rc-line', 'You tested water like a real water scientist.'));
  const actions = h('div.rc-actions',
    h('button.btn.primary', { type: 'button', id: 'btn-print', onclick: () => { sfx.tap(); window.print(); } }, h('span', { html: icon('print', 22) }), 'Print'),
    h('button.btn.ghost', { type: 'button', id: 'btn-copy', onclick: async () => { try { await navigator.clipboard.writeText(reportText()); toast('Report card copied.'); } catch { toast('Could not copy. Try Print instead.', { kind: 'warn' }); } } }, h('span', { html: icon('copy', 22) }), 'Copy'),
    h('button.btn.ghost', { type: 'button', id: 'btn-home', onclick: () => app.go('title') }, h('span', { html: icon('home', 22) }), 'Title screen'));
  root.replaceChildren(h('header.topbar.noprint', h('div.tb-title', h('span.tb-name', 'Report card')), h('div.tb-spacer'), soundButton()), h('main.report', sheet, actions));
}
