// The main screen: map + toolkit + field notebook.
import { h, $, announce, reduced } from './dom.js';
import { icon, toolIcon, weatherIcon } from './icons.js';
import { app, persist, toast, applyCaseTheme, soundButton, dropsMeter } from './core.js';
import { createMap } from './map.js';
import { notebookView, entryValueText, entryLabel } from './notebook.js';
import { runInstrument, sampleTint } from './instruments.js';
import { openGraph } from './graph.js';
import { openDialog, confirmDialog } from './dialog.js';
import { glossify, openGlossary, resetGloss } from './glossary.js';
import { createCoach } from './coach.js';
import { TOOLS } from '../data/cases.js';
import { GUIDE } from '../data/cases.js';
import { GUIDE_ROWS } from '../data/guide.js';
import { TOOL_HELP } from '../data/toolhelp.js';
import * as G from '../logic/game.js';
import { sensorValue, lookAt, siteOf, formatReading } from '../logic/readings.js';
import { sfx, isMuted, setMuted } from '../audio/sfx.js';
import * as save from '../state/save.js';
import { openMenu } from './menu.js';

export function openGuide() {
  const rows = GUIDE_ROWS.map(r => h('tr', h('th', { scope: 'row' }, r.name), h('td', r.estuary), h('td', r.fresh)));
  const body = h('div.guide', h('p.lead', 'A guide, not a law. Pick the column by how salty the water is: salty water uses the estuary column.'),
    h('div.table-wrap', h('table.guide-table', h('thead', h('tr', h('th', ''), h('th', GUIDE.estuary.label), h('th', GUIDE.fresh.label))), h('tbody', rows))),
    h('p.note', GUIDE.note), h('p.note', 'Salty water is not "polluted". It just has a different guide.'),
    h('p.src', `Source: ${GUIDE.source}.`));
  glossify(body);
  return openDialog({ title: 'Guide card', wide: true, body, cls: 'guide-dlg' });
}

