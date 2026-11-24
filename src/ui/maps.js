// Water Detective map art: pure string builders (no DOM). The map is drawn in a 1000 x 640 viewBox.
// Animation classes (wm-*) live in maps.css and switch off under prefers-reduced-motion.

const W = 1000, H = 640;
const C = {
  land: '#D6E7AC', land2: '#C3DD95', lawn: '#B5D788', sand: '#F3E3B2', sandD: '#E2CC92',
  shallow: '#9BD9EF', deep: '#4A9BD2', deep2: '#3A86C0', sea: '#6DBBE6', road: '#A9ADB1',
  mud: '#C8A877', earth: '#C9A06E', marsh: '#BFD39C', white: '#FFFFFF',
};
const ROOFS = ['#E58A6C', '#D9694F', '#7FA3C9', '#E9B96A', '#B9877A', '#8DB9A5'];

const r1 = n => Math.round(n * 10) / 10;
const stroke = (ink, w = 3.5) => `stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Union of circles with one outline around the whole shape.
function blobs(cs, fill, ink, w = 3.5) {
  return `<g>${cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r1(r + w / 2)}" fill="${ink}"/>`).join('')}${cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r1(r - w / 2)}" fill="${fill}"/>`).join('')}</g>`;
}
function tree(x, y, r, ink, fill = '#6DAF5B') {
  return `<g><ellipse cx="${r1(x + r * .25)}" cy="${r1(y + r * .55)}" rx="${r1(r * 1.05)}" ry="${r1(r * .6)}" fill="#2B3A2A" opacity=".16"/>`
    + blobs([[x, y, r], [x - r * .62, y + r * .3, r * .66], [x + r * .6, y + r * .26, r * .62]], fill, ink, 3)
    + `<circle cx="${r1(x - r * .25)}" cy="${r1(y - r * .3)}" r="${r1(r * .42)}" fill="#A5DB84" opacity=".7"/></g>`;
}
function house(x, y, w, h, roof, ink) {
  return `<g><rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="5" fill="#2B3A2A" opacity=".16"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${roof}" ${stroke(ink, 3)}/>`
    + `<rect x="${x + 2}" y="${y + h / 2}" width="${w - 4}" height="${r1(h / 2 - 2)}" fill="#2B2B2B" opacity=".12"/>`
    + `<line x1="${x + 3}" y1="${y + h / 2}" x2="${x + w - 3}" y2="${y + h / 2}" ${stroke(ink, 2.5)}/>`
    + `<rect x="${x + w - 12}" y="${y + 5}" width="7" height="7" rx="1" fill="#F7EFD9" ${stroke(ink, 2)}/></g>`;
}
function lawn(x, y, w, h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.lawn}"/>`; }
function reeds(x, y, n, ink, s = 1) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 7 * s, lean = (i - (n - 1) / 2) * 3.2 * s, hgt = (30 + (i % 2) * 8) * s;
    out += `<path d="M${r1(x + dx)},${y} q${r1(lean * .5)},${r1(-hgt * .5)} ${r1(lean)},${r1(-hgt)}" fill="none" stroke="#6E8F3D" stroke-width="3.2" stroke-linecap="round"/>`
      + `<ellipse cx="${r1(x + dx + lean)}" cy="${r1(y - hgt - 2)}" rx="3" ry="6.5" fill="#8B5E3C" ${stroke(ink, 1.8)} transform="rotate(${r1(lean * 2)} ${r1(x + dx + lean)} ${r1(y - hgt)})"/>`;
  }
  return `<g>${out}</g>`;
}
function mangrove(x, y, s, ink) {
  let roots = '';
  for (let i = -2; i <= 2; i++) roots += `<path d="M${r1(x + i * 9 * s)},${r1(y + 10 * s)} q${r1(i * 4 * s)},${r1(14 * s)} ${r1(i * 7 * s)},${r1(22 * s)}" fill="none" ${stroke('#5B4630', 3)}/>`;
  return `<g>${roots}${blobs([[x, y, 20 * s], [x - 22 * s, y + 6 * s, 14 * s], [x + 22 * s, y + 5 * s, 15 * s], [x - 6 * s, y - 14 * s, 14 * s]], '#4E8F58', ink, 3)}`
    + `<circle cx="${r1(x - 6 * s)}" cy="${r1(y - 8 * s)}" r="${r1(7 * s)}" fill="#7FBE74" opacity=".7"/></g>`;
}
function cow(x, y, rot, s, ink = '#2E3B40') {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${s})">`
    + `<ellipse cx="2" cy="12" rx="19" ry="8" fill="#2B3A2A" opacity=".15"/>`
    + `<path d="M-17,0 Q-17,-9 -8,-9 L9,-9 Q16,-9 16,0 Q16,9 9,9 L-8,9 Q-17,9 -17,0 Z" fill="#FFFDF5" ${stroke(ink, 2.6)}/>`
    + `<path d="M-6,-8 Q2,-8 0,-1 Q-3,5 -9,3 Q-12,-4 -6,-8 Z" fill="#7A5236"/><ellipse cx="9" cy="4" rx="4" ry="3.2" fill="#7A5236"/>`
    + `<ellipse cx="21" cy="0" rx="7.5" ry="6.2" fill="#FFFDF5" ${stroke(ink, 2.6)}/><ellipse cx="25" cy="0" rx="3.2" ry="3.6" fill="#F2B8B0"/>`
    + `<circle cx="20" cy="-3.5" r="1.4" fill="${ink}"/><circle cx="20" cy="3.5" r="1.4" fill="${ink}"/>`
    + `<path d="M-17,0 q-6,3 -9,9" fill="none" ${stroke(ink, 2.2)}/></g>`;
}
function ripples(list, delayBase = 0, cls = '') {
  return list.map(([x, y, w], i) => `<g class="wm-ripple ${cls}" style="animation-delay:-${r1(delayBase + i * 1.3)}s"><path d="M${x},${y} q${r1(w / 4)},-5 ${r1(w / 2)},0 t${r1(w / 2)},0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`).join('');
}
// Concrete drain pipe pointing +x with its mouth at (0,0); rotate to aim. Flow streaks run out of the mouth.
function pipe(x, y, deg, len, ink, big = 1) {
  const hgt = 26 * big, fl = 38 * big;
  return `<g transform="translate(${x} ${y}) rotate(${deg})">`
    + `<path class="wm-flow" d="M14,${-hgt * .3} q22,6 44,0 t44,0 M14,0 q22,-6 44,0 t44,0 M14,${hgt * .3} q22,6 44,0 t44,0" fill="none" stroke="#A67B4B" stroke-width="5" stroke-linecap="round" opacity=".55"/>`
    + `<ellipse cx="46" cy="0" rx="46" ry="${r1(hgt * .85)}" fill="#A67B4B" opacity=".22"/>`
    + `<rect x="${-len}" y="${-hgt / 2 + 3}" width="${len}" height="${hgt}" fill="#000" opacity=".13"/>`
    + `<rect x="${-len}" y="${-hgt / 2}" width="${len}" height="${hgt}" fill="#C9C5BA" ${stroke(ink, 3.5)}/>`
    + `<rect x="${-len + 2}" y="${-hgt / 2 + 4}" width="${len - 4}" height="6" fill="#fff" opacity=".45"/>`
    + `<rect x="-14" y="${-fl / 2}" width="16" height="${fl}" rx="5" fill="#B7B2A5" ${stroke(ink, 3.5)}/>`
    + `<rect x="2" y="${-hgt / 2 + 2}" width="7" height="${hgt - 4}" rx="3" fill="#3C4448" ${stroke(ink, 2.5)}/></g>`;
}
function road(d, ink, w = 22, dashed = true) {
  return `<g><path d="${d}" fill="none" ${stroke(ink, w + 7)}/><path d="${d}" fill="none" stroke="${C.road}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    + (dashed ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray="12 11" stroke-linecap="butt" opacity=".9"/>` : '') + '</g>';
}
function fence(d, ink) {
  return `<g><path d="${d}" fill="none" stroke="${ink}" stroke-width="1.8" opacity=".85"/><path d="${d}" fill="none" ${stroke(ink, 5.5)} stroke-dasharray="0.1 14"/></g>`;
}

