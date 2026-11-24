// First-time coach marks for case 1. STEPS is pure data plus predicates (unit-tested); createCoach() is the DOM layer.
// ctx = { site, looked, tested }
export const STEPS = [
  { id: 'site', text: 'Tap a site on the map to stand there. Start where the water looks worst.', target: '.pins', done: (ev, c) => !!c.site },
  { id: 'look', text: 'Press Look. It is free, and it shows what the water looks like.', target: '#btn-look', done: (ev, c) => c.looked },
  { id: 'test', text: 'Now tap a tool to test the water. Tests cost tokens, so choose well.', target: '.tool-grid', done: (ev, c) => c.tested },
  { id: 'solve', text: 'When you know the cause, press Solve the case.', target: '#solve', button: 'Got it', done: ev => ev === 'gotit' },
];

export function createCoach({ getCtx, host, onEnd, onTab }) {
  let i = -1, node = null, hl = null;
  const api = {
    get active() { return i >= 0; },
    start() { if (i >= 0) return; node = document.createElement('div'); node.id = 'coach'; node.setAttribute('role', 'status'); host.append(node); i = 0; settle('sync'); render(); },
    notify(ev) { if (i < 0) return; const was = i; settle(ev); if (i >= 0 && i !== was) render(); },
    refresh() { if (i >= 0) mark(); },
    stop(finished = false) { if (i < 0) return; i = -1; unmark(); node?.remove(); node = null; onEnd?.(finished); },
  };
  function settle(ev) {
    while (i >= 0 && i < STEPS.length && STEPS[i].done(ev, getCtx())) { i++; ev = 'sync'; }
    if (i >= STEPS.length) api.stop(true);
  }
  function render() {
    if (i < 0 || !node) return;
    const s = STEPS[i];
    node.replaceChildren();
    const step = document.createElement('span'); step.className = 'cstep'; step.textContent = `${i + 1}/${STEPS.length}`; step.setAttribute('aria-hidden', 'true');
    const txt = document.createElement('span'); txt.className = 'ctext'; txt.textContent = s.text;
    node.append(step, txt);
    if (s.button) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary cgo'; b.textContent = s.button; b.onclick = () => api.notify('gotit'); node.append(b); }
    const sk = document.createElement('button'); sk.type = 'button'; sk.className = 'btn ghost cskip'; sk.textContent = 'Skip tips'; sk.onclick = () => api.stop(false); node.append(sk);
    mark();
  }
  function unmark() { hl?.classList.remove('coach-target'); hl = null; }
  function mark() {
    unmark();
    const s = STEPS[i]; if (!s?.target) return;
    onTab?.(s.target);
    const el = document.querySelector(s.target);
    if (el) { el.classList.add('coach-target'); hl = el; }
  }
  return api;
}
