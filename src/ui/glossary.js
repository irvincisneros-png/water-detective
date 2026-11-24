// Glossary links: the first time a science word appears in a block it becomes a small button that opens its meaning.
import { GLOSSARY } from '../data/glossary.js';
import { h } from './dom.js';
import { icon } from './icons.js';
import { openDialog } from './dialog.js';
import { speak, stop, supported } from './speech.js';
import * as save from '../state/save.js';

const variants = t => {
  const base = t.term;
  const out = [base];
  if (/s$/i.test(base) && !/^(ph|bod)$/i.test(base)) out.push(base.slice(0, -1));
  return out;
};
const MAP = new Map();   // lowercase variant -> glossary entry
for (const g of GLOSSARY) for (const v of variants(g)) MAP.set(v.toLowerCase(), g);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp(`(?<![\\w-])(${[...MAP.keys()].sort((a, b) => b.length - a.length).map(esc).join('|')})(?![\\w-])`, 'gi');

let seen = new Set();
export const resetGloss = () => { seen = new Set(); };

export function showTerm(term) {
  const g = GLOSSARY.find(x => x.term.toLowerCase() === term.toLowerCase());
  if (!g) return null;
  const d = openDialog({
    title: g.term, cls: 'small',
    body: [h('p.lead', g.text), supported() && save.get().settings.readAloud ? h('button.btn.ghost.read', { type: 'button', onclick: () => speak(`${g.term}. ${g.text}`) }, h('span', { html: icon('speak', 22) }), 'Read aloud') : null],
    onClose: () => stop(),
    actions: [h('button.btn.primary', { type: 'button', onclick: () => d.close() }, 'Got it')],
  });
  return d;
}

// Walk the text nodes inside `root`; wrap the first appearance of each term (once per screen) in a button.
export function glossify(root, { local = false } = {}) {
  const seenSet = local ? new Set() : seen;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let p = n.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        if (['BUTTON', 'A', 'SVG', 'TEXTAREA', 'INPUT', 'SELECT', 'H1', 'LABEL'].includes(p.tagName.toUpperCase()) || p.classList?.contains('no-gloss')) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    const text = n.nodeValue; RE.lastIndex = 0;
    let last = 0, m, frag = null;
    while ((m = RE.exec(text))) {
      const g = MAP.get(m[1].toLowerCase()); if (!g || seenSet.has(g.term)) continue;
      seenSet.add(g.term);
      frag ??= document.createDocumentFragment();
      frag.append(text.slice(last, m.index));
      const b = h('button.gloss', { type: 'button', 'aria-label': `${m[1]}: what does this mean?`, onclick: e => { e.stopPropagation(); showTerm(g.term); } }, m[1]);
      frag.append(b); last = m.index + m[1].length;
    }
    if (frag) { frag.append(text.slice(last)); n.replaceWith(frag); }
  }
  return root;
}

export function openGlossary() {
  const rows = GLOSSARY.map(g => h('div.gl-row', h('h3', g.term), h('p', g.text)));
  const all = GLOSSARY.map(g => `${g.term}. ${g.text}`).join(' ');
  const d = openDialog({
    title: 'Science words', wide: true,
    body: [supported() && save.get().settings.readAloud ? h('button.btn.ghost.read', { type: 'button', onclick: () => speak(all) }, h('span', { html: icon('speak', 22) }), 'Read all aloud') : null, h('div.gl-list', rows)],
    onClose: () => stop(),
  });
  return d;
}
