# Water Detective: design spec (25 Nov 2026)

A 2D browser game for **Stage 5 Aquatic Technology** at Woonona High School (combined Year 9/10 class, NESA Aquatic
Technology 7–10, 2024). Students test water at sites on a drawn lagoon map, spend a small budget of test tokens, wait for
lab results, then name the cause of a water problem and back it up with readings. Three cases, one per module.

Decided with Irvin: a casebook of 3 cases, played **in pairs on laptops/Chromebooks**, a **2D illustrated map**, and
the **test budget + stars** hook. Paired one-page worksheets ("Case Notes") per case. Must be high quality and fully polished.

## 1. Cases (content contract; exact data lives in `src/data/cases.js`)

| # | Title | Module · dot points | Lesson(s) it pairs with | Time |
|---|---|---|---|---|
| 1 | Green Water | M1 · 1.1.1, 1.2.3 | 1.1.1 Water Quality Testing, 1.2.3 Eutrophication Jars | 15 min |
| 2 | Which Pond Is Sick? | M5 · 5.1.7, 5.3.2 | 5.1.7 Pond Doctor, 5.3.2 Water Watchers | 15 min |
| 3 | Fish Kill | M6 · 6.1.6, 6.1.7 | 6.1.6 Muddy Water Test, 6.1.7 Lagoon Water Check | 15 min |

