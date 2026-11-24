// The map tells each case's story: the problem is visible from Day 1 and changes day by day.
// Drawn above the water, below the HTML pins. Pure string builder (viewBox 0 0 1000 640).
import { lookAt } from '../logic/readings.js';
import { RESERVE_PONDS } from './maps.js';

const INK = '#2E3B40';
const pick = (arr, day) => arr[Math.min(Math.max(day, 1), arr.length) - 1];
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r1 = n => Math.round(n * 10) / 10;

const defs = `<defs><filter id="wst-blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter><filter id="wst-blur2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>
<radialGradient id="wst-heat"><stop offset="0" stop-color="#FFB347" stop-opacity=".55"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient></defs>`;

export function fish(x, y, rot = 0, sc = 1.3) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><ellipse rx="14" ry="6.2" fill="#EEF2F3" stroke="${INK}" stroke-width="2.4"/><path d="M12,0 l10,-6.5 v13Z" fill="#CBD5D9" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-5,1 q6,3 12,0" fill="none" stroke="#9AA9AF" stroke-width="2" stroke-linecap="round"/><path d="M-10,-3 l4,4 m0,-4 l-4,4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/></g>`;
}
const FISH_C1 = [[318, 172, -12], [522, 196, 160], [372, 276, 24], [478, 280, 190], [330, 236, 8]];
const FISH_C3_C = [[150, 262, -8], [262, 250, 170], [186, 372, 20], [270, 352, 200], [128, 292, 12], [236, 396, 150], [300, 300, 30], [112, 244, 175], [170, 410, 10], [250, 268, 195], [140, 330, 160], [296, 372, 15]];
const FISH_C3_B = [[512, 268, 8], [586, 280, 170], [548, 392, 200], [610, 340, 20], [476, 300, 160], [520, 232, 12]];

function dots(cx, cy, rx, ry, n, seed, fill, rmax = 4.5) {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()); s += `<circle cx="${r1(cx + Math.cos(a) * rx * d)}" cy="${r1(cy + Math.sin(a) * ry * d)}" r="${r1(1.8 + r() * rmax)}" fill="${fill}" opacity="${r1(.55 + r() * .4)}"/>`; }
  return s;
}
const blob = (cx, cy, rx, ry, fill, op, blur = 'wst-blur') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${op}" filter="url(#${blur})"/>`;
const tadpoles = (cx, cy, n, seed) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const x = cx + (r() - .5) * 110, y = cy + (r() - .5) * 60; s += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(r() * 360)})"><ellipse rx="4" ry="3" fill="#2E3B40"/><path d="M-3,0 q-6,-3 -11,0" fill="none" stroke="#2E3B40" stroke-width="1.8" stroke-linecap="round"/></g>`; } return s; };
const sparkle = (x, y) => `<g transform="translate(${x} ${y})" class="wm-twinkle"><path d="M0,-7 L2,-2 L7,0 L2,2 L0,7 L-2,2 L-7,0 L-2,-2Z" fill="#fff"/></g>`;

function case1(state, c) {
  const d = state.day, R = pick([112, 142, 176], d), cx = 412 + 10 * (d - 1), cy = 196 + 8 * (d - 1);
  let s = blob(cx, cy, R * 1.25, R * .85, '#6CC93A', .82) + blob(cx - 6, cy + 6, R * .85, R * .55, '#9AE34A', .7, 'wst-blur2');
  s += dots(cx, cy, R * 1.1, R * .72, 16 + d * 8, 11 + d, '#C9F27A');
  if (state.revealed.C) {
    s += `<path d="M${cx - R},${cy - 10} q22,-10 44,0 t44,0 M${cx - R * .6},${cy + 28} q22,-10 44,0 t44,0" fill="none" stroke="#3E8E1F" stroke-width="7" stroke-linecap="round" opacity=".55"/>`;
    s += dots(cx, cy, R * 1.05, R * .7, 22, 77, '#2F7A1A', 3.2);
    for (const [x, y, rot] of FISH_C1.slice(0, 3 + (d > 1 ? 1 : 0) + (d > 2 ? 1 : 0))) s += fish(x + (d - 1) * 6, y + (d - 1) * 4, rot);
  }
  for (const site of c.sites) {
    if (!state.revealed[site.id] || site.id === 'C') continue;
    const art = lookAt(c, site.id, d).art;
    if (art.includes('tinge')) s += blob(site.x, site.y, 62, 42, '#9BD870', .5);
    if (art.includes('tea')) s += blob(site.x + 6, site.y - 10, 66, 44, '#B98F55', .6);
    if (art.includes('clear')) s += sparkle(site.x - 46, site.y - 24) + sparkle(site.x + 40, site.y + 30) + sparkle(site.x - 10, site.y + 44) + `<g opacity=".8"><ellipse cx="${site.x - 50}" cy="${site.y + 20}" rx="7" ry="3.2" fill="#fff" stroke="${INK}" stroke-width="1.6"/><ellipse cx="${site.x + 52}" cy="${site.y - 16}" rx="7" ry="3.2" fill="#fff" stroke="${INK}" stroke-width="1.6"/></g>`;
  }
  return s;
}

