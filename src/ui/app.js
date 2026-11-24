// Router and the simple screens: title, call, kit. Everything else lives in its own module.
import { h, $, announce } from './dom.js';
import { icon } from './icons.js';
import { app, persist, toast, clearToast, applyCaseTheme, soundButton, readButton, dropsMeter } from './core.js';
import { CASES } from '../data/cases.js';
import { KIT, KIT_NEEDED, KIT_DONE } from '../data/kit.js';
import { caseById } from '../logic/readings.js';
import * as G from '../logic/game.js';
import * as save from '../state/save.js';
import { sfx, arm, setMuted } from '../audio/sfx.js';
import { stop as stopSpeech, supported as speechOK } from './speech.js';
import { glossify, resetGloss, openGlossary } from './glossary.js';
import { toggleRow, openMenu } from './menu.js';
import { renderInvestigate } from './investigate.js';
import { renderBoard } from './board.js';
import { renderWrapup, renderResults } from './wrapup.js';
import { renderReport } from './report.js';
import { closeAllDialogs } from './dialog.js';

const TIMES = { 1: '20 to 25 minutes', 2: '25 minutes', 3: '25 minutes' };

function logo(size = 74) {
  return `<svg viewBox="0 0 80 80" width="${size}" height="${size}" aria-hidden="true" stroke="#1F4E52" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M34 8C34 8 14 30 14 44a20 20 0 0 0 40 0C54 30 34 8 34 8Z" fill="#6DBBE6"/><path d="M24 46a10 10 0 0 0 8 9" fill="none" stroke="#fff" stroke-width="4" opacity=".85"/><circle cx="50" cy="48" r="17" fill="#FBF7EE" fill-opacity=".92"/><circle cx="50" cy="48" r="11" fill="#CDEBE6" stroke-width="3.2"/><path d="M62 60l13 13" stroke-width="7"/><path d="M44 47c3-3 5 3 8 0" fill="none" stroke="#4A9BD2" stroke-width="3"/></svg>`;
}
function ranger(size = 120) {
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true" stroke="#1F4E52" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 118c0-26 18-40 42-40s42 14 42 40Z" fill="#7FA77C"/><path d="M52 80l8 14 8-14" fill="#FBF7EE"/><circle cx="60" cy="52" r="24" fill="#F0C9A0"/><path d="M26 44c0-4 14-8 34-8s34 4 34 8c0 5-14 8-34 8s-34-3-34-8Z" fill="#9C7A4F"/><path d="M40 40c0-16 8-26 20-26s20 10 20 26Z" fill="#B28C58"/><path d="M40 38h40" stroke-width="5" stroke="#1F4E52"/><circle cx="51" cy="56" r="2.6" fill="#1F4E52" stroke="none"/><circle cx="69" cy="56" r="2.6" fill="#1F4E52" stroke="none"/><path d="M52 66c4 5 12 5 16 0" fill="none"/></svg>`;
}

