// Instrument close-ups. Each opens a "bench" dialog with an authored SVG, a short animation (<= 1.2 s, skippable by click,
// instant under reduced motion), and records the reading only when it finishes. Cancelling costs nothing.
import { h, sleep, reduced } from './dom.js';
import { icon } from './icons.js';
import { openDialog } from './dialog.js';
import { formatValue, paramInfo } from '../logic/readings.js';
import { TOOLS } from '../data/cases.js';

export const STRIP_COLORS = { 6: '#E8A33D', 6.5: '#D9C93A', 7: '#9BC53D', 7.5: '#4FB06D', 8: '#2FA3A0', 8.5: '#3A6FB5' };
const swatchKey = v => String(v);
const ease = t => 1 - Math.pow(1 - t, 3);
const NS = 'http://www.w3.org/2000/svg';

// Sample colour in beakers: only follows the site's look once the student has looked there.
export const sampleTint = flags => {
  const f = flags || [];
  if (f.includes('bloom')) return '#7CC24E';
  if (f.includes('brown') || f.includes('plume')) return '#B99A68';
  if (f.includes('tea')) return '#C9A877';
  if (f.includes('tinge')) return '#8FD0BE';
  return '#8FD3EE';
};

function lcd(x, y, w, hh, text, unit, sub) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" fill="#CFE5D3" stroke="#1F3B2D" stroke-width="3"/>
    <text x="${x + w - 12}" y="${y + hh * 0.7}" text-anchor="end" class="lcd-ghost" font-size="${hh * 0.5}">888.8</text>
    <text x="${x + w - 12}" y="${y + hh * 0.7}" text-anchor="end" class="lcd-live" font-size="${hh * 0.5}" id="lcd-val">${text}</text>
    ${unit ? `<text x="${x + 10}" y="${y + 16}" class="lcd-unit" font-size="13">${unit}</text>` : ''}${sub ? `<text x="${x + 10}" y="${y + hh - 8}" class="lcd-unit" font-size="12">${sub}</text>` : ''}`;
}

// ───────────────────────────────────────── shared bench shell
function shell(ctx, { svg, controls, caption, skippable = true, wide = false }) {
  let closeResolve; const done = new Promise(r => { closeResolve = r; });
  const state = { committed: false, skipped: false, closed: false };
  const stage = h('div.bench-stage', { html: svg });
  const cap = h('p.bench-cap', { 'aria-live': 'polite' }, caption || '');
  const hint = skippable ? h('p.bench-hint', 'Click anywhere to skip the animation') : null;
  const body = h('div.bench', h('div.bench-top', h('span.bench-site', h('span', { html: icon('pin', 18) }), `${ctx.siteId} · ${ctx.siteName}`), h('span.bench-day', `Day ${ctx.day}`)), stage, cap, controls || null, hint);
  const dlg = openDialog({ title: ctx.tool.name, body, cls: `bench-dlg${wide ? ' wide' : ''}`, onClose: () => { state.closed = true; state.pendingRes?.(); closeResolve(state.committed); } });
  if (skippable) body.addEventListener('pointerdown', e => { if (!e.target.closest('button')) state.skipped = true; });
  const wait = ms => (state.skipped || state.closed || ctx.reduced ? Promise.resolve() : sleep(ms));
  // Reading is kept only when the student presses the button: tokens are spent then.
  const finish = (readoutEl, savedText, label = 'Save to notebook') => new Promise(res => {
    if (state.closed) return res();
    state.pendingRes = res;
    hint?.remove();
    const btn = h('button.btn.primary.big#btn-save-reading', { type: 'button', 'data-autofocus': '', onclick: async () => {
      if (state.committed) return;
      btn.disabled = true;
      if (!ctx.commit()) { cap.textContent = 'Something went wrong. Try again.'; btn.disabled = false; return; }
      state.committed = true;
      cap.textContent = savedText || 'Saved in your notebook.';
      ctx.sfx?.right?.();
      if (!ctx.reduced) await flyToNotebook(btn, ctx.flyText || '');
      await (ctx.reduced ? sleep(500) : wait(150));
      dlg.close(); res();
    } }, h('span', { html: icon('check', 24) }), label);
    body.append(h('div.bench-save', btn));
    btn.focus();
  });
  return { dlg, stage, cap, body, state, wait, finish, $: s => stage.querySelector(s), done };
}

async function flyToNotebook(fromEl, text) {
  const target = document.querySelector('[data-tab="notebook"]');
  if (!target || !fromEl.getBoundingClientRect) return;
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const chip = h('div.fly-chip', { 'aria-hidden': 'true' }, text);
  Object.assign(chip.style, { left: `${a.left + a.width / 2}px`, top: `${a.top + a.height / 2}px` });
  document.body.append(chip);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = chip.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: .2 }], { duration: 520, easing: 'cubic-bezier(.5,0,.8,.4)' });
  await anim.finished.catch(() => {});
  chip.remove();
  target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
}

async function countUp(el, from, to, dec, ms, B) {
  if (B.state.skipped || ctx0(B).reduced) { el.textContent = to.toFixed(dec); return; }
  const t0 = performance.now(); let lastInt = null;
  await new Promise(res => {
    const step = now => {
      if (B.state.skipped || B.state.closed) { el.textContent = to.toFixed(dec); return res(); }
      const k = Math.min(1, (now - t0) / ms), v = from + (to - from) * ease(k);
      el.textContent = v.toFixed(dec);
      const iv = Math.round(v * 2); if (iv !== lastInt) { lastInt = iv; B.ctx.sfx?.tick?.(); }
      if (k < 1) requestAnimationFrame(step); else { el.textContent = to.toFixed(dec); res(); }
    };
    requestAnimationFrame(step);
  });
}
const ctx0 = B => B.ctx;

// ───────────────────────────────────────── digital meters: thermometer, pH meter, oxygen meter, turbidity meter
function meterSvg(kind, tint, unit, from, dec) {
  const water = `<rect x="145" y="190" width="110" height="72" rx="6" fill="${tint}" opacity=".95"/><path d="M147 190c14-5 24 5 36 0s24 5 36 0 24 3 34 0" fill="none" stroke="#fff" stroke-width="3" opacity=".7" class="b-ripple"/>`;
  const beaker = `<path d="M138 152v110a12 12 0 0 0 12 12h100a12 12 0 0 0 12-12V152" fill="#fff" fill-opacity=".35" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${water}<path d="M138 152h-8M262 152h8M138 190h12M138 232h12" stroke="#1F3B2D" stroke-width="3" stroke-linecap="round"/>`;
  const table = `<path d="M30 276h340" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round"/><path d="M50 288h300" stroke="#1F3B2D" stroke-width="3" stroke-linecap="round" opacity=".25"/>`;
  if (kind === 'turb') {
    return `<svg viewBox="0 0 400 300" class="bench-svg" role="img" aria-label="A turbidity meter with a sample vial">${table}
      <g class="vial"><path d="M185 20h30v10l-3 3v50a12 12 0 0 1-12 12h-0a12 12 0 0 1-12-12V33l-3-3Z" fill="#fff" fill-opacity=".5" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><path d="M188 52h24v32a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10Z" fill="${tint}"/></g>
      <g><rect x="120" y="116" width="160" height="150" rx="22" fill="#F2A07F" stroke="#1F3B2D" stroke-width="4"/><rect x="176" y="106" width="48" height="22" rx="7" fill="#2B3A33" stroke="#1F3B2D" stroke-width="4"/>
      ${lcd(138, 140, 124, 70, from.toFixed(dec), unit, 'turbidity')}
      <circle cx="160" cy="236" r="9" fill="#fff" stroke="#1F3B2D" stroke-width="3.5"/><circle cx="200" cy="236" r="9" fill="#fff" stroke="#1F3B2D" stroke-width="3.5"/><circle cx="240" cy="236" r="9" fill="#FFD04D" stroke="#1F3B2D" stroke-width="3.5"/></g></svg>`;
  }
  const probes = {
    temp: `<rect x="195" y="130" width="10" height="112" rx="5" fill="#C7CDD2" stroke="#1F3B2D" stroke-width="3.5"/><rect x="195" y="196" width="10" height="14" fill="#E8584A" stroke="#1F3B2D" stroke-width="3"/>`,
    ph: `<rect x="193" y="130" width="14" height="96" rx="5" fill="#E9F2E4" stroke="#1F3B2D" stroke-width="3.5"/><circle cx="200" cy="238" r="12" fill="#CFE8D8" stroke="#1F3B2D" stroke-width="3.5"/>`,
    do: `<rect x="194" y="130" width="12" height="100" rx="5" fill="#C7CDD2" stroke="#1F3B2D" stroke-width="3.5"/><rect x="190" y="224" width="20" height="26" rx="8" fill="#4A9BD2" stroke="#1F3B2D" stroke-width="3.5"/>`,
  };
  const body = { temp: '#F2A07F', ph: '#CFE8D8', do: '#BFD9EE' }[kind];
  const lab = { temp: 'temperature', ph: 'pH', do: 'oxygen' }[kind];
  return `<svg viewBox="0 0 400 300" class="bench-svg" role="img" aria-label="A digital ${lab} meter with its probe over a beaker of sample water">${table}${beaker}
    <g class="probe">${probes[kind]}</g>
    <rect x="150" y="8" width="100" height="126" rx="20" fill="${body}" stroke="#1F3B2D" stroke-width="4"/>
    ${lcd(160, 20, 80, 56, from.toFixed(dec), unit, '')}
    <circle cx="176" cy="104" r="9" fill="#fff" stroke="#1F3B2D" stroke-width="3.5"/><circle cx="224" cy="104" r="9" fill="#FFD04D" stroke="#1F3B2D" stroke-width="3.5"/></svg>`;
}

