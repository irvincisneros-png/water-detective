// Shared app context and small UI pieces used by several screens.
import * as save from '../state/save.js';
import { sfx, setMuted, isMuted } from '../audio/sfx.js';
import { h, announce } from './dom.js';
import { icon } from './icons.js';
import { speak, stop, supported } from './speech.js';

export const app = { c: null, state: null, go: () => {}, root: null };

export function persist() { if (app.state) save.saveProgress(app.state); }

let toastTimer = 0;
export function toast(text, { kind = '', ms = 3400 } = {}) {
  let t = document.getElementById('toast');
  if (!t) { t = h('div#toast', { role: 'status' }); document.body.append(t); }
  t.className = 'show ' + kind; t.textContent = text;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function clearToast() { clearTimeout(toastTimer); document.getElementById('toast')?.classList.remove('show'); }

export function applyCaseTheme(el, c) {
  const a = c?.accent || { ink: '#1F4E52', bg: '#CDEBE6', pop: '#F2A07F', pop2: '#E8775A' };
  el.style.setProperty('--ink', a.ink); el.style.setProperty('--bg', a.bg); el.style.setProperty('--pop', a.pop); el.style.setProperty('--pop2', a.pop2);
}

export function soundButton() {
  const b = h('button.btn.icon-btn.snd', { type: 'button', 'data-testid': 'sound', onclick: () => { const m = !isMuted(); setMuted(m); save.setSetting('muted', m); paint(); if (!m) sfx.tap(); } });
  function paint() { const m = isMuted(); b.innerHTML = icon(m ? 'sound-off' : 'sound-on', 24); b.setAttribute('aria-label', m ? 'Sound is off. Turn sound on' : 'Sound is on. Turn sound off'); b.setAttribute('aria-pressed', String(!m)); b.title = m ? 'Sound off' : 'Sound on'; }
  paint(); b.addEventListener('repaint', paint);
  return b;
}

// Read-aloud button: hidden when the browser has no speech or the student turned read-aloud off.
export function readButton(getText, { label = 'Read aloud' } = {}) {
  if (!supported() || !save.get().settings.readAloud) return null;
  let on = false;
  const b = h('button.btn.ghost.read', { type: 'button', onclick: () => { if (on) { stop(); on = false; paint(); return; } on = true; paint(); speak(getText(), () => { on = false; paint(); }); } });
  function paint() { b.replaceChildren(h('span', { html: icon('speak', 22) }), on ? 'Stop reading' : label); }
  paint();
  return b;
}

export function dropsMeter(tokens, total, prev) {
  const wrap = h('div.drops', { role: 'img', 'aria-label': `${tokens} test ${tokens === 1 ? 'token' : 'tokens'} left` });
  for (let i = 0; i < total; i++) {
    const full = i < tokens;
    const d = h('span.drop' + (full ? '.full' : '.empty'), { html: icon('drop', 22) });
    if (!full && prev != null && i < prev) d.classList.add('spent');
    if (full && prev != null && i >= prev) d.classList.add('gain');
    wrap.append(d);
  }
  return wrap;
}

export const todayText = () => new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
export const isoDay = () => new Date().toISOString().slice(0, 10);
export { announce };