function clear() { clearToast(); app.cleanup?.(); app.cleanup = null; closeAllDialogs(); stopSpeech(); resetGloss(); }
function focusScreen(root) {
  const el = root.querySelector('[data-autofocus]') || root.querySelector('h1');
  if (el) { if (!el.hasAttribute('tabindex') && el.tagName === 'H1') el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
}

export function go(name, arg) {
  clear();
  const root = app.root;
  root.className = ''; root.removeAttribute('style');
  const setStep = s => { app.state.step = s; persist(); };
  switch (name) {
    case 'title': app.screen = 'title'; document.title = 'Water Detective'; renderTitle(root); break;
    case 'call': {
      const c = caseById(arg ?? app.c.id); app.c = c; app.state = G.createState(c.id); persist();
      app.screen = 'call'; renderCall(root); break;
    }
    case 'continue': {
      const st = save.progressFor(arg); if (!st) return go('call', arg);
      app.c = caseById(st.caseId); app.state = st;
      return go(st.step === 'done' ? 'title' : st.step);
    }
    case 'restart': return go('call', app.c.id);
    case 'kit': setStep('kit'); app.screen = 'kit'; renderKit(root); break;
    case 'investigate': setStep('investigate'); app.screen = 'investigate'; app.cleanup = renderInvestigate(root); break;
    case 'board': if (app.state.step !== 'wrapup') setStep('board'); if (app.state.step === 'wrapup') return go('wrapup'); app.screen = 'board'; app.cleanup = renderBoard(root); break;
    case 'wrapup': setStep('wrapup'); app.screen = 'wrapup'; renderWrapup(root); break;
    case 'results': app.screen = 'results'; app.c = caseById(app.finished.state.caseId); renderResults(root); break;
    case 'report': app.screen = 'report'; renderReport(root); break;
    default: throw new Error('unknown screen ' + name);
  }
  if (name !== 'title') document.title = `${app.c?.title ?? 'Water Detective'} · Water Detective`;
  root.dataset.screen = app.screen;
  if (name !== 'investigate') focusScreen(root);
}
app.go = go;

// ───────────────────────────────────────────── title
function renderTitle(root) {
  const d = save.get();
  const cards = CASES.map(c => {
    const prog = save.progressFor(c.id), done = save.hasFinished(c.id), st = d.cases[c.id]?.stars || [false, false, false];
    const stars = h('span.cc-stars', { role: 'img', 'aria-label': `${st.filter(Boolean).length} of 3 stars` }, st.map(b => h('span', { html: icon(b ? 'star' : 'star-empty', 28) })));
    const main = prog ? h('button.btn.primary.cc-go', { type: 'button', 'data-case': c.num, 'data-action': 'continue', onclick: () => { sfx.tap(); go('continue', c.id); } }, 'Continue', h('span', { html: icon('arrow', 22) }))
      : h('button.btn.primary.cc-go', { type: 'button', 'data-case': c.num, 'data-action': 'new', onclick: () => { sfx.tap(); go('call', c.id); } }, done ? 'Play again' : 'New case', h('span', { html: icon('arrow', 22) }));
    const sub = prog ? h('button.btn.link', { type: 'button', 'data-case': c.num, 'data-action': 'restart', onclick: () => { sfx.tap(); go('call', c.id); } }, 'Start over') : null;
    return h('article.case-card', { style: { '--ink': c.accent.ink, '--bg': c.accent.bg, '--pop': c.accent.pop, '--pop2': c.accent.pop2 } },
      h('div.cc-top', h('span.cc-mod', c.module), h('span.cc-badge', prog ? 'In progress' : done ? 'Done' : 'New')),
      h('h2', h('span.cc-num', `Case ${c.num}`), c.title),
      h('p.cc-place', `${c.place} · ${TIMES[c.num]}`),
      h('p.cc-dots', `${c.moduleName} · ${c.dotPoints.join(', ')}`), stars, h('div.cc-actions', main, sub));
  });
  const readTxt = () => 'Water Detective. Test the water. Find the cause. Three cases: ' + CASES.map(c => `Case ${c.num}, ${c.title}`).join('. ');
  const rd = readButton(readTxt);
  root.replaceChildren(
    h('header.topbar.title-bar', h('div.tb-spacer'), soundButton(), h('button.btn.icon-btn', { type: 'button', 'aria-label': 'Menu', onclick: () => { sfx.tap(); openMenu({ inGame: false }); } }, h('span', { html: icon('menu', 24) }))),
    h('main.title',
      h('div.hero', h('span.logo', { html: logo() }), h('h1', { 'data-autofocus': '' }, 'Water Detective'), h('p.tagline', 'Test the water. Find the cause.'), rd),
      h('div.cards', cards),
      h('nav.title-links', h('button.btn.ghost', { type: 'button', id: 'btn-report', onclick: () => go('report') }, h('span', { html: icon('book', 22) }), 'Report card'),
        h('a.btn.ghost', { href: 'teacher.html' }, 'Teacher guide'),
        h('button.btn.ghost', { type: 'button', onclick: openGlossary }, 'Science words')),
      h('div.title-toggles', toggleRow('Sound', () => !save.get().settings.muted, v => { setMuted(!v); save.setSetting('muted', !v); document.querySelectorAll('.snd').forEach(b => b.dispatchEvent(new Event('repaint'))); }),
        speechOK() ? toggleRow('Read-aloud buttons', () => save.get().settings.readAloud, v => { save.setSetting('readAloud', v); go('title'); }) : null),
      h('p.fine', 'Made-up places, real science. Played in pairs.')));
}

// ───────────────────────────────────────────── call
function renderCall(root) {
  const { c, state } = app;
  applyCaseTheme(root, c);
  const lines = c.call.lines;
  const start = h('button.btn.primary.big#btn-start', { type: 'button', 'data-autofocus': '', onclick: () => { sfx.tap(); go('kit'); } }, 'Take the case', h('span', { html: icon('arrow', 24) }));
  const bubble = h('div.bubble', h('p.from', c.call.from), lines.map(l => h('p.say', l)));
  const body = h('main.call',
    h('p.kicker', `Case ${c.num} · ${c.place}`), h('h1', c.title),
    h('div.call-row', h('span.ranger', { html: ranger(132) }), bubble),
    h('div.chips', h('span.chip-info', { html: icon('drop', 24) }, `${c.budget} test tokens`), h('span.chip-info', { html: icon('day', 24) }, `${c.days} days`), h('span.chip-info', { html: icon('flask', 24) }, c.tools.includes('bod') ? 'Some labs take 5 days' : 'Lab tests take a day')),
    h('div.call-actions', readButton(() => `${c.title}. ${c.call.from} says. ${lines.join(' ')} You have ${c.budget} test tokens and ${c.days} days.`), start));
  root.replaceChildren(h('header.topbar', h('button.btn.tb-btn', { type: 'button', onclick: () => go('title') }, h('span', { html: icon('home', 22) }), h('span.lbl', 'Title')), h('div.tb-spacer'), soundButton()), body);
  glossify(bubble);
}

// ───────────────────────────────────────────── kit
function renderKit(root) {
  const { c, state } = app;
  applyCaseTheme(root, c);
  const quick = c.num === 1 && save.hasFinished(c.id);
  if (quick) {
    const b = h('button.btn.primary.big#btn-kit-ok', { type: 'button', 'data-autofocus': '', onclick: () => { sfx.right(); go('investigate'); } }, h('span', { html: icon('check', 24) }), 'Kit packed');
    root.replaceChildren(h('header.topbar', h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), h('div.tb-spacer'), soundButton()),
      h('main.kit.quick', h('h1', 'Safety check'), h('p.lead', 'Gloves on, buddy beside you, sampling pole in hand. You stay on the bank and never wade in.'), b));
    return;
  }
  const packed = new Set();
  const msg = h('p.kit-msg', { 'aria-live': 'polite' }, 'Tap the 3 things you need to test water safely.');
  const go1 = h('button.btn.primary.big#btn-kit-go', { type: 'button', hidden: true, onclick: () => { sfx.right(); go('investigate'); } }, 'Start testing', h('span', { html: icon('arrow', 24) }));
  const grid = h('div.kit-grid');
  const prog = h('p.kit-prog');
  for (const k of KIT) {
    const el = h('button.kit-item', { type: 'button', 'data-kit': k.id, 'aria-pressed': 'false', onclick: () => tap(k, el) }, h('span.k-ico', { html: icon(k.icon, 64) }), h('span.k-name', k.label), h('span.k-ok', { html: icon('check', 22) }));
    grid.append(el);
  }
  function tap(k, el) {
    if (packed.has(k.id)) return;
    if (!k.safe) { sfx.wrong(); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); msg.textContent = `Not this one. ${k.why}`; msg.className = 'kit-msg bad'; announce(msg.textContent); return; }
    packed.add(k.id); sfx.right(); el.classList.add('packed'); el.setAttribute('aria-pressed', 'true');
    msg.textContent = k.why; msg.className = 'kit-msg good';
    prog.textContent = `${packed.size} of ${KIT_NEEDED} packed`;
    if (packed.size === KIT_NEEDED) { msg.textContent = KIT_DONE; go1.hidden = false; go1.focus(); grid.querySelectorAll('.kit-item:not(.packed)').forEach(b => b.disabled = true); announce(KIT_DONE); }
  }
  prog.textContent = `0 of ${KIT_NEEDED} packed`;
  root.replaceChildren(h('header.topbar', h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title)), h('div.tb-spacer'), soundButton()),
    h('main.kit', h('h1', 'Pack your kit'), h('p.lead', 'Water can hide germs and chemicals. Pick the three safety items. Stay on the bank.'), prog, grid, msg, go1));
}

// ───────────────────────────────────────────── boot
export function boot() {
  const d = save.load();
  setMuted(d.settings.muted);
  arm();
  app.root = document.getElementById('app');
  window.__wd = {
    get state() { return app.state; }, get c() { return app.c; }, get screen() { return app.screen; }, get save() { return save.get(); },
    game: G, CASES, go, saveMod: save,
    start(num, { kit = true } = {}) { const c = caseById(num); go('call', c.id); if (kit) { go('kit'); go('investigate'); } },
  };
  go('title');
}
