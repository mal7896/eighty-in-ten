// Checks every Memorize fact against brute-force math written separately from src/memo.js,
// renders every cell and prompt through KaTeX, and checks that each card's key is accepted.
const load = require('./load');
const katex = require('../vendor/node_modules/katex');
const NS = load({ katex });
NS.store.load();
let fails = 0, checked = 0;
const bad = (...m) => { fails++; if (fails < 40) console.log('FAIL', ...m); };
const plainNum = s => Number(String(s).replace(/,/g, '').replace(/−/g, '-'));
const kw = []; const _w = console.warn; console.warn = (...a) => kw.push(a.join(' '));

// brute-force references
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const primeBF = n => n > 1 && [...Array(n).keys()].slice(2).every(d => n % d);
const spfBF = n => { for (let d = 2; d <= n; d++) if (n % d === 0) return d; };
// value of a "0.abc\overline{de}" string as a fraction [num, den]
function decValue(l) {
  const m = /^0\.(\d*)(?:\\overline\{(\d+)\})?$/.exec(l); if (!m) return null;
  const pre = m[1] || '', rep = m[2] || '';
  if (!rep) return [BigInt(pre || '0'), 10n ** BigInt(pre.length)];
  const all = BigInt(pre + rep) - BigInt(pre || '0');
  return [all, (10n ** BigInt(rep.length) - 1n) * 10n ** BigInt(pre.length)];
}
const unwrap = s => String(s).replace(/\u0001|\u0002/g, '');

