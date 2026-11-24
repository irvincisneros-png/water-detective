// Field notebook: readings grouped by site. Also used (selectable) on the case board.
import { h } from './dom.js';
import { icon, toolIcon } from './icons.js';
import { paramInfo, formatValue } from '../logic/readings.js';
import { guideFlag } from '../data/guide.js';

const paramIcon = p => (p === 'n' || p === 'p') ? 'flask' : toolIcon(p) || 'book';
const unitOf = e => paramInfo(e.param).unit;

export function entryLabel(e) { return e.param === 'look' ? 'Look' : paramInfo(e.param).label; }
export function entryValueText(e) {
  if (e.param === 'look') return e.value;
  const u = unitOf(e), v = typeof e.value === 'number' ? formatValue(e.param, e.value) : e.value;
  return u ? `${v} ${u}` : String(v);
}
export const entryPlain = (c, e) => `${c.sites.find(s => s.id === e.site)?.name ?? e.site}, ${entryLabel(e)}${e.param === 'look' ? '' : ' ' + entryValueText(e)}, Day ${e.day}`;

export function notebookView({ c, state, selectable = false, selected = new Set(), onToggle, flags = false, max = 99 }) {
  const root = h('div.nb' + (selectable ? '.selectable' : ''));
  const newIds = new Set(state.entries.slice(Math.max(0, state.entries.length - state.unseen)).map(e => e.id));
  if (!state.entries.length) root.append(h('p.nb-empty', 'No readings yet. Tap a site on the map, then use Look or a tool.'));
  for (const s of c.sites) {
    const list = state.entries.filter(e => e.site === s.id).sort((a, b) => a.day - b.day || (a.param === 'look' ? -1 : 0) - (b.param === 'look' ? -1 : 0));
    if (!list.length) continue;
    const group = h('section.nb-group', { 'aria-label': `Site ${s.id}, ${s.name}` }, h('h3', h('span.nb-letter', s.id), s.name));
    for (const e of list) {
      const isLook = e.param === 'look';
      const fl = flags && !isLook ? guideFlag(s.water, e) : null;
      const sub = e.param === 'bod' ? h('span.nb-sub', `Oxygen on Day ${e.day}: ${e.doNow.toFixed(1)} mg/L. Oxygen after 5 days: ${e.doAfter.toFixed(1)} mg/L. BOD = ${e.doNow.toFixed(1)} − ${e.doAfter.toFixed(1)} = ${e.value.toFixed(1)} mg/L.`) : null;
      const kids = [
        h('span.nb-ico', { html: icon(isLook ? 'eye' : paramIcon(e.param), 24) }),
        isLook
          ? h('span.nb-body', h('span.nb-label', 'Look'), h('span.nb-look', e.value))
          : h('span.nb-body', h('span.nb-label', entryLabel(e)), h('span.nb-val', entryValueText(e)), sub),
        h('span.nb-meta', h('span.nb-day', `Day ${e.day}`), newIds.has(e.id) && !selectable ? h('span.nb-new', 'New') : null, fl ? h('span.nb-flag.' + fl.flag, fl.text) : null),
      ];
      if (selectable) {
        const on = selected.has(e.id);
        const row = h('button.nb-row', { type: 'button', role: 'checkbox', 'aria-checked': String(on), 'data-id': e.id, class: on ? 'on' : '', onclick: () => onToggle?.(e) }, ...kids, h('span.nb-check', { html: icon('check', 18) }));
        group.append(row);
      } else group.append(h('div.nb-row' + (newIds.has(e.id) ? '.fresh' : ''), { 'data-id': e.id }, ...kids));
    }
    root.append(group);
  }
  return root;
}