const tad = (x, y, rot, sc = 1.5) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${sc})"><ellipse rx="5" ry="3.6" fill="#1F2A2E"/><path d="M-4,0 q-8,-4 -14,0" fill="none" stroke="#1F2A2E" stroke-width="2.4" stroke-linecap="round"/><circle cx="2.4" cy="-1" r=".9" fill="#fff"/></g>`;
const tads = (p, n, seed) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * .72; s += tad(p.cx + Math.cos(a) * p.rx * d, p.cy + Math.sin(a) * p.ry * d, Math.round(r() * 360)); } return s; };
const pill = (x, y, text, bg, fg, w = 150) => `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="${bg}" stroke="${INK}" stroke-width="3"/><text y="6" text-anchor="middle" font-size="17" font-weight="800" fill="${fg}">${text}</text></g>`;
const crab = (x, y) => `<g transform="translate(${x} ${y}) scale(1.5)"><ellipse rx="8" ry="5.4" fill="#E8775A" stroke="${INK}" stroke-width="2"/><path d="M-9,-3 l-6,-5 M9,-3 l6,-5 M-8,3 l-6,5 M8,3 l6,5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><circle cx="-3" cy="-6" r="1.4" fill="${INK}"/><circle cx="3" cy="-6" r="1.4" fill="${INK}"/></g>`;
const ell = (p, k, attrs) => `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${r1(p.rx * k)}" ry="${r1(p.ry * k)}" ${attrs}/>`;

function case2(state, c) {
  const d = state.day, W = c.weather[d - 1], { dam, fern, salt } = RESERVE_PONDS;
  let s = '';
  // ── Farm Dam: green-brown (Day 1) > plume (Day 2) > milky tea (Day 3) > brown + green film (Days 4-5)
  if (d === 1) s += ell(dam, .98, 'fill="#8AA55A" opacity=".72"') + dots(dam.cx, dam.cy, dam.rx * .8, dam.ry * .75, 22, 14, '#A5BE63', 4);
  if (d === 2) {
    s += ell(dam, .98, 'fill="#B07A44" opacity=".8"');
    s += `<path d="M30,60 C120,66 190,96 262,150 L292,172 L250,238 C190,200 110,150 30,150 Z" fill="#9C5F26" opacity="1" filter="url(#wst-blur2)"/>`;
    s += `<path d="M60,88 C130,94 192,120 250,168" fill="none" stroke="#C99A62" stroke-width="9" stroke-linecap="round" class="wm-flow" opacity=".9"/><path d="M52,128 C120,132 184,160 244,198" fill="none" stroke="#C99A62" stroke-width="8" stroke-linecap="round" class="wm-flow" opacity=".85"/><path d="M80,66 C150,76 208,104 266,150" fill="none" stroke="#6B4421" stroke-width="6" stroke-linecap="round" class="wm-flow" opacity=".7"/>`;
  }
  if (d >= 3) s += ell(dam, .985, `fill="${d === 3 ? '#C79F6A' : '#B58853'}" opacity=".97"`) + (d === 3 ? ell(dam, .72, 'fill="#EBD5AB" opacity=".42" filter="url(#wst-blur)"') + dots(dam.cx, dam.cy, dam.rx * .8, dam.ry * .75, 12, 3, '#9A7647', 3.5) : '');
  if (d >= 4) {
    const w = d === 4 ? 20 : 34;
    s += `<ellipse cx="${dam.cx}" cy="${dam.cy}" rx="${dam.rx - w / 2 - 2}" ry="${dam.ry - w / 2 - 2}" fill="none" stroke="#62B82B" stroke-width="${w}" opacity=".92"/>`;
    s += `<ellipse cx="${dam.cx}" cy="${dam.cy}" rx="${dam.rx - w - 6}" ry="${dam.ry - w - 6}" fill="none" stroke="#9BE04A" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round" opacity=".9"/>`;
    s += dots(dam.cx, dam.cy, dam.rx * .93, dam.ry * .9, d === 4 ? 26 : 50, 9 + d, '#3D8A18', 4.5);
  }
  s += tads(dam, pick([10, 6, 2, 0, 0], d), 31);
  if (d >= 4) s += pill(dam.cx - 55, dam.cy + 58, 'No tadpoles', '#FFF1D6', '#8C2B14', 176);
  // ── Fern Pond: clear, healthy, lots of tadpoles
  s += tads(fern, 16, 41) + sparkle(fern.cx - 90, fern.cy - 30) + sparkle(fern.cx + 80, fern.cy + 34) + sparkle(fern.cx + 10, fern.cy - 56);
  s += pill(fern.cx - 72, fern.cy + 46, 'Lots of tadpoles', '#E4F6DC', '#1E5A2A', 200);
  // ── Saltmarsh Pool: clear and salty, crabs
  s += [[705, 236], [850, 244], [750, 152], [822, 160], [724, 272]].map(([x, y]) => crab(x, y)).join('') + sparkle(salt.cx - 70, salt.cy - 20) + sparkle(salt.cx + 60, salt.cy + 30) + sparkle(salt.cx + 10, salt.cy - 44);
  if (state.revealed.B && d <= 3) s += dots(dam.cx, dam.cy, 40, 20, 0, 1, '#000');
  if (W?.icon === 'rain') {
    s += `<rect width="1000" height="640" fill="#3E4F66" opacity=".16"/>`;
    for (const p of [dam, fern, salt]) for (let i = 0; i < 7; i++) s += `<ellipse cx="${r1(p.cx + (i - 3) * p.rx * .27)}" cy="${r1(p.cy + (i % 2 ? 22 : -22))}" rx="${13 + (i % 3) * 3}" ry="${6 + (i % 3)}" fill="none" stroke="#fff" stroke-width="3" opacity=".8" class="wm-pulse"/>`;
  }
  return s;
}

