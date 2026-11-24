// Menu dialog: science words, sound, read-aloud, restart, back to title, teacher guide.
import { h } from './dom.js';
import { icon } from './icons.js';
import { app } from './core.js';
import { openDialog, confirmDialog, closeAllDialogs } from './dialog.js';
import { openGlossary } from './glossary.js';
import { sfx, isMuted, setMuted } from '../audio/sfx.js';
import { supported, stop } from './speech.js';
import * as save from '../state/save.js';

export function toggleRow(label, getOn, set) {
  const b = h('button.toggle', { type: 'button', role: 'switch', onclick: () => { set(!getOn()); paint(); sfx.tap(); } });
  function paint() { b.setAttribute('aria-checked', String(getOn())); b.replaceChildren(h('span.tg-label', label), h('span.tg-pill', h('span.tg-knob')), h('span.tg-state', getOn() ? 'On' : 'Off')); }
  paint();
  return b;
}

export function openMenu({ inGame = false } = {}) {
  const d = openDialog({
    title: 'Menu', cls: 'small',
    body: h('div.menu',
      h('button.btn.ghost.wide', { type: 'button', onclick: () => { d.close(); openGlossary(); } }, h('span', { html: icon('book', 22) }), 'Science words'),
      toggleRow('Sound', () => !isMuted(), v => { setMuted(!v); save.setSetting('muted', !v); document.querySelectorAll('.snd').forEach(b => b.dispatchEvent(new Event('repaint'))); }),
      supported() ? toggleRow('Read-aloud buttons', () => save.get().settings.readAloud, v => { save.setSetting('readAloud', v); if (!v) stop(); }) : null,
      h('a.btn.ghost.wide', { href: 'teacher.html', target: '_blank', rel: 'noopener' }, 'Teacher guide'),
      inGame ? h('button.btn.ghost.wide', { type: 'button', onclick: async () => { d.close(); if (await confirmDialog({ title: 'Start this case again?', text: 'Your readings and tokens for this case will be cleared.', yes: 'Start again', danger: true })) app.go('restart'); } }, 'Start this case again') : null,
      inGame ? h('button.btn.primary.wide', { type: 'button', onclick: () => { d.close(); app.go('title'); } }, h('span', { html: icon('home', 22) }), 'Back to the title screen (saved)') : null),
  });
  return d;
}