// ───────────────────────────────────────────────────────── lagoon shared geometry
function lagoonPath(open) {
  return 'M110,350 C95,270 150,200 250,160 C330,128 400,118 470,122 C560,128 610,170 690,180 C770,190 820,240 850,285 '
    + (open ? 'L905,293 L905,367 L850,378 ' : 'C872,292 880,312 880,330 C880,348 872,368 850,378 ')
    + 'C810,440 740,500 640,520 C540,540 440,545 340,525 C250,510 160,500 125,455 C105,420 110,385 110,350 Z';
}
const SEA_PATH = 'M952,0 C936,80 966,160 952,240 C940,300 964,360 952,410 C942,490 966,570 952,640 L1000,640 L1000,0 Z';
const SPIT_PATH = 'M893,0 C912,100 890,200 900,290 L900,370 C896,470 914,560 898,640 L960,640 L960,0 Z';
const SPIT_CLOSED = 'M893,0 C912,100 898,190 880,236 C858,290 858,370 880,424 C898,470 914,560 898,640 L960,640 L960,0 Z';

function defs(p) {
  return `<defs>
<linearGradient id="wm-${p}-deep" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#58A9DB"/><stop offset="1" stop-color="#3680BA"/></linearGradient>
<linearGradient id="wm-${p}-sea" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CC6EC"/><stop offset="1" stop-color="#4FA6DB"/></linearGradient>
<pattern id="wm-${p}-gr" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M9,15 l-2.5,-7 M9,15 l2.5,-7 M9,15 l0,-8 M32,39 l-2.5,-7 M32,39 l2.5,-7 M32,39 l0,-8" fill="none" stroke="#86A957" stroke-width="2.2" stroke-linecap="round" opacity=".5"/></pattern>
<pattern id="wm-${p}-dot" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="1.8" fill="#C9AE70" opacity=".55"/><circle cx="17" cy="17" r="1.6" fill="#C9AE70" opacity=".55"/></pattern>
<linearGradient id="wm-${p}-stripe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".0"/></linearGradient>
</defs>`;
}
function landBase(p) {
  return `<rect width="${W}" height="${H}" fill="${C.land}"/><rect width="${W}" height="${H}" fill="url(#wm-${p}-gr)"/>`;
}

function lagoonWater(p, open, ink) {
  const d = lagoonPath(open);
  const clipW = open ? 892 : 872;
  return `<clipPath id="wm-${p}-ringclip"><rect x="0" y="0" width="${clipW}" height="${H}"/></clipPath>`
    + `<g clip-path="url(#wm-${p}-ringclip)"><path d="${d}" fill="none" ${stroke(ink, 41)}/><path d="${d}" fill="none" stroke="${C.sand}" stroke-width="34" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="url(#wm-${p}-dot)" stroke="none"/></g>`
    + `<path d="${d}" fill="${C.shallow}" ${stroke(ink, 3.5)}/>`
    + `<path d="${lagoonPath(false)}" fill="url(#wm-${p}-deep)" opacity=".92" transform="translate(490 335) scale(.9) translate(-490 -335)"/>`
    + `<path d="${lagoonPath(false)}" fill="none" stroke="#fff" stroke-width="3" opacity=".5" transform="translate(490 335) scale(.9) translate(-490 -335)"/>`;
}