async function meterBench(ctx) {
  const kind = ctx.toolId, info = paramInfo(kind), dec = info.decimals, v = ctx.value;
  const unit = info.unit || (kind === 'ph' ? 'pH' : '');
  const from = kind === 'ph' ? 7 : 0;
  const B = shell(ctx, { svg: meterSvg(kind, ctx.tint, unit, from, dec), caption: kind === 'turb' ? 'Lowering the sample vial into the meter…' : 'Dipping the probe into the sample…' });
  B.ctx = ctx;
  const val = B.$('#lcd-val'), probe = B.$('.probe'), vial = B.$('.vial');
  const mover = probe || vial;
  mover.style.transform = `translateY(${kind === 'turb' ? -70 : -78}px)`;
  await B.wait(120);
  mover.style.transition = ctx.reduced || B.state.skipped ? 'none' : 'transform .5s ease-in-out';
  mover.style.transform = 'translateY(0)';
  ctx.sfx?.pour?.();
  await B.wait(520);
  ctx.sfx?.bubble?.();
  B.cap.textContent = 'Reading…';
  await countUp(val, from, v, dec, 650, B);
  if (B.state.closed) return B.done;
  ctx.sfx?.beep?.();
  B.cap.textContent = `${info.label}: ${formatValue(kind, v)} ${unit === 'pH' ? '' : unit}`.trim();
  val.classList.add('settled');
  ctx.flyText = `${formatValue(kind, v)} ${info.unit}`.trim();
  await B.wait(200);
  await B.finish(val, `${info.label} ${formatValue(kind, v)} ${info.unit}`.trim() + ' saved in your notebook.');
  return B.done;
}