function case3(state, c) {
  const d = state.day, W = c.weather[d - 1], hot = /Hot/i.test(W?.text || ''), windy = W?.icon === 'wind';
  let s = '';
  const R = pick([100, 130, 130, 84, 62, 52, 50], d);
  s += blob(188, 322, R * 1.2, R * .85, '#9A6B3C', .85) + blob(176, 326, R * .7, R * .5, '#7A4F29', .6, 'wst-blur2');
  // debris near the outlet
  const r = rng(909);
  const nDebris = 12 + (state.revealed.C ? 8 : 0);
  for (let i = 0; i < nDebris; i++) {
    const x = 120 + r() * 150, y = 270 + r() * 120, k = i % 4;
    s += k === 0 ? `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="7" ry="3.4" fill="#7B5B2E" stroke="${INK}" stroke-width="1.6" transform="rotate(${Math.round(r() * 180)} ${r1(x)} ${r1(y)})"/>`
      : k === 1 ? `<path d="M${r1(x)},${r1(y)} l9,-4 l3,4 l-8,4Z" fill="#8FB04A" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
      : k === 2 ? `<rect x="${r1(x)}" y="${r1(y)}" width="10" height="7" rx="1.5" fill="#EDEDED" stroke="${INK}" stroke-width="1.6" transform="rotate(${Math.round(r() * 90)} ${r1(x)} ${r1(y)})"/>`
      : `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.2" fill="#C9A77A" stroke="${INK}" stroke-width="1.4"/>`;
  }
  // dead fish (more on the hot days)
  const nC = pick([6, 12, 12, 2, 0, 0, 0], d), nB = pick([3, 6, 6, 0, 0, 0, 0], d);
  for (const [x, y, rot] of FISH_C3_C.slice(0, nC)) s += fish(x, y, rot);
  for (const [x, y, rot] of FISH_C3_B.slice(0, nB)) s += fish(x, y, rot);
  if (nB) s += blob(548, 330, 70, 50, '#9DB87A', .35);
  if (hot) {
    s += `<rect width="1000" height="640" fill="#FFE9A0" opacity=".16"/><circle cx="930" cy="64" r="230" fill="url(#wst-heat)"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M${180 + i * 90},${230 + (i % 3) * 70} q14,-10 28,0 t28,0 t28,0 t28,0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" class="wm-ripple${i % 2 ? ' wm-slow' : ''}"/>`;
    s += `<ellipse cx="520" cy="330" rx="260" ry="120" fill="#fff" opacity=".12"/>`;
  }
  if (windy) for (let i = 0; i < 26; i++) { const x = 170 + (i % 7) * 100 + (Math.floor(i / 7) % 2) * 40, y = 190 + Math.floor(i / 7) * 62 + (i % 3) * 10; s += `<path d="M${x},${y} q13,-11 26,0 t26,0 t26,0" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" opacity=".95" class="wm-ripple${i % 2 ? ' wm-slow' : ''}"/>`; }
  if (state.revealed.A) s += sparkle(820, 300) + sparkle(880, 360);
  return s;
}

export function storyLayer(c, state) {
  let body = '';
  if (c.map === 'lagoon-open') body = case1(state, c);
  else if (c.map === 'reserve') body = case2(state, c);
  else body = case3(state, c);
  return `${defs}<g class="wm-story" pointer-events="none">${body}</g>`;
}
