// Checks the difficulty levels.
//  1. Every problem type gets harder from Warm-up to Contest to Hard to Super-hard (by work score).
//  2. Each level still varies: no level collapses a problem type to a handful of repeats.
//  3. Generated Contest tests match the real-test profile in test/real_profile.json (typical
//     invitational and TMSCA tests), and Hard tests match Regional/State tests, column by column.
//  4. Test codes carry the level, old codes still read as Contest, and progress records keep it.
// Run: node test/difficulty.js [tests per level]
const load = require('./load');
const NS = load({});
const PROF = require('./real_profile.json');
const NT = +(process.argv[2] || 60);
let fails = 0; const bad = (...m) => { fails++; if (fails < 60) console.log('FAIL', ...m); };
const LV = ['warmup', 'contest', 'hard', 'super'];
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const plain = h => NS.latexPlain(h.replace(/\u0001([^\u0002]*)\u0002/g, (m, l) => ' ' + l + ' ')).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<');

/* 1 and 2: per problem type */
let typesChecked = 0; const flat = [];
for (const g of NS.GENS) for (const lv of ['ms', 'hs']) {
  if (!g.col[lv]) continue; typesChecked++;
  const S = {}, U = {};
  for (const d of LV) { const ws = [], seen = new Set();
    for (let i = 0; i < 120; i++) { const p = NS.makeProblem(g.id, lv, 1000 + i * 7919, d); ws.push(NS.workScore(p)); seen.add(p.p.h); }
    S[d] = mean(ws); U[d] = seen.size; }
  const spread = S.super - S.warmup;
  if (spread < 0.05) { flat.push(`${g.id}/${lv}`); continue; }  // a type whose problems all take the same work
  for (let k = 1; k < 4; k++) if (S[LV[k]] < S[LV[k - 1]] - 1e-9) bad(`${g.id}/${lv}: ${LV[k]} (${S[LV[k]].toFixed(2)}) is easier than ${LV[k - 1]} (${S[LV[k - 1]].toFixed(2)})`);
  if (!(S.warmup < S.contest && S.contest < S.hard)) bad(`${g.id}/${lv}: levels not strictly ordered`, LV.map(d => S[d].toFixed(2)).join(' < '));
  // variety: every level keeps at least 10 different problems in 120 (fewer only if Contest itself has fewer)
  for (const d of LV) if (U[d] < Math.min(10, 0.5 * U.contest)) bad(`${g.id}/${lv}: ${d} has only ${U[d]} different problems in 120 (Contest has ${U.contest})`);
}
console.log(`Per-type order and variety: ${typesChecked} type/level pairs checked; ${flat.length} have no spread to order (${flat.slice(0, 8).join(', ')}${flat.length > 8 ? ', …' : ''}).`);