// ───────────────────────────────────────── refractometer
function refractSvg() {
  let ticks = '';
  for (let i = 0; i <= 40; i += 2) {
    const y = 250 - i * 5, major = i % 10 === 0;
    ticks += `<path d="M86 ${y}h${major ? 26 : 14}" stroke="#1F3B2D" stroke-width="${major ? 3.5 : 2.2}" stroke-linecap="round"/>`;
    if (major) ticks += `<text x="122" y="${y + 6}" class="ref-num">${i}</text>`;
  }
  return `<svg viewBox="0 0 400 300" class="bench-svg" role="img" aria-label="Looking through a refractometer eyepiece. A scale from 0 to 40 parts per thousand and a boundary between blue and white.">
    <defs><clipPath id="ref-clip"><circle cx="200" cy="150" r="132"/></clipPath><radialGradient id="ref-vig" cx="50%" cy="50%" r="50%"><stop offset="70%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
    <circle cx="200" cy="150" r="144" fill="#3A4A44" stroke="#1F3B2D" stroke-width="5"/>
    <g clip-path="url(#ref-clip)"><rect x="60" y="10" width="280" height="280" fill="#fff"/>
      <g id="ref-blue"><rect x="60" y="-60" width="280" height="310" fill="#6CB4E8"/><path d="M60,250H340" stroke="#2F78B8" stroke-width="3"/></g>
      ${ticks}<text x="262" y="92" class="ref-unit" text-anchor="middle">ppt</text>
      <circle cx="200" cy="150" r="132" fill="url(#ref-vig)"/></g>
    <circle cx="200" cy="150" r="132" fill="none" stroke="#1F3B2D" stroke-width="5"/>
    <g id="ref-pointer"><path d="M60 250h22" stroke="#E8584A" stroke-width="4" stroke-linecap="round"/></g></svg>`;
}
async function refractBench(ctx) {
  const v = ctx.value;
  const B = shell(ctx, { svg: refractSvg(), caption: 'Looking through the eyepiece. Read the scale where blue meets white.', controls: h('div.bench-readout', h('span.rd-label', 'Salinity'), h('strong#rd-val', '0'), h('span.rd-unit', 'ppt')) });
  B.ctx = ctx;
  const blue = B.$('#ref-blue'), ptr = B.$('#ref-pointer'), out = B.body.querySelector('#rd-val');
  const yAt = x => 250 - x * 5;
  const set = x => { const dy = yAt(x) - 250; blue.setAttribute('transform', `translate(0 ${dy})`); ptr.setAttribute('transform', `translate(0 ${dy})`); out.textContent = Math.round(x); };
  set(0);
  await B.wait(150);
  ctx.sfx?.pour?.();
  if (ctx.reduced || B.state.skipped) set(v);
  else {
    const t0 = performance.now(), ms = 950;
    await new Promise(res => { const f = now => { if (B.state.skipped || B.state.closed) { set(v); return res(); } const k = Math.min(1, (now - t0) / ms); set(v * ease(k)); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  }
  set(v);
  ctx.sfx?.beep?.();
  B.cap.textContent = `Blue meets white at ${v} ppt.`;
  ctx.flyText = `${v} ppt`;
  await B.wait(250);
  await B.finish(out, `Salinity ${v} ppt saved in your notebook.`);
  return B.done;
}

// ───────────────────────────────────────── pH strip with colour chart (interactive)
async function stripBench(ctx) {
  const target = ctx.value, col = STRIP_COLORS[swatchKey(target)];
  const svg = `<svg viewBox="0 0 400 220" class="bench-svg short" role="img" aria-label="A pH test strip dipping into a beaker of sample water">
    <path d="M30 206h340" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round"/>
    <g class="strip"><rect x="188" y="-30" width="24" height="132" rx="4" fill="#fff" stroke="#1F3B2D" stroke-width="3.5"/><rect id="pad" x="190" y="66" width="20" height="34" fill="#F1EBC0" stroke="#1F3B2D" stroke-width="2"/></g>
    <path d="M138 84v104a12 12 0 0 0 12 12h100a12 12 0 0 0 12-12V84" fill="#fff" fill-opacity=".35" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="145" y="118" width="110" height="76" rx="6" fill="${ctx.tint}" opacity=".95"/><path d="M147 118c14-5 24 5 36 0s24 5 36 0 24 3 34 0" fill="none" stroke="#fff" stroke-width="3" opacity=".7" class="b-ripple"/></svg>`;
  const swatches = h('div.chart', { role: 'group', 'aria-label': 'pH colour chart. Tap the colour that matches your strip.' },
    Object.entries(STRIP_COLORS).sort((a, b) => a[0] - b[0]).map(([k, c]) => h('button.swatch', { type: 'button', 'data-swatch': k, 'aria-label': `pH ${Number(k).toFixed(1)}`, style: { '--sw': c }, onclick: () => pick(Number(k)) }, h('span.sw-chip'), h('span.sw-num', Number(k).toFixed(1)))));
  const mine = h('div.strip-mine', { hidden: true }, h('span.sm-label', 'Your strip'), h('span.sm-chip#mine'));
  const assist = h('button.btn.ghost#btn-assist', { type: 'button', hidden: true, onclick: () => { swatches.querySelector(`[data-swatch="${target}"]`).classList.add('hint'); B.cap.textContent = 'The glowing swatch matches your strip. Tap it.'; ctx.sfx?.tap?.(); } }, 'Show me the match');
  const controls = h('div.strip-ui', mine, swatches, assist);
  const B = shell(ctx, { svg, caption: 'Dipping the strip…', controls, wide: true });
  B.ctx = ctx;
  swatches.style.visibility = 'hidden';
  let misses = 0, locked = false;
  const strip = B.$('.strip'), pad = B.$('#pad');
  strip.style.transform = 'translateY(-14px)';
  await B.wait(120);
  strip.style.transition = ctx.reduced || B.state.skipped ? 'none' : 'transform .45s ease-in-out';
  strip.style.transform = 'translateY(54px)';
  ctx.sfx?.pour?.();
  await B.wait(480);
  pad.style.transition = ctx.reduced || B.state.skipped ? 'none' : 'fill .6s';
  pad.setAttribute('fill', col); pad.style.fill = col;
  await B.wait(520);
  strip.style.transform = 'translateY(-4px)';
  ctx.sfx?.bubble?.();
  mine.hidden = false; B.body.querySelector('#mine').style.background = col;
  swatches.style.visibility = 'visible'; assist.hidden = false;
  B.cap.textContent = 'Tap the colour on the chart that matches your strip.';
  B.body.querySelector('.bench-hint')?.remove();
  swatches.querySelector('.swatch').focus();
  function pick(v) {
    if (locked) return;
    const el = swatches.querySelector(`[data-swatch="${v}"]`);
    if (v !== target) {
      misses++; ctx.sfx?.wrong?.();
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      B.cap.textContent = misses >= 3 ? 'Look again. It is close to the one that is glowing. No tokens lost.' : 'Look again. No tokens lost.';
      if (misses >= 3) swatches.querySelector(`[data-swatch="${target}"]`).classList.add('hint');
      return;
    }
    locked = true;
    el.classList.add('right'); assist.hidden = true; ctx.sfx?.beep?.();
    ctx.flyText = `pH ${target.toFixed(1)}`;
    B.finish(el, `pH ${target.toFixed(1)} saved in your notebook.`);
  }
  return B.done;
}

// ───────────────────────────────────────── clarity tube: hold to pour (interactive)
const CM_PX = 3.1, TUBE_BOTTOM = 400;
async function clarityBench(ctx) {
  const target = ctx.value, never = target === '100+', goal = never ? 100 : target;
  const tick = (cm) => `<path d="M206 ${TUBE_BOTTOM - cm * CM_PX}h10" stroke="#1F3B2D" stroke-width="3" stroke-linecap="round"/><text x="222" y="${TUBE_BOTTOM - cm * CM_PX + 5}" class="ref-num">${cm}</text>`;
  const svg = `<svg viewBox="0 0 320 430" class="bench-svg tall" role="img" aria-label="A clarity tube with a black cross at the bottom. Pour water in until the cross disappears.">
    <g id="jug" style="transform-origin:160px 40px"><path d="M122 18h56l8 40a10 10 0 0 1-10 12h-52a10 10 0 0 1-10-12Z" fill="#fff" fill-opacity=".6" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><path d="M124 36h52l5 22a8 8 0 0 1-8 9h-46a8 8 0 0 1-8-9Z" fill="${ctx.tint}"/><path d="M186 30c14 0 14 18 0 18" fill="none" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round"/></g>
    <rect id="stream" x="157" y="72" width="6" height="0" rx="3" fill="${ctx.tint}" opacity=".9"/>
    <path d="M122 88v300a38 38 0 0 0 76 0V88" fill="#fff" fill-opacity=".25" stroke="#1F3B2D" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect id="water" x="126" y="${TUBE_BOTTOM}" width="68" height="0" fill="${ctx.tint}" opacity=".78"/>
    <g id="cross"><circle cx="160" cy="${TUBE_BOTTOM - 8}" r="26" fill="#fff" stroke="#1F3B2D" stroke-width="3"/><path d="M146 ${TUBE_BOTTOM - 22}l28 28M174 ${TUBE_BOTTOM - 22}l-28 28" stroke="#111" stroke-width="9" stroke-linecap="butt"/></g>
    ${[0, 20, 40, 60, 80, 100].map(tick).join('')}</svg>`;
  const live = h('div.bench-readout', h('span.rd-label', 'Water depth'), h('strong#rd-val', '0'), h('span.rd-unit', 'cm'));
  const pourBtn = h('button.btn.primary.pour', { type: 'button', 'data-autofocus': '', 'aria-describedby': 'pour-help' }, h('span', { html: icon('drop', 26) }), h('span', 'Hold to pour'));
  const auto = h('button.btn.ghost', { type: 'button' }, 'Pour for me');
  const controls = h('div.pour-ui', live, pourBtn, auto, h('p#pour-help.sr-only', 'Hold Space or Enter to pour. Let go when the black cross disappears.'));
  const B = shell(ctx, { svg, caption: 'Hold the button to pour. Let go when the black cross disappears.', controls, skippable: false, wide: true });
  B.ctx = ctx;
  const water = B.$('#water'), cross = B.$('#cross'), jug = B.$('#jug'), stream = B.$('#stream'), out = B.body.querySelector('#rd-val');
  let level = 0, holding = false, raf = 0, last = 0, locked = false, autoMode = false;
  const RATE = 36;
  const vis = L => never ? 1 - 0.18 * (L / 100) : Math.max(0, Math.min(1, 1 - (L - goal * 0.55) / (goal * 0.45)));
  const draw = () => {
    const hgt = level * CM_PX;
    water.setAttribute('y', TUBE_BOTTOM - hgt); water.setAttribute('height', hgt);
    cross.style.opacity = String(vis(level));
    out.textContent = Math.round(level);
    const streaming = holding && level < 100;
    stream.setAttribute('height', streaming ? Math.max(0, TUBE_BOTTOM - hgt - 72) : 0);
    jug.style.transform = streaming ? 'rotate(-14deg)' : 'rotate(0)';
  };
  const done = () => {
    if (locked) return; locked = true; holding = false; cancelAnimationFrame(raf);
    level = Math.max(level, never ? 100 : goal); draw();
    out.textContent = never ? '100+' : String(goal);
    ctx.flyText = `${never ? '100+' : goal} cm`;
    B.cap.textContent = never ? 'You can still see the cross at 100 cm, so the water is very clear.' : `The cross disappeared at ${goal} cm.`;
    ctx.sfx?.beep?.();
    pourBtn.disabled = true; auto.disabled = true;
    B.finish(out, `Clarity ${never ? '100+' : goal} cm saved in your notebook.`);
  };
  const loop = now => {
    if (!holding || locked) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    level = Math.min(100, level + RATE * dt);
    draw();
    if (Math.floor(now / 140) !== Math.floor((now - dt * 1000) / 140)) ctx.sfx?.pour?.();
    if (level >= 100 && never) return done();
    if (autoMode && level >= goal + 4) return done();
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (locked || holding) return; holding = true; last = performance.now(); B.cap.textContent = 'Pouring… let go when the cross disappears.'; raf = requestAnimationFrame(loop); };
  const stop = () => {
    if (!holding || locked) return; holding = false; cancelAnimationFrame(raf); draw();
    if (level >= goal && !never) done();
    else B.cap.textContent = level >= 100 ? 'The tube is full.' : 'You can still see the cross. Hold again to keep pouring.';
  };
  pourBtn.addEventListener('pointerdown', e => { e.preventDefault(); try { pourBtn.setPointerCapture(e.pointerId); } catch { /* ignore */ } start(); });
  pourBtn.addEventListener('pointerup', stop); pourBtn.addEventListener('pointercancel', stop); pourBtn.addEventListener('lostpointercapture', stop);
  pourBtn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
  pourBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(); } });
  pourBtn.addEventListener('blur', stop);
  auto.addEventListener('click', () => { autoMode = true; pourBtn.disabled = true; auto.disabled = true; if (ctx.reduced) { level = never ? 100 : goal; draw(); done(); } else start(); });
  draw();
  pourBtn.focus();
  return B.done;
}

