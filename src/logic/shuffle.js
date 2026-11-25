// Seeded, stable shuffles: the same case always shows the same order, but the correct answer is not always first.
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function seededOrder(n, seed) {
  const idx = Array.from({ length: n }, (_, i) => i), r = rng(hash(seed));
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
// Order of option indexes to display for each wrap-up blank (seeded, stable). Re-rolled until the correct option's
// position is not the same for every blank in the case, so it varies across the case.
export function wrapOrders(c) {
  const bl = c.frame.blanks;
  for (let k = 0; k < 60; k++) {
    const orders = bl.map((b, i) => seededOrder(b.options.length, `${c.id}:${i}:${k}`));
    const pos = orders.map((o, i) => o.indexOf(bl[i].correct));
    if (new Set(pos).size > 1 || k === 59) return orders;
  }
}
// Display order of suspects (seeded, stable).
export function suspectOrder(c) { return seededOrder(c.suspects.length, `${c.id}:suspects`); }