for (const lv of ['ms', 'hs']) {
  for (const set of NS.MEMO) {
    const b = NS.memoBuild(set.id, lv);
    const cells = b.groups.flatMap(g => g.cells);
    // every cell renders without KaTeX errors
    for (const c of cells) for (const x of [c.t, c.b, c.b2]) if (x) { const h = NS.render(x, { display: true }); if (h.includes('class="fb"')) bad(lv, set.id, 'render', x); }
    // every card: key accepted, render ok, show renders, keys unique
    const keys = new Set();
    for (const it of b.items) {
      if (keys.has(it.k)) bad(lv, set.id, 'duplicate key', it.k); keys.add(it.k);
      for (let s = 1; s <= 12; s++) {
        const card = it.ask(new NS.Rng(s * 7919 + it.k.length));
        const key = card.a.est ? String(card.a.v.num()) : NS.keyText ? NS.keyText(card.a) : null;
        for (const x of [card.q, card.show]) { const h = NS.render(x, { display: true }); if (h.includes('class="fb"')) bad(lv, set.id, 'render', x); }
        // the plain-text key must be accepted by the checker (what a student would type)
        if (key != null && !NS.check(card.a, key).ok) bad(lv, set.id, 'key not accepted', it.k, key);
        checked++;
      }
    }
    // set-specific independent checks
    if (set.id === 'squares') { const N = lv === 'ms' ? 30 : 50; if (cells.length !== N) bad('squares count'); cells.forEach((c, i) => { if (plainNum(c.b) !== (i + 1) ** 2) bad('square', c.b); }); }
    if (set.id === 'cubes') { const N = lv === 'ms' ? 12 : 20; if (cells.length !== N) bad('cubes count'); cells.forEach((c, i) => { if (plainNum(c.b) !== (i + 1) ** 3) bad('cube', c.b); }); }
    if (set.id === 'squares2') { const lo = lv === 'ms' ? 31 : 51; if (cells.length !== 126 - lo) bad('squares2 count', cells.length); cells.forEach((c, i) => { if (plainNum(c.b) !== (lo + i) ** 2) bad('square2', c.b); }); }
    if (set.id === 'cubes2') { const lo = lv === 'ms' ? 13 : 21; if (cells.length !== 51 - lo) bad('cubes2 count', cells.length); cells.forEach((c, i) => { if (plainNum(c.b) !== (lo + i) ** 3) bad('cube2', c.b); }); }
    if (set.id === 'powers') cells.forEach(c => { const [, B, E] = /pw(\d+)_(\d+)/.exec(c.k); let v = 1; for (let i = 0; i < +E; i++) v *= +B; if (plainNum(c.b) !== v) bad('power', c.k, c.b); });
    if (set.id === 'factorials') cells.forEach((c, n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; if (plainNum(c.b) !== f) bad('factorial', n, c.b); });
    if (set.id === 'fractions') {
      const dens = lv === 'ms' ? [2, 3, 4, 5, 6, 7, 8, 9, 11, 12] : [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 16]; let want = 0;
      dens.forEach(n => { for (let k = 1; k < n; k++) if (gcd(k, n) === 1) want++; });
      if (cells.length !== want) bad('fraction count', cells.length, want);
      for (const c of cells) {
        const [, k, n] = /fr(\d+)_(\d+)/.exec(c.k).map(Number);
        const dv = decValue(unwrap(c.b)); if (!dv || dv[0] * BigInt(n) !== dv[1] * BigInt(k)) bad('decimal', c.k, unwrap(c.b));
        // repetend must be minimal: no shorter period, and no digit can be absorbed from the front
        const m = /^0\.(\d*)(?:\\overline\{(\d+)\})?$/.exec(unwrap(c.b)); const rep = m[2] || '', pre = m[1] || '';
        if (rep) { for (let L = 1; L < rep.length; L++) if (rep.length % L === 0 && rep.slice(0, L).repeat(rep.length / L) === rep) bad('repetend not minimal', c.k); if (pre && pre[pre.length - 1] === rep[rep.length - 1]) bad('pre not minimal', c.k); }
        // percent text
        const pl = unwrap(c.b2).replace(/\\%$/, '');
        let pv; const mm = /^(\d+)\\frac\{(\d+)\}\{(\d+)\}$/.exec(pl);
        if (mm) pv = [BigInt(mm[1]) * BigInt(mm[3]) + BigInt(mm[2]), BigInt(mm[3])];
        else { const [w, d = ''] = pl.split('.'); pv = [BigInt(w + d), 10n ** BigInt(d.length)]; }
        if (pv[0] * BigInt(n) !== pv[1] * BigInt(100 * k)) bad('percent', c.k, pl);
      }
    }
    if (set.id === 'triples') {
      const maxC = lv === 'ms' ? 41 : 85; const want = [];
      for (let c = 5; c <= maxC; c++) for (let a = 3; a < c; a++) for (let bb = a + 1; bb < c; bb++) if (a * a + bb * bb === c * c && gcd(gcd(a, bb), c) === 1) want.push(`${a},${bb},${c}`);
      const got = cells.map(c => c.t.replace(/\s/g, '') + ',' + c.b);
      if (want.sort().join('|') !== got.slice().sort().join('|')) bad('triples', want.join(' '), '\n vs', got.join(' '));
      for (const it of b.items) for (let s = 1; s <= 30; s++) { const card = it.ask(new NS.Rng(s)); const nums = card.q.match(/\d+/g).map(Number); const v = Number(card.a.v.n);
        const ok = card.q.startsWith('Legs') ? nums[0] ** 2 + nums[1] ** 2 === v * v : nums[0] ** 2 + v * v === nums[1] ** 2; if (!ok) bad('triple card', card.q, v); }
    }
    if (set.id === 'primes') {
      const N = lv === 'ms' ? 100 : 200; const want = []; for (let n = 2; n < N; n++) if (primeBF(n)) want.push(n);
      if (cells.map(c => c.t).join() !== want.join()) bad('prime table');
      for (const it of b.items) { const n = +it.k.slice(2); const card = it.ask(new NS.Rng(1)); if (Number(card.a.v.n) !== spfBF(n)) bad('spf', n); }
    }
    if (set.id === 'constants') {
      const ref = { cosqrt2: 1.41421356, cosqrt3: 1.73205081, copi: 3.14159265, cosqrt5: 2.23606798, cosqrt6: 2.44948974, cosqrt7: 2.64575131, cosqrt10: 3.16227766, coe: 2.71828183 };
      for (const c of cells) { const want = (Math.round(ref[c.k] * 1000) / 1000).toFixed(3); if (c.b !== want) bad('constant', c.k, c.b, want); }
    }
    if (set.id === 'measures') {
      const hsOnly = { 'vara (Texas) inches': 100 / 3, 'league of land (Texas) labors': 25, 'league of land (Texas) acres': 25e6 * (100 / 3) ** 2 / 6272640, 'labor of land (Texas) acres': 1e6 * (100 / 3) ** 2 / 6272640, 'Egyptian cubit inches': 17.72 };
      const ref = { 'miles per hour feet per second': 88 / 60 * 60, ...(lv === 'hs' ? hsOnly : {}), 'mile feet': 5280, 'mile yards': 1760, 'yard feet': 3, 'yard inches': 36, 'foot inches': 12, 'rod feet': 16.5, 'furlong feet': 660, 'fathom feet': 6, 'league miles': 3,
        'gallon quarts': 4, 'gallon fluid ounces': 128, 'quart pints': 2, 'quart fluid ounces': 32, 'pint cups': 2, 'cup fluid ounces': 8, 'gallon cubic inches': 231, 'peck quarts': 8, 'bushel pecks': 4,
        'pound ounces': 16, 'ton pounds': 2000, 'square foot square inches': 144, 'square yard square feet': 9, 'acre square feet': 43560, 'square mile acres': 640, 'cubic yard cubic feet': 27, 'cubic foot cubic inches': 1728,
        'hour seconds': 3600, 'day minutes': 1440, 'week hours': 168, 'inch centimeters': 2.54, 'kilometer meters': 1000, 'liter milliliters': 1000, 'kilogram grams': 1000, 'dozen ': 12, 'gross ': 144, 'score ': 20, 'ream sheets': 500 };
      for (const c of cells) { const k = `${c.one} ${c.many}`; const v = c.v.num(); const want = k === 'miles per hour feet per second' ? 5280 * c.n / 3600 : ref[k];
        if (want === undefined) { bad('measure missing from reference', k); continue; }
        // exact facts must match exactly; approximate ones (marked ≈) must be within 0.5% of the true value
        if (c.approx ? Math.abs(v - want) / want > 0.005 : Math.abs(v - want) > 1e-9) bad('measure', k, v, want);
        if (!c.approx && !c.v.isInt() && !c.v.terminates()) { if (!/frac/.test(c.b)) bad('measure text', c.b); } else if (Math.abs(plainNum(c.b.replace('≈ ', '').split(' ')[0]) - v) > 1e-9) bad('measure text', c.b); }
      if (lv === 'hs' && !cells.some(c => c.one === 'Egyptian cubit' && c.v.num() === 17.72)) bad('cubit missing');
      if (cells.length !== Object.keys(ref).length) bad('measure count');
    }
  }
}
// unit conversions used by the problem generator must agree with the Memorize table
console.warn = _w;
if (kw.length) { console.log('KaTeX warnings:', [...new Set(kw)].slice(0, 10)); fails++; }
console.log(`Memorize: ${checked} cards checked, ${fails} failures.`);
process.exit(fails ? 1 : 0);
