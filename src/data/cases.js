// Water Detective case data. Authored and science-checked by Claude (25 Nov 2026). DO NOT change values without
// updating docs/ANSWER-KEY.md and the Case Notes worksheets: the worksheets quote these numbers.
//
// Conventions
// - Days are 1-based. A reading is either one value (same every day) or an array with one value per day.
// - "100+" (clarity) means the cross never disappeared in the 100 cm tube (clear water).
// - Labs: nutrients return { n, p } in µg/L the NEXT day; bod returns the BOD (mg/L) after 5 days; pest after 5 days.
//   BOD bottle: DO now = do[day]; DO after 5 days = do[day] - bod. Lab tests are refused if the result would arrive
//   after the case's last day.
// - Evidence and rule-out rules match notebook entries by site + param (+ optional minDay/maxDay).
//   param is a tool id, or 'n' / 'p' for the two nutrient results, or 'look'.
// - A `why` may contain {value}: replace it with the student's own reading and unit (e.g. '15 cm').
// - Wrap-up options are listed with the correct one first; the UI must SHUFFLE their display order (seeded, stable).
// - Map coordinates are in a 1000 x 640 viewBox.

export const TOOLS = {
  look:      { name: 'Look',                 short: 'Look',      cost: 0, unit: '',     delay: 0 },
  temp:      { name: 'Thermometer',          short: 'Temp',      cost: 1, unit: '°C',   delay: 0, label: 'Temperature' },
  ph:        { name: 'pH meter',             short: 'pH',        cost: 1, unit: '',     delay: 0, label: 'pH' },
  phStrip:   { name: 'pH strip',             short: 'pH',        cost: 1, unit: '',     delay: 0, label: 'pH',
               chart: [6.0, 6.5, 7.0, 7.5, 8.0, 8.5] },
  sal:       { name: 'Refractometer',        short: 'Salt',      cost: 1, unit: 'ppt',  delay: 0, label: 'Salinity' },
  do:        { name: 'Oxygen meter',         short: 'Oxygen',    cost: 1, unit: 'mg/L', delay: 0, label: 'Dissolved oxygen' },
  turb:      { name: 'Turbidity meter',      short: 'Cloudy',    cost: 1, unit: 'NTU',  delay: 0, label: 'Turbidity' },
  clarity:   { name: 'Clarity tube',         short: 'Clarity',   cost: 1, unit: 'cm',   delay: 0, label: 'Clarity' },
  nutrients: { name: 'Nutrient lab test',    short: 'Nutrients', cost: 2, unit: 'µg/L', delay: 1, label: 'Nutrients',
               parts: { n: 'Total nitrogen', p: 'Total phosphorus' } },
  bod:       { name: 'BOD bottles',          short: 'BOD',       cost: 2, unit: 'mg/L', delay: 5, label: 'BOD' },
  pest:      { name: 'Pesticide lab test',   short: 'Pesticide', cost: 3, unit: '',     delay: 5, label: 'Pesticides' },
};

// Guide values (NSW ANZECC 2000 default trigger values; Beachwatch for low oxygen). A guide, not a law.
export const GUIDE = {
  source: 'NSW Government guide values (ANZECC 2000) and Beachwatch NSW',
  sourceUrl: 'https://www.environment.nsw.gov.au/ieo/CooksRiver/report-03.htm',
  estuary: { label: 'Estuary or salty water', ph: [7.0, 8.5], turb: [0.5, 10], n: 300, p: 30, doLow: 4 },
  fresh:   { label: 'Fresh water (lowland river)', ph: [6.5, 8.5], turb: null, n: 350, p: 25, doLow: 4 },
  note: 'Temperature and salinity have no single guide: it depends on the animals that live there.',
  bodNote: 'BOD has no guide on this card. Compare sites: a higher BOD means microbes use up oxygen faster.',
};

