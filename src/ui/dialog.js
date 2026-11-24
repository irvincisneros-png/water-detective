// Accessible modal dialogs: focus trap, Escape to close, focus returns to the opener.
import { h } from './dom.js';
import { icon } from './icons.js';
import { sfx } from '../audio/sfx.js';

const stack = [];
export function openDialog({ title, body, actions = [], onClose, wide = false, cls = '', closeLabel = 'Close', noClose = false, label } = {}) {
  const opener = document.activeElement;
  const titleId = 'dlg-t' + Math.random().toString(36).slice(2, 7);
  const panel = h('div.dlg-panel', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': title ? titleId : null, 'aria-label': title ? null : label, tabindex: '-1' });
  if (title || !noClose) {
    panel.append(h('div.dlg-head',
      title ? h('h2', { id: titleId }, title) : h('span'),
      noClose ? null : h('button.btn.icon-btn.dlg-x', { type: 'button', 'aria-label': closeLabel, onclick: () => api.close() }, h('span', { html: icon('close', 22) }))));
  }
  const bodyEl = h('div.dlg-body', body);
  panel.append(bodyEl);
  if (actions.length) panel.append(h('div.dlg-actions', actions));
  const back = h('div.dlg' + (wide ? '.wide' : '') + (cls ? '.' + cls.split(' ').join('.') : ''), { onpointerdown: e => { if (e.target === back && !noClose) api.close(); } }, panel);
  document.body.append(back);
  document.body.classList.add('has-dialog');
  const prevInert = [...document.querySelectorAll('#app, #topchrome')];
  prevInert.forEach(n => n.setAttribute('aria-hidden', 'true'));
  const onKey = e => {
    if (stack[stack.length - 1] !== api) return;
    if (e.key === 'Escape' && !noClose) { e.preventDefault(); api.close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(n => n.offsetParent !== null);
    if (!f.length) { e.preventDefault(); panel.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  let closed = false;
  const api = {
    el: back, panel, body: bodyEl,
    close(result) {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey, true);
      back.remove();
      const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
      if (!stack.length) { document.body.classList.remove('has-dialog'); prevInert.forEach(n => n.removeAttribute('aria-hidden')); }
      try { if (opener && document.contains(opener)) opener.focus(); } catch { /* ignore */ }
      onClose?.(result);
    },
  };
  stack.push(api);
  const auto = panel.querySelector('[data-autofocus]') || panel.querySelector('.dlg-actions .btn.primary') || panel;
  requestAnimationFrame(() => auto.focus({ preventScroll: true }));
  return api;
}
export const dialogOpen = () => stack.length > 0;
export function closeAllDialogs() { [...stack].reverse().forEach(d => d.close()); }

export function confirmDialog({ title, text, yes = 'Yes', no = 'Cancel', danger = false }) {
  return new Promise(res => {
    const d = openDialog({
      title, body: h('p.lead', text), onClose: r => res(r === true),
      actions: [h('button.btn.ghost', { type: 'button', onclick: () => d.close(false) }, no), h('button.btn.primary' + (danger ? '.danger' : ''), { type: 'button', onclick: () => { sfx.tap(); d.close(true); } }, yes)],
    });
  });
}
