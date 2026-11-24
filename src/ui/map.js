// The illustrated map: authored SVG art (maps.js) + big HTML site pins on top (so tap targets stay >= 48 px at any width).
import { baseMap, weatherLayer, lifeLayer } from './maps.js';
import { storyLayer } from './story.js';
import { h } from './dom.js';
import { icon } from './icons.js';

const DAY_TINT = ['rgba(255,214,150,.10)', 'rgba(200,215,240,.10)', 'rgba(255,232,190,.08)', 'rgba(190,225,240,.10)', 'rgba(255,225,170,.09)', 'rgba(215,225,240,.08)', 'rgba(255,215,170,.10)'];
const NS = 'http://www.w3.org/2000/svg';

export function createMap(c, { onSelect, ink } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 640'); svg.setAttribute('class', 'map-svg'); svg.setAttribute('role', 'img');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-label', `Map of ${c.place}. Sites: ${c.sites.map(s => `${s.id} ${s.name}`).join(', ')}.`);
  const layer = cls => { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', cls); svg.append(g); return g; };
  const base = layer('lay-base'), art = layer('lay-art'), life = layer('lay-life'), wx = layer('lay-wx');
  base.innerHTML = baseMap(c.map, ink || c.accent.ink);
  life.innerHTML = lifeLayer(c.map);

  const tint = h('div.map-tint', { 'aria-hidden': 'true' });
  const wipe = h('div.map-wipe', { 'aria-hidden': 'true' }, h('span.wipe-day'));
  const pins = h('div.pins', { role: 'group', 'aria-label': 'Test sites. Use the arrow keys to move between sites.' });
  const pinEls = {};
  for (const s of c.sites) {
    const el = h('button.pin', {
      type: 'button', 'data-site': s.id, style: { left: `${s.x / 10}%`, top: `${s.y / 6.4}%` },
      onclick: () => onSelect?.(s.id),
      onkeydown: e => arrow(e, s),
    },
      h('span.pin-pulse'),
      h('span.pin-badge', s.id, h('span.pin-tick', { html: icon('check', 14) })),
      h('span.pin-name', s.name),
      h('span.pin-here', 'You are here'));
    pinEls[s.id] = el; pins.append(el);
  }
  function arrow(e, from) {
    const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    const d = dirs[e.key]; if (!d) return;
    e.preventDefault();
    let best = null, bs = Infinity;
    for (const s of c.sites) {
      if (s === from) continue;
      const dx = s.x - from.x, dy = s.y - from.y, along = dx * d[0] + dy * d[1];
      if (along <= 0) continue;
      const score = (dx * dx + dy * dy) * 1 + Math.abs(dx * d[1] + dy * d[0]) * 3;
      if (score < bs) { bs = score; best = s; }
    }
    if (best) pinEls[best.id].focus();
  }
  const el = h('div.mapbox', svg, tint, pins, wipe);

  const api = {
    el, pins: pinEls,
    update(state) {
      art.innerHTML = storyLayer(c, state);
      const wxi = c.weather[state.day - 1]?.icon || 'sun';
      wx.innerHTML = weatherLayer(wxi);
      tint.style.background = DAY_TINT[(state.day - 1) % DAY_TINT.length];
      for (const s of c.sites) {
        const p = pinEls[s.id], tested = state.entries.some(e => e.site === s.id && e.param !== 'look') || state.pending.some(x => x.site === s.id);
        p.classList.toggle('sel', state.site === s.id);
        p.classList.toggle('tested', tested);
        p.setAttribute('aria-pressed', state.site === s.id ? 'true' : 'false');
        p.setAttribute('aria-label', `Site ${s.id}, ${s.name}${state.site === s.id ? ', you are here' : ''}${tested ? ', tested' : ''}`);
      }
    },
    async dayWipe(n, text, reducedMotion) {
      wipe.querySelector('.wipe-day').textContent = text;
      if (reducedMotion) return;
      wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
      await new Promise(r => setTimeout(r, 900));
      wipe.classList.remove('go');
    },
    async timelapse(from, to, reducedMotion) {
      if (reducedMotion) return;
      wipe.classList.remove('go'); wipe.classList.add('hold');
      for (let d = from + 1; d <= to; d++) { wipe.querySelector('.wipe-day').textContent = `Day ${d}`; await new Promise(r => setTimeout(r, 330)); }
      await new Promise(r => setTimeout(r, 200));
      wipe.classList.remove('hold');
    },
    pulse(siteId) { const p = pinEls[siteId]; p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); },
  };
  return api;
}