export const CASES = [
  // ───────────────────────────────────────────────────────────── CASE 1
  {
    id: 'green-water', num: 1, title: 'Green Water',
    module: 'M1', moduleName: 'Aquatic Environments', dotPoints: ['1.1.1', '1.2.3'],
    accent: { ink: '#1F4E52', bg: '#CDEBE6', pop: '#F2A07F', pop2: '#E8775A' },
    place: 'Sandpiper Lagoon', map: 'lagoon-open',
    budget: 6, days: 3,
    tools: ['look', 'temp', 'ph', 'sal', 'do', 'turb', 'nutrients'],
    weather: [
      { icon: 'sun-cloud', text: 'Warm and still. Heavy rain two days ago.' },
      { icon: 'sun', text: 'Warm and still.' },
      { icon: 'sun', text: 'Hot and still.' },
    ],
    call: {
      from: 'Ranger Sam',
      lines: [
        'The water near the north shore of Sandpiper Lagoon has turned bright green, and some fish have died.',
        'Find out what caused it. Your readings are taken early in the morning.',
      ],
    },
    mapFeatures: ['sea', 'entrance-open', 'north-drain', 'housing-lawns', 'sports-field', 'boat-ramp', 'creek', 'building-site', 'reeds', 'mangroves'],
    sites: [
      { id: 'A', name: 'Entrance',    water: 'estuary', x: 860, y: 330, blurb: 'Where the lagoon meets the sea.' },
      { id: 'B', name: 'Boat ramp',   water: 'estuary', x: 560, y: 360, blurb: 'The middle of the lagoon, by the boat ramp.' },
      { id: 'C', name: 'North drain', water: 'estuary', x: 420, y: 170, blurb: 'A stormwater drain from the new houses and the sports field.' },
      { id: 'D', name: 'Creek mouth', water: 'estuary', x: 170, y: 430, blurb: 'Where the creek flows in. A building site is up the creek.' },
    ],
    readings: {
      A: { temp: 21.0, ph: 8.1, sal: 32, do: 7.6, turb: 4 },
      B: { temp: 22.0, ph: 8.0, sal: 24, do: 5.8, turb: 9 },
      C: { temp: 22.5, ph: 7.4, sal: 12, do: 2.9, turb: 18 },
      D: { temp: 21.5, ph: 7.6, sal: 6,  do: 6.9, turb: 8 },
    },
    labs: {
      nutrients: { A: { n: 220, p: 18 }, B: { n: 340, p: 34 }, C: { n: 900, p: 95 }, D: { n: 260, p: 22 } },
    },
    looks: {
      A: { text: 'Clear blue-green water. Small fish in the shallows. No oil shine.', art: ['clear'] },
      B: { text: 'Slightly green water by the boat ramp. No oil shine on the water.', art: ['tinge'] },
      C: { text: 'Bright green water with a scum on top. Two dead fish. A smell of rotting plants. No oil shine.', art: ['bloom', 'deadfish'] },
      D: { text: 'Light brown but fairly clear creek water. No oil shine.', art: ['tea'] },
    },
    suspects: [
      { id: 'fertiliser', icon: 'drain', title: 'Fertiliser down the north drain',
        line: 'Rain washed lawn fertiliser into the lagoon.', correct: true },
      { id: 'soil', icon: 'digger', title: 'Soil from the building site',
        line: 'Mud from the building site washed down the creek.',
        wrongWhy: 'Soil makes water brown and cloudy, and it would come in at the creek. Have you tested the creek mouth?',
        ruleOut: [{ site: 'D', param: 'turb', why: 'The creek mouth is only 8 NTU, inside the guide (10 or less). Not much soil is coming in.' }] },
      { id: 'oil', icon: 'boat', title: 'Oil leaking from boats',
        line: 'Fuel or oil leaked at the boat ramp.',
        wrongWhy: 'Oil leaves a rainbow shine on the water, and it would be worst at the boat ramp. Have you looked there?',
        ruleOut: [{ site: 'B', param: 'look', why: 'There is no oil shine at the boat ramp.' }] },
      { id: 'heat', icon: 'sun', title: 'Just the hot weather',
        line: 'The warm week made the whole lagoon go green.',
        wrongWhy: 'If heat alone did it, every warm site would be green. Compare the temperature at another site.',
        ruleOut: [
          { site: 'A', param: 'temp', why: 'The entrance is just as warm (21 °C) but its water is clear. Heat alone is not the cause.' },
          { site: 'B', param: 'temp', why: 'The boat ramp is just as warm (22 °C) but only slightly green. Heat alone is not the cause.' },
          { site: 'D', param: 'temp', why: 'The creek mouth is just as warm (21.5 °C) but its water is not green. Heat alone is not the cause.' },
        ] },
    ],
    evidence: {
      valid: [
        { site: 'C', param: 'n',  why: 'Nitrogen at the north drain is 900 µg/L, three times the guide (300). Fertiliser is full of nitrogen.' },
        { site: 'C', param: 'p',  why: 'Phosphorus at the north drain is 95 µg/L, about three times the guide (30). Fertiliser adds phosphorus.' },
        { site: 'C', param: 'do', why: 'Oxygen at the north drain is 2.9 mg/L, under 4: too low for fish. Rotting algae used it up.' },
      ],
      mustInclude: ['n', 'p'],
      mustIncludeWhy: 'Pick at least one nutrient reading. Nutrients are what show that fertiliser got in.',
      notes: {
        'C.turb': 'Cloudy water could be algae or soil. On its own it does not show fertiliser.',
        'C.temp': 'Every site is warm, so temperature does not point to the drain.',
        'A.*': 'The entrance is the cleanest site. Use readings from where the problem is.',
      },
      defaultWhy: 'This reading does not show that fertiliser came down the north drain.',
    },
    hints: [
      'Start where the problem looks worst. Tap the north drain and Look.',
      'Green water means lots of algae. Algae grow fast when there are lots of nutrients. Which test measures nutrients?',
      'Fish need oxygen. Test the oxygen where the fish died, and compare it with the guide card.',
    ],
    frame: {
      text: 'Rain washed {0} from lawns down the north drain. The extra nutrients fed an algae {1}. When the algae died and rotted, the oxygen in the water {2}, so fish died.',
      blanks: [
        { options: ['fertiliser', 'soil', 'oil'], correct: 0, hint: 'What do people put on lawns to make grass grow?' },
        { options: ['bloom', 'die-off', 'shortage'], correct: 0, hint: 'The water turned green: the algae grew fast. A sudden burst of algae has a flower word.' },
        { options: ['dropped', 'rose', 'stayed the same'], correct: 0, hint: 'Check the oxygen reading at the north drain.' },
      ],
    },
    real: {
      text: 'This lagoon is made up, but the problem is real. Near Woonona, NSW rates the water quality of Bellambi Lake as poor, and more than 90 % of its catchment is houses, roads and other urban land.',
      url: 'https://www.environment.nsw.gov.au/topics/water/estuaries/estuaries-of-nsw/bellambi-lake',
      linkText: 'NSW Government: Bellambi Lake',
    },
  },

  // ───────────────────────────────────────────────────────────── CASE 2
  {
    id: 'which-pond', num: 2, title: 'Which Pond Is Sick?',
    module: 'M5', moduleName: 'Aquatic Ecology', dotPoints: ['5.1.7', '5.3.2'],
    accent: { ink: '#3A2F66', bg: '#E6E0F3', pop: '#E7A6CB', pop2: '#D070AA' },
    place: 'Banksia Reserve', map: 'reserve',
    budget: 8, days: 5,
    tools: ['look', 'temp', 'phStrip', 'sal', 'do', 'clarity', 'nutrients'],
    weather: [
      { icon: 'sun', text: 'Sunny and mild.' },
      { icon: 'rain', text: 'Heavy rain all day.' },
      { icon: 'cloud', text: 'Cloudy. The rain has stopped.' },
      { icon: 'sun', text: 'Sunny.' },
      { icon: 'sun', text: 'Sunny and warm.' },
    ],
    call: {
      from: 'Ranger Jo',
      lines: [
        'Volunteers count the animals in three waters at Banksia Reserve. This month, animals are disappearing from one of them.',
        'You have five days. Test, wait, and test again to find which water is sick, and why.',
      ],
    },
    mapFeatures: ['saltmarsh', 'farm-paddock', 'cattle', 'fern-gully', 'boardwalk', 'track'],
    sites: [
      { id: 'A', name: 'Saltmarsh Pool', water: 'estuary', x: 780, y: 220, blurb: 'A salty pool in the saltmarsh, filled by high tides.' },
      { id: 'B', name: 'Farm Dam',       water: 'fresh',   x: 300, y: 200, blurb: 'A dam beside a cattle paddock.' },
      { id: 'C', name: 'Fern Pond',      water: 'fresh',   x: 470, y: 470, blurb: 'A cool, shady pond in the fern gully.' },
    ],
    readings: {
      A: { temp: [20, 19, 19, 20, 21], phStrip: 8.0, sal: [25, 22, 22, 23, 24], do: [7.2, 7.4, 7.3, 7.1, 7.0], clarity: ['100+', 90, '100+', '100+', '100+'] },
      B: { temp: [21, 18, 19, 21, 22], phStrip: [7.5, 7.0, 7.0, 7.0, 7.0], sal: 0, do: [6.5, 6.2, 4.6, 3.4, 3.1], clarity: [80, 30, 15, 20, 25] },
      C: { temp: [16, 15, 15, 16, 16], phStrip: 6.5, sal: 0, do: [7.0, 7.1, 7.0, 6.9, 6.9], clarity: ['100+', 85, '100+', '100+', '100+'] },
    },
    labs: {
      nutrients: {
        A: { n: 240, p: 20 },
        B: [{ n: 330, p: 24 }, { n: 620, p: 58 }, { n: 900, p: 110 }, { n: 820, p: 96 }, { n: 760, p: 88 }],
        C: { n: 280, p: 20 },
      },
    },
    looks: {
      A: [
        { text: 'Clear, salty pool. Crabs and small fish among the saltmarsh plants.', art: ['clear'] },
        { text: 'Rain on a clear, salty pool. Crabs hiding under the plants.', art: ['clear'] },
        { text: 'Clear, salty pool. Crabs and small fish among the saltmarsh plants.', art: ['clear'] },
        { text: 'Clear, salty pool. Crabs and small fish among the saltmarsh plants.', art: ['clear'] },
        { text: 'Clear, salty pool. Crabs and small fish among the saltmarsh plants.', art: ['clear'] },
      ],
      B: [
        { text: 'Green-brown dam water. Cattle drink at the muddy edge. Tadpoles swim near the reeds.', art: ['tinge', 'cattle'] },
        { text: 'Muddy water is pouring off the paddock into the dam.', art: ['plume', 'cattle'] },
        { text: 'The dam is brown, like milky tea. Hardly any tadpoles to be seen.', art: ['brown'] },
        { text: 'Brown water with a green film at the edges. Very few tadpoles.', art: ['brown', 'film'] },
        { text: 'Brown water with a thicker green film. No tadpoles seen today.', art: ['brown', 'film'] },
      ],
      C: [
        { text: 'Clear, shady pond. Frogs calling. Lots of tadpoles.', art: ['clear'] },
        { text: 'Rain dripping through the ferns. The pond is a little cloudy.', art: ['tinge'] },
        { text: 'Clear, shady pond. Frogs calling. Lots of tadpoles.', art: ['clear'] },
        { text: 'Clear, shady pond. Frogs calling. Lots of tadpoles.', art: ['clear'] },
        { text: 'Clear, shady pond. Frogs calling. Lots of tadpoles.', art: ['clear'] },
      ],
    },
    suspects: [
      { id: 'too-salty', icon: 'salt', title: 'Saltmarsh Pool is too salty',
        line: 'The salt in the pool is harming the animals.',
        wrongWhy: 'A saltmarsh pool is filled by the tide, so it is meant to be salty. Which column of the guide card fits salty water?',
        ruleOut: [
          { site: 'A', param: 'sal', why: 'The pool is salty because the tide fills it. Salty is normal here: use the estuary guide.' },
          { site: 'A', param: 'do',  why: 'The pool has {value} of oxygen: plenty for its animals to breathe.' },
        ] },
      { id: 'runoff', icon: 'rain', title: 'Rain washed the paddock into the Farm Dam',
        line: 'Runoff brought soil and cattle dung into the dam.', correct: true },
      { id: 'too-cold', icon: 'snow', title: 'Fern Pond is too cold',
        line: 'The shady pond is too cold for the animals.',
        wrongWhy: 'Cool water is not always bad. Cool water holds more oxygen. Check how the Fern Pond animals are doing.',
        ruleOut: [
          { site: 'C', param: 'do',   why: 'Fern Pond has {value} of oxygen: plenty. Its frogs and tadpoles are doing well.' },
          { site: 'C', param: 'temp', why: 'Fern Pond is {value}: cool, and its frogs and tadpoles are doing well at that temperature.' },
        ] },
      { id: 'always-bad', icon: 'calendar', title: 'The Farm Dam was always bad',
        line: 'The dam water was unhealthy all along.',
        wrongWhy: 'Did you test the dam on Day 1, before the rain? One day is not enough: compare before and after.',
        ruleOut: [
          { site: 'B', param: 'clarity', maxDay: 1, why: 'On Day 1, before the rain, the dam was fairly clear (80 cm).' },
          { site: 'B', param: 'do',      maxDay: 1, why: 'On Day 1, before the rain, the dam had plenty of oxygen (6.5 mg/L).' },
          { site: 'B', param: 'n',       maxDay: 1, why: 'On Day 1, before the rain, the dam\'s nitrogen was inside the fresh-water guide (330, guide 350).' },
          { site: 'B', param: 'p',       maxDay: 1, why: 'On Day 1, before the rain, the dam\'s phosphorus was inside the fresh-water guide (24, guide 25).' },
        ] },
    ],
    evidence: {
      valid: [
        { site: 'B', param: 'clarity', minDay: 2, why: 'After the rain the Farm Dam\'s clarity is only {value}. Soil washed in and made it cloudy.' },
        { site: 'B', param: 'n',       minDay: 2, why: 'After the rain the Farm Dam\'s nitrogen is {value}, over the fresh-water guide (350). Dung and soil carry nutrients.' },
        { site: 'B', param: 'p',       minDay: 2, why: 'After the rain the Farm Dam\'s phosphorus is {value}, over the fresh-water guide (25). Dung and soil carry nutrients.' },
        { site: 'B', param: 'do',      minDay: 4, why: 'The Farm Dam\'s oxygen has fallen to {value}, under 4 mg/L: too low for many animals.' },
      ],
      notes: {
        'B.clarity@1': 'That is a Day 1 reading, from before the rain. It shows the dam was fine then.',
        'B.do@1': 'That is a Day 1 reading, from before the rain. It shows the dam was fine then.',
        'B.do@2': 'The oxygen has not dropped much yet on that day. A later day shows the problem.',
        'B.do@3': 'The oxygen is falling, but it is not yet under 4 mg/L. A later day shows the problem clearly.',
        'B.n@1': 'That is a Day 1 reading, from before the rain. It shows the dam was fine then.',
        'B.p@1': 'That is a Day 1 reading, from before the rain. It shows the dam was fine then.',
        'B.temp': 'The dam\'s temperature is normal for a farm dam. It does not show runoff.',
        'B.phStrip': 'The dam\'s pH stays inside the fresh-water guide (6.5 to 8.5).',
        'B.sal': 'The dam is fresh water every day. Salt is not the problem.',
        'A.*': 'That reading is from the Saltmarsh Pool, not the sick water.',
        'C.*': 'That reading is from Fern Pond, not the sick water.',
      },
      defaultWhy: 'This reading does not show what happened to the Farm Dam after the rain.',
    },
    hints: [
      'Test all three waters on Day 1, then press Next day. Watch what the rain does.',
      'Salty is normal for a saltmarsh pool. Check the guide card for which column to use.',
      'Pick one water and test it again on a later day. Use the Graph to see the change.',
    ],
    frame: {
      text: 'The {0} got sick after the {1}. Runoff made the water {2} and added {3}. One test on Day 1 would have {4} the problem.',
      blanks: [
        { options: ['Farm Dam', 'Saltmarsh Pool', 'Fern Pond'], correct: 0, hint: 'Which water changed after the rain?' },
        { options: ['rain', 'sunshine', 'cold nights'], correct: 0, hint: 'What happened on Day 2?' },
        { options: ['cloudy', 'salty', 'acidic'], correct: 0, hint: 'What did the clarity tube show?' },
        { options: ['nutrients', 'salt', 'pesticide'], correct: 0, hint: 'Dung and soil carry nitrogen and phosphorus.' },
        { options: ['missed', 'found'], correct: 0, hint: 'Was the dam healthy on Day 1?' },
      ],
    },
    real: {
      text: 'Real scientists test again and again. Beachwatch NSW usually samples its sites once a week, so it can spot changes after rain.',
      url: 'https://www.beachwatch.nsw.gov.au/waterMonitoring/howWeMonitor',
      linkText: 'Beachwatch NSW: How we monitor',
    },
  },

  // ───────────────────────────────────────────────────────────── CASE 3
  {
    id: 'fish-kill', num: 3, title: 'Fish Kill',
    module: 'M6', moduleName: 'Local Area Study', dotPoints: ['6.1.6', '6.1.7'],
    accent: { ink: '#37474F', bg: '#EFE7D7', pop: '#9DBBD9', pop2: '#4F7CAC' },
    place: 'Sandpiper Lagoon', map: 'lagoon-closed',
    budget: 7, days: 7,
    tools: ['look', 'temp', 'ph', 'sal', 'do', 'turb', 'nutrients', 'bod', 'pest'],
    weather: [
      { icon: 'sun-cloud', text: 'Warm and still. Heavy rain three days ago.' },
      { icon: 'sun', text: 'Hot and calm.' },
      { icon: 'sun', text: 'Hot and calm.' },
      { icon: 'wind', text: 'A cool southerly wind.' },
      { icon: 'sun-cloud', text: 'Mild.' },
      { icon: 'sun-cloud', text: 'Mild.' },
      { icon: 'sun-cloud', text: 'Mild.' },
    ],
    call: {
      from: 'Ranger Sam',
      lines: [
        'Dead fish are floating in Sandpiper Lagoon. Sand has closed the entrance, so the sea cannot flush the water.',
        'Find out what is killing the fish. Some lab tests take five days, so start them by Day 2.',
      ],
    },
    mapFeatures: ['sea', 'entrance-closed', 'stormwater-outlet', 'creek', 'roads', 'housing', 'reeds', 'mangroves'],
    sites: [
      { id: 'A', name: 'Entrance',     water: 'estuary', x: 850, y: 330, blurb: 'The lagoon entrance. A sand bar has closed it.' },
      { id: 'B', name: 'Middle',       water: 'estuary', x: 540, y: 330, blurb: 'The middle of the lagoon.' },
      { id: 'C', name: 'Creek inflow', water: 'estuary', x: 210, y: 300, blurb: 'Where the creek flows in, next to a big stormwater outlet.' },
    ],
    // Day-1 values are the course practice set (BUILD_RULES, Module 6). BOD values match the 6.1.7 worksheet.
    readings: {
      A: { temp: [19.5, 21.0, 21.5, 19.0, 19.5, 19.5, 19.5], ph: 8.0, sal: 28, do: [7.8, 7.4, 7.2, 8.0, 7.8, 7.8, 7.8], turb: 6 },
      B: { temp: [20.5, 22.0, 22.5, 20.0, 20.5, 20.5, 20.5], ph: 7.6, sal: 15, do: [6.5, 5.8, 5.6, 6.8, 6.5, 6.6, 6.6], turb: 12 },
      C: { temp: [21.0, 23.0, 23.5, 20.5, 21.0, 21.0, 21.0], ph: 7.2, sal: 4,  do: [4.2, 3.3, 3.0, 4.6, 4.2, 4.3, 4.4], turb: 35 },
    },
    labs: {
      nutrients: { A: { n: 210, p: 18 }, B: { n: 420, p: 45 }, C: { n: 780, p: 90 } },
      bod: { A: 1.0, B: 1.8, C: 2.5 },
      pest: { A: 'Not found', B: 'Not found', C: 'Not found' },
    },
    looks: {
      A: { text: 'Clear water. A sand bar blocks the entrance, so no sea water is coming in. No oil shine.', art: ['clear', 'sandbar'] },
      B: [
        { text: 'Still, warm water. A few dead mullet near the reeds. No oil shine.', art: ['tinge', 'deadfish'] },
        { text: 'Hot, still water. More dead fish near the reeds this morning. No oil shine.', art: ['tinge', 'deadfish'] },
        { text: 'Hot, still water. More dead fish near the reeds this morning. No oil shine.', art: ['tinge', 'deadfish'] },
        { text: 'The cool wind is rippling the water. Fewer dead fish today. No oil shine.', art: ['tinge'] },
        { text: 'Still water. No new dead fish. No oil shine.', art: ['tinge'] },
        { text: 'Still water. No new dead fish. No oil shine.', art: ['tinge'] },
        { text: 'Still water. No new dead fish. No oil shine.', art: ['tinge'] },
      ],
      C: [
        { text: 'Brown water from the stormwater outlet. Rotting leaves, grass clippings and rubbish in the reeds. Six dead fish. No oil shine.', art: ['brown', 'debris', 'deadfish'] },
        { text: 'Hot, still, brown water. Many more dead fish this morning. A rotten-egg smell. No oil shine.', art: ['brown', 'debris', 'deadfish'] },
        { text: 'Hot, still, brown water. Many more dead fish this morning. A rotten-egg smell. No oil shine.', art: ['brown', 'debris', 'deadfish'] },
        { text: 'The wind is rippling the brown water. Only one new dead fish. No oil shine.', art: ['brown', 'debris'] },
        { text: 'Brown water and rotting leaves. No new dead fish. No oil shine.', art: ['brown', 'debris'] },
        { text: 'Brown water and rotting leaves. No new dead fish. No oil shine.', art: ['brown', 'debris'] },
        { text: 'Brown water and rotting leaves. No new dead fish. No oil shine.', art: ['brown', 'debris'] },
      ],
    },
    suspects: [
      { id: 'oxygen-used', icon: 'microbe', title: 'Rotting stormwater waste',
        line: 'Stormwater washed in waste. Microbes breaking it down used up the oxygen.', correct: true },
      { id: 'weed-spray', icon: 'spray', title: 'Weed spray from gardens',
        line: 'Rain washed weed spray (pesticide) into the lagoon.',
        wrongWhy: 'Weed spray can kill fish, but you need a lab test to know if it is there. It takes five days.',
        ruleOut: [
          { site: 'C', param: 'pest', why: 'The lab found no pesticide at the creek inflow, where most fish died.' },
          { site: 'B', param: 'pest', why: 'The lab found no pesticide in the middle of the lagoon.' },
        ] },
      { id: 'oil', icon: 'boat', title: 'An oil or fuel spill',
        line: 'Oil or fuel spilled into the lagoon.',
        wrongWhy: 'Oil leaves a rainbow shine on the water. Have you looked where the fish died?',
        ruleOut: [
          { site: 'C', param: 'look', why: 'There is no oil shine at the creek inflow, where most fish died.' },
          { site: 'B', param: 'look', why: 'There is no oil shine in the middle, where fish died.' },
        ] },
      { id: 'too-salty', icon: 'salt', title: 'The water is too salty',
        line: 'With the entrance closed, the lagoon got too salty for fish.',
        wrongWhy: 'Where did most fish die? Check how salty the water is there.',
        ruleOut: [{ site: 'C', param: 'sal', why: 'The creek inflow is the least salty site (4 ppt), yet most fish died there. Salt is not the cause.' }] },
    ],
    evidence: {
      valid: [
        { site: 'C', param: 'bod',  why: 'The creek inflow has the highest BOD of the three sites (2.5 mg/L). Microbes there use up oxygen fastest.' },
        { site: 'B', param: 'bod',  why: 'The middle\'s BOD (1.8 mg/L) is higher than the entrance (1.0). Microbes are using up oxygen there too.' },
        { site: 'C', param: 'do',   why: 'The creek inflow\'s oxygen ({value}) is the lowest of the three sites. Low oxygen is what kills fish.' },
        { site: 'C', param: 'turb', why: 'The creek inflow is 35 NTU, far over the guide (10). Stormwater carried in mud and rotting waste.' },
        { site: 'C', param: 'sal',  why: 'The creek inflow is only 4 ppt salt: lots of fresh stormwater is flowing in there.' },
      ],
      mustInclude: ['bod'],
      mustIncludeWhy: 'Fish died from low oxygen. Pick a reading that shows what is USING the oxygen: a BOD result.',
      notes: {
        'A.bod': 'The entrance has the lowest BOD. Use it to compare, but pick readings from where the fish died.',
        'C.ph': 'The creek inflow\'s pH (7.2) is inside the estuary guide (7.0 to 8.5). pH is not the problem.',
        'C.temp': 'Warm water holds less oxygen, which made things worse. But it does not show what is using the oxygen.',
        'A.*': 'The entrance is the healthiest site. Use readings from where the fish died.',
      },
      defaultWhy: 'This reading does not show that rotting waste is using up the oxygen.',
    },
    hints: [
      'Most fish died at the creek inflow. Start there: Look, then test the oxygen.',
      'BOD shows how much oxygen microbes use up as they rot waste. It takes 5 days, so start it early.',
      'Compare the hot days (Days 2 and 3) with the windy day (Day 4). What happens to the oxygen?',
    ],
    frame: {
      text: 'Stormwater carried waste into the lagoon at the {0}. Microbes broke it down and used up the {1}. On the hot days, oxygen fell further because warm water holds {2} oxygen.',
      blanks: [
        { options: ['creek inflow', 'entrance', 'middle'], correct: 0, hint: 'Where is the stormwater outlet?' },
        { options: ['oxygen', 'nutrients', 'salt'], correct: 0, hint: 'What does BOD measure?' },
        { options: ['less', 'more'], correct: 0, hint: 'Compare the oxygen on Day 3 (hot) with Day 4 (cool).' },
      ],
    },
    real: {
      text: 'This really happens near Woonona. In January 2020 low oxygen killed fish in Bellambi Lagoon, and the council told people to stay out of the water. NSW rates the lake\'s water quality as poor.',
      url: 'https://www.environment.nsw.gov.au/topics/water/estuaries/estuaries-of-nsw/bellambi-lake',
      linkText: 'NSW Government: Bellambi Lake',
    },
  },
];

