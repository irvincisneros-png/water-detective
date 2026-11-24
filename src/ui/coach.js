// First-time coach marks for case 1: anchored bubbles with an arrow, pointing at what to press.
// STEPS is pure data plus predicates (unit-tested); createCoach() is the DOM layer.
// ctx = { site, looked, tested, sawNotebook, sawGuide, nextDayed }
export const STEPS = [
  { id: 'site', text: 'Tap a site on the map to stand there. Start where the water looks worst.', target: '.pin[data-site="C"]', side: 'below', done: (ev, c) => !!c.site },
  { id: 'look', text: 'Press Look. It is free, and it shows what the water looks like today.', target: '#btn-look', side: 'left', done: (ev, c) => c.looked },
  { id: 'test', text: 'Now tap a tool to test the water. Tests cost tokens, so choose well.', target: '.tool-grid', side: 'left', done: (ev, c) => c.tested },
  { id: 'notebook', text: 'Every reading lands in your Notebook. Open it to compare sites.', target: '[data-tab="notebook"]', side: 'below', button: 'Got it', done: (ev, c) => c.sawNotebook || ev === 'gotit' },
  { id: 'guide', text: 'Open the Guide card to judge a number. Is it over the guide value?', target: '#btn-guide', side: 'below', button: 'Got it', done: (ev, c) => c.sawGuide || ev === 'gotit' },
  { id: 'next', text: 'Lab results and new weather come on the next day. Press Next day, or Wait for results.', target: '#next-day', side: 'above', button: 'Got it', done: (ev, c) => c.nextDayed || ev === 'gotit' },
  { id: 'solve', text: 'When you know the cause, press Solve the case.', target: '#solve', side: 'above', button: 'Got it', done: ev => ev === 'gotit' },
];

export function createCoach({ getCtx, onEnd, onTab }) {
  let i = -1, node = null, hl = null;
  const api = {
    get active() { return i >= 0; },
    start() { if (i >= 0) return; node = document.createElement('div'); node.id = 'coach'; node.setAttribute('role', 'status'); document.body.append(node); i = 0; addEventListener('resize', place); settle('sync'); render(); },
    notify(ev) { if (i < 0) return; const was = i; settle(ev); if (i >= 0 && i !== was) render(); else place(); },
    refresh() { if (i >= 0) { mark(); place(); } },
    stop(finished = false) { if (i < 0) return; i = -1; removeEventListener('resize', place); unmark(); node?.remove(); node = null; onEnd?.(finished); },
  };
  function settle(ev) {
    while (i >= 0 && i < STEPS.length && STEPS[i].done(ev, getCtx())) { i++; ev = 'sync'; }
    if (i >= STEPS.length) api.stop(true);
  }
  function render() {
    if (i < 0 || !node) return;
    const s = STEPS[i];
    node.replaceChildren();
    const arrow = document.createElement('span'); arrow.className = 'carrow'; arrow.setAttribute('aria-hidden', 'true');
    const step = document.createElement('span'); step.className = 'cstep'; step.textContent = `${i + 1}/${STEPS.length}`; step.setAttribute('aria-hidden', 'true');
    const txt = document.createElement('span'); txt.className = 'ctext'; txt.textContent = s.text;
    const row = document.createElement('div'); row.className = 'cbtns';
    if (s.button) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary cgo'; b.textContent = s.button; b.onclick = () => api.notify('gotit'); row.append(b); }
    const sk = document.createElement('button'); sk.type = 'button'; sk.className = 'btn ghost cskip'; sk.textContent = 'Skip tips'; sk.onclick = () => api.stop(false); row.append(sk);
    const top = document.createElement('div'); top.className = 'ctop'; top.append(step, txt);
    node.append(arrow, top, row);
    mark();
    const el = target();
    if (el) { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'center' }); }
    place();
  }
  const target = () => { const s = STEPS[i]; return s ? document.querySelector(s.target) : null; };
  function unmark() { hl?.classList.remove('coach-target'); hl = null; }
  function mark() {
    unmark();
    const s = STEPS[i]; if (!s) return;
    onTab?.(s.target);
    const el = target();
    if (el) { el.classList.add('coach-target'); hl = el; }
  }
  function place() {
    if (i < 0 || !node) return;
    const el = target(), s = STEPS[i];
    if (!el) { node.style.visibility = 'hidden'; return; }
    node.style.visibility = 'visible';
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, gap = 16;
    node.style.maxWidth = `${Math.min(380, vw - 16)}px`;
    const w = node.offsetWidth, h = node.offsetHeight;
    let side = s.side;
    if (side === 'left' && (r.left - w - gap < 8 || vw < 900)) side = r.top - h - gap > 8 ? 'above' : 'below';
    if (side === 'below' && r.bottom + h + gap > vh - 8) side = r.top - h - gap > 8 ? 'above' : 'below';
    if (side === 'above' && r.top - h - gap < 8) side = 'below';
    let x, y;
    if (side === 'left') { x = r.left - w - gap; y = Math.min(Math.max(8, r.top + Math.min(r.height / 2, 90) - h / 2), vh - h - 8); }
    else { x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8); y = side === 'below' ? Math.min(r.bottom + gap, vh - h - 8) : Math.max(8, r.top - h - gap); }
    node.style.left = `${Math.round(x)}px`; node.style.top = `${Math.round(y)}px`;
    node.dataset.side = side;
    const a = node.querySelector('.carrow');
    if (side === 'left') a.style.top = `${Math.round(Math.min(Math.max(18, r.top + Math.min(r.height / 2, 90) - y - 9), h - 36))}px`;
    else a.style.left = `${Math.round(Math.min(Math.max(18, r.left + r.width / 2 - x - 9), w - 36))}px`;
  }
  return api;
}