/* 3: whole tests against the real profile */
const RX = new RegExp(PROF.advPattern, 'i');
function profile(lv, diff) {
  const cols = [[], [], [], []]; const adv = [];
  for (let t = 0; t < NT; t++) {
    const probs = NS.buildTest(lv, 50000 + t * 104729, [1, 2, 3, 4], diff); const pos = [];
    for (const p of probs) {
      if (p.n % 10 === 0) continue; const txt = plain(p.p.h).replace(/(\d),(?=\d{3})/g, '$1');
      const d = (txt.match(/\d/g) || []).length; if (d >= 3) cols[Math.floor((p.n - 1) / 20)].push(d);
      if (RX.test(txt)) pos.push(p.n);
    }
    if (pos.length) adv.push([pos.length, Math.min(...pos)]);
  }
  const firsts = adv.map(a => a[1]).sort((a, b) => a - b);
  return { cols: cols.map(mean), advN: mean(adv.map(a => a[0])), advFirst: firsts[Math.floor(firsts.length / 2)] };
}
const fmt = a => a.map(x => x.toFixed(2)).join('  ');
for (const lv of ['ms', 'hs']) {
  const P = {}; for (const d of LV) P[d] = profile(lv, d);
  const R = PROF[lv];
  console.log(`\n${lv.toUpperCase()} digit load by column (1–20, 21–40, 41–60, 61–80)`);
  console.log(`  real typical  ${fmt(R.typical)}\n  real champ    ${fmt(R.champ)}`);
  for (const d of LV) console.log(`  ${d.padEnd(13)} ${fmt(P[d].cols)}${lv === 'ms' ? `   advanced topics/test ${P[d].advN.toFixed(1)}, first at #${P[d].advFirst}` : ''}`);
  if (lv === 'ms') console.log(`  real: typical ${R.advTypical[0]} advanced/test, first at #${R.advTypical[1]}; Regional/State ${R.advChamp[0]}, first at #${R.advChamp[1]}`);
  // Contest within 0.6 digits (or two standard errors of the real mean, if larger) of real typical tests
  // in every column; Hard within the same of Regional/State tests
  const tolT = c => Math.max(0.6, 2 * R.se[0][c]), tolC = c => Math.max(0.6, 2 * R.se[1][c]);
  for (let c = 0; c < 4; c++) {
    if (Math.abs(P.contest.cols[c] - R.typical[c]) > tolT(c)) bad(`${lv} Contest column ${c + 1}: ${P.contest.cols[c].toFixed(2)} vs real ${R.typical[c]} (±${tolT(c).toFixed(2)})`);
    if (Math.abs(P.hard.cols[c] - R.champ[c]) > tolC(c)) bad(`${lv} Hard column ${c + 1}: ${P.hard.cols[c].toFixed(2)} vs real Regional/State ${R.champ[c]} (±${tolC(c).toFixed(2)})`);
    for (let k = 1; k < 4; k++) if (P[LV[k]].cols[c] < P[LV[k - 1]].cols[c] - 0.05) bad(`${lv} column ${c + 1}: ${LV[k]} lighter than ${LV[k - 1]}`);
  }
  if (lv === 'ms') {
    const tA = k => Math.max(1.0, 2 * R.advSE[k][0]);
    if (Math.abs(P.contest.advN - R.advTypical[0]) > tA(0) || Math.abs(P.contest.advFirst - R.advTypical[1]) > 6) bad(`ms Contest advanced topics ${P.contest.advN.toFixed(1)} first #${P.contest.advFirst} vs real ${R.advTypical}`);
    if (Math.abs(P.hard.advN - R.advChamp[0]) > tA(1) || Math.abs(P.hard.advFirst - R.advChamp[1]) > 6) bad(`ms Hard advanced topics ${P.hard.advN.toFixed(1)} first #${P.hard.advFirst} vs real ${R.advChamp} (±${tA(1).toFixed(2)})`);
    if (!(P.super.advFirst <= P.hard.advFirst && P.hard.advFirst <= P.contest.advFirst && P.contest.advFirst <= P.warmup.advFirst)) bad('ms advanced topics should start earlier at each harder level');
  }
}

/* 4: codes and progress records */
for (const lv of ['ms', 'hs']) for (const d of LV) for (const cols of [[1, 2, 3, 4], [1], [2], [3], [4]]) {
  const seed = 0xABCDE; const code = NS.testCode(lv, cols, seed, d); const r = NS.readTestCode(code);
  if (!r || r.lv !== lv || r.diff !== d || r.seed !== seed || r.cols.join() !== cols.join()) bad('code round trip', code, JSON.stringify(r));
  const a = NS.buildTest(lv, seed, cols, d).map(p => p.p.h).join('|'), b = NS.buildTest(r.lv, r.seed, r.cols, r.diff).map(p => p.p.h).join('|');
  if (a !== b) bad('same code, different test', code);
}
{ const r = NS.readTestCode('hf-7k2m'); if (!r || r.diff !== 'contest') bad('old code should read as Contest'); if (NS.readTestCode('HF-7K2M-Q')) bad('bad level letter accepted'); }
// different levels from one seed really are different tests, and harder ones are heavier
{ const w = d => mean(NS.buildTest('hs', 777, [1, 2, 3, 4], d).map(NS.workScore)); const ws = LV.map(w); if (!(ws[0] < ws[1] && ws[1] < ws[2] && ws[2] < ws[3])) bad('whole-test work not increasing', ws.map(x => x.toFixed(2)).join(' ')); }
// progress: attempts keep their level through the transfer code clean-up, and Warm-up alone never marks a trick learned
NS.store.data = { v: 1, level: 'ms', settings: { pdiff: 'auto', tdiff: 'hard' }, levels: { ms: { tricks: {}, tests: [], days: {}, misses: [] }, hs: { tricks: {}, tests: [], days: {}, misses: [] } } };
const tr = NS.tricksFor('ms')[0];
for (let i = 0; i < 12; i++) NS.store.record(NS.problemForTrick(tr, 'ms', i + 1, null, 'warmup'), true, 1000);
if (NS.trickStatus(tr, 'ms').key !== 'learning') bad('Warm-up alone marked a trick', NS.trickStatus(tr, 'ms').key);
for (let i = 0; i < 10; i++) NS.store.record(NS.problemForTrick(tr, 'ms', i + 100, null, 'contest'), true, 1000);
if (!['fast', 'solid'].includes(NS.trickStatus(tr, 'ms').key)) bad('Contest work did not mark the trick');
for (let i = 0; i < 8; i++) NS.store.record(NS.problemForTrick(tr, 'ms', i + 200, null, 'hard'), true, 1000);
if (!NS.trickStatus(tr, 'ms').hard) bad('Hard work not credited');
NS.store.record(NS.problemForTrick(tr, 'ms', 999, null, 'super'), false, 1000);
const cleaned = NS.cleanProgress(NS.trimProgress(NS.store.data));
const att = cleaned.levels.ms.tricks[tr].att; if (!att.some(a => a[2] === 2) || !att.some(a => a[2] === 3)) bad('levels lost in progress code', JSON.stringify(att));
if (cleaned.settings.pdiff !== 'auto' || cleaned.settings.tdiff !== 'hard') bad('difficulty settings lost in progress code');
if (!cleaned.levels.ms.misses.some(m => m.d === 'super')) bad('miss level lost');
const m = cleaned.levels.ms.misses.find(x => x.d === 'super'); const again = NS.makeProblem(m.g, 'ms', m.s, m.d); const orig = NS.problemForTrick(tr, 'ms', 999, null, 'super');
if (again.p.h !== orig.p.h) bad('a missed problem does not come back the same');
// a missed test problem (placed in a later column than usual) comes back exactly, through the progress code too
{ const T = NS.buildTest('ms', 4242, [4], 'hard'); const p = T.find(x => x.at && x.at !== x.col) || T[3]; NS.store.record(p, false, 1000);
  const c2 = NS.cleanProgress(NS.trimProgress(NS.store.data)); const mm = c2.levels.ms.misses.find(x => x.g === p.gid && x.s === p.seed);
  if (!mm || NS.makeProblem(mm.g, 'ms', mm.s, mm.d, mm.at).p.h !== p.p.h) bad('a missed test problem does not come back the same'); }

console.log(`\nDifficulty checks: ${fails} failures.`);
process.exit(fails ? 1 : 0);