export function renderInvestigate(root) {
  const { c, state } = app;
  resetGloss();
  applyCaseTheme(root, c);
  const ui = { tab: 'tools', prevTokens: state.tokens, busy: false };
  const map = createMap(c, { onSelect: selectSite });

  // ── top bar
  const titleEl = h('div.tb-title', h('span.tb-case', `Case ${c.num}`), h('span.tb-name', c.title));
  const dayEl = h('div.tb-day', { 'aria-live': 'off' });
  const tokEl = h('div.tb-tokens');
  const guideBtn = h('button.btn.tb-btn', { type: 'button', id: 'btn-guide', onclick: () => { sfx.tap(); openGuide(); } }, h('span', { html: icon('guide', 22) }), h('span.lbl', 'Guide'));
  const tipBtn = h('button.btn.tb-btn', { type: 'button', id: 'btn-tip', onclick: () => { sfx.tap(); openTips(); } }, h('span', { html: icon('bulb', 22) }), h('span.lbl', 'Tip'));
  const menuBtn = h('button.btn.icon-btn', { type: 'button', id: 'btn-menu', 'aria-label': 'Menu', onclick: () => { sfx.tap(); openMenu({ inGame: true }); } }, h('span', { html: icon('menu', 24) }));
  const top = h('header.topbar', menuBtn, titleEl, dayEl, tokEl, h('div.tb-spacer'), guideBtn, tipBtn, soundButton());

  // ── map column
  const trayWx = h('div.tray-wx');
  const nextBtn = h('button.btn.secondary#next-day', { type: 'button', onclick: doNextDay });
  const waitList = h('div.wait-list');
  const tray = h('div.tray', h('div.tray-row', trayWx, nextBtn), h('div.tray-wait', h('span.tray-title', h('span', { html: icon('wait', 20) }), 'Waiting for the lab'), waitList));
  const coachHost = h('div.coach-host');
  const mapCol = h('section.map-col', h('div.map-wrap', map.el, coachHost), tray);

  // ── panel
  const tabTools = h('button.tab', { type: 'button', role: 'tab', id: 'tab-tools', 'data-tab': 'tools', 'aria-controls': 'pane-tools', onclick: () => setTab('tools'), onkeydown: tabKey }, h('span', { html: icon('kit', 22) }), 'Tools');
  const nbBadge = h('span.badge', { hidden: true });
  const tabNote = h('button.tab', { type: 'button', role: 'tab', id: 'tab-notebook', 'data-tab': 'notebook', 'aria-controls': 'pane-notebook', onclick: () => setTab('notebook'), onkeydown: tabKey }, h('span', { html: icon('book', 22) }), 'Notebook', nbBadge);
  function tabKey(e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const t = e.currentTarget === tabTools ? tabNote : tabTools; t.focus(); t.click(); } }
  const toolsPane = h('div.pane#pane-tools', { role: 'tabpanel', 'aria-labelledby': 'tab-tools' });
  const notePane = h('div.pane#pane-notebook', { role: 'tabpanel', 'aria-labelledby': 'tab-notebook', hidden: true });
  const solveBtn = h('button.btn.primary.big#solve', { type: 'button', onclick: () => { sfx.tap(); app.go('board'); } }, h('span', { html: icon('flag', 24) }), 'Solve the case');
  const panel = h('aside.panel', h('div.tabs', { role: 'tablist', 'aria-label': 'Toolkit' }, tabTools, tabNote), h('div.panes', toolsPane, notePane), h('div.panel-foot', solveBtn));

  root.replaceChildren(top, h('main.inv-main', mapCol, panel));
  const coach = !save.get().seenCoach && c.num === 1 ? createCoach({
    host: coachHost,
    getCtx: () => ({ site: state.site, looked: state.entries.some(e => e.param === 'look'), tested: state.entries.some(e => e.param !== 'look') || state.pending.length > 0 }),
    onEnd: () => { save.markSeenCoach(); },
    onTab: sel => { if (sel === '.tool-grid' || sel === '#btn-look') setTab('tools'); },
  }) : null;

  function setTab(t) {
    ui.tab = t;
    for (const [btn, name] of [[tabTools, 'tools'], [tabNote, 'notebook']]) { btn.setAttribute('aria-selected', String(t === name)); btn.tabIndex = t === name ? 0 : -1; btn.classList.toggle('on', t === name); }
    toolsPane.hidden = t !== 'tools'; notePane.hidden = t !== 'notebook';
    if (t === 'notebook') { state.unseen = 0; persist(); renderBadge(); renderNotebook(); }
  }

  // ── actions
  function selectSite(id) {
    G.selectSite(state, id); sfx.tap(); map.pulse(id); persist();
    const s = siteOf(c, id);
    announce(`Standing at site ${id}, ${s.name}. ${s.blurb}`);
    refresh(); coach?.notify('site');
    if (ui.tab !== 'tools') setTab('tools');
  }
  function doLook() {
    const r = G.look(state);
    if (!r.ok) { toast(r.reason); return; }
    if (!r.existing) { sfx.blip(); persist(); }
    announce(`Look at ${siteOf(c, state.site).name}: ${r.entry.value}`);
    refresh(); coach?.notify('look');
  }
  async function doTest(toolId) {
    if (ui.busy) return;
    const chk = G.canTest(state, toolId);
    if (!chk.ok) { sfx.wrong(); toast(chk.reason, { kind: 'warn' }); return; }
    ui.busy = true;
    const site = siteOf(c, state.site), day = state.day;
    const value = ['temp', 'ph', 'phStrip', 'sal', 'do', 'turb', 'clarity'].includes(toolId) ? sensorValue(c, site.id, toolId, day) : null;
    const flags = state.revealed[site.id] ? lookAt(c, site.id, day).art : [];
    let before = state.tokens, result = null;
    const committed = await runInstrument({
      toolId, siteId: site.id, siteName: site.name, day, value, tint: sampleTint(flags), sfx,
      extra: { doNow: toolId === 'bod' ? sensorValue(c, site.id, 'do', day) : null },
      commit: () => { const r = G.runTest(state, toolId, site.id); if (!r.ok) { toast(r.reason, { kind: 'warn' }); return false; } result = r; persist(); return true; },
    });
    ui.busy = false;
    if (committed && result) {
      ui.prevTokens = before;
      sfx.pop();
      const t = TOOLS[toolId];
      if (result.entries.length) announce(`${entryLabel(result.entries[0])} at ${site.name}: ${entryValueText(result.entries[0])}. Saved in your notebook.`);
      else announce(`Sample sent to the lab. Result on Day ${result.pending.due}.`);
      toast(result.entries.length ? `Saved: ${entryLabel(result.entries[0])} ${entryValueText(result.entries[0])} at ${site.name}, Day ${day}.` : `${t.name} sent. Result on Day ${result.pending.due}.`);
      refresh(); coach?.notify('test');
    }
    queueMicrotask(() => $(`[data-tool="${toolId}"]`)?.focus());
  }
  async function doNextDay() {
    if (ui.busy) return;
    const chk = G.canNextDay(state);
    if (!chk.ok) { toast(chk.reason, { kind: 'warn' }); return; }
    ui.busy = true;
    const r = G.nextDay(state); persist();
    sfx.dayChime();
    const text = `Day ${state.day}`;
    const wipe = map.dayWipe(state.day, text, reduced());
    refresh();
    await wipe;
    ui.busy = false;
    const wx = c.weather[state.day - 1];
    const labs = r.arrived.length ? ` ${describeArrivals(r.arrived)}` : '';
    announce(`${text} of ${c.days}. ${wx.text}${labs}`);
    toast(`${text} of ${c.days}. ${wx.text}${labs}`, { ms: 5000 });
    if (r.arrived.length) { sfx.labSend(); }
    nextBtn.focus();
  }
  function describeArrivals(list) {
    const bits = [];
    const seen = new Set();
    for (const e of list) {
      const key = `${e.site}:${e.param === 'p' || e.param === 'n' ? 'nutrients' : e.param}`;
      if (seen.has(key)) continue; seen.add(key);
      bits.push(e.param === 'bod' ? `BOD result for site ${e.site} is in.` : e.param === 'pest' ? `Pesticide result for site ${e.site} is in.` : `Nutrient results for site ${e.site} are in.`);
    }
    return bits.join(' ');
  }
  function openTips() {
    const draw = () => {
      const tips = c.hints.slice(0, state.tipsShown);
      list.replaceChildren(...(tips.length ? tips.map((t, i) => h('li', h('span.tip-n', i + 1), h('span', t))) : [h('li.none', 'No tips yet. Press the button for a small hint.')]));
      more.hidden = state.tipsShown >= c.hints.length;
      more.textContent = state.tipsShown ? 'Show the next tip' : 'Show a tip';
    };
    const list = h('ol.tips'), more = h('button.btn.primary', { type: 'button', onclick: () => { G.nextTip(state); persist(); sfx.blip(); draw(); } }, 'Show a tip');
    const note = h('p.note', 'Tips are free. Each one gives away a little more.');
    draw();
    const body = h('div', note, list, more);
    glossify(body);
    openDialog({ title: 'Detective tip', body });
  }
  function doTopUp() {
    G.topUp(state); persist(); sfx.right();
    ui.prevTokens = state.tokens - G.TOPUP;
    toast('The ranger gave you 3 more tokens. That ends the Sharp detective star for this case.');
    announce('The ranger gave you 3 more tokens.');
    refresh();
  }

  // ── rendering
  function refresh() {
    map.update(state);
    // header
    const wx = c.weather[state.day - 1];
    dayEl.replaceChildren(h('span.wx', { html: icon(weatherIcon(wx.icon), 26) }), h('span', h('strong', `Day ${state.day}`), ` of ${c.days}`));
    dayEl.setAttribute('title', wx.text);
    tokEl.replaceChildren(dropsMeter(state.tokens, c.budget + G.TOPUP * state.topUps, ui.prevTokens), h('span.tok-n', h('strong', state.tokens), h('span.sr-only', ' tokens left')));
    ui.prevTokens = state.tokens;
    // tray
    trayWx.replaceChildren(h('span.wx', { html: icon(weatherIcon(wx.icon), 30) }), h('span.wx-text', wx.text));
    const last = G.canNextDay(state);
    nextBtn.replaceChildren(h('span', { html: icon('day', 22) }), last.ok ? 'Next day' : 'Last day');
    nextBtn.disabled = false; nextBtn.setAttribute('aria-disabled', String(!last.ok)); nextBtn.classList.toggle('disabled', !last.ok);
    nextBtn.title = last.ok ? `Go to Day ${state.day + 1}` : 'This is the last day. You can still solve the case.';
    waitList.replaceChildren(...(state.pending.length ? state.pending.map(p => {
      const left = p.due - state.day;
      return h('span.wait-chip', { 'data-pending': p.tool }, h('span', { html: icon(p.tool === 'nutrients' ? 'flask' : p.tool === 'bod' ? 'bod' : 'pest', 20) }), `${TOOLS[p.tool].short} · site ${p.site}`, h('b', left <= 0 ? 'ready' : `${left} ${left === 1 ? 'day' : 'days'}`), p.tool === 'bod' ? h('small', `oxygen now ${p.doNow.toFixed(1)}`) : null);
    }) : [h('span.wait-none', 'No samples waiting.')]));
    renderTools(); renderBadge();
    if (ui.tab === 'notebook') renderNotebook();
    coach?.refresh();
  }
  function renderBadge() { nbBadge.hidden = !state.unseen || ui.tab === 'notebook'; nbBadge.textContent = state.unseen; tabNote.setAttribute('aria-label', `Notebook${state.unseen ? `, ${state.unseen} new` : ''}`); }
  function renderNotebook() {
    const kids = [];
    if (c.num >= 2) kids.push(h('div.nb-tools', h('button.btn.ghost', { type: 'button', id: 'btn-graph', onclick: () => { sfx.tap(); openGraph(c, state, state.site); } }, h('span', { html: icon('graph', 22) }), 'Graph')));
    kids.push(notebookView({ c, state, flags: state.step === 'done' }));
    notePane.replaceChildren(...kids);
  }
  function renderTools() {
    const site = state.site ? siteOf(c, state.site) : null;
    const kids = [];
    if (!site) kids.push(h('div.site-card.empty', h('span', { html: icon('pin', 30) }), h('div', h('strong', 'Tap a site on the map'), h('p', 'Then look at the water and test it.'))));
    else {
      const lastLook = [...state.entries].reverse().find(e => e.param === 'look' && e.site === site.id);
      kids.push(h('div.site-card', h('span.sc-letter', site.id), h('div', h('strong', site.name), h('p', site.blurb))));
      kids.push(h('button.btn.look#btn-look', { type: 'button', onclick: doLook }, h('span', { html: icon('eye', 26) }), h('span', 'Look at the water'), h('span.free', 'Free')));
      if (lastLook) kids.push(h('p.look-text', { 'data-testid': 'look-text' }, h('span.look-day', `Day ${lastLook.day}`), lastLook.value));
    }
    const grid = h('div.tool-grid');
    for (const id of c.tools.filter(t => t !== 'look')) {
      const t = TOOLS[id], chk = site ? G.canTest(state, id) : { ok: true, reason: '' };
      const reason = site ? chk.reason : 'Tap a site on the map first';
      const disabled = !site || !chk.ok;
      const showWhy = !!site && !chk.ok;
      grid.append(h('button.tool' + (disabled ? '.disabled' : ''), { type: 'button', 'data-tool': id, 'aria-disabled': String(disabled), title: disabled ? reason : `${t.name}${t.delay ? `: result in ${t.delay} ${t.delay === 1 ? 'day' : 'days'}` : ''}`, onclick: () => doTest(id) },
        h('span.t-ico', { html: icon(toolIcon(id), 34) }),
        h('span.t-name', t.name),
        h('span.t-cost', { 'aria-label': `costs ${t.cost} ${t.cost === 1 ? 'token' : 'tokens'}` }, ...Array.from({ length: t.cost }, () => h('span', { html: icon('drop', 16) })), t.delay ? h('span.t-lab', `Lab: Day +${t.delay}`) : null),
        showWhy ? h('span.t-why', reason) : null));
    }
    kids.push(grid);
    if (state.tokens < 2) {
      kids.push(h('div.topup', h('p', state.tokens === 0 ? 'You are out of tokens.' : 'You are almost out of tokens.'),
        h('button.btn.ghost#btn-topup', { type: 'button', onclick: doTopUp }, 'Ask the ranger for 3 more'), h('small', 'This ends the Sharp detective star.')));
    }
    const help = h('details.tool-help', h('summary', 'What do the tools measure?'), h('ul', c.tools.filter(t => t !== 'look').map(t => h('li', TOOL_HELP[t]))));
    kids.push(help);
    toolsPane.replaceChildren(...kids);
    glossify(help, { local: true });
  }

  setTab('tools');
  refresh();
  if (coach) setTimeout(() => coach.start(), 400);
  // keep the coach cleaned up when leaving
  return () => { coach?.stop(false); };
}