// ───────────────────────────────────────── lab parcels: nutrients, pesticide
function parcelSvg(kind, label) {
  const bottle = kind === 'pest'
    ? `<path d="M168 44h30v14l8 12v56a10 10 0 0 1-10 10h-26a10 10 0 0 1-10-10V70l8-12Z" fill="#fff" fill-opacity=".6" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><rect x="164" y="30" width="38" height="18" rx="5" fill="#E7C85A" stroke="#1F3B2D" stroke-width="4"/><rect x="156" y="84" width="54" height="34" rx="4" fill="#fff" stroke="#1F3B2D" stroke-width="3"/><text x="183" y="106" text-anchor="middle" class="lab-label">${label}</text>`
    : `<path d="M166 40h34v18l12 14v52a12 12 0 0 1-12 12h-34a12 12 0 0 1-12-12V72l12-14Z" fill="#fff" fill-opacity=".6" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><rect x="162" y="24" width="42" height="20" rx="5" fill="#7FD3A0" stroke="#1F3B2D" stroke-width="4"/><path d="M158 96h50v30a10 10 0 0 1-10 10h-30a10 10 0 0 1-10-10Z" fill="#8FD3EE" opacity=".9"/><rect x="158" y="86" width="50" height="34" rx="4" fill="#fff" stroke="#1F3B2D" stroke-width="3"/><text x="183" y="108" text-anchor="middle" class="lab-label">${label}</text>`;
  return `<svg viewBox="0 0 400 300" class="bench-svg" role="img" aria-label="A sample bottle labelled and packed into a lab parcel">
    <path d="M30 276h340" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round"/>
    <g id="parcel"><path d="M110 170h180v96H110Z" fill="#E2C393" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><path d="M110 170l-12-20h204l-12 20" fill="#D4B27A" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><rect x="170" y="212" width="60" height="34" rx="4" fill="#fff" stroke="#1F3B2D" stroke-width="3"/><text x="200" y="234" text-anchor="middle" class="lab-label">LAB</text>
      <g id="lid" style="transform-origin:110px 170px"><path d="M104 150h192v18H104Z" fill="#EBD0A0" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round" opacity="0"/></g></g>
    <g id="bottle">${bottle}</g></svg>`;
}
async function labBench(ctx) {
  const t = ctx.tool, label = ctx.toolId === 'pest' ? 'PEST' : 'N + P';
  const B = shell(ctx, { svg: parcelSvg(ctx.toolId, `${ctx.siteId} D${ctx.day}`), caption: `Labelling the ${ctx.toolId === 'pest' ? 'pesticide' : 'nutrient'} sample for site ${ctx.siteId}…` });
  B.ctx = ctx;
  const bottle = B.$('#bottle'), parcel = B.$('#parcel');
  const move = (el, tr, ms) => { el.style.transition = ctx.reduced || B.state.skipped ? 'none' : `transform ${ms}ms ease-in-out, opacity ${ms}ms`; el.style.transform = tr; };
  await B.wait(250);
  move(bottle, 'translate(17px,120px)', 420); await B.wait(440);
  bottle.style.opacity = '0';
  ctx.sfx?.labSend?.();
  move(parcel, 'translateX(70px)', 420); await B.wait(440);
  ctx.flyText = 'Sent to lab';
  const due = ctx.day + t.delay;
  const pill = h('div.bench-readout.lab', h('span.rd-label', 'Result arrives'), h('strong', `Day ${due}`));
  B.cap.after(pill);
  B.cap.textContent = `Parcel sealed. The result arrives on Day ${due}.`;
  await B.wait(150);
  await B.finish(pill, `Sent to the lab. The result arrives on Day ${due}. Look in the Waiting tray.`, 'Send to the lab');
  return B.done;
}

