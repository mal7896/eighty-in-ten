// Independent checks for the generators in gens_ms.js (middle school types from TMSCA tests).
// Each recomputes the answer another way: brute force over integers, floating point, or a
// formula the generator doesn't use. V returns a value to compare; F returns true/false.
module.exports = function (NS) {
  const { Q, q } = NS;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  const C = (n, k) => fact(n) / (fact(k) * fact(n - k));
  const close = (x, y, tol = 1e-9) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(y));
  const QP = s => Q.parseNum(String(s));
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
  const dice = (sides, test) => { let c = 0; for (const x of range(1, sides)) for (const y of range(1, sides)) if (test(x + y)) c++; return q(c, sides * sides); };
  const ndiv = n => range(1, n).filter(d => n % d === 0).length;
  // roots of ax² + bx + c numerically (real or complex) → [re1, im1, re2, im2]
  const quadRoots = (a, b, c) => { const D = b * b - 4 * a * c; if (D >= 0) return [(-b + Math.sqrt(D)) / (2 * a), 0, (-b - Math.sqrt(D)) / (2 * a), 0]; return [-b / (2 * a), Math.sqrt(-D) / (2 * a), -b / (2 * a), -Math.sqrt(-D) / (2 * a)]; };
  const cmul = (a, b, c, d) => [a * c - b * d, a * d + b * c];

  const V = {
    decDigits: p => (p.a / p.d).toFixed(12).slice(2, 6),
    clock: p => { const hr = (p.h % 12) * 30 + p.mm / 2, mn = p.mm * 6; const d = Math.abs(hr - mn); return Math.min(d, 360 - d); },
    countMult: p => {
      if (p.kd === 'between') return range(p.a + 1, p.b - 1).filter(x => x % p.k === 0).length;
      if (p.kd === 'terms') { let c = 0; for (let t = p.a0; t > 0; t -= p.d) c++; return c; }
      if (p.kd === 'or') return range(1, p.n - 1).filter(x => x % p.a === 0 || x % p.b === 0).length;
      return range(1, p.n).filter(x => x % p.a && x % p.b).length;
    },
    absEq: p => {
      if (p.kd === 'findC' || p.kd === 'findD') { // search c, d with |x − c| = d solved by s1 and s2
        for (let c = -40; c <= 40; c++) for (let d = 1; d <= 60; d++) if (Math.abs(p.s1 - c) === d && Math.abs(p.s2 - c) === d) return p.kd === 'findC' ? c : d; return 'none'; }
      const c = QP(p.c); // solve |ax + b| = c by trying both signs and checking
      const sols = [c.sub(p.b).div(p.a), c.neg().sub(p.b).div(p.a)].filter(x => x.mul(p.a).add(p.b).abs().eq(c));
      const [hi, lo] = sols[0].cmp(sols[1]) > 0 ? sols : [sols[1], sols[0]];
      return { sum: () => hi.add(lo), larger: () => hi, smaller: () => lo, dist: () => hi.sub(lo), gap: () => (hi.cmp(0) > 0 && lo.cmp(0) < 0 ? hi.sub(lo) : 'signs') }[p.kd]();
    },
    absIneq: p => {
      if (p.kd === 'chain') return range(-300, 300).filter(x => { const y = p.a * x + p.b; return p.strict ? p.L < y && y < p.U : p.L <= y && y <= p.U; }).length;
      const xs = range(-300, 300).filter(x => { const y = Math.abs(p.a * x + p.b); return p.strict ? y < p.c : y <= p.c; });
      return p.kd === 'count' ? xs.length : xs.reduce((s, x) => s + x, 0);
    },
    means: p => {
      if (p.kd === 'harm2') return q(2, 1).div(q(1, p.a).add(q(1, p.b)));
      if (p.kd === 'geo2') return Math.round(Math.sqrt(p.xs[0] * p.xs[1])) ** 2 === p.xs[0] * p.xs[1] ? Math.round(Math.sqrt(p.xs[0] * p.xs[1])) : 'not square';
      if (p.kd === 'geo3') { const P = p.xs[0] * p.xs[1] * p.xs[2]; for (let g = 1; g <= 100; g++) if (g ** 3 === P) return g; return 'not cube'; }
      if (p.kd === 'geoRad') { const n = p.a * p.b; for (let s = Math.floor(Math.sqrt(n)); s >= 1; s--) if (n % (s * s) === 0) return s + n / (s * s); }
      if (p.mode === 'stack') return Math.round(Math.log(p.pb ** p.e * (p.pb ** 2) ** p.e * (p.pb ** 3) ** p.e) / Math.log(p.pb) / 3 * 1e6) / 1e6;
      return q(p.es.reduce((s, x) => s + x, 0), p.es.length);
    },
    equiTri: p => ({ sideA: () => p.s * p.s * Math.sqrt(3) / 4 / Math.sqrt(3), sideH: () => Math.sqrt(p.s * p.s - p.s * p.s / 4) / Math.sqrt(3), heightA: () => { const s = 2 * p.t * Math.sqrt(3) / Math.sqrt(3); return s * s / 4; }, heightP: () => 3 * (2 * p.t * Math.sqrt(3) / Math.sqrt(3)), perimA: () => p.s * p.s / 4, hexA: () => 6 * p.s * p.s / 4, areaS: () => Math.sqrt(4 * p.kk) })[p.kd](),
    flatMore: p => ({ sqAreaDiag: () => Math.sqrt(2 * p.s * p.s) / Math.SQRT2, sqPerimA: () => p.s * p.s, sqAreaP: () => 4 * p.s, trapMedian: () => p.A0 / p.h, rhombSide: () => Math.hypot(p.d1 / 2, p.d2 / 2), circCA: () => p.rr * p.rr, circAD: () => 2 * p.rr, rectDiag: () => Math.sqrt(p.c * p.c - p.w * p.w), isoTrap: () => 360 - 2 * p.x })[p.kd](),
    solids: p => ({ sphSAtoV: () => 4 / 3 * p.rr ** 3, sphSAtoR: () => p.rr, cubeDiag: () => Math.sqrt(3 * p.e * p.e) / Math.sqrt(3), tetraSA: () => 4 * (p.s * p.s * Math.sqrt(3) / 4) / Math.sqrt(3), tetraV: () => p.s ** 3 / (6 * Math.SQRT2) / Math.SQRT2, hexaSA: () => 6 * p.s * p.s, pyramid: () => p.s * p.s * p.h / 3, prismDiag2: () => Math.hypot(...p.dims) / Math.SQRT2 })[p.kd](),
    polyMore: p => {
      const diags = n => n * (n - 3) / 2;
      return { diagSides: () => range(3, 100).find(n => diags(n) === p.D), triVertex: () => p.n - 2, tri3: () => C(p.n, 3), perimExt: () => (360 / p.e) * p.s, sumExceeds: () => (p.a - 2) * 180 - (p.b - 2) * 180, sidesFromSum: () => range(3, 100).find(n => (n - 2) * 180 === p.S), sidesFromInt: () => range(3, 100).find(n => (n - 2) * 180 / n === p.ia), central: () => 360 / p.n }[p.kd]();
    },
    setsMore: p => {
      if (p.kd === 'kSub') { let c = 0; for (let m = 0; m < 2 ** p.n; m++) if (m.toString(2).split('1').length - 1 === p.k) c++; return c; }
      if (p.kd === 'nFromSub') return Math.round(Math.log2(p.N));
      if (p.kd === 'even') { let c = 0; for (let m = 0; m < 2 ** p.n; m++) if ((m.toString(2).split('1').length - 1) % 2 === 0) c++; return c; }
      if (p.kd === 'moreSub') return 2 ** p.n - 2 ** p.k;
      if (p.kd === 'twoOr') return C(p.n, p.k1) + C(p.n, p.k2);
      const U = new Set([...p.A1, ...p.B1]).size, I = p.A1.filter(x => p.B1.includes(x)).length;
      return { union: U, inter: I, both: U + I }[p.ask];
    },
    diceMore: p => ({
      sumOr: () => dice(6, s => s === p.s || s === p.t), less: () => dice(6, s => s <= p.hi), between: () => dice(6, s => s >= p.lo && s <= p.hi),
      odds: () => { const f = dice(6, s => s === p.s).mul(36).num(); const g = gcd(f, 36 - f); return `${f / g}:${(36 - f) / g}`; },
      d4: () => dice(4, s => s === p.s), divisor: () => q(ndiv(p.n), p.n), oddsToP: () => q(p.b, p.a + p.b), repeat: () => q(1, 6 ** p.n),
      marbles: () => { for (let k = 1; k <= 100; k++) if (q(p.red, p.red + p.blue + k).eq(q(p.P[0], p.P[1]))) return k; return 'none'; },
    })[p.kd](),
    arrange: p => {
      if (p.kd === 'word') { // count distinct permutations by brute force for short words, multinomial check otherwise
        if (p.w.length <= 8) { const seen = new Set(); const go = (pre, rest) => { if (!rest.length) { seen.add(pre); return; } const used = new Set(); for (let i = 0; i < rest.length; i++) { if (used.has(rest[i])) continue; used.add(rest[i]); go(pre + rest[i], rest.slice(0, i) + rest.slice(i + 1)); } }; go('', p.w); return seen.size; }
        const cnt = {}; for (const ch of p.w) cnt[ch] = (cnt[ch] || 0) + 1; let left = p.w.length, v = 1; for (const c of Object.values(cnt)) { v *= C(left, c); left -= c; } return v; }
      return { line: () => fact(p.n), committee: () => C(p.n, p.k), outfits: () => p.xs[0] * p.xs[1] * p.xs[2] }[p.kd]();
    },
    polyNum: p => {
      const T = n => range(1, n).reduce((s, x) => s + x, 0); const Pn = n => { let s = 0, add = 1; for (let i = 0; i < n; i++) { s += add; add += 3; } return s; }; const Hx = n => { let s = 0, add = 1; for (let i = 0; i < n; i++) { s += add; add += 4; } return s; };
      return { triPair: () => T(p.k) + T(p.k + 1), pentTri: () => Pn(p.n) + T(p.n), pentInv: () => range(1, 200).find(n => Pn(n) === p.val), triInv: () => range(1, 200).find(n => T(n) === p.val), triRecip: () => range(1, p.n).reduce((s, n) => s.add(q(1, T(n))), q(0)), hex: () => Hx(p.n), pentBig: () => Pn(p.n) }[p.kd]();
    },
    lineMore: p => ({
      slopeInt: () => q(p.b - 0, 0 - p.a), perpStd: () => q(-1).div(q(-p.a, p.b)), intSum: () => q(p.c, p.a).add(q(p.c, p.b)),
      parA: () => range(-400, 400).find(A => A && q(-p.a1, p.b1).eq(q(-A, p.b2))), perpA: () => range(-400, 400).find(A => A && q(-p.a1, p.b1).mul(q(-A, p.b2)).eq(-1)),
      perpBis: () => (p.x2 === p.x1 ? 0 : q(-1).div(q(p.y2 - p.y1, p.x2 - p.x1))), throughC: () => p.a * p.x + p.b * p.y, ptXint: () => q(p.y0 - 0, p.x0 - p.xi), midSum: () => q(p.x1 + p.x2, 2).add(q(p.y1 + p.y2, 2)),
    })[p.kd](),
    vertexMore: p => {
      if (p.kd === 'trans') { // sample g(x) = a·f(x − p) + b with f(x) = (x − h0)² + k0 and find its minimum/maximum numerically
        const f = x => (x - p.h0) ** 2 + p.k0, g = x => p.a * f(x - p.p) + p.b; let best = null; for (let i = -4000; i <= 4000; i++) { const x = i / 100; const y = g(x); if (best === null || (p.a > 0 ? y < best[1] : y > best[1])) best = [x, y]; }
        const [h, k] = best.map(v => Math.round(v * 100) / 100); return p.ask === 'h' ? h : p.ask === 'k' ? k : h + k; }
      if (p.kd === 'findQ') return (p.k - p.b) / p.k0;
      if (p.kd === 'axisFact') return (p.b / p.a + p.d / p.c) / 2;
      if (p.kd === 'axisShift') { const f = x => (x + p.p) ** 2 + p.b * (x + p.p); let best = [0, Infinity]; for (let i = -6000; i <= 6000; i++) { const x = i / 100; if (f(x) < best[1]) best = [x, f(x)]; } return best[0]; }
      if (p.kd === 'hk') return p.h + p.k;
      if (p.kd === 'oneRoot') return p.b * p.b / (4 * p.a);
      if (p.form === 'vertex') return p.k === 0 ? 1 : p.a * p.k < 0 ? 2 : 0;
      const D = p.b * p.b - 4 * p.a * p.c; return D > 0 ? 2 : D === 0 ? 1 : 0;
    },
    rootsMore: p => {
      if (p.kd === 'cubicSum' || p.kd === 'cubicCombo') return p.kd === 'cubicSum' ? q(-p.b, p.a) : q(-p.b, p.a).add(q(-p.d, p.a));
      if (p.kd === 'sqRoot') { const s = Math.sqrt(p.d / p.a); const xs = [(p.c + s) / p.b, (p.c - s) / p.b]; return p.big ? Math.max(...xs) : Math.min(...xs); }
      if (p.kd === 'pq') { for (let x = -30; x <= 30; x++) for (let y = -30; y <= 30; y++) if (x + y === p.S && x * y === p.Pr) return Math.max(x, y); }
      if (p.kd === 'shiftProd') return (p.m1 + p.t) * (p.m2 + p.t);
      if (p.kd === 'findB') return -p.a * p.s;
      if (p.kd === 'findA') return p.c / p.Pr;
      const [r1, i1, r2, i2] = quadRoots(p.a, p.b, p.c); const S = r1 + r2, [pr] = cmul(r1, i1, r2, i2);
      const sq = cmul(r1, i1, r1, i1)[0] + cmul(r2, i2, r2, i2)[0];
      return { sum: S, prod: pr, sumsq: sq, plus1: cmul(r1 + 1, i1, r2 + 1, i2)[0], pqpq: pr + S, mean: S / 2, mix: sq + p.k * pr, harm: 2 / (1 / 1) * pr / S }[p.kd];
    },
    quadIneq: p => {
      const f = x => x * (x - p.k); const xs = range(-400, 400);
      if (p.kd === 'smallest') return xs.find(x => x > 0 && f(x) > p.N);
      if (p.kd === 'countPos') return xs.filter(x => x > 0 && f(x) < p.N).length;
      return Math.max(...xs.filter(x => f(x) < p.N));
    },
    intPairs: p => {
      if (p.kd === 'sq') { const sols = []; for (let x = 1; x * x < p.N; x++) for (let y = 1; y < x; y++) if (x * x + y * y === p.N) sols.push(x + y); return sols.length === 1 ? sols[0] : 'not unique'; }
      let c = 0; for (let x = 0; p.a * x <= p.N; x++) for (let y = 0; p.a * x + p.b * y <= p.N; y++) if (p.a * x + p.b * y === p.N) c++; return c;
    },
    funcDiff: p => {
      if (p.kd === 'lin') { const f = x => p.a * x + p.b; return f(p.mm) - f(p.n); }
      if (p.kd === 'quad') { const f = x => p.a * x * x + p.b; return f(p.mm) - f(p.n); }
      if (p.kd === 'comp') { let s = 0; for (let x = -50; x <= 50; x++) if (x * x + p.c === p.s * p.s + p.c) s += p.a * x + p.b; return s; }
      if (p.kd === 'ints') return -p.b / p.a + p.b;
      const z = p.c / p.a; return Math.floor(z) + Math.ceil(z);
    },
    moneyMore: p => ({ interest: () => p.P * (p.rate / 100) * (p.months ? p.t / 12 : p.t), coins: () => p.total / p.c, coinMix: () => (p.d * 10 + p.qn * 25) / 5, mileage: () => p.mi * p.c / 100 })[p.kd](),
    angleAP: p => {
      if (p.kd === 'triAP' || p.kd === 'triDiff') { const d = (180 - 3 * p.a) / 3; return p.kd === 'triAP' ? p.a + 2 * d : d; }
      if (p.kd === 'quadAP' || p.kd === 'quadSmall') { for (let a = 1; a < 180; a++) for (let d = 1; d < 90; d++) if (4 * a + 6 * d === 360 && a + 3 * d === p.L) return p.kd === 'quadAP' ? a + 2 * d : a; return 'none'; }
      return Math.max(180 * p.x / (p.x + p.y), 180 * p.y / (p.x + p.y));
    },
    bigSquares: p => p.n * p.n,
    altSq: p => { const [a, b, c, d] = p.xs.map(QP); return a.mul(a).sub(b.mul(b)).add(c.mul(c)).sub(d.mul(d)); },
    digitsCount: p => { const N = 2n ** BigInt(p.a2) * 5n ** BigInt(p.b) * BigInt(p.extra); const s = N.toString(); return p.ask === 'digits' ? s.length : [...s].reduce((t, ch) => t + Number(ch), 0); },
    abRev: p => { for (let b = 1; b < 40; b++) for (let a = b + 1; a < 60; a++) if (gcd(a, b) === 1 && q(a, b).add(q(b, a)).eq(q(2).add(q(p.dd, p.ab)))) return p.ask === 'larger' ? a : a + b; return 'none'; },
    divRecip: p => { const rs = k => { let t = q(0); for (let d = 1; d <= k; d++) if (k % d === 0) t = t.add(q(1, d)); return t; }; if (p.kd === 'sum') return rs(p.n); const want = q(p.v[0], p.v[1]); const hits = range(1, 100).filter(k => rs(k).eq(want)); return hits.length === 1 ? hits[0] : 'not unique'; },
    hiddenK: p => { const prod = p.shown.reduce((a, b) => a * b, 1); return p.N % prod === 0 ? p.N / prod : 'not whole'; },
    consecProd: p => { for (let n = 2; n < 200; n++) { if (p.kd === 'three' && (n - 1) * n * (n + 1) === p.P) return n; if (p.kd === 'two' && n * (n + 1) === p.P) return 2 * n + 1; } return 'none'; },
  };

  const est = (p, a, want) => Math.abs(a.v.num() - want) <= 1e-6 * Math.abs(want);
  const F = {
    estMs3: (p, a) => est(p, a, { circA: Math.PI * p.x ** 2, circC: Math.PI * 2 * p.x, equiA: Math.sqrt(3) * p.x ** 2 / 4, sqDiag: Math.sqrt(2 * p.x * p.x), hypIso: Math.sqrt(2 * p.x * p.x), hyp: Math.sqrt(p.x ** 2 + (p.y || 0) ** 2), sqSide: Math.sqrt(p.x), pentBig: p.x * (3 * p.x - 1) / 2, diag: p.x * (p.x - 3) / 2 }[p.kd]),
    estMs4: (p, a) => est(p, a, { sphSA: 4 * Math.PI * p.x ** 2, sphV: 4 * Math.PI * p.x ** 3 / 3, cylV: Math.PI * p.x ** 2 * p.y, tetraV: p.x ** 3 / (6 * Math.SQRT2), tetraSA: Math.sqrt(3) * p.x ** 2, cubeV: p.x ** 3, boxV: p.xs && p.xs[0] * p.xs[1] * p.xs[2], pyrV: p.x ** 2 * p.y / 3, acres: p.x * 640, galIn3: p.x * 231, mph: p.x * 5280 / 3600, interest: p.xs && p.xs[0] * p.xs[1] * p.xs[2] / 100, light: 186000 * p.x }[p.kd]),
  };
  return { V, F };
};
