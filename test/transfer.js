// Round-trips a realistic progress record through the transfer code, and feeds it broken codes.
const load = require('./load');
const NS = load({ TextEncoder, TextDecoder, CompressionStream, DecompressionStream, Response, Blob, btoa, atob, Uint8Array, isFinite });
NS.store.load = NS.store.load.bind(NS.store);
(async () => {
  let fails = 0; const bad = (...m) => { fails++; console.log('FAIL', ...m); };
  // build a heavy, realistic record: every trick at both levels with 30 attempts, 60 tests, 60 misses, memo for every card
  const r = new NS.Rng(9); const d = { v: 1, level: 'hs', settings: { theme: 'dark', names: true }, levels: {} };
  for (const lv of ['ms', 'hs']) {
    const tricks = {}; NS.tricksFor(lv).forEach(id => { tricks[id] = { att: Array.from({ length: 30 }, () => [r.chance(0.8) ? 1 : 0, r.int(1500, 25000)]), n: r.int(30, 400), ok: r.int(20, 300), lesson: true }; });
    const tests = Array.from({ length: 60 }, (_, i) => ({ t: 1.7e12 + i * 864e5, kind: i % 3 ? 'col' : 'full', col: 1 + i % 4, score: r.int(-20, 380), correct: r.int(0, 80), wrong: r.int(0, 10), skipped: r.int(0, 5), last: r.int(1, 80), code: NS.testCode(lv, i % 3 ? [1 + i % 4] : [1, 2, 3, 4], NS.testSeed()) }));
    const days = {}; for (let i = 0; i < 200; i++) days[`2026-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`] = r.int(1, 120);
    const gens = NS.GENS.filter(g => g.col[lv]); const misses = Array.from({ length: 60 }, () => ({ g: r.pick(gens).id, s: r.int(1, 2 ** 31), t: 1.7e12 }));
    const memo = {}; NS.MEMO.forEach(s => NS.memoBuild(s.id, lv).items.forEach(it => { memo[it.k] = Array.from({ length: 6 }, () => [r.chance(0.7) ? 1 : 0, r.int(800, 9000)]); }));
    d.levels[lv] = { tricks, tests, days, misses, memo };
  }
  const code = await NS.exportProgress(d);
  console.log('heavy record: JSON', JSON.stringify(d).length, 'chars → code', code.length, 'chars');
  const back = await NS.readProgress(code);
  if (!back.data) bad('round trip failed', back.error);
  else if (JSON.stringify(back.data) !== JSON.stringify(NS.cleanProgress(NS.trimProgress(d)))) bad('round trip changed data');
  else { // the trimmed record must give the same status for every trick and fact
    const before = JSON.stringify(NS.store.data); for (const lv of ['ms', 'hs']) {
      NS.store.data = d; const s1 = NS.tricksFor(lv).map(id => NS.trickStatus(id, lv).key).join() + NS.MEMO.map(s => JSON.stringify(NS.memoCount(lv, s.id))).join() + NS.streak(lv);
      NS.store.data = back.data; const s2 = NS.tricksFor(lv).map(id => NS.trickStatus(id, lv).key).join() + NS.MEMO.map(s => JSON.stringify(NS.memoCount(lv, s.id))).join() + NS.streak(lv);
      if (s1 !== s2) bad('status changed after transfer', lv); }
    NS.store.data = JSON.parse(before); }
  
  if (JSON.stringify(NS.cleanProgress(d)) !== JSON.stringify(d)) bad('clean altered valid data');
  // whitespace and line breaks from pasting through email
  const wrapped = code.replace(/(.{60})/g, '$1\n  ');
  if (!(await NS.readProgress(wrapped)).data) bad('wrapped code rejected');
  // empty record
  const empty = { v: 1, level: 'ms', settings: {}, levels: { ms: { tricks: {}, tests: [], days: {}, misses: [], memo: {} }, hs: { tricks: {}, tests: [], days: {}, misses: [], memo: {} } } };
  const e2 = await NS.readProgress(await NS.exportProgress(empty)); if (!e2.data) bad('empty record');
  // broken inputs
  for (const x of ['', 'hello', 'EIT1z.', code.slice(0, code.length - 40), code.slice(0, 30), 'EIT1j.' + Buffer.from('{"v":2}').toString('base64url'), 'EIT1j.' + Buffer.from('[1,2]').toString('base64url'), 'EIT1j.@@@']) {
    const res = await NS.readProgress(x); if (res.data) bad('accepted broken code', x.slice(0, 40));
  }
  // hostile but parseable: wrong types everywhere
  const hostile = { v: 1, level: 'xx', settings: { theme: '<script>' }, levels: { ms: { tricks: { foil: { att: 'no', n: 'x' }, notATrick: {} }, tests: [null, { score: 'a' }], days: { bad: 1, '2026-01-01': 'x' }, misses: [{ g: 'nope' }], memo: { 'sq17': [[1, 'x']], '<b>': [] } }, hs: null } };
  const h = await NS.readProgress('EIT1j.' + Buffer.from(JSON.stringify(hostile)).toString('base64url'));
  if (!h.data) bad('hostile record rejected outright');
  else { const L = h.data.levels.ms; if (h.data.level !== null || h.data.settings.theme || L.tricks.notATrick || !Array.isArray(L.tricks.foil.att) || L.misses.length || L.memo['<b>'] || L.days.bad !== undefined) bad('hostile record not cleaned', JSON.stringify(h.data).slice(0, 300)); }
  console.log(`Transfer: ${fails} failures.`); process.exit(fails ? 1 : 0);
})();
