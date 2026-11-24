// Glossary = the authored list in cases.js plus two short aliases for units students meet on instruments.
import { GLOSSARY as BASE } from './cases.js';
export const GLOSSARY = [
  ...BASE,
  { term: 'ppt', text: 'Parts per thousand: the unit for salinity. 35 ppt is about as salty as sea water.' },
  { term: 'NTU', text: 'The unit for turbidity. A higher number means cloudier water.' },
];
export const termKey = t => t.toLowerCase();
export const lookup = t => GLOSSARY.find(g => termKey(g.term) === termKey(t));
