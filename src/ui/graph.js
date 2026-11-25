// Line graph of readings over days, for one site and one measurement.
import { h } from './dom.js';
import { openDialog } from './dialog.js';
import { paramInfo, formatValue } from '../logic/readings.js';
import { GUIDE } from '../data/cases.js';

const GRAPHABLE = ['temp', 'ph', 'phStrip', 'sal', 'do', 'turb', 'clarity', 'n', 'p'];
const FROM_ZERO = new Set(['sal', 'do', 'turb', 'clarity', 'n', 'p']);
const NS = 'http://www.w3.org/2000/svg';

export function graphPoints(c, state, site, param) {
  return state.entries.filter(e => e.site === site && e.param === param).map(e => ({ day: e.day, raw: e.value, y: e.value === '100+' ? 100 : e.value }))
    .filter(p => typeof p.y === 'number').sort((a, b) => a.day - b.day);
}
function guideLine(c, site, param) {
  const w = c.sites.find(s => s.id === site)?.water, g = GUIDE[w];
  if (!g) return null;
  if (param === 'n') return { y: g.n, label: `Guide ${g.n}` };
  if (param === 'p') return { y: g.p, label: `Guide ${g.p}` };
  if (param === 'do') return { y: g.doLow, label: 'Low: under 4' };
  return null;
}
// Round tick values: 0, 20, 40 ... never 89.9, 71.2.
export function niceTicks(lo, hi, n = 5) {
  const range = hi - lo || 1, raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= raw) || raw;
  const start = Math.floor(lo / step) * step, ticks = [];
  for (let v = start; v <= hi + step * 0.999; v += step) { ticks.push(Math.round(v * 1e6) / 1e6); if (v >= hi) break; }
  return ticks;
}

export function drawGraph(c, state, site, param) {
  const pts = graphPoints(c, state, site, param), info = paramInfo(param), gl = guideLine(c, site, param);
  const W = 560, H = 310, L = 66, R = 22, T = 30, B = 54, n = c.days;
  if (!pts.length) return h('p.nb-empty', 'No readings yet for this site and measurement. Test it on more than one day to see a graph.');
  let lo = Math.min(...pts.map(p => p.y), gl ? gl.y : Infinity), hi = Math.max(...pts.map(p => p.y), gl ? gl.y : -Infinity);
  if (FROM_ZERO.has(param)) lo = 0; else { const pad = Math.max((hi - lo) * 0.25, 0.5); lo -= pad; hi += pad; }
  hi += (hi - lo) * 0.1;
  const ticks = niceTicks(lo, hi, 5); lo = Math.min(lo, ticks[0]); hi = ticks[ticks.length - 1];
  const colW = (W - L - R) / n, X = d => L + (d - 0.5) * colW, Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'graph-svg'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${info.label} at site ${site}: ` + pts.map(p => `Day ${p.day} ${p.raw}`).join(', '));
  let s = `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="#fff" stroke="#1F3B2D" stroke-width="2"/>`;
  for (let d = 1; d <= n; d++) if (c.weather[d - 1]?.icon === 'rain') s += `<rect x="${X(d) - colW / 2}" y="${T}" width="${colW}" height="${H - T - B}" fill="#9BD9EF" opacity=".35"/><text x="${X(d)}" y="${T + 16}" text-anchor="middle" class="g-rain">Rain</text>`;
  for (const v of ticks) { const y = Y(v); s += `<path d="M${L} ${y}H${W - R}" stroke="#1F3B2D" stroke-opacity=".14" stroke-width="2"/><text x="${L - 8}" y="${y + 5}" text-anchor="end" class="g-tick">${v}</text>`; }
  for (let d = 1; d <= n; d++) s += `<text x="${X(d)}" y="${H - B + 24}" text-anchor="middle" class="g-tick">Day ${d}</text><path d="M${X(d)} ${H - B}v6" stroke="#1F3B2D" stroke-width="2"/>`;
  s += `<text x="16" y="${(T + H - B) / 2}" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle" class="g-axis">${info.label}${info.unit ? ' (' + info.unit + ')' : ''}</text>`;
  if (gl) s += `<path d="M${L} ${Y(gl.y)}H${W - R}" stroke="#B3401C" stroke-width="3" stroke-dasharray="8 6"/><text x="${W - R - 6}" y="${Y(gl.y) - 8}" text-anchor="end" class="g-guide">${gl.label}</text>`;
  for (let i = 1; i < pts.length; i++) s += `<path d="M${X(pts[i - 1].day)} ${Y(pts[i - 1].y)}L${X(pts[i].day)} ${Y(pts[i].y)}" stroke="#1F4E52" stroke-width="4" stroke-linecap="round" ${pts[i].day - pts[i - 1].day > 1 ? 'stroke-dasharray="3 9"' : ''} fill="none"/>`;
  for (const p of pts) s += `<circle cx="${X(p.day)}" cy="${Y(p.y)}" r="7" fill="#F2A07F" stroke="#1F3B2D" stroke-width="3"/><text x="${X(p.day)}" y="${Y(p.y) - 14}" text-anchor="middle" class="g-val">${typeof p.raw === 'number' ? formatValue(param, p.raw) : p.raw}</text>`;
  svg.innerHTML = s;
  return svg;
}

export function openGraph(c, state, startSite) {
  let site = startSite && c.sites.some(s => s.id === startSite) ? startSite : c.sites.find(s => c.id === 'which-pond' ? s.id === 'B' : s.id === 'C')?.id || c.sites[0].id;
  const measures = GRAPHABLE.filter(p => (p === 'n' || p === 'p') ? c.tools.includes('nutrients') : c.tools.includes(p));
  const best = () => measures.map(p => [p, graphPoints(c, state, site, p).length]).sort((a, b) => b[1] - a[1])[0][0];
  let param = best();
  const chart = h('div.graph-chart'), sSel = h('select#g-site', { 'aria-label': 'Site' }), pSel = h('select#g-param', { 'aria-label': 'Measurement' });
  c.sites.forEach(s => sSel.append(h('option', { value: s.id, selected: s.id === site }, `${s.id} · ${s.name}`)));
  measures.forEach(p => pSel.append(h('option', { value: p, selected: p === param }, paramInfo(p).label)));
  const redraw = () => { chart.replaceChildren(drawGraph(c, state, site, param)); };
  sSel.onchange = () => { site = sSel.value; param = best(); pSel.value = param; redraw(); };
  pSel.onchange = () => { param = pSel.value; redraw(); };
  redraw();
  return openDialog({ title: 'Graph your readings', wide: true, cls: 'graph-dlg', body: [h('p.lead', 'Pick a site and a measurement. Test on different days to see how the water changes.'), h('div.graph-pick', h('label', 'Site ', sSel), h('label', 'Measurement ', pSel)), chart] });
}
