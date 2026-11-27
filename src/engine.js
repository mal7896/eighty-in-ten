/* ===== engine: problems, tests, progress (no DOM) ===== */
(function () {
  const GBY = {}; NS.GENS.forEach(g => { GBY[g.id] = g; }); NS.GBY = GBY;

  NS.gensFor = (trick, lv) => NS.GENS.filter(g => g.trick === trick && g.col[lv]);
  NS.tricksFor = lv => NS.PATH[lv].filter(t => NS.TRICKS[t] && NS.gensFor(t, lv).length);
  NS.trickCol = (trick, lv) => Math.min(...NS.gensFor(trick, lv).map(g => g.col[lv]));
  NS.TARGET = { 1: 8, 2: 12, 3: 16, 4: 20 };

  /* ---------- difficulty ----------
     Every problem type can make easier and harder versions of itself. To make one problem at a
     given difficulty we generate several candidates from the same seed, rank them by how much
     work they take (size of the numbers, fractions and negatives in the answer), and take one
     from the band for that difficulty. Every candidate comes from the same checked generator,
     so the answer key is exactly as reliable at every level. */
  NS.DIFFS = [
    { id: 'warmup', code: 'W', name: 'Warm-up', blurb: 'Friendlier numbers and the most common version of each problem. Good for learning a trick.' },
    { id: 'contest', code: '', name: 'Contest', blurb: 'Matches a typical TMSCA or UIL invitational test.' },
    { id: 'hard', code: 'H', name: 'Hard', blurb: 'Matches Regional and State tests: bigger numbers, and the harder topics come sooner.' },
    { id: 'super', code: 'X', name: 'Super-hard', blurb: 'Harder than any real test: the biggest numbers and the hardest version of each problem.' },
  ];
  NS.diffIdx = id => { const i = NS.DIFFS.findIndex(d => d.id === id); return i < 0 ? 1 : i; };
  const K = 8;                                  // candidates per problem
  // ranks (0 = easiest of the 8) that each difficulty draws from, by level and by the problem's column.
  // Tuned against real tests (see test/real_profile.json and test/difficulty.js): Contest matches typical
  // invitational and TMSCA tests, Hard matches Regional and State. Middle school Regional/State tests are
  // no heavier than usual early on; what changes is that harder topics come sooner (see buildTest).
  const BAND = {
    ms: [
      [[0, 1], [0, 2], [0, 2], [0, 2]],   // Warm-up
      [[0, 4], [1, 5], [2, 7], [3, 7]],   // Contest
      [[1, 4], [3, 7], [4, 7], [6, 7]],   // Hard
      [[5, 7], [6, 7], [7, 7], [7, 7]],   // Super-hard
    ],
    hs: [
      [[0, 1], [0, 2], [0, 2], [0, 2]],
      [[0, 4], [2, 7], [3, 7], [1, 6]],
      [[2, 6], [4, 7], [5, 7], [4, 7]],
      [[5, 7], [6, 7], [7, 7], [7, 7]],
    ],
  };
  NS.DIFF_BAND = BAND;
  // how much work a problem takes: digits in the prompt, digits in the answer, fractions, negatives
  NS.workScore = function (p) {
    const l = p.p.h.replace(/\u0001([^\u0002]*)\u0002/g, (m0, x) => ' ' + x + ' ').replace(/<[^>]+>/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/(\d),(?=\d{3})/g, '$1');
    const runs = l.match(/\d+(\.\d+)?/g) || [];
    const pd = runs.reduce((t, x) => t + x.replace('.', '').replace(/^0+(?=\d)/, '').length, 0);
    let ad = 0, extra = 0; const a = p.a;
    if (a.type === 'num' && !a.est) {
      const v = a.v;
      if ((a.form === 'money' || a.form === 'dec') && v.terminates()) { ad = v.toDecStr().replace(/[-.]/g, '').length; if (!v.isInt()) extra += 0.5; }
      else { ad = (v.n < 0n ? -v.n : v.n).toString().length + (v.isInt() ? 0 : v.d.toString().length); if (!v.isInt()) extra += v.terminates() ? 1 : 2; }
      if (v.cmp(0) < 0) extra += 1;
    } else if (a.type === 'text') ad = String(a.v).replace(/[^0-9A-Za-z]/g, '').length;
    return pd + 1.2 * ad + 1.5 * extra + 0.4 * Math.max(0, runs.length - 2);
  };
  const mix = (a, b) => { let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  // col: the column the problem sits in on a test (a type placed later than usual gets a weightier version)
  NS.makeProblem = function (genId, lv, seed, diff = 'contest', col) {
    const g = GBY[genId]; const di = NS.diffIdx(diff);
    const pick = new NS.Rng(mix(seed, 777));
    // Super-hard middle school sometimes uses the high school version of the same problem type
    const glv = di === 3 && lv === 'ms' && g.col.hs && pick.chance(0.5) ? 'hs' : lv;
    const cands = [];
    for (let i = 0; i < K; i++) { const out = g.gen(new NS.Rng(mix(seed, i)), glv, di); cands.push({ out, w: NS.workScore(out), i }); }
    cands.sort((x, y) => x.w - y.w || x.i - y.i);
    const [lo, hi] = BAND[lv][di][Math.min(4, Math.max(1, col || g.col[lv] || g.col.hs || 1)) - 1]; const c = cands[lo + pick.int(0, hi - lo)];
    return { gid: genId, trick: g.trick, lv, seed, diff: NS.DIFFS[di].id, ...(col ? { at: col } : {}), est: !!g.est, col: g.col[lv], ...c.out };
  };
  NS.problemForTrick = function (trick, lv, seed, avoidGid, diff = 'contest') {
    const gs = NS.gensFor(trick, lv); const r = new NS.Rng(seed ^ 0x9e3779b9);
    let g = r.pick(gs); if (gs.length > 1 && avoidGid && g.id === avoidGid) g = r.pick(gs.filter(x => x.id !== avoidGid));
    return NS.makeProblem(g.id, lv, seed, diff);
  };

  /* ---------- contest test: 80 problems, every 10th an estimate ---------- */
  NS.buildTest = function (lv, seed, cols = [1, 2, 3, 4], diff = 'contest') {
    const di = NS.diffIdx(diff);
    // how strongly each column draws on problem types from other columns (d = this column − the type's usual column)
    // Hard pulls later topics earlier, as Regional and State tests do; Warm-up keeps to earlier ones.
    // Middle school Regional/State tests also fill problems 61–80 with weightier versions of earlier arithmetic.
    const W = [{ 0: 3, 1: 2, 2: 0.8 }, { 0: 3, 1: 1.4, 2: 0.5 }, lv === 'ms' ? { 0: 3, 1: 1.4, 2: 1.0, '-1': 0.3 } : { 0: 3, 1: 1.2, 2: 0.4, '-1': 0.5 }, { 0: 3, 1: 1.2, 2: 0.6, '-1': 1.6, '-2': 0.5 }][di];
    const r = new NS.Rng(seed); const probs = [];
    for (const c of cols) {
      const estG = NS.GENS.filter(g => g.est && g.col[lv] === c);
      const pool = [];
      NS.GENS.forEach(g => {
        if (g.est || !g.col[lv]) return; const d = c - g.col[lv];
        // Middle school Regional and State tests put several long sums (5 + 2 + 7 + 9 + … + 173, 1 − 4 + 9 − …) in 61–80
        const champ = lv === 'ms' && di >= 2 && c === 4 && g.series ? 2.8 : 1;
        // …and bring the problems-61–80 topics forward into 41–60 (Regional/State: first one near #48, not #60)
        const fwd = lv === 'ms' && di === 2 && c === 3 && d === -1 ? 10 : 1;
        const w = (d === 2 && c < 3 ? 0 : W[d] || 0) * ((g.w && typeof g.w === 'object' ? g.w[lv] : g.w) || 1) * champ * fwd;
        if (w) pool.push({ g, w });
      });
      // weighted sample without replacement
      const chosen = []; const avail = pool.slice();
      while (chosen.length < 18 && avail.length) {
        const tot = avail.reduce((s, x) => s + x.w, 0); let t = r.f() * tot; let k = 0;
        for (; k < avail.length - 1; k++) { t -= avail[k].w; if (t <= 0) break; }
        chosen.push(avail[k].g); avail.splice(k, 1);
      }
      while (chosen.length < 18) chosen.push(r.pick(pool).g);
      // easier (earlier-column) material first within the column
      chosen.sort((a, b) => a.col[lv] - b.col[lv] || (r.f() - 0.5));
      // real tests open with a plain sum or difference, then often a decimal one
      const leads = c === 1 ? NS.GENS.filter(g => g.lead && g.col[lv] === 1) : [];
      let i = 0;
      for (let pos = 1; pos <= 20; pos++) {
        const s = r.int(1, 2 ** 31);
        if (pos % 10 === 0) { let t = r.f() * estG.reduce((a, g) => a + (g.w || 1), 0), k = 0; for (; k < estG.length - 1; k++) { t -= estG[k].w || 1; if (t <= 0) break; } probs.push(NS.makeProblem(estG[k].id, lv, s, diff, c)); }
        else if (pos <= 2 && leads.length) probs.push(NS.makeProblem(pos === 1 ? leads[0].id : r.pick(leads).id, lv, s, diff, c));
        else probs.push(NS.makeProblem(chosen[i++].id, lv, s, diff, c));
      }
    }
    probs.forEach((p, i) => { p.n = (cols[0] - 1) * 20 + i + 1; });
    return probs;
  };

  /* ---------- test codes: same code, same test, so a team can all take one test ----------
     format: level letter (M/H), F for full or the column number, dash, 4 characters of seed */
  const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  NS.testSeed = () => NS.newSeed() & 0xFFFFF;
  NS.testCode = function (lv, cols, seed, diff = 'contest') {
    let s = ''; for (let i = 0; i < 4; i++) s = ALPH[(seed >> (5 * i)) & 31] + s;
    const dc = NS.DIFFS[NS.diffIdx(diff)].code;   // Contest has no suffix, so older codes still read as Contest
    return (lv === 'ms' ? 'M' : 'H') + (cols.length === 4 ? 'F' : String(cols[0])) + '-' + s + (dc ? '-' + dc : '');
  };
  NS.readTestCode = function (str) {
    const c = String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 6 && c.length !== 7) return null;
    let diff = 'contest'; if (c.length === 7) { const d = NS.DIFFS.find(x => x.code && x.code === c[6]); if (!d) return null; diff = d.id; }
    const lv = c[0] === 'M' ? 'ms' : c[0] === 'H' ? 'hs' : null; if (!lv) return null;
    const cols = c[1] === 'F' ? [1, 2, 3, 4] : /[1-4]/.test(c[1]) ? [+c[1]] : null; if (!cols) return null;
    let seed = 0; for (const ch of c.slice(2, 6)) { const k = ALPH.indexOf(ch); if (k < 0) return null; seed = seed * 32 + k; }
    return { lv, cols, seed, diff };
  };

  /* official-style scoring: through the last attempted problem, +5 right, −4 wrong or skipped */
  NS.scoreTest = function (probs, answers) {
    let last = -1; answers.forEach((a, i) => { if (a && String(a).trim() !== '') last = i; });
    let correct = 0, wrong = 0, skipped = 0; const marks = [];
    probs.forEach((p, i) => {
      const a = answers[i];
      if (i > last) { marks.push('after'); return; }
      if (!a || String(a).trim() === '') { skipped++; marks.push('skip'); return; }
      const res = NS.check(p.a, a); if (res.ok) { correct++; marks.push('ok'); } else { wrong++; marks.push('bad'); }
    });
    return { last: last + 1, correct, wrong, skipped, score: 5 * correct - 4 * (wrong + skipped), marks };
  };

  /* ---------- answering behaviors for practice rounds and sprints ---------- */
  NS.BEHAVIORS = ['normal', 'noenter', 'hardcore', 'test'];

  /* ---------- arithmetic warm-up: plain + − × ÷ with ranges you set (subtraction and division run
     the addition and multiplication facts backward, so every answer is a whole number) ---------- */
  NS.ARITH_DEF = { ops: '+-x/', add: [2, 100, 2, 100], mul: [2, 12, 2, 100] };
  NS.arithClean = function (a) {
    if (!a || typeof a !== 'object') return null;
    const ops = typeof a.ops === 'string' ? [...new Set(a.ops.split('').filter(c => '+-x/'.includes(c)))].sort((x, y) => '+-x/'.indexOf(x) - '+-x/'.indexOf(y)).join('') : '';
    const rng = (v, lo0) => Array.isArray(v) && v.length === 4 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 9999) && v[0] <= v[1] && v[2] <= v[3] && v[0] >= lo0 && v[2] >= lo0 ? v.slice() : null;
    const add = rng(a.add, 0), mul = rng(a.mul, 1);
    if (!ops || !add || !mul) return null;
    return { ops, add, mul };
  };
  NS.arithKey = (a, dur) => `${a.ops}:${a.add.join(',')}-${a.mul.join(',')}:${dur}`;
  NS.arithProblem = function (a, r) {
    const op = r.pick(a.ops.split('')); let x, y, v, sym;
    if (op === '+' || op === '-') { const m = r.int(a.add[0], a.add[1]), n = r.int(a.add[2], a.add[3]); if (op === '+') { x = m; y = n; v = m + n; sym = '+'; } else { x = m + n; y = m; v = n; sym = '−'; } }
    else { const m = r.int(a.mul[0], a.mul[1]), n = r.int(a.mul[2], a.mul[3]); if (op === 'x') { x = m; y = n; v = m * n; sym = '×'; } else { x = m * n; y = m; v = n; sym = '÷'; } }
    return { gid: 'arith', trick: null, lv: null, seed: 0, diff: 'contest', col: 1, est: false, p: NS.H.cat(NS.H.n(x), ` ${sym} `, NS.H.n(y), ' ='), a: NS.ans.num(v), steps: [`${NS.fmtn(x)} ${sym} ${NS.fmtn(y)} = ${NS.hl(NS.fmtn(v))}`] };
  };

  /* ---------- progress store ---------- */
  const KEY = 'eighty-in-ten:v1';
  const blank = () => ({ tricks: {}, tests: [], days: {}, misses: [] });
  NS.blankLevel = blank;
  NS.store = {
    data: null,
    load() {
      let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
      if (!d || d.v !== 1) d = { v: 1, level: null, settings: {}, levels: { ms: blank(), hs: blank() } };
      this.data = d; return d;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage blocked: progress lasts for this visit */ } },
    lv() { return this.data.levels[this.data.level]; },
    trick(id) { const L = this.lv(); return L.tricks[id] || (L.tricks[id] = { att: [], n: 0, ok: 0, lesson: false }); },
    record(p, ok, ms) {
      // each attempt: [right?, ms, difficulty index]; Contest (1) is left off to keep old records valid
      const di = NS.diffIdx(p.diff); const t = this.trick(p.trick); t.att.push(di === 1 ? [ok ? 1 : 0, Math.round(ms)] : [ok ? 1 : 0, Math.round(ms), di]); if (t.att.length > 30) t.att.shift(); t.n++; if (ok) t.ok++;
      const L = this.lv(); const day = NS.today(); L.days[day] = (L.days[day] || 0) + 1; const d = NS.DIFFS[di].id;
      if (!ok) { L.misses.push({ g: p.gid, s: p.seed, t: Date.now(), ...(di === 1 ? {} : { d }), ...(p.at ? { at: p.at } : {}) }); if (L.misses.length > 60) L.misses.shift(); }
      else { const k = L.misses.findIndex(m => m.g === p.gid && m.s === p.seed && (m.d || 'contest') === d && (m.at || 0) === (p.at || 0)); if (k >= 0) L.misses.splice(k, 1); }
      this.save();
    },
    reset(level) { this.data.levels[level] = blank(); this.save(); },
  };
  /* ---------- moving progress to another device: a copy-and-paste code ----------
     EIT1z.<base64url of deflate(JSON)>  (or EIT1j.<base64url of JSON> where compression is missing) */
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  // only what the app reads: trick status uses the last 12 tries, a fact's status its last 2, the streak recent days
  NS.trimProgress = function (data) {
    const d = JSON.parse(JSON.stringify(data)); const cut = Date.now() - 400 * 864e5;
    for (const lv of ['ms', 'hs']) { const L = d.levels[lv]; if (!L) continue;
      Object.values(L.tricks || {}).forEach(t => { t.att = (t.att || []).slice(-12).map(([ok, ms, di]) => di === undefined ? [ok, ms > 0 ? Math.ceil(ms / 100) * 100 : ms] : [ok, ms > 0 ? Math.ceil(ms / 100) * 100 : ms, di]); });
      Object.keys(L.memo || {}).forEach(k => { L.memo[k] = L.memo[k].slice(-3).map(([ok, ms]) => [ok, Math.ceil(ms / 100) * 100]); });
      const days = {}; Object.keys(L.days || {}).sort().slice(-120).forEach(k => { days[k] = L.days[k]; }); L.days = days;
      L.tests = (L.tests || []).filter(t => t.t > cut || t.kind === 'full').slice(-100);
    }
    return d;
  };
  NS.exportProgress = async function (data) {
    const json = new TextEncoder().encode(JSON.stringify(NS.trimProgress(data)));
    if (typeof CompressionStream !== 'undefined') { try { return 'EIT1z.' + b64(await pipe(json, new CompressionStream('deflate'))); } catch (e) { /* fall through */ } }
    return 'EIT1j.' + b64(json);
  };
  // keeps only well-formed pieces, so a damaged or hand-edited code can't break the app
  NS.cleanProgress = function (d) {
    if (!d || typeof d !== 'object' || d.v !== 1 || !d.levels || typeof d.levels !== 'object') return null;
    const num = x => (typeof x === 'number' && isFinite(x) ? x : 0); const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
    const out = { v: 1, level: d.level === 'ms' || d.level === 'hs' ? d.level : null, settings: {}, levels: {} };
    const st = obj(d.settings); if (['system', 'light', 'dark'].includes(st.theme)) out.settings.theme = st.theme; if (typeof st.names === 'boolean') out.settings.names = st.names;
    const dids = NS.DIFFS.map(x => x.id); if (st.pdiff === 'auto' || dids.includes(st.pdiff)) out.settings.pdiff = st.pdiff; if (dids.includes(st.tdiff)) out.settings.tdiff = st.tdiff;
    if (NS.BEHAVIORS.includes(st.pbeh)) out.settings.pbeh = st.pbeh; if ([10, 20, 40, 80].includes(st.plen)) out.settings.plen = st.plen;
    { const a = NS.arithClean(st.arith); if (a) out.settings.arith = a; }
    const pair = a => Array.isArray(a) && a.length === 2 ? [a[0] ? 1 : 0, num(a[1])] : null;
    const att = a => Array.isArray(a) && a.length === 3 && [0, 2, 3].includes(a[2]) ? [a[0] ? 1 : 0, num(a[1]), a[2]] : Array.isArray(a) && a.length >= 2 ? [a[0] ? 1 : 0, num(a[1])] : null;
    for (const lv of ['ms', 'hs']) {
      const L = obj(d.levels[lv]); const tricks = {};
      for (const [id, t] of Object.entries(obj(L.tricks))) { if (!NS.TRICKS[id]) continue; const tt = obj(t); tricks[id] = { att: (Array.isArray(tt.att) ? tt.att : []).map(att).filter(Boolean).slice(-30), n: num(tt.n), ok: num(tt.ok), lesson: !!tt.lesson }; }
      const tests = (Array.isArray(L.tests) ? L.tests : []).filter(t => t && typeof t === 'object').map(t => ({ t: num(t.t), kind: t.kind === 'col' ? 'col' : 'full', col: num(t.col) || 1, score: num(t.score), correct: num(t.correct), wrong: num(t.wrong), skipped: num(t.skipped), last: num(t.last), ...(typeof t.code === 'string' && NS.readTestCode(t.code) ? { code: t.code } : {}) })).slice(-200);
      const days = {}; for (const [k, v] of Object.entries(obj(L.days))) if (/^\d{4}-\d\d-\d\d$/.test(k)) days[k] = num(v);
      const misses = (Array.isArray(L.misses) ? L.misses : []).filter(m => m && NS.GBY[m.g] && typeof m.s === 'number').map(m => ({ g: m.g, s: m.s, t: num(m.t), ...(dids.includes(m.d) && m.d !== 'contest' ? { d: m.d } : {}), ...([1, 2, 3, 4].includes(m.at) ? { at: m.at } : {}) })).slice(-60);
      const memo = {}; for (const [k, v] of Object.entries(obj(L.memo))) if (Array.isArray(v) && /^[a-z]{2}[\w.]*$/.test(k)) memo[k] = v.map(pair).filter(Boolean).slice(-6);
      const b = obj(L.best); const best = {}; if (num(b.hc) > 0) best.hc = Math.round(num(b.hc));
      const ar = {}; for (const [k, v] of Object.entries(obj(b.ar))) if (/^[+\-x\/]{1,4}:[\d,-]{1,60}:\d{2,3}$/.test(k) && num(v) > 0) ar[k] = Math.round(num(v)); if (Object.keys(ar).length) best.ar = ar;
      out.levels[lv] = { tricks, tests, days, misses, memo, ...(Object.keys(best).length ? { best } : {}) };
    }
    return out;
  };
  NS.readProgress = async function (code) {
    const m = /^EIT1([zj])\.([A-Za-z0-9_-]+)$/.exec(String(code || '').replace(/\s+/g, ''));
    if (!m) return { error: 'bad' };
    try {
      let bytes = unb64(m[2]);
      if (m[1] === 'z') { if (typeof DecompressionStream === 'undefined') return { error: 'old' }; bytes = await pipe(bytes, new DecompressionStream('deflate')); }
      const data = NS.cleanProgress(JSON.parse(new TextDecoder().decode(bytes)));
      return data ? { data } : { error: 'bad' };
    } catch (e) { return { error: 'bad' }; }
  };
  NS.progressSummary = function (d, lv) { const L = d.levels[lv]; return { answered: Object.values(L.tricks).reduce((s, t) => s + t.n, 0), tests: L.tests.length, facts: Object.keys(L.memo || {}).length }; };

  NS.today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  NS.trickStatus = function (id, lv) {
    const t = NS.store.data.levels[lv].tricks[id]; if (!t || (!t.att.length && !t.lesson)) return { key: 'new', label: 'Not started', acc: null, med: null };
    // only Contest-level work and harder can mark a trick Accurate or Fast; Warm-up is for learning
    const dOf = a => (a[2] === undefined ? 1 : a[2]);
    const real = t.att.filter(a => dOf(a) >= 1); const hd = t.att.filter(a => dOf(a) >= 2).slice(-8);
    const hard = hd.length >= 6 && hd.filter(a => a[0]).length / hd.length >= 0.8;
    const recent = (real.length >= 3 ? real : t.att).slice(-12); const acc = recent.length ? recent.reduce((s, a) => s + a[0], 0) / recent.length : null;
    const times = recent.filter(a => a[0] && a[1] > 0).map(a => a[1]).sort((a, b) => a - b); const med = times.length ? times[Math.floor(times.length / 2)] / 1000 : null;
    const target = NS.TARGET[Math.min(4, NS.trickCol(id, lv))] + (id === 'estimate' ? 6 : 0);
    if (recent.length >= 8 && acc >= 0.85) {
      if (real.length >= 8 && med !== null && med <= target) return { key: 'fast', label: 'Fast', acc, med, target, hard };
      if (real.length >= 8) return { key: 'solid', label: 'Accurate', acc, med, target, hard };
    }
    return { key: 'learning', label: 'Learning', acc, med, target, hard };
  };

  NS.streak = function (lv) {
    const days = NS.store.data.levels[lv].days; let n = 0; const d = new Date();
    const key = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    if (!days[key(d)]) d.setDate(d.getDate() - 1);
    while (days[key(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };

  NS.nextTrick = function (lv) {
    const list = NS.tricksFor(lv);
    return list.find(id => { const t = NS.store.data.levels[lv].tricks[id]; return !t || !t.lesson; }) || list.find(id => NS.trickStatus(id, lv).key === 'learning') || list[0];
  };

  NS.weakTricks = function (lv) {
    return NS.tricksFor(lv).map(id => ({ id, st: NS.trickStatus(id, lv) }))
      .filter(x => x.st.key === 'learning' && NS.store.data.levels[lv].tricks[x.id] && NS.store.data.levels[lv].tricks[x.id].att.length >= 3)
      .sort((a, b) => (a.st.acc ?? 1) - (b.st.acc ?? 1)).map(x => x.id);
  };

  /* pick the next trick for a practice session; weak and slow tricks come up more often */
  NS.pickTrick = function (tricks, lv, r, last) {
    const w = tricks.map(id => { const s = NS.trickStatus(id, lv); let x = s.key === 'new' ? 1.2 : s.key === 'learning' ? 1.6 : s.key === 'solid' ? 1 : 0.6; if (s.acc !== null && s.acc < 0.7) x += 0.8; if (id === last && tricks.length > 1) x *= 0.15; return x; });
    const tot = w.reduce((a, b) => a + b, 0); let t = r.f() * tot;
    for (let i = 0; i < tricks.length; i++) { t -= w[i]; if (t <= 0) return tricks[i]; }
    return tricks[tricks.length - 1];
  };
})();