- **Made-up places.** Cases 1 and 3 are at **Sandpiper Lagoon**, case 2 at **Banksia Reserve**. Both are fictional "typical NSW
  coastal" places. No invented facts or readings for real places (house rule). Each case ends with one verified real link:
  Case 3 and Case 1 → NSW Bellambi Lake page ("NSW rates its water quality as poor"; "more than 90 % of the catchment is
  urban"), https://www.environment.nsw.gov.au/topics/water/estuaries/estuaries-of-nsw/bellambi-lake . Case 2 → Beachwatch
  "How we monitor" (samples usually once a week), https://www.beachwatch.nsw.gov.au/waterMonitoring/howWeMonitor .
- **Case 3 day-1 readings are the course's fixed practice set** (BUILD_RULES Module 6) so the game and the 6.1.7 worksheet agree.
- Readings are **hand-authored and identical for every student** (no randomness) so answers are checkable.

### Guide values (shown on the in-game "Guide card"; a guide, not a law)
Source: NSW ANZECC 2000 default trigger values (environment.nsw.gov.au/ieo/CooksRiver/report-03.htm) and Beachwatch low oxygen.
| | Estuary / salty water | Fresh water (lowland river) |
|---|---|---|
| pH | 7.0 to 8.5 | 6.5 to 8.5 |
| Turbidity | 0.5 to 10 NTU | (no value on the card) |
| Total nitrogen | 300 µg/L or less | 350 µg/L or less |
| Total phosphorus | 30 µg/L or less | 25 µg/L or less |
| Dissolved oxygen | under 4 mg/L is low | under 4 mg/L is low |
| Temperature, salinity | no single guide: depends on the animals | same |

Students pick the column by the water's salinity (misconception target: "salty water is polluted").

## 2. The core loop

1. **Call** (1 screen): a ranger's message, 2 short sentences, read-aloud. Shows the budget and the day limit.
2. **Pack your kit** (1 screen, ~20 s): tap the 3 safety items out of 6 (gloves, buddy, sampling pole; distractors: thongs,
   wading boots "for going in", a drink bottle "to taste-test"). Matches the course rule: buddy, boundary, no wading, gloves.
   Wrong taps give a friendly reason. Case 1 only after first completion: it shrinks to a one-tap "Kit packed" confirm.
3. **Investigate** (main screen): map + toolkit + field notebook.
   - Tap a **site pin** to stand there. **Look** (free) gives the site's observation text and changes the site art
     (green scum, dead fish, brown water, foam, no shine…).
   - Tap a **tool** to test. Each test costs tokens and plays a short instrument animation (see §4). The reading lands in
     the notebook with units, site and day.
   - **Lab tests** (nutrients, BOD, pesticide) take time: the bottle goes in the "Waiting" tray with a day countdown.
   - **Next day** advances the clock: weather and site art change, readings may change, waiting results arrive.
     The day limit is shown ("Day 2 of 5"). Next day is disabled at the last day.
   - **Guide card** (free) opens the guide table.
   - **Graph** (case 2 and 3): pick a site and parameter, see a line graph of the readings taken over days.
   - **Detective tip** (free): 3 progressive hints per case.
   - **Solve the case** opens the case board (always available; no gate).
4. **Case board**:
   1. Pick the cause from 4 **suspect cards** (icon + one line).
   2. Pick **2 evidence readings** from your notebook that support it.
   3. Optional: pick one other suspect and **one reading that rules it out**.
   4. Check. A wrong cause costs **2 tokens** ("The council paid for a check that found nothing") and shows a
      friendly, specific reason, then "Try again". Weak evidence does not fail the case; it just loses star 2, with feedback
      naming why the reading does not help ("Site A is the clean entrance, so it does not show where the problem is").
5. **Wrap-up**: a sentence frame with 2–3 blanks, 3 word chips each (tap chip then blank, or drag; wrong chips wobble with
   a hint). Then the stars animation, a "real place" card with the verified link, and Next case / Report card.

**No dead ends:** if tokens hit 0, tests show "Out of tokens" and offer **"Ask the ranger for 3 more"** (loses star 3).
Wrong-cause token cost cannot take tokens below 0. The day limit never blocks solving.

### Stars (per case; best kept)
- ★ **Solved**: the right cause found with at most ONE wrong try. After two or more wrong tries the case still closes
  ("Solved after a few guesses") but without star 1. A wrong try costs 2 tokens; the same wrong cause is never charged
  twice and is locked once tried.
- ★ **Evidence**: both chosen readings are valid for the right cause (rules per case in `cases.js`). If not earned, the
  board shows the student's result and a model answer ("Strong evidence would be..."). No retry.
- ★ **Sharp detective**: ★ Evidence AND a valid rule-out reading for another suspect AND no ranger top-up AND no wrong tries.
- Budgets: 6 / 8 / 7 tokens (cases 1 / 2 / 3). Lab results show a "Results are in" card; "Wait for results" skips to the next arrival.

## 3. Screens and layout

- **Title**: logo "Water Detective", one line ("Test the water. Find the cause."), 3 case cards (module tag, title,
  stars earned, "New" / "Continue"), Report card button, Teacher guide link, sound toggle, read-aloud toggle.
  Continue restores an in-progress case exactly.
- **Investigate layout at 1366×768 (the target Chromebook):** top bar (case title, Day x of y + weather icon, token
  meter as drops, Guide, Tip, sound, menu); left 62 % map; right 38 % panel with two tabs **Tools** | **Notebook**
  (notebook badge counts new readings). Waiting tray sits under the map. Bottom-right primary button **Solve the case**.
- **Narrow (< 900 px, phones/projector zoom):** map on top (fixed aspect), panel below with the tabs. Everything reachable.
- **Report card**: all 3 cases with stars and completed sentences, optional name field, date, Print (one A4 page, light) and
  Copy. Line: "You tested water like a real water scientist."
- **Teacher guide** (`teacher.html`): 30-second quick start, how to run each case (timing, pairs, run case 1's first minute
  on the board), dot points, misconceptions targeted, the made-up-place note, the worksheet links, the stars rules,
  a "reset this device" button. **No answers** (answer key is `docs/ANSWER-KEY.md`, git-ignored, and the worksheet answer copies).

## 4. Instruments (authored SVG, short animations ≤ 1.2 s, skippable by click; instant under reduced motion)
| Tool | Cost | Unit | Animation / interaction | Used in |
|---|---|---|---|---|
| Look | 0 | – | Site art detail swaps in; observation text | 1, 2, 3 |
| Thermometer (digital) | 1 | °C | Probe dips, display counts up to the value | 1, 2, 3 |
| pH meter | 1 | pH | Probe dips, display settles (one decimal) | 1, 3 |
| pH strip + colour chart | 1 | pH | Strip dips and changes colour; student **taps the matching chart swatch** (6.0–8.5 in 0.5 steps). Wrong tap: "Look again", no cost | 2 |
| Refractometer | 1 | ppt | Eyepiece view: the blue/white line slides to the value on a 0–40 scale | 1, 2, 3 |
| Dissolved oxygen meter | 1 | mg/L | Probe dips, display settles | 1, 2, 3 |
| Turbidity meter | 1 | NTU | Vial goes in, display settles | 1, 3 |
| Clarity tube | 1 | cm | **Hold to pour**: water rises, the black cross fades; release when it disappears. The value recorded is always the authored one (the cross vanishes exactly there); "100+" if it never vanishes | 2 |
| Nutrient lab test | 2 | µg/L (total N and total P) | Bottle labelled and sent; result arrives **next day** | 1, 2, 3 |
| BOD bottles | 2 | mg/L | Fill clear + foil bottle; clear tested now (shows DO); foil result after **5 days**; notebook shows DO now, DO after 5 days, and BOD = difference | 3 |
| Pesticide lab test | 3 | – | Sent to lab; result after **5 days**: "Not found" or a found message | 3 |

Every reading shows units. Values outside the guide are **not** auto-flagged in the notebook (comparing is the student's
job); the Guide card is one tap away. After the case ends, the notebook shows guide flags.

## 5. Misconceptions the cases make fail
- "Salty water is polluted" (case 2 saltmarsh pool, case 3 salinity rule-out).
- "One test on one day tells you everything" (case 2: Pond B looks fine on day 1).
- "Hot weather alone made the water green" (case 1: every site is warm; only the drain site is bad).
- "Cloudy = poisoned" / "Clear water is always healthy" (case 3: Site A is clear and fine, Site C's problem is oxygen use).
- "BOD is the oxygen in the water" (case 3: BOD is the oxygen used up over 5 days, shown as a difference).

## 6. Look and feel
- **Style:** friendly field-notebook. Cream paper panels, rounded cards, thick ink outlines (same line-art feel as the
  course slides), flat colour fills. Per-case accent = module ink from the slide templates: M1 `#1F4E52` (bg `#CDEBE6`,
  pop `#F2A07F`), M5 `#3A2F66` (bg `#E6E0F3`, pop `#E7A6CB`), M6 `#37474F` (bg `#EFE7D7`, pop `#9DBBD9`).
- **Fonts:** Bubblegum Sans (titles), Mulish (body), self-hosted from `fonts/`. Body 18 px min, 20 px on screens with
  instructions.
- **Map:** authored inline SVG, top-down illustrated: water with soft ripple animation, sand, reeds/mangroves, houses,
  roads, drains, creek, boat ramp, sand bar. Weather layer (sun, clouds, rain streaks) and a day/time tint. Site pins are
  big labelled markers (A, B, C…) with a "you are here" state and a small tick when tested. Site art changes by
  observation (green tint + scum dots, dead fish, brown plume, foam). Decorative birds (pelican, heron) idle gently.
- **No emoji** in the UI; authored SVG icons only. No AI images. No photos.
- **Juice (subtle, meaningful):** token drop pops when spent; reading "lands" in the notebook; stamp thump on stars;
  day change wipe. WebAudio synth sfx (no files): tap, pour/bubble, meter beep, lab send, day chime, correct, wrong,
  star, stamp. Sound off by default? **On by default, muted easily**; remembered.
- **Light theme only** (deviation from the suite's dual-theme rule: chosen for projector legibility, print and to match the
  paper worksheets). Contrast WCAG AA.

## 7. Accessibility and reading level
- Text per screen: short sentences, Year 7–8 reading level, each science word explained the first time (glossary popover:
  pH, salinity, ppt, dissolved oxygen, turbidity, NTU, clarity, nutrients, algae bloom, BOD, microbes, estuary, stormwater,
  runoff, guide value).
- Read-aloud button on Call, Case board, Wrap-up and Glossary (Web Speech API, prefer en-AU; hidden if unsupported).
- Full keyboard play: Tab order, Enter/Space activate, arrow keys move between site pins, visible focus ring,
  `aria-live` announces each new reading and day change. Hold-to-pour also works by holding Space/Enter.
- Tap targets ≥ 44 px (48 preferred). `prefers-reduced-motion`: no ripples, instant instruments, no screen shake.
- Works at 1366×768, 1920×1080 (projector) and 375 px wide.

## 8. Technical
- **Stack:** vanilla ES modules, no build step, no dependencies, no network calls (works offline once loaded).
  `python3 devserver.py 8494` to run. GitHub Pages ready (`.nojekyll`, relative paths). Not published until Irvin says so.
- **Layout:**
  - `index.html`, `teacher.html`, `styles.css`, `fonts/`
  - `src/data/cases.js` (content, authored by Claude: do not change values), `src/data/glossary.js`, `src/data/guide.js`
  - `src/logic/` pure functions, no DOM: `game.js` (create state, runTest, look, nextDay, topUp, accuse, scoreStars),
    `readings.js` (value for site/param/day; pending lab results), `board.js` (check cause, evidence, rule-out → feedback)
  - `src/state/save.js`: localStorage key `water-detective:v1`, versioned, validated on load (bad data → fresh start)
  - `src/ui/`: `app.js` (router/screens), `map.js`, `instruments.js`, `notebook.js`, `graph.js`, `board.js`,
    `wrapup.js`, `report.js`, `glossary.js`, `speech.js`, `icons.js`, `coach.js` (first-time tips on case 1)
  - `src/audio/sfx.js` (from SEALED, extended)
  - `tests/*.test.mjs` (`node --test`), `tests/playtest/` (Playwright from `../LifeLens/node_modules`, screenshots)
- `window.__wd` exposes state for playtests.

## 9. Tests (must pass)
- **Content integrity:** every case has 4 suspects with exactly one correct; every evidence/rule-out rule references a
  site/param that exists; every wrap-up blank has exactly one correct chip; every reading has a unit; guide values match §1.
- **Solvability:** for each case a scripted shortest path reaches 3 stars within the budget and day limit; a path that
  only uses free actions cannot reach star 2.
- **Rules:** wrong cause costs 2 tokens, never below 0; top-up blocks star 3; lab results arrive on the right day;
  BOD = DO now − DO after 5 days; readings vary by day where authored.
- **Save:** round-trip, corrupt data → fresh start, in-progress case restores.
- **Playtest (browser):** each case played start to finish at 1366×768 and 375×667 by keyboard and by mouse, no console
  errors, screenshots saved.

## 10. Paired worksheets
One page per case ("Case Notes", whs-worksheet house style, + red answer copy): prediction, a notebook table to copy the
readings they used, the cause + two readings + rule-out, the wrap-up sentence, and one link-back question to the paired
lesson. Saved in the course folder `Worksheets/Water Detective/`.

## 11. Out of scope
Accounts, online scores, a free sandbox, 3D, real Bellambi readings, Year-specific versions.
