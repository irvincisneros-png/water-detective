// The map tells each case's story: the problem is visible from Day 1 and changes day by day.
// Drawn above the water, below the HTML pins. Pure string builder (viewBox 0 0 1000 640).
import { lookAt } from '../logic/readings.js';

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

function case2(state, c) {
  const d = state.day, W = c.weather[d - 1];
  let s = '';
  // the Farm Dam: green-brown on Day 1, muddy plume on Day 2, brown from Day 3, green film on Days 4-5
  const dx = 300, dy = 200;
  if (d === 1) s += `<ellipse cx="${dx}" cy="${dy}" rx="80" ry="47" fill="#9DB36B" opacity=".35"/>`;
  if (d >= 2) s += `<ellipse cx="${dx}" cy="${dy}" rx="82" ry="49" fill="${d === 2 ? '#C29A66' : '#B6844E'}" opacity="${d === 2 ? .55 : .9}"/>`;
  if (d === 2) {
    s += `<path d="M150,118 C190,134 214,156 244,182 L296,198 L246,222 C214,204 184,176 138,150 Z" fill="#9A6B3A" opacity=".85" filter="url(#wst-blur2)"/>`;
    s += `<path d="M165,135 C195,150 218,170 250,192" fill="none" stroke="#C99A62" stroke-width="7" stroke-linecap="round" class="wm-flow" opacity=".9"/><path d="M148,160 C182,170 212,190 246,206" fill="none" stroke="#C99A62" stroke-width="6" stroke-linecap="round" class="wm-flow" opacity=".8"/>`;
  }
  if (d >= 4) s += `<ellipse cx="${dx}" cy="${dy}" rx="80" ry="47" fill="none" stroke="#6FC23A" stroke-width="${d === 4 ? 9 : 15}" opacity=".8"/>` + dots(dx, dy, 74, 40, d === 4 ? 18 : 34, 5 + d, '#8EDB52', 3.2);
  if (d >= 3 && d <= 3) s += dots(dx, dy, 70, 38, 10, 3, '#8F6A3B', 3);
  if (state.revealed.B) s += tadpoles(dx, dy + 6, pick([8, 5, 2, 1, 0], d), 31);
  if (state.revealed.C) s += tadpoles(470, 470, 10, 41) + sparkle(430, 450) + sparkle(512, 484);
  if (state.revealed.A) s += `<g>${[[736, 228], [800, 244], [770, 200]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="7" ry="5" fill="#E8775A" stroke="${INK}" stroke-width="2"/><path d="M-9,-4 l-5,-4 M9,-4 l5,-4 M-8,3 l-5,4 M8,3 l5,4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/></g>`).join('')}</g>` + sparkle(740, 190) + sparkle(820, 224);
  if (W?.icon === 'rain') {
    // puddle rings on every water + heavy dark tint
    s += `<rect width="1000" height="640" fill="#3E4F66" opacity=".12"/>`;
    for (const [x, y, rx, ry] of [[dx, dy, 78, 44], [470, 470, 66, 34], [780, 220, 74, 40]]) {
      for (let i = 0; i < 4; i++) s += `<ellipse cx="${x + (i - 1.5) * rx * .35}" cy="${y + (i % 2 ? 8 : -8)}" rx="${10 + i * 2}" ry="${5 + i}" fill="none" stroke="#fff" stroke-width="2.6" opacity=".7" class="wm-pulse"/>`;
    }
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