// Reading-level glossary. Each entry: one or two short sentences.
export const GLOSSARY = [
  { term: 'pH', text: 'How acidic or basic water is, from 0 to 14. 7 is neutral. Lower is more acidic.' },
  { term: 'Salinity', text: 'How salty the water is. We measure it in ppt (parts per thousand): about grams of salt in a kilogram of water. Sea water is about 35.' },
  { term: 'Dissolved oxygen', text: 'Oxygen gas mixed into the water. Fish breathe it with their gills. Under 4 mg/L is too low for many animals.' },
  { term: 'Turbidity', text: 'How cloudy the water is, measured in NTU. A higher number means cloudier water.' },
  { term: 'Clarity', text: 'How clear the water is. In a clarity tube, the deeper you can see the cross, the clearer the water.' },
  { term: 'Nutrients', text: 'Nitrogen and phosphorus: plant food. Too much makes algae grow out of control.' },
  { term: 'Algae bloom', text: 'A sudden burst of algae that turns water green. When the algae die and rot, oxygen is used up.' },
  { term: 'BOD', text: 'Biochemical oxygen demand: the oxygen microbes use up over 5 days as they break down waste. A big BOD means oxygen is used up fast.' },
  { term: 'Microbes', text: 'Living things too small to see, like bacteria. Many of them break down dead plants and waste.' },
  { term: 'Estuary', text: 'Where a river or creek meets the sea. The water is a mix of fresh and salty.' },
  { term: 'Stormwater', text: 'Rain that runs off roofs and roads into drains. It is not cleaned before it reaches creeks and lagoons.' },
  { term: 'Runoff', text: 'Rain water that flows over the ground, carrying soil, dung, fertiliser or rubbish with it.' },
  { term: 'Guide value', text: 'A number that tells scientists when to look more closely. A guide, not a law.' },
  { term: 'Pesticide', text: 'A chemical spray that kills weeds or insects. A lab is needed to test for it.' },
];