// ───────────────────────────────────────────────────────── case 1: lagoon-open / case 3: lagoon-closed
function lagoon(variant, ink) {
  const open = variant === 'lagoon-open', p = open ? 'o' : 'c';
  let s = defs(p) + landBase(p);

  // spit of sand and the sea
  s += `<path d="${open ? SPIT_PATH : SPIT_CLOSED}" fill="${C.sand}" ${stroke(ink, 3.5)}/><path d="${open ? SPIT_PATH : SPIT_CLOSED}" fill="url(#wm-${p}-dot)"/>`;
  s += `<path d="${SEA_PATH}" fill="url(#wm-${p}-sea)" ${stroke(ink, 3.5)}/>`;
  s += `<path d="M946,0 C930,80 960,160 946,240 C934,300 958,360 946,410 C936,490 960,570 946,640" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="26 14" opacity=".8" stroke-linecap="round"/>`;
  s += ripples([[964, 90, 30], [962, 190, 34], [968, 290, 26], [962, 440, 32], [966, 540, 30], [964, 610, 30]], 0, 'wm-slow');
  if (!open) {
    // waves breaking on the sea side of the sand bar
    s += `<g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".95"><path d="M968,226 q-10,12 0,24 q10,12 0,24 M978,300 q-10,12 0,24 q10,12 0,24 M968,372 q-10,12 0,24"/></g>`;
    s += `<path d="M914,250 q-6,24 0,48 M916,356 q-6,22 0,44" fill="none" stroke="${C.sandD}" stroke-width="4" stroke-linecap="round"/><path d="M924,320 q6,-4 12,0 M920,420 q6,-4 12,0" fill="none" stroke="#7A9A4A" stroke-width="3" stroke-linecap="round"/>`;
  }

  // roads, lawns, houses
  const northRoad = open ? 'M-10,80 L560,80 C615,80 640,70 662,44' : 'M-10,84 L130,84 C300,84 440,82 570,84 L720,84';
  s += road(northRoad, ink);
  const row = open
    ? [[22, 22, 0], [88, 22, 1], [154, 22, 2], [220, 22, 3], [286, 22, 4], [352, 22, 5], [490, 22, 1], [556, 22, 0]]
    : [[150, 20, 2], [216, 20, 0], [282, 20, 4], [348, 20, 5], [490, 20, 1], [556, 20, 3]];
  const row2 = open ? [[26, 108, 3], [92, 108, 5], [158, 108, 1]] : [];
  for (const [x, y] of row.concat(row2)) s += lawn(x - 8, y - 6, 62, 50 + (y > 90 ? 0 : 6));
  for (const [x, y, c] of row.concat(row2)) s += house(x, y, 46, 32, ROOFS[c], ink);
  if (open) {
    // sports field
    s += `<rect x="640" y="46" width="200" height="104" rx="42" fill="#9ACB6B" ${stroke(ink, 3.5)}/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${668 + i * 36}" y="56" width="18" height="84" fill="#fff" opacity=".13"/>`;
    s += `<rect x="652" y="58" width="176" height="80" rx="32" fill="none" stroke="#fff" stroke-width="3.5" opacity=".95"/><line x1="740" y1="58" x2="740" y2="138" stroke="#fff" stroke-width="3.5"/><circle cx="740" cy="98" r="15" fill="none" stroke="#fff" stroke-width="3.5"/>`;
    s += `<path d="M652,86 v24 M828,86 v24" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
    s += tree(870, 120, 22, ink) + tree(610, 128, 18, ink);
  } else {
    s += tree(640, 40, 20, ink) + tree(690, 44, 16, ink);
  }

  // creek
  const creek = open ? 'M-14,612 C36,566 66,520 100,480 C112,466 122,456 134,448' : 'M-14,218 C44,230 70,276 112,294 C122,298 130,300 140,300';
  s += `<path d="${creek}" fill="none" ${stroke(ink, 36)}/><path d="${creek}" fill="none" stroke="${C.shallow}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><path d="${creek}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 18" opacity=".6"/>`;

  // lagoon water (drawn over the creek mouth)
  s += lagoonWater(p, open, ink);
  s += open ? `<circle cx="130" cy="450" r="17" fill="${C.shallow}"/>` : `<circle cx="126" cy="297" r="17" fill="${C.shallow}"/>`;

  if (open) {
    // entrance channel to the sea
    s += `<path d="M885,291 C912,293 936,298 958,306 L958,354 C936,362 912,367 885,369 Z" fill="${C.shallow}"/>`;
    s += `<path d="M905,293 C925,295 940,299 958,306 M905,367 C925,365 940,361 958,354" fill="none" ${stroke(ink, 3.5)}/>`;
    s += `<path d="M912,320 l30,0 M918,340 l26,0" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
  }

  // ripples on the lagoon
  s += ripples([[250, 240, 60], [330, 200, 54], [530, 215, 66], [640, 290, 60], [250, 360, 56], [420, 420, 70], [640, 440, 60], [760, 340, 54], [330, 470, 62]], 0);

  // drain / outlet pipe
  if (open) {
    s += `<rect x="408" y="86" width="24" height="16" rx="3" fill="#6C7378" ${stroke(ink, 2.5)}/><path d="M413,92 h14 M413,97 h14" stroke="${ink}" stroke-width="2"/>`;
    s += `<path d="M420,100 L420,112" stroke="${ink}" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>`;
    s += pipe(420, 140, 90, 46, ink);
  } else {
    s += pipe(112, 338, 0, 40, ink, 1.25);
  }

  // shore details: reeds, mangroves, trees
  const reedSpots = open
    ? [[290, 150, 5], [370, 128, 4], [560, 142, 5], [236, 176, 4], [596, 168, 3], [790, 226, 5], [372, 551, 4], [250, 524, 5], [130, 478, 4]]
    : [[300, 148, 5], [380, 126, 4], [560, 142, 5], [236, 176, 4], [800, 232, 5], [374, 551, 4], [250, 524, 5], [160, 486, 4]];
  for (const [x, y, n] of reedSpots) s += reeds(x, y, n, ink, .9);
  for (const [x, y, sc] of [[782, 478, 1], [748, 502, .85], [820, 440, .85], [690, 536, .8]]) s += mangrove(x, y, sc, ink);
  const trees = open
    ? [[214, 154, 17], [60, 190, 19], [48, 260, 17], [46, 330, 20], [70, 392, 16], [782, 262, 18], [752, 224, 15], [858, 220, 17]]
    : [[190, 150, 17], [16, 130, 17], [18, 400, 18], [16, 470, 20], [20, 540, 17], [720, 150, 18], [792, 240, 17], [770, 190, 15]];
  for (const [x, y, r] of trees) s += tree(x, y, r, ink);

  if (open) {
    // boat ramp, jetty, boat, car park (south shore)
    s += `<path d="M562,560 L610,560 L598,512 L574,512 Z" fill="#CFCCC3" ${stroke(ink, 3.5)}/><path d="M572,534 h28 M568,548 h36" stroke="${ink}" stroke-width="2.4" opacity=".6" stroke-linecap="round"/>`;
    s += `<rect x="636" y="450" width="14" height="86" rx="3" fill="#C99A5B" ${stroke(ink, 3.2)}/><path d="M637,462 h12 M637,476 h12 M637,490 h12 M637,504 h12 M637,518 h12" stroke="${ink}" stroke-width="1.8" opacity=".55"/>`;
    s += `<g class="wm-bob"><path d="M588,474 Q588,464 612,464 Q630,466 642,474 Q630,482 612,484 Q588,484 588,474 Z" fill="#fff" ${stroke(ink, 3)}/><path d="M598,474 h26" stroke="#E8775A" stroke-width="5" stroke-linecap="round"/></g>`;
    s += `<rect x="480" y="566" width="150" height="58" rx="8" fill="#B8BBBE" ${stroke(ink, 3.5)}/><path d="M510,572 v46 M545,572 v46 M580,572 v46 M615,572 v46" stroke="#fff" stroke-width="3" opacity=".85"/>`;
    s += `<rect x="516" y="584" width="24" height="14" rx="4" fill="#E58A6C" ${stroke(ink, 2.5)}/><rect x="586" y="592" width="24" height="14" rx="4" fill="#7FA3C9" ${stroke(ink, 2.5)}/>`;
    s += road('M690,640 C690,606 650,600 630,596', ink, 18);
    // building site up the creek
    s += `<rect x="156" y="560" width="190" height="68" rx="10" fill="${C.earth}" ${stroke(ink, 3.5)}/><rect x="156" y="560" width="190" height="68" rx="10" fill="url(#wm-${p}-dot)"/>`;
    s += fence('M148,556 L352,556 L352,634 L148,634 Z', ink);
    s += `<path d="M184,616 L206,584 L232,616 Z M236,616 L254,596 L272,616 Z" fill="#B88A58" ${stroke(ink, 3)}/>`;
    s += `<g transform="translate(298 598)"><rect x="-22" y="2" width="44" height="14" rx="6" fill="#4C4C4C" ${stroke(ink, 2.8)}/><rect x="-16" y="-14" width="26" height="18" rx="3" fill="#F2BE3C" ${stroke(ink, 2.8)}/><rect x="-11" y="-10" width="11" height="9" fill="#CDEBE6" stroke="${ink}" stroke-width="2"/><path d="M8,-8 L30,-26 L40,-12" fill="none" ${stroke(ink, 4.5)}/><path d="M36,-14 l10,0 l-2,12 l-10,0 Z" fill="#F2BE3C" ${stroke(ink, 2.6)}/></g>`;
    s += `<path d="M156,596 C120,596 98,574 82,548" fill="none" stroke="#A97F4F" stroke-width="7" stroke-linecap="round" opacity=".8" stroke-dasharray="1 11"/>`;
    s += tree(404, 592, 17, ink) + tree(430, 614, 14, ink) + tree(720, 600, 18, ink) + tree(760, 560, 16, ink);
  } else {
    // bridge over the creek, side road, south houses
    const side = 'M54,-10 L54,260 C54,290 54,330 54,420 L54,650';
    s += road(side, ink, 20);
    s += `<g><rect x="30" y="232" width="48" height="52" fill="#B3B6B9" ${stroke(ink, 3.5)}/><path d="M30,240 h48 M30,276 h48" stroke="${ink}" stroke-width="4"/></g>`;
    const south = [[150, 570, 3], [216, 570, 0], [282, 574, 5], [348, 574, 1], [680, 560, 4], [746, 540, 2]];
    s += road('M-10,622 L330,622 C480,622 620,626 700,610 L800,590', ink, 20);
    for (const [x, y] of south) s += lawn(x - 8, y - 8, 62, 56);
    for (const [x, y, c] of south) s += house(x, y, 46, 30, ROOFS[c], ink);
    s += tree(420, 592, 17, ink) + tree(500, 596, 15, ink) + tree(600, 578, 17, ink);
  }
  return s;
}

// ───────────────────────────────────────────────────────── case 2: reserve
function fern(x, y, s, ink) {
  let out = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, L = 21 * s, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * .85;
    const cx = x + Math.cos(a + .5) * L * .6, cy = y + Math.sin(a + .5) * L * .6;
    out += `<path d="M${r1(x)},${r1(y)} Q${r1(cx)},${r1(cy)} ${r1(ex)},${r1(ey)}" fill="none" stroke="#2E6E3A" stroke-width="4.6" stroke-linecap="round"/>`
      + `<path d="M${r1(x)},${r1(y)} Q${r1(cx)},${r1(cy)} ${r1(ex)},${r1(ey)}" fill="none" stroke="#7DC06A" stroke-width="2" stroke-linecap="round"/>`;
  }
  return `<g>${out}<circle cx="${x}" cy="${y}" r="3.2" fill="#2E6E3A"/></g>`;
}
function tuft(x, y) {
  return `<path d="M${x},${y} l-3,-9 M${x},${y} l3,-9 M${x},${y} l0,-11" fill="none" stroke="#B5583F" stroke-width="2.6" stroke-linecap="round"/><path d="M${x - 5},${y} h10" stroke="#6E8F3D" stroke-width="3" stroke-linecap="round"/>`;
}
function blobPath(cx, cy, rx, ry, seed, wob = .09) {
  const R = rng(seed), n = 12, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (R() - .5) * 2 * wob; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  let d = `M${r1((pts[0][0] + pts[n - 1][0]) / 2)},${r1((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; d += ` Q${r1(p[0])},${r1(p[1])} ${r1((p[0] + q[0]) / 2)},${r1((p[1] + q[1]) / 2)}`; }
  return d + ' Z';
}
// Pond geometry for the reserve map (the water surface). story.js draws the case-2 story on exactly these.
export const RESERVE_PONDS = { dam: { cx: 275, cy: 195, rx: 150, ry: 100 }, fern: { cx: 470, cy: 470, rx: 145, ry: 88 }, salt: { cx: 780, cy: 215, rx: 132, ry: 82 } };
function reserve(ink) {
  const p = 'r';
  let s = defs(p) + landBase(p);

  // paddock
  s += `<rect x="22" y="22" width="450" height="316" rx="16" fill="#D9EAA8" ${stroke(ink, 3.5)}/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="24" y="${34 + i * 44}" width="446" height="22" fill="#fff" opacity=".18"/>`;
  s += fence('M34,34 L460,34 L460,326 L34,326 Z', ink);
  // track and boardwalk
  const track = 'M690,640 C690,560 686,470 676,400 C668,350 648,332 600,322 C540,312 500,308 470,306';
  s += `<path d="${track}" fill="none" ${stroke(ink, 20)}/><path d="${track}" fill="none" stroke="#E5D2A0" stroke-width="14" stroke-linecap="round"/><path d="${track}" fill="none" stroke="#B58B5A" stroke-width="3" stroke-dasharray="3 12" stroke-linecap="round"/>`;
  s += `<rect x="462" y="286" width="20" height="40" rx="3" fill="#C99A5B" ${stroke(ink, 3)}/>`;

  // fern gully (shady)
  s += `<path d="${blobPath(460, 500, 205, 150, 7, .06)}" fill="#8DBD7A" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(460, 500, 175, 125, 11, .06)}" fill="#7DB06C" opacity=".8"/>`;
  // saltmarsh
  const marsh = 'M624,170 C628,84 722,46 826,48 C930,50 1004,76 1004,76 L1004,392 C900,400 780,382 706,356 C646,334 618,246 624,170 Z';
  s += `<path d="${marsh}" fill="${C.marsh}" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${marsh}" fill="url(#wm-${p}-dot)"/>`;
  // tidal creek out to the east
  const tide = 'M860,236 C920,244 950,290 1010,296';
  s += `<path d="${tide}" fill="none" ${stroke(ink, 26)}/><path d="${tide}" fill="none" stroke="#8FD7DA" stroke-width="18" stroke-linecap="round"/><path d="${tide}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 16" opacity=".6"/>`;
  // salt pool: mud rim + salty water
  const P = RESERVE_PONDS;
  s += `<path d="${blobPath(P.salt.cx, P.salt.cy, P.salt.rx + 20, P.salt.ry + 16, 3, .05)}" fill="${C.mud}" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.salt.cx, P.salt.cy, P.salt.rx, P.salt.ry, 5, .05)}" fill="#8FD7DA" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.salt.cx, P.salt.cy, P.salt.rx - 24, P.salt.ry - 22, 9, .05)}" fill="#6EC4CE" opacity=".85"/>`;
  s += ripples([[724, 205, 54], [800, 245, 50], [760, 175, 46], [830, 190, 40]], 0);
  // farm dam
  s += `<path d="${blobPath(P.dam.cx, P.dam.cy, P.dam.rx + 20, P.dam.ry + 20, 21, .04)}" fill="#C9A877" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.dam.cx, P.dam.cy, P.dam.rx, P.dam.ry, 4, .04)}" fill="#7FC6DD" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.dam.cx, P.dam.cy, P.dam.rx - 28, P.dam.ry - 26, 8, .04)}" fill="#5DADCF" opacity=".85"/>`;
  s += ripples([[210, 185, 54], [330, 235, 50], [270, 140, 46], [340, 160, 40]], 2);
  // fern pond (dark, shaded)
  s += `<path d="${blobPath(P.fern.cx, P.fern.cy, P.fern.rx + 20, P.fern.ry + 18, 14, .04)}" fill="#6E9F62" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.fern.cx, P.fern.cy, P.fern.rx, P.fern.ry, 2, .04)}" fill="#3D8EA0" ${stroke(ink, 3.5)}/>`;
  s += `<path d="${blobPath(P.fern.cx, P.fern.cy, P.fern.rx - 28, P.fern.ry - 24, 6, .04)}" fill="#2F7A8C" opacity=".9"/>`;
  s += ripples([[420, 462, 46], [500, 492, 44], [466, 440, 40]], 1);

  // boardwalk across the saltmarsh
  const walk = 'M650,336 C700,334 760,320 830,316 C890,312 940,322 1010,330';
  s += `<path d="${walk}" fill="none" ${stroke(ink, 24)}/><path d="${walk}" fill="none" stroke="#D4A767" stroke-width="18" stroke-linecap="butt"/><path d="${walk}" fill="none" stroke="${ink}" stroke-width="18" stroke-dasharray="2.4 10" opacity=".5"/>`;

  // barn and tank in the paddock corner
  s += `<g><rect x="58" y="56" width="84" height="54" rx="5" fill="#2B3A2A" opacity=".16" transform="translate(4 5)"/><rect x="58" y="56" width="84" height="54" rx="5" fill="#D9694F" ${stroke(ink, 3.2)}/><rect x="60" y="83" width="80" height="25" fill="#2B2B2B" opacity=".13"/><line x1="60" y1="83" x2="140" y2="83" ${stroke(ink, 2.6)}/></g>`;
  s += `<circle cx="168" cy="82" r="14" fill="#CFD6DA" ${stroke(ink, 3)}/><circle cx="168" cy="82" r="6" fill="#fff" opacity=".6"/>`;
  // cattle
  s += cow(100, 250, -14, 1, '#2E3B40') + cow(394, 90, 160, 1) + cow(62, 160, 190, .95) + cow(150, 312, 18, .95);
  // trees: paddock edge and gully
  for (const [x, y, r] of [[500, 60, 20], [532, 120, 17], [504, 214, 19], [560, 270, 18], [36, 370, 16], [90, 372, 19], [150, 380, 16], [230, 376, 18], [296, 372, 16], [296, 440, 20], [270, 520, 19], [304, 596, 18], [380, 600, 18], [500, 604, 20], [590, 566, 19], [610, 480, 20], [596, 396, 18], [380, 396, 17], [540, 396, 16], [560, 610, 16]]) s += tree(x, y, r, ink, '#5F9F52');
  for (const [x, y, sc] of [[372, 440, 1], [566, 452, 1.05], [378, 510, 1], [556, 506, 1], [470, 568, 1.1], [420, 410, .95], [524, 414, 1], [336, 480, .9], [606, 536, .9], [430, 556, .9]]) s += fern(x, y, sc, ink);
  // saltmarsh tufts
  for (const [x, y] of [[660, 120], [700, 160], [676, 232], [690, 292], [712, 262], [660, 188], [880, 110], [930, 150], [960, 200], [920, 90], [870, 300], [940, 360], [900, 360], [760, 372], [700, 372], [680, 316], [850, 140], [715, 100], [820, 120], [980, 120]]) s += tuft(x, y);
  return s;
}

export function baseMap(variant, ink = '#1F4E52') {
  if (variant === 'reserve') return reserve(ink);
  return lagoon(variant === 'lagoon-closed' ? 'lagoon-closed' : 'lagoon-open', ink);
}

// ───────────────────────────────────────────────────────── per-site art
const FISH = '#2E3B40';
function deadFish(x, y, rot, sc = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">`
    + `<ellipse cx="0" cy="3" rx="17" ry="7" fill="#1F3A4A" opacity=".18"/>`
    + `<path d="M-14,0 Q-2,-9 14,0 Q-2,9 -14,0 Z" fill="#C5D2D8" stroke="${FISH}" stroke-width="2.6" stroke-linejoin="round"/>`
    + `<path d="M-12,-1 Q-2,-6 12,-1 Q-2,2 -12,-1 Z" fill="#fff"/>`
    + `<path d="M-13,0 L-22,-6 L-22,6 Z" fill="#9FB1BA" stroke="${FISH}" stroke-width="2.4" stroke-linejoin="round"/>`
    + `<path d="M7,-3 l4,4 m0,-4 l-4,4" stroke="${FISH}" stroke-width="2" stroke-linecap="round"/></g>`;
}
function leaf(x, y, rot, col) {
  return `<path d="M0,0 q6,-8 16,-3 q-4,9 -16,3 Z" transform="translate(${x} ${y}) rotate(${rot})" fill="${col}" stroke="#4E3A22" stroke-width="1.8" stroke-linejoin="round"/>`;
}
function sparkle(x, y, s, delay) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path class="wm-twinkle" style="animation-delay:-${delay}s" d="M0,-9 Q1.5,-1.5 9,0 Q1.5,1.5 0,9 Q-1.5,1.5 -9,0 Q-1.5,-1.5 0,-9 Z" fill="#fff" stroke="#8FD0EA" stroke-width="1.4" stroke-linejoin="round"/></g>`;
}

export function siteArt(flags, x, y, uid = 's') {
  const f = new Set(Array.isArray(flags) ? flags : []);
  const id = `wm-sa-${String(uid).replace(/[^A-Za-z0-9_-]/g, '')}`;
  const R = rng(hash(uid));
  const grad = (name, col, a0, a1 = 0, r = '50%') => `<radialGradient id="${id}-${name}" cx="50%" cy="50%" r="${r}"><stop offset="0" stop-color="${col}" stop-opacity="${a0}"/><stop offset=".72" stop-color="${col}" stop-opacity="${r1(a0 * .85)}"/><stop offset="1" stop-color="${col}" stop-opacity="${a1}"/></radialGradient>`;
  let d = '', b = '';
  if (f.has('clear')) { d += grad('clear', '#D9F6FF', .55); b += `<circle r="86" fill="url(#${id}-clear)"/>` + sparkle(-42, -22, 1, 0) + sparkle(36, -36, .8, 1.4) + sparkle(52, 24, 1.05, 2.4) + sparkle(-26, 40, .75, .8); }
  if (f.has('tinge')) { d += grad('tinge', '#86C95A', .5); b += `<circle r="84" fill="url(#${id}-tinge)"/>`; }
  if (f.has('tea')) { d += grad('tea', '#B98E50', .58); b += `<circle r="86" fill="url(#${id}-tea)"/>`; }
  if (f.has('brown')) { d += grad('brown', '#98672F', .82); b += `<path d="${blobPath(0, 0, 88, 76, hash(uid) % 97 + 1, .1)}" fill="url(#${id}-brown)"/>`; }
  if (f.has('bloom')) {
    d += grad('bloom', '#5FCB2E', .95);
    b += `<path d="${blobPath(0, 0, 86, 60, hash(uid) % 89 + 3, .12)}" fill="url(#${id}-bloom)"/><path d="${blobPath(0, 0, 62, 40, hash(uid) % 71 + 2, .15)}" fill="#46A92A" opacity=".5"/>`;
    for (let i = 0; i < 26; i++) { const a = R() * 6.283, rr = Math.sqrt(R()) * 66; b += `<circle cx="${r1(Math.cos(a) * rr)}" cy="${r1(Math.sin(a) * rr * .65)}" r="${r1(2.4 + R() * 3.4)}" fill="${R() > .5 ? '#2F7F1D' : '#C8F08A'}" opacity=".85"/>`; }
  }
  if (f.has('film')) {
    b += `<path d="${blobPath(0, 0, 80, 62, hash(uid) % 53 + 4, .1)}" fill="none" stroke="#6DBB3F" stroke-width="13" opacity=".55" stroke-dasharray="46 14" stroke-linecap="round"/>`;
    for (let i = 0; i < 12; i++) { const a = R() * 6.283; b += `<circle cx="${r1(Math.cos(a) * 80)}" cy="${r1(Math.sin(a) * 62)}" r="${r1(2.5 + R() * 2.5)}" fill="#3E8E22" opacity=".8"/>`; }
  }
  if (f.has('scum')) {
    for (let i = 0; i < 9; i++) { const a = R() * 6.283, rr = Math.sqrt(R()) * 58; b += `<ellipse cx="${r1(Math.cos(a) * rr)}" cy="${r1(Math.sin(a) * rr * .8)}" rx="${r1(8 + R() * 8)}" ry="${r1(4 + R() * 4)}" fill="#D7E58A" stroke="#6C8F2A" stroke-width="1.8" opacity=".9"/>`; }
  }
  if (f.has('plume')) {
    d += `<linearGradient id="${id}-plume" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C4F22" stop-opacity=".92"/><stop offset=".6" stop-color="#A97B43" stop-opacity=".7"/><stop offset="1" stop-color="#B98E50" stop-opacity=".12"/></linearGradient>`;
    b += `<path d="M-20,-96 C-14,-70 -40,-50 -34,-24 C-28,2 -4,14 8,40 C18,60 4,76 20,88 C32,68 56,56 50,30 C44,4 20,-10 26,-40 C30,-62 16,-80 20,-96 Z" fill="url(#${id}-plume)"/>`
      + `<path d="M-6,-80 C0,-56 -22,-40 -14,-18 M16,-70 C24,-46 6,-30 14,-6" fill="none" stroke="#6B4318" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
  }
  if (f.has('debris')) {
    const cols = ['#7A8F3A', '#9A7A3A', '#6F8E4E'];
    for (let i = 0; i < 9; i++) { const a = R() * 6.283, rr = 20 + R() * 58; b += leaf(r1(Math.cos(a) * rr), r1(Math.sin(a) * rr * .8), r1(R() * 360), cols[i % 3]); }
    b += `<path d="M-48,26 l12,-4 M-40,30 l11,-6 M30,-44 l12,3 M36,-38 l10,6" stroke="#8FA83A" stroke-width="3.4" stroke-linecap="round"/>`
      + `<rect x="34" y="22" width="9" height="15" rx="2" fill="#E8775A" stroke="#2E3B40" stroke-width="2" transform="rotate(24 38 30)"/><rect x="-52" y="-24" width="13" height="9" rx="2" fill="#9DBBD9" stroke="#2E3B40" stroke-width="2" transform="rotate(-18 -46 -20)"/>`;
  }
  if (f.has('sandbar')) {
    b += `<path d="M40,-64 C58,-30 58,30 40,64" fill="none" stroke="#37474F" stroke-width="22" stroke-linecap="round"/><path d="M40,-64 C58,-30 58,30 40,64" fill="none" stroke="#F3E3B2" stroke-width="15" stroke-linecap="round"/><path d="M44,-34 C50,-10 50,12 44,34" fill="none" stroke="#E2CC92" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  if (f.has('deadfish')) { b += deadFish(-34, 14, -18) + deadFish(18, -16, 24, .95) + deadFish(-6, -38, 170, .85) + deadFish(30, 36, -152, .9); }
  if (f.has('cattle')) {
    b += `<path d="${blobPath(-80, 44, 30, 18, 17, .15)}" fill="#8A6038" opacity=".7"/>` + cow(-88, 38, 28, .9) + cow(-62, 62, -10, .85);
  }
  return `<g class="wm-site-art" transform="translate(${x} ${y})" pointer-events="none"><defs>${d}</defs>${b}</g>`;
}

// ───────────────────────────────────────────────────────── weather
function cloud(x, y, sc, op = .92, cls = 'wm-drift') {
  const shape = 'M-40,20 C-64,20 -64,-8 -38,-6 C-40,-34 0,-44 14,-22 C30,-42 72,-30 62,-4 C86,-4 88,20 62,20 Z';
  return `<g transform="translate(${x} ${y}) scale(${sc})"><g class="${cls}"><path d="${shape}" transform="translate(16 62)" fill="#2B3A55" opacity=".14"/><path d="${shape}" fill="#fff" stroke="#9FB4C6" stroke-width="3.2" stroke-linejoin="round" opacity="${op}"/></g></g>`;
}
function sun(x, y) {
  let rays = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; rays += `<line x1="${r1(Math.cos(a) * 44)}" y1="${r1(Math.sin(a) * 44)}" x2="${r1(Math.cos(a) * 62)}" y2="${r1(Math.sin(a) * 62)}" stroke="#F4B93A" stroke-width="6" stroke-linecap="round"/>`; }
  return `<g transform="translate(${x} ${y})"><circle r="108" fill="url(#wm-sunglow)" class="wm-pulse"/><g class="wm-spin">${rays}</g><circle r="32" fill="#FFD960" stroke="#C98B1B" stroke-width="4"/><circle cx="-9" cy="-9" r="9" fill="#fff" opacity=".5"/></g>`;
}
export function weatherLayer(icon) {
  const defsW = `<defs><radialGradient id="wm-sunglow"><stop offset="0" stop-color="#FFE58A" stop-opacity=".75"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></radialGradient>`
    + `<pattern id="wm-rainpat" width="56" height="70" patternUnits="userSpaceOnUse"><path d="M10,4 l-5,18 M38,34 l-5,18 M22,50 l-4,14 M50,8 l-4,12" stroke="#EAF5FF" stroke-width="2.6" stroke-linecap="round" opacity=".85"/></pattern></defs>`;
  const tint = (col, op) => `<rect width="${W}" height="${H}" fill="${col}" opacity="${op}" pointer-events="none"/>`;
  let b = '';
  switch (icon) {
    case 'sun': b = tint('#FFE9A8', .07) + sun(930, 64); break;
    case 'sun-cloud': b = tint('#FFE9A8', .05) + sun(930, 64) + cloud(800, 70, .8) + cloud(150, 560, .7, .7, 'wm-drift wm-slow'); break;
    case 'cloud': b = tint('#7C8A99', .17) + cloud(180, 70, 1.05) + cloud(820, 90, .95, .9, 'wm-drift wm-slow') + cloud(520, 590, .9, .85) + cloud(60, 330, .7, .8, 'wm-drift wm-slow'); break;
    case 'rain': b = tint('#5E6F85', .27) + `<g class="wm-rainfall"><rect x="0" y="-70" width="${W}" height="${H + 140}" fill="url(#wm-rainpat)"/></g>` + cloud(170, 60, 1.1, .95) + cloud(640, 50, 1, .95, 'wm-drift wm-slow') + cloud(900, 120, .8, .9); break;
    case 'wind':
      b = tint('#CFE6F2', .06) + `<g class="wm-wind" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8">`
        + `<path d="M40,150 C160,138 260,166 360,150 C410,142 430,120 412,104 C396,92 380,112 394,124"/>`
        + `<path d="M520,70 C640,60 740,86 830,70 C880,62 900,40 884,26 C868,16 854,34 866,44"/>`
        + `<path d="M60,420 C180,408 300,436 420,418 C470,410 494,388 478,372 C462,360 446,380 458,392"/>`
        + `<path d="M560,520 C680,508 790,536 900,518 C950,510 972,490 956,474"/>`
        + `<path d="M120,590 C220,580 300,600 380,588"/></g>`;
      break;
    default: b = '';
  }
  return `<g class="wm-weather" pointer-events="none">${defsW}${b}</g>`;
}

// ───────────────────────────────────────────────────────── idle life
function pelican(x, y, sc, standing, ink = '#2E3B40') {
  const legs = standing ? `<path d="M-5,12 v18 M7,12 v18" stroke="#E0914A" stroke-width="4" stroke-linecap="round"/><path d="M-9,30 h8 M3,30 h8" stroke="#E0914A" stroke-width="4" stroke-linecap="round"/>` : `<ellipse cx="0" cy="16" rx="36" ry="7" fill="#fff" opacity=".45"/>`;
  return `<g transform="translate(${x} ${y}) scale(${sc})"><g class="${standing ? 'wm-sway' : 'wm-bob'}">${legs}`
    + `<path d="M-24,-2 L-40,6 L-24,8 Z" fill="#fff" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`
    + `<ellipse cx="0" cy="0" rx="27" ry="15" fill="#fff" stroke="${ink}" stroke-width="3.2"/>`
    + `<path d="M-19,-3 C-6,-14 14,-12 22,-2 C8,-4 -6,0 -19,-3 Z" fill="#46535C" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M18,-8 C32,-12 36,-24 29,-33" fill="none" stroke="${ink}" stroke-width="13" stroke-linecap="round"/><path d="M18,-8 C32,-12 36,-24 29,-33" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`
    + `<circle cx="30" cy="-35" r="8.5" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="32" cy="-37" r="1.8" fill="${ink}"/>`
    + `<path d="M36,-40 L76,-31 L38,-28 Z" fill="#F2B84B" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/><path d="M38,-28 C50,-14 68,-18 76,-31" fill="#F5A04A" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/></g></g>`;
}
function heron(x, y, sc, ink = '#2E3B40') {
  return `<g transform="translate(${x} ${y}) scale(${sc})"><g class="wm-sway">`
    + `<path d="M-3,10 v34 M5,10 v34" stroke="#C9A24E" stroke-width="3.4" stroke-linecap="round"/><path d="M-9,44 h12 M0,44 h12" stroke="#C9A24E" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M-22,-4 L-36,4 L-20,8 Z" fill="#8FA3B3" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>`
    + `<ellipse cx="0" cy="0" rx="20" ry="12" fill="#A8BAC8" stroke="${ink}" stroke-width="3"/><path d="M-14,-2 C-4,-9 8,-7 14,0" fill="none" stroke="#6F8496" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M13,-6 C26,-10 22,-24 14,-30 C8,-36 14,-44 22,-46" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M13,-6 C26,-10 22,-24 14,-30 C8,-36 14,-44 22,-46" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="23" cy="-47" r="6.5" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="25" cy="-48" r="1.6" fill="${ink}"/><path d="M28,-49 L52,-44 L28,-42 Z" fill="#F2B84B" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/></g></g>`;
}
function duck(x, y, sc, ink = '#2E3B40') {
  return `<g transform="translate(${x} ${y}) scale(${sc})"><g class="wm-bob"><ellipse cx="0" cy="8" rx="20" ry="5" fill="#fff" opacity=".45"/><path d="M-16,0 Q-6,-10 8,-4 Q18,-4 16,4 Q0,12 -16,0 Z" fill="#B58B5A" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/><circle cx="12" cy="-8" r="6" fill="#4C8F6A" stroke="${ink}" stroke-width="2.8"/><path d="M17,-8 l8,2 l-8,3 Z" fill="#F2B84B" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><circle cx="13" cy="-9" r="1.3" fill="${ink}"/></g></g>`;
}
export function lifeLayer(variant) {
  let b = '';
  if (variant === 'reserve') b = heron(705, 262, .95) + duck(300, 262, .8) + duck(332, 270, .7);
  else if (variant === 'lagoon-closed') b = pelican(916, 430, .8, true) + pelican(690, 270, .75, false) + duck(400, 470, .8) + duck(428, 480, .7);
  else b = pelican(926, 456, .8, true) + pelican(700, 262, .75, false) + duck(380, 478, .8) + duck(410, 488, .7);
  return `<g class="wm-life" pointer-events="none">${b}</g>`;
}
