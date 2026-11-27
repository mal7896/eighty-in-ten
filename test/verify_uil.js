// Independent checks for the generators in gens_uil.js and gens_uil2.js.
// Each one recomputes the answer a different way from the generator: brute force,
// its own tables, or numerically. V returns a value to compare; F returns true/false.
module.exports = function (NS) {
  const { Q, q } = NS;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const isP = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const divs = n => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
  const close = (x, y, tol = 1e-9) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(y));
  const P = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; };
  const C = (n, k) => { if (k < 0 || k > n) return 0; return P(n, k) / P(k, k); };
  const QP = s => Q.parseNum(String(s));
  const frac = s => { const [a, b] = String(s).split('/'); return b ? q(+a, +b) : QP(a); };
  const parseBase = (s, b) => { const [w, f = ''] = s.replace(/^\./, '0.').split('.'); let v = Q.from(parseInt(w || '0', b)); let p = Q.from(1); for (const ch of f) { p = p.div(b); v = v.add(p.mul(parseInt(ch, b))); } return v; };

  // English words → number, written separately from the generator
  const W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const FR = { half: 2, fourth: 4, fourths: 4, fifth: 5, fifths: 5, eighth: 8, eighths: 8, tenth: 10, tenths: 10 };
  function words(text) {
    const t = text.toLowerCase().replace(/^write /, '').replace(/ in digits\.$/, '').replace(/ is$/, '').replace(/ plus /, ' ');
    const parts = t.split(' million'); const head = parts[0].split(' and '); const whole = W[head[0]];
    const fw = head[1].replace(/^an? /, 'one ').replace('-', ' ').split(' '); const num = W[fw[0]], den = FR[fw[1]];
    let rest = 0, cur = 0; for (const w0 of parts[1].trim().split(/[\s-]+/).filter(Boolean)) { if (w0 === 'thousand') { rest += cur * 1000; cur = 0; } else if (w0 === 'hundred') cur *= 100; else cur += W[w0]; }
    return whole * 1e6 + num * 1e6 / den + rest + cur;
  }

  const V = {
    addsub: p => ({ add: () => p.x + p.y, sub: () => p.x - p.y, neg: () => p.x - p.y, three: () => p.plus ? p.a - p.b + p.c : p.a + p.b - p.c, blank: () => p.f === 'xMinus' ? p.a + p.b : p.b, money: () => q(p.minus ? p.cs[0] - p.cs[1] + p.cs[2] : p.cs[0] + p.cs[1] + p.cs[2], 100) })[p.kd](),
    decAS: p => { let v = QP(p.xs[0]); p.ops.forEach((o, i) => { v = o === '+' ? v.add(QP(p.xs[i + 1])) : v.sub(QP(p.xs[i + 1])); }); return v; },
    divide: p => QP(p.n).div(QP(p.d)),
    pctConv: p => p.kd === 'f2p' ? q(100 * p.a, p.b) : frac(p.p).div(100),
    factorK: p => p.n * p.k + (p.plus ? p.c : -p.c),
    ninePat: p => ({ ones: () => 9 * p.n + p.d + 1, eights: () => p.n * 9 + p.add, eightsDown: () => 9 * p.n - 1, nineEight: () => p.n * 8 + p.d, repunitSq: () => new Q(BigInt(p.n) * BigInt(p.n)) })[p.kd](),
    dsqBlank: p => { const v = p.a * p.a - p.b * p.b; return v % p.c === 0 ? v / p.c : 'not integer'; },
    gcdLcm2: p => { let g = 1; for (let i = 1; i <= p.a; i++) if (p.a % i === 0 && p.b % i === 0) g = i; let L = p.a; while (L % p.b) L += p.a; return { sum: L + g, diff: g - L, times: L / p.a }[p.kd]; },
    divisors2: p => { const d = divs(p.n); return { sum: () => d.reduce((a, b) => a + b), properSum: () => d.reduce((a, b) => a + b) - p.n, properProd: () => d.filter(x => x < p.n).reduce((a, b) => a * b, 1), primeSum: () => d.filter(isP).reduce((a, b) => a + b), bigPrime: () => Math.max(...d.filter(isP)), countProd: () => d.length }[p.kd](); },
    stats: p => {
      if (p.kd === 'missing') return p.mean * (p.xs.length + 1) - p.xs.reduce((a, b) => a + b);
      if (p.kd === 'mean') return q(p.xs.reduce((a, b) => a + b), p.xs.length);
      const s = p.xs.slice().sort((a, b) => a - b), L = s.length; const med = L % 2 ? q(s[(L - 1) / 2]) : q(s[L / 2 - 1] + s[L / 2], 2);
      const cnt = {}; p.xs.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }); const top = Math.max(...Object.values(cnt)); const modes = Object.keys(cnt).filter(k => cnt[k] === top); if (modes.length !== 1) return 'no unique mode'; const mode = +modes[0];
      return { medMode: () => med.add(mode), rangeMode: () => q(s[L - 1] - s[0] - mode), medModeRange: () => med.add(mode).add(s[L - 1] - s[0]) }[p.kd]();
    },
    consumer2: p => ({ unitCost: () => q(p.c / p.n * p.k, 100), gallons: () => q(p.g * p.pc, 100), perUnit: () => q(p.pc * p.k, 100), tax: () => frac(p.rate).mul(p.price).div(100), salary: () => q(p.s * (100 + (p.up ? p.p1 : -p.p1)), 100), salary2: () => q(p.s * (100 + (p.up ? p.p1 : -p.p1)) * (100 + p.p2), 10000), pctMoney: () => QP(p.pq).mul(p.amt).div(10000) })[p.kd](),
    rateConv: p => QP(p.oz).div(QP(p.per)).mul(p.g),
    unitsMore: p => {
      const T = { 'gallon>quart': 4, 'gallon>pint': 8, 'gallon>cup': 16, 'gallon>fluid ounce': 128, 'quart>pint': 2, 'quart>cup': 4, 'foot>inch': 12, 'yard>foot': 3, 'yard>inch': 36, 'bushel>peck': 4, 'peck>quart': 8, 'fathom>foot': 6, 'minute>second': 60, 'hour>minute': 60, 'pound>ounce': 16 };
      if (p.kd === 'fracOf') { const tot = p.a * T[p.big + '>' + p.small] + p.b; const inT = p.target === p.small ? tot : tot * T[p.small + '>' + p.target]; return q(inT * p.num, p.den); }
      if (p.kd === 'pctOf') return q(100 * p.n, T['gallon>' + p.small]);
      const f = T[p.big + '>' + p.small]; return p.kd === 'down' ? frac(p.n).mul(f) : frac(p.n).div(f);
    },
    pctPlus: p => {
      if (p.kd === 'isPctOf') return p.f === 'ofBlank' ? Q.from(p.a * p.x).div(QP(p.b)) : q(p.a * p.x, p.y);
      if (p.kd === 'repPct') return frac(p.part).div(frac(p.frac));
      if (p.kd === 'chain') return frac(p.f1).mul(frac(p.f2)).mul(p.n);
      if (p.kd === 'moreLess') { const a = frac(p.a), b = frac(p.b); return b.sub(a).abs().div(a).mul(100); }
      return Q.from(100).div(frac(p.f1).mul(frac(p.f2)));
    },
    repSum: p => {
      if (p.kd === 'decFrac') { let v = q(p.ks[0], p.den); p.ks.slice(1).forEach((k, i) => { v = p.signs[i] === '+' ? v.add(q(k, p.den)) : v.sub(q(k, p.den)); }); return v; }
      if (p.kd === 'repSum') return q(p.ds[0] + p.ds[1] + p.ds[2], 9);
      return p.which === 'additive' ? frac(p.val).neg() : Q.from(1).div(frac(p.val));
    },
    seqNeighbor: p => {
      const primes = []; for (let i = 2; primes.length < 40; i++) if (isP(i)) primes.push(i);
      const seq = []; for (let n = 1; n <= 30; n++) seq.push({ arith: p.a + (n - 1) * p.d, tri: n * (n + 1) / 2, prime: primes[n - 1], cube: n ** 3, geo: p.d ** (n - 1), plus: null, sq: n * n }[p.kd]);
      if (p.kd === 'plus') { let t = p.a; for (let n = 1; n <= 30; n++) { if (n > 1) t += n - 1; seq[n - 1] = t; } }
      return seq[p.t - 1];
    },
    sumsMore: p => {
      if (p.kd === 'tri') { let s = 0; for (let k = 1; k <= p.n; k++) s += k * (k + 1) / 2; return s; }
      if (p.kd === 'oddCount') return p.xs.reduce((a, b) => a + b);
      if (p.kd === 'sigma') { let s = 0; for (let k = 1; k <= p.n; k++) s += p.f === 'alt' ? (-1) ** k * k : p.c * k + p.d; return s; }
      let s = 0; for (let k = 1; k <= p.n; k++) s += k ** 3; return Math.round(Math.sqrt(s)) ** 2 === s ? Math.round(Math.sqrt(s)) : 'not square';
    },
    symPQ: p => {
      if (p.kd === 'sq') { for (let x = -60; x <= 60; x++) { const y = p.S - x; if (x * y === p.P) return x * x + y * y; } return 'none'; }
      for (let x = -60; x <= 60; x++) { const y = x - p.D; if (x * y === p.P && (p.kd === 'pq' || (x > 0 && y > 0))) return Math.abs(x + y); } return 'none';
    },
    numWords: p => words(p.text),
    divisibility: p => { const ok = []; for (let k = 1; k <= 9; k++) { const d = p.digs.slice(); d.splice(p.pos, 0, k); if (Number(d.join('')) % p.d === 0) ok.push(k); } return ok.length === 1 ? ok[0] : 'not unique'; },
    expRules: p => ({ laws: () => p.a + p.b - p.c, factor: () => { const lhs = p.b ** p.e - p.b ** (p.e - 1); for (let n = 0; n < 12; n++) if ((p.b - 1) * p.b ** n === lhs) return n; return 'none'; }, solve: () => { let x = 0; while (p.b ** x < p.t) x++; return p.pw[0] === 2 ? x * x : x + p.pw[1]; } })[p.kd](),
    expandSum: p => {
      const mul = (A, B) => { const R = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { R[i + j] += a * b; })); return R; };
      if (p.kd === 'sq') { const c = mul([p.a, p.b], [p.a, p.b]); return c[0] + c[1] + c[2]; }
      if (p.kd === 'sqAlt') { const c = mul([p.a, p.b], [p.a, p.b]); return c[0] - c[1] + c[2]; }
      if (p.kd === 'prod2') { const c = mul([p.a, p.b], [p.c, p.d]); return c[0] + c[1] + c[2]; }
      let c = [1]; for (let i = 0; i < p.n; i++) c = mul(c, [p.a, p.b]); // coefficients of x^(n-k) y^k
      if (p.kd === 'coefProd') return c.reduce((x, y) => x * y, 1);
      if (p.kd === 'termCoef') return c[p.t - 1];
      return c[1] + c[p.n - 1];
    },
    hiddenPow: p => { if (p.kd === 'ab') return p.a * p.a + 2 * p.a * p.b + p.b * p.b; if (p.kd === 'diffCube') return (p.x - p.y) * (p.x * p.x + p.x * p.y + p.y * p.y); return p.cs.reduce((s, c) => s * p.x + c, 0); },
    similarity: p => p.what === 'area' ? (p.a * p.k * p.b * p.k) / (p.a * p.b) : (2 * (p.a + p.b) * p.k) / (2 * (p.a + p.b)),
    specialTri: p => ({ t45: () => 2 * Math.sqrt(p.h2 / 2), t45x: () => Math.sqrt(p.h2 / 2), t30: () => p.s * Math.sqrt(3) / Math.sqrt(3) + 2 * p.s, t30ft: () => 2 * p.s })[p.kd](),
    cubeNear: p => p.n ** 3,
    baseNear: p => (p.b ** p.n - p.k).toString(p.b).toUpperCase(),
    digitSum: p => { let c = 0; for (let n = 100; n <= 999; n++) if (String(n).split('').reduce((a, d) => a + +d, 0) === p.s) c++; return c; },
    reflect: p => {
      // line ax + by + c = 0, then the standard reflection formula
      const L = { yx: [1, -1, 0], ynx: [1, 1, 0], xaxis: [0, 1, 0], yaxis: [1, 0, 0], yxc: [1, -1, p.c], ynxc: [1, 1, -p.c] }[p.kd];
      let h, k;
      if (p.kd === 'origin') { h = -p.x; k = -p.y; }
      else if (p.kd === 'yk' || p.kd === 'xk') { const v = +p.line.split('= ')[1].replace('−', '-'); if (p.kd === 'yk') { h = p.x; k = 2 * v - p.y; } else { h = 2 * v - p.x; k = p.y; } }
      else { const [a, b, c] = L; const t = (a * p.x + b * p.y + c) / (a * a + b * b); h = p.x - 2 * a * t; k = p.y - 2 * b * t; }
      return p.ask === 'h + k' ? h + k : p.ask === 'h − k' ? h - k : k - h;
    },
    fibSum: p => { const t = [p.a, p.b]; while (t.length < 20) t.push(t[t.length - 1] + t[t.length - 2]); if (p.kd === 'ten') return t.slice(0, 10).reduce((x, y) => x + y); if (p.kd === 'n') return t.slice(0, p.n).reduce((x, y) => x + y); return t[6]; },
    radicals: p => {
      if (p.kd === 'sum') { const v = Math.sqrt(p.k1 * p.k1 * p.s) + (p.minus ? -1 : 1) * Math.sqrt(p.k2 * p.k2 * p.s); return Math.round(v * v); }
      let best = 1; for (let a = 1; a * a <= p.n; a++) if (p.n % (a * a) === 0) best = a; return p.kd === 'simpA' ? best : p.n / (best * best);
    },
    countDigits: p => {
      let c = 0; const perms = (arr, L, pre = []) => { if (pre.length === L) { if (pre[0] === 0) return; const n = Number(pre.join('')); const lim = p.cond ? Number(p.cond.replace(/\D/g, '')) : 0; if (p.kind === 'gt' && !(n > lim)) return; if (p.kind === 'lt' && !(n < lim)) return; if (p.kind === 'odd' && n % 2 === 0) return; c++; return; } arr.forEach((d, i) => perms(arr.filter((_, j) => j !== i), L, [...pre, d])); };
      perms(p.digs, p.L); return c;
    },
    permComb: p => ({ pascal: () => { for (let n = 2; n < 20; n++) if (C(n, p.k + 1) === C(p.n, p.k) + C(p.n, p.k + 1)) return n; return 'none'; }, kTimes: () => q(P(p.n, p.k), C(p.n, p.k2)), ratioPC: () => q(P(p.n, p.k), C(p.n - 1, p.k)), ratioCP: () => q(C(p.n, p.k + 1), P(p.n, p.k)), diff: () => C(p.n + 1, 2) - P(p.n, 2), sumK: () => q(C(p.n, 2) + C(p.n, 3), P(p.n, 4)) })[p.kd](),
    triRecip: p => { let v = Q.from(0); for (let k = 1; k <= p.n; k++) v = v.add(q(2, k * (k + 1))); return v; },
    geoFinite: p => { let t = frac(p.a), v = Q.from(0); for (let i = 0; i < p.k; i++) { v = v.add(t); t = t.mul(frac(p.rat)); } return v; },
    coordMore: p => ({ circle: () => (p.px - p.hx) ** 2 + (p.py - p.hy) ** 2, endpoint: () => { const x = 2 * p.mx - p.ax, y = 2 * p.my - p.ay; return p.ask === 'x + y' ? x + y : x - y; }, xint: () => q(-p.b * p.den, p.num), yint2: () => Q.from(p.y1).sub(q(p.y2 - p.y1, p.x2 - p.x1).mul(p.x1)), perp: () => q(-p.dx, p.dy) })[p.kd](),
    symCubes: p => { if (p.minus) { const x = (p.D + Math.sqrt(p.D * p.D + 4 * p.P)) / 2, y = x - p.D; return Math.round(x ** 3 - y ** 3); } const x = (p.D + Math.sqrt(p.D * p.D - 4 * p.P)) / 2, y = p.D - x; return Math.round(x ** 3 + y ** 3); },
    vieta3: p => { const [a, b, c] = p.rs; const S1 = a + b + c, S2 = a * b + b * c + a * c, S3 = a * b * c; return { prodMinusPairs: () => S3 - S2, sumPlusPairs: () => S1 + S2, pairProd: () => (a + b) * (b + c) * (c + a), sumPlusProd: () => S1 + S3, harmonic: () => q(3, 1).div(Q.from(q(1, a)).add(q(1, b)).add(q(1, c))) }[p.kd](); },
    remLinear: p => { // long division by (a x + b) with exact fractions; the remainder is the last value
      let rem = p.cs.map(c => Q.from(c)); while (rem.length > 1) { const lead = rem[0].div(p.a); const next = rem.slice(1); next[0] = next[0].sub(lead.mul(p.b)); rem = next; } return rem[0];
    },
    dblInt: p => { const f = { xy: (x, y) => x * y, xplusy: (x, y) => x + y, xminusy: (x, y) => x - y, lin: (x) => { const m0 = /\((\d+)x ([+-]) (\d+)\)/.exec(p.f); return +m0[1] * x + (m0[2] === '-' ? -1 : 1) * +m0[3]; } }[p.kd]; const n = 400; let s = 0; const dx = (p.b - p.a) / n, dy = (p.d - p.c) / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += f(p.a + (i + 0.5) * dx, p.c + (j + 0.5) * dy) * dx * dy; return s; },
    ginRad: p => { if (p.kd === 'four') return Math.floor(p.xs.reduce((s, x) => s + Math.sqrt(x), 0)); if (p.kd === 'sum') { const y = Math.sqrt(p.a) + (p.minus ? -1 : 1) * Math.sqrt(p.b); return p.fl ? Math.floor(y) : Math.ceil(y); } const a = Math.floor(p.p * Math.sqrt(p.a)), b = Math.ceil(p.qq * Math.sqrt(p.b)); return p.op === '×' ? a * b : a - b; },
    baseFracTo: p => null,
    prob2: p => {
      if (p.kd === 'cond') { // enumerate ordered pairs of distinct socks, keep those whose first is the second colour
        const socks = [...Array(p.a).fill('A'), ...Array(p.b).fill('B')]; let first = 0, both = 0; socks.forEach((s1, i) => socks.forEach((s2, j) => { if (i === j || s1 !== 'B') return; first++; if (p.same ? s2 === 'B' : s2 === 'A') both++; })); return q(both, first);
      }
      if (p.kd === 'cards') { const deck = []; for (const s of ['H', 'D', 'C', 'S']) for (let r = 1; r <= 13; r++) deck.push({ s, r }); const red = c => c.s === 'H' || c.s === 'D', face = c => c.r >= 11;
        const f = { 'a black king or an ace': c => (!red(c) && c.r === 13) || c.r === 1, 'a heart or a face card': c => c.s === 'H' || face(c), 'a red card or a king': c => red(c) || c.r === 13, 'a queen or a spade': c => c.r === 12 || c.s === 'S', 'a red face card': c => red(c) && face(c), 'an ace or a club': c => c.r === 1 || c.s === 'C', 'a black card or a jack': c => !red(c) || c.r === 11 }[p.txt]; return q(deck.filter(f).length, 52); }
      if (p.kd === 'dice') { let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) { const s = i + j; if (p.rel === 'less than' ? s < p.t : p.rel === 'greater than' ? s > p.t : s >= p.t) c++; } return q(c, 36); }
      let c = 0; for (let m = 0; m < 2 ** p.n; m++) { let h = 0; for (let i = 0; i < p.n; i++) if (m >> i & 1) h++; if (h === p.k) c++; } return q(c, 2 ** p.n);
    },
  };

  const F = {
    // the pattern each trick promises must actually hold
    ninePat: (p, a) => { const s = a.v.n.toString(); return ({ ones: () => /^1+$/.test(s) && s.length === p.d + 1, eights: () => /^8+$/.test(s) && s.length === String(p.n).length + 1, eightsDown: () => s === String(String(p.n).length - 1) + '8'.repeat(String(p.n).length), nineEight: () => s === '987654321'.slice(0, p.d), repunitSq: () => s === s.split('').reverse().join('') })[p.kd](); },
    factorK: (p, a) => Number(a.v.n) % 100 === 0,
    baseFracTo: (p, a) => parseBase(a.v, p.b).eq(frac(p.v)),
    inverseTrig: (p, a) => {
      const v = a.v.num();
      if (p.kd === 'arc') { const fn = { Arcsin: Math.asin, Arccos: Math.acos, Arctan: Math.atan, Arccsc: x => Math.asin(1 / x), Arcsec: x => Math.acos(1 / x) }[p.f]; return close(fn(p.x), v * Math.PI, 1e-9); }
      if (p.kd === 'comp') { const inv = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[p.inner](p.arg); const out = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: t => 1 / Math.cos(t), csc: t => 1 / Math.sin(t), cot: t => 1 / Math.tan(t) }[p.outer](inv); return close(out, v, 1e-9); }
      const t = v * Math.PI / 180; const lo = (p.qd - 1) * 90, hi = p.qd * 90; if (!(v > lo && v < hi)) return false;
      const target = { 240: -0.5, 300: -Math.sqrt(3) / 2, 135: -1, 150: 0.5, 315: Math.SQRT1_2, 225: -Math.SQRT1_2 }; const val = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[p.f](t);
      const want = { cos: { 240: -0.5, 315: Math.SQRT1_2, 150: -Math.sqrt(3) / 2 }, sin: { 300: -Math.sqrt(3) / 2, 150: 0.5, 225: -Math.SQRT1_2 }, tan: { 135: -1, 240: Math.sqrt(3) } }[p.f][p.deg]; return want !== undefined && close(val, want, 1e-9) && !!target;
    },
    directrix: (p, a) => { // pick two points on the parabola, check each is as far from the focus as from the directrix
      const A0 = frac(p.a).num(); const d = a.v.num();
      if (p.kd === 'yx2') { const f = x => A0 * (x - p.h) ** 2 + p.k; const focusY = 2 * p.k - d; return [p.h + 1, p.h - 3, p.h + 2.5].every(x => close(Math.hypot(x - p.h, f(x) - focusY), Math.abs(f(x) - d), 1e-9)); }
      const g = y => A0 * y * y + p.c; const pp = 1 / (4 * A0); const focusX = p.c + pp;
      if (p.kd === 'focus') return close(focusX, d, 1e-12) && [1, -2, 3].every(y => close(Math.hypot(g(y) - focusX, y), Math.abs(g(y) - (p.c - pp)), 1e-9));
      const fX = 2 * p.c - d; return [1, -2, 3].every(y => close(Math.hypot(g(y) - fX, y), Math.abs(g(y) - d), 1e-9));
    },
    estConv: (p, a) => {
      const vara = 100 / 3, acre = 43560 * 144, sqv = vara * vara / acre, labor = 1e6 * sqv, league = 25e6 * sqv, cubit = 17.72; const v = a.v.num();
      const want = { vara: () => p.toYd ? p.n * vara / 36 : p.n * 36 / vara, land: () => p.f === 'league' ? league * frac(p.L).num() : p.f === 'minus' ? p.Lg * league - p.Lb * labor : p.Lg * league + p.Lb * labor + p.sq * sqv,
        cubit: () => ({ in2c: () => p.n / cubit, c2in: () => p.n * cubit, c2ft: () => p.n * cubit / 12, phi: () => p.k * 1.6180339887 * cubit })[p.f](), cm: () => ({ ydftin: () => p.tot * 2.54, mile: () => frac(p.fr).num() * 5280 * 12 * 2.54, inch: () => p.n * 2.54 })[p.f]() }[p.kd]();
      return close(v, want, 1e-6);
    },
    estGeo: (p, a) => { const v = a.v.num(); const want = { cylSA: () => 2 * Math.PI * (p.d / 2) * (p.d / 2 + p.h), cylLat: () => Math.PI * p.d * p.hf * 12, cylVolCm: () => Math.PI * (p.d / 2) ** 2 * p.h * 2.54 ** 3, hemi: () => (p.closed ? 3 : 2) * Math.PI * p.rr ** 2, pipe: () => Math.PI * (p.d / 2) ** 2 * p.L, pyramid: () => p.a * p.b * p.h / 3, circ: () => p.C ** 2 / (4 * Math.PI), lot: () => p.f1 * p.f2 * 5280 ** 2 }[p.kd](); return close(v, want, 1e-6); },
    estRep: (p, a) => { const v = a.v.num(); const want = { repSq: () => (p.ab / 99 * p.n) ** 2, fracSq: () => (frac(p.f).num() * p.n) ** 2, pctDiv: () => p.a / (p.p * p.b / 100), fx: () => +p.rate * p.n / 10 }[p.kd](); return close(v, want, 1e-9); },
  };
  return { V, F };
};