// ───────────────────────────────────────── BOD bottles
function bodSvg(doNow) {
  return `<svg viewBox="0 0 400 300" class="bench-svg" role="img" aria-label="Two sample bottles: one clear, one wrapped in foil">
    <path d="M30 276h340" stroke="#1F3B2D" stroke-width="4" stroke-linecap="round"/>
    <g><path d="M98 78h46v18l8 14v136a14 14 0 0 1-14 14h-34a14 14 0 0 1-14-14V110l8-14Z" fill="#fff" fill-opacity=".5" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><clipPath id="bod-clip"><path d="M98 78h46v18l8 14v136a14 14 0 0 1-14 14h-34a14 14 0 0 1-14-14V110l8-14Z"/></clipPath><g clip-path="url(#bod-clip)"><rect id="fill-a" x="80" y="120" width="90" height="160" fill="#8FD3EE" style="transform-origin:50% 100%;transform:scaleY(0);transform-box:fill-box"/></g><rect x="94" y="64" width="54" height="18" rx="5" fill="#fff" stroke="#1F3B2D" stroke-width="4"/><text x="121" y="238" text-anchor="middle" class="lab-label">CLEAR</text></g>
    <g><path d="M258 78h46v18l8 14v136a14 14 0 0 1-14 14h-34a14 14 0 0 1-14-14V110l8-14Z" fill="#C7CDD2" stroke="#1F3B2D" stroke-width="4" stroke-linejoin="round"/><path d="M252 130l60 20M252 170l60 20M252 210l60 20" stroke="#fff" stroke-width="3" opacity=".6"/><rect x="254" y="64" width="54" height="18" rx="5" fill="#fff" stroke="#1F3B2D" stroke-width="4"/><text x="281" y="238" text-anchor="middle" class="lab-label">FOIL</text></g>
    <g id="bod-lcd" opacity="0"><rect x="150" y="14" width="100" height="44" rx="8" fill="#CFE5D3" stroke="#1F3B2D" stroke-width="3"/><text x="240" y="52" text-anchor="end" class="lcd-live" font-size="26">${doNow.toFixed(1)}</text><text x="160" y="28" class="lcd-unit" font-size="11">oxygen now</text></g></svg>`;
}
async function bodBench(ctx) {
  const doNow = ctx.extra.doNow, due = ctx.day + ctx.tool.delay;
  const B = shell(ctx, { svg: bodSvg(doNow), caption: 'Filling two bottles: one clear, one wrapped in foil…' });
  B.ctx = ctx;
  const fill = B.$('#fill-a'), lcdG = B.$('#bod-lcd');
  await B.wait(150);
  fill.style.transition = ctx.reduced || B.state.skipped ? 'none' : 'transform .7s ease-out';
  fill.style.transform = 'scaleY(1)';
  ctx.sfx?.pour?.();
  await B.wait(720);
  ctx.sfx?.beep?.();
  lcdG.setAttribute('opacity', '1');
  B.cap.textContent = `Clear bottle: oxygen now ${doNow.toFixed(1)} mg/L. The foil bottle waits in the dark for 5 days.`;
  ctx.flyText = 'BOD started';
  const pill = h('div.bench-readout.lab', h('span.rd-label', 'BOD result arrives'), h('strong', `Day ${due}`));
  B.cap.after(pill);
  await B.wait(350);
  await B.finish(pill, `Oxygen now ${doNow.toFixed(1)} mg/L. The BOD result arrives on Day ${due}. Look in the Waiting tray.`, 'Start the BOD test');
  return B.done;
}

// ───────────────────────────────────────── entry point
export function runInstrument(ctx) {
  ctx.tool = TOOLS[ctx.toolId];
  ctx.reduced = ctx.reduced ?? reduced();
  const f = { temp: meterBench, ph: meterBench, do: meterBench, turb: meterBench, sal: refractBench, phStrip: stripBench, clarity: clarityBench, nutrients: labBench, pest: labBench, bod: bodBench }[ctx.toolId];
  return f(ctx);
}
