// Independent checks for every generator. Run: node test/verify.js [samples]
const load = require('./load');
const NS = load();
const { Q, q } = NS;
const N = +(process.argv[2] || 2000);

// UIL 2026 District #10 has an inclusive integer key of 6,802 through 7,518.
const assert = require('node:assert/strict');
for (const sign of [1, -1]) {
  const star = NS.ans.est(sign * 7160);
  for (const n of [6802, 7160, 7518]) assert.ok(NS.check(star, String(sign * n)).ok);
  for (const n of [6801, 7519, 7160.5]) assert.ok(!NS.check(star, String(sign * n)).ok);
  assert.ok(!NS.check(star, (sign * 14321) + '/2').ok);
}

/* ---------- exact expression evaluator for prompt text ---------- */
function evalExpr(src) {
  const s = src.replace(/=\s*$/, '').trim(); let i = 0;
  const peek = () => { while (s[i] === ' ') i++; return s[i]; };
  const num = () => { const m = /^\d*\.?\d+/.exec(s.slice(i)); i += m[0].length; return Q.parseNum(m[0]); };
  function primary() {
    const c = peek();
    if (c === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error('expected ) at ' + i + ' in ' + s); i++; return v; }
    for (const fn of ['sqrt', 'cbrt', 'abs', 'floor']) if (s.startsWith(fn + '(', i)) {
      i += fn.length + 1; const v = expr(); i++;
      if (fn === 'abs') return v.abs();
      if (fn === 'floor') { const n = v.n / v.d; return q(Number(v.n % v.d !== 0n && v.n < 0n ? n - 1n : n)); }
      const x = v.num(); const k = fn === 'sqrt' ? 2 : 3; const r = Math.round(Math.sign(x) * Math.abs(x) ** (1 / k));
      if (!q(r).pow(k).eq(v)) throw new Error(fn + ' not exact: ' + v); return q(r);
    }
    if (/[\d.]/.test(c)) return num();
    throw new Error(`unexpected '${c}' at ${i} in: ${s}`);
  }
  function power() { let b = primary(); if (peek() === '^') { i++; const e = unary(); if (!e.isInt()) throw new Error('non-int exp'); b = b.pow(Number(e.n)); } return b; }
  function unary() { if (peek() === '-') { i++; return unary().neg(); } if (peek() === '+') { i++; return unary(); } return power(); }
  function term() {
    let v = unary();
    for (;;) { const c = peek(); if (c === '*') { i++; v = v.mul(unary()); } else if (c === '/') { i++; v = v.div(unary()); } else if (c === '(' || (c && /[a-z]/.test(c))) { v = v.mul(unary()); } else return v; }
  }
  function expr() { let v = term(); for (;;) { const c = peek(); if (c === '+') { i++; v = v.add(term()); } else if (c === '-') { i++; v = v.sub(term()); } else return v; } }
  const v = expr(); if (i < s.length && peek() !== undefined) throw new Error('trailing at ' + i + ': ' + s);
  return v;
}

/* ---------- read the value out of the last <mark> in the steps ---------- */
function markValue(html) {
  const ms = [...html.matchAll(/<mark>([\s\S]*?)<\/mark>/g)]; if (!ms.length) return null;
  let t = ms[ms.length - 1][1].replace(/\u0001([^\u0002]*)\u0002/g, (m0, l) => NS.latexPlain(l)).replace(/-\s+/g, '-');
  t = t.replace(/<span class="mw">(\d+)<\/span>/g, '$1 ').replace(/<span class="fr"><span class="nu">([^<]*)<\/span><span class="de">([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
  t = t.replace(/−/g, '-').replace(/,/g, '').replace(/\s+/g, ' ').trim();
  return t;
}

/* ---------- independent verifiers by generator id ---------- */
const C = (n, k) => { let r = 1n; for (let i = 0n; i < BigInt(k); i++) r = r * (BigInt(n) - i) / (i + 1n); return Number(r); };
const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const isP = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const roman = s => { const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; } return t; };
const V = {
  m11: p => p.n * p.k,
  m25: p => p.kd === 'd25' ? q(p.n, 25) : p.n * +p.kd,
  near100: p => p.x * p.y, sq5: p => p.n ? p.n * p.n : Q.parseNum(p.t + '.5').pow(2), sameFront: p => p.x * p.y, end5: p => p.x * p.y,
  sq50: p => p.n * p.n, equi: p => p.x && typeof p.x === 'string' ? Q.parseNum(p.x).mul(Q.parseNum(p.y)) : p.x * p.y,
  dbl: p => p.f === 1.5 ? q(3 * p.n, 2) : p.f * p.n, foil: p => p.x * p.y, rev: p => p.x * p.y, m101: p => p.n * p.k, special: p => p.n * p.m,
  distrib: p => ({ sum100: () => p.a * p.b + p.a * p.c, diff: () => p.a * p.b - p.a * p.c, nn1: () => p.n * p.n + p.n, scaled: () => p.a * p.g + p.g * p.t * p.b })[p.kd](),
  aab: p => q(p.a * p.a, p.b),
  mixmul: p => p.c ? q(p.n * p.c + p.a, p.c).mul(q(p.n * p.c + p.c - p.a, p.c)) : q(p.x * p.k + 1, p.k).mul(q(p.y * p.k + 1, p.k)),
  sumsq101: p => p.x * p.x + p.y * p.y, diffsq: p => p.x * p.x - p.y * p.y, consq: p => p.lo * p.lo + p.hi * p.hi,
  fdp: p => p.den ? q(p.a, p.den) : p.c ? q(p.c, p.d) : null, // value checked by form below
  fracOps: p => p.w1 !== undefined ? q(p.w1 * p.b + p.a, p.b).sub(q(p.w2 * p.d + p.c, p.d)) : (p.plus ? q(p.a, p.b).add(q(p.c, p.d)) : q(p.a, p.b).sub(q(p.c, p.d))),
  abba: p => p.lo !== undefined ? q(p.lo, p.hi).add(q(p.hi - p.lo, p.lo)) : q(p.a, p.b).add(q(p.b, p.a)).sub(p.kd === 'm2' ? 2 : 0),
  nfrac: p => q(p.a, p.b).sub(q(p.c, p.d)),
  pct: p => p.x !== undefined ? q(p.x * p.y, 100) : p.pc !== undefined && p.n !== undefined ? Q.parseNum(String(p.pc)).mul(p.n).div(100) : p.a !== undefined ? q(100 * p.a, p.b) : p.part !== undefined ? q(p.part * 100).div(Q.parseNum(String(p.pc))) : q(p.n).mul(100 + p.up).mul(100 - p.dn).div(10000),
  compare: p => { const x = q(p.a, p.b), y = p.c ? q(p.c, p.d) : Q.parseNum(p.dv); return (x.cmp(y) > 0) === p.larger ? x : y; },
  repdec: p => null, ratio: p => p.b * p.k,
  consumer: p => p.each ? q(p.m * p.each, 100) : p.off ? q(p.price * (100 - p.off), 100) : p.tip ? q(p.bill * (100 + p.tip), 100) : q(p.P * p.rt * p.t, 100),
  orderOps: p => null, // covered by eval
  mean: p => p.xs && p.n === undefined ? null : p.n * p.m - p.xs.reduce((a, b) => a + b, 0),
  rem: p => Number(BigInt(p.s) % BigInt(p.m)),
  remExpr: p => p.e ? Number(BigInt(p.b) ** BigInt(p.e) % BigInt(p.m)) : (((p.plus ? p.a * p.b + p.c : p.a * p.b - p.c) % p.m) + p.m) % p.m,
  gcdLcm: p => null, divisors: p => null, primes: p => null,
  unitsDigit: p => Number(BigInt(p.b) ** BigInt(p.e) % 10n),
  modular: p => { if (p.a) { for (let x = 0; x < p.m; x++) if ((p.a * x) % p.m === p.b) return x; } for (let y = 1; ; y++) if (y % p.m1 === p.r1 && y % p.m2 === p.r2) return y; },
  sums: p => { const k = p.kd; let s = 0; if (k === 'n') for (let i = 1; i <= p.n; i++) s += i; if (k === 'odd') for (let i = 1; i <= 2 * p.k - 1; i += 2) s += i; if (k === 'even') for (let i = 2; i <= 2 * p.k; i += 2) s += i; if (k === 'arith') for (let i = 0; i < p.n; i++) s += p.a + i * p.d; if (k === 'sq') for (let i = 1; i <= p.n; i++) s += i * i; if (k === 'cube') for (let i = 1; i <= p.n; i++) s += i ** 3; if (k === 'alt') for (let i = 1; i <= p.n; i++) s += (i % 2 ? 1 : -1) * i * i; return s; },
  arithSeq: p => p.k ? p.a * p.k ** (p.n - 1) : p.a + (p.n - 1) * p.d,
  geoSeries: p => { let s = q(0), t = q(p.a); for (let i = 0; i < 400; i++) { s = s.add(t); t = t.mul(q(p.num, p.den)); } return s; }, // compared approx
  telescope: p => { let s = q(0); for (let i = 0; i < p.k; i++) s = s.add(q(p.top, (p.s + i) * (p.s + i + 1))); return s; },
  consec: p => p.a !== undefined ? p.a : p.m + 2,
  polygonal: p => ({ tri: () => p.n * (p.n + 1) / 2, pent: () => p.n * (3 * p.n - 1) / 2, hex: () => p.n * (2 * p.n - 1), fib: () => { let a = 1, b = 1; for (let i = 2; i < p.k; i++) [a, b] = [b, a + b]; return b; }, fibsum: () => { const f = [p.a, p.b]; while (f.length < 10) f.push(f.at(-1) + f.at(-2)); return f.reduce((x, y) => x + y); } })[p.kd](),
  bases: p => p.s ? parseInt(p.s, p.b) : p.n !== undefined && p.b ? p.n.toString(p.b).toUpperCase() : p.n.toString(p.b2).toUpperCase(),
  baseOps: p => (p.op === '+' ? p.x + p.y : p.op === '−' ? p.x - p.y : p.x * p.y).toString(p.b).toUpperCase(),
  baseFrac: p => q(p.d1 * p.b + p.d2, p.b * p.b),
  subst: p => p.a * p.x * p.x + p.b * p.x + p.c,
  equation: p => p.den ? q(p.rhs - p.b).mul(p.den).div(p.num) : q(p.d - p.b, p.a - p.c),
  absInv: p => p.c !== undefined ? Math.abs(p.a - p.b) - Math.abs(p.c - p.d) : null,
  system: p => p.kd === 'xy' ? p.x * p.y : p.kd === 'x' ? p.x : p.x ** 2 + p.y ** 2,
  roots: p => { if (p.cubic) return p.cubic === 'prod' ? q(-p.d, p.a) : q(-p.b, p.a); if (p.kd === undefined) { const d = p.b * p.b - 4 * p.c; return (-p.b + Math.sqrt(d)) / 2; } return { sum: q(-p.b, p.a), prod: q(p.c, p.a), disc: q(p.b * p.b - 4 * p.a * p.c), sumsq: q(p.b * p.b, p.a * p.a).sub(q(2 * p.c, p.a)) }[p.kd]; },
  vertex: p => null,
  exponents: p => p.e1 ? q(p.b).pow(p.e1 + p.e2 - p.e3) : p.e !== undefined && p.num === undefined ? null : null,
  logs: p => p.e !== undefined && p.x === undefined ? (p.b ** p.e > 0 ? null : null) : null,
  complex: p => null, binomial: p => p.k !== undefined ? C(p.n, p.k) * p.a ** p.k * p.b ** (p.n - p.k) : p.a !== undefined ? (p.a + p.b) ** p.n : p.n + 4,
  variation: p => p.inv ? q(p.x1 * p.y1, p.x2) : q(p.y1 * p.x2, p.x1),
  ineq: p => { if (p.a) { let x = 1000; while (p.a * x + p.b >= p.c) x--; return x; } let c = 0; for (let x = -100; x <= 100; x++) { const d = Math.abs(x - p.h); if (p.strict ? d < p.k : d <= p.k) c++; } return c; },
  functions: p => p.dom ? q(p.k, p.m) : p.c !== undefined ? p.a * (p.c * p.x * p.x + p.d) + p.b : (p.y - p.b) / p.a,
  polygon: p => null, rightTri: p => null, area: p => null, volume: p => null, platonic: p => null, coord: p => null, conics: p => null,
  units: p => null, roman: p => p.s ? roman(p.s) : p.n ? null : p.plus ? p.x + p.y : p.x - p.y,
  tempSpeed: p => p.c !== undefined ? p.c * 1.8 + 32 : p.f !== undefined ? (p.f - 32) / 1.8 : p.m ? p.m * 5280 / 3600 : p.ft * 3600 / 5280,
  powers: p => null, sets: p => null, counting: p => p.w ? null : null, prob: p => null,
  trig: p => null, matrix: p => p.a !== undefined ? p.a * p.d - p.b * p.c : null, vectors: p => p.a !== undefined ? p.a * p.c + p.b * p.d : null,
  gint: p => Math.floor(p.a) + Math.floor(p.b), limits: p => p.k !== undefined ? p.k + p.m : q(p.a, p.c),
  deriv: p => null, integral: p => null, critical: p => null, asymptote: p => p.k !== undefined ? q(p.k, p.m) : q(p.a, p.c),
  geofacts: p => ({ third: () => 180 - p.a - p.b, ext: () => p.a + p.b, comp: () => (p.sup ? 180 : 90) - p.a, isos: () => q(180 - p.v, 2), inscribed: () => p.arc / 2, similar: () => q(p.t * p.s2, p.s1) })[p.kd](),
  remThm: p => { let v = 0; for (let i = 0; i < 4; i++) v += p.cs[i] * p.a ** (3 - i); return v; },
  subrev: p => p.x - p.y,
  sqmult: p => p.a * p.a + (p.k * p.a) ** 2,
  twoab: p => p.plus ? (p.a + p.b) ** 2 - p.a ** 2 - p.b ** 2 : p.a ** 2 + p.b ** 2 - (p.a - p.b) ** 2,
  fourcons: p => { const v = p.n * (p.n + 1) * (p.n + 2) * (p.n + 3) + 1; const s = Math.round(Math.sqrt(v)); return s * s === v ? s : null; },
  div9: p => q(p.n, 9),
  relprime: p => { let c = 0; for (let i = 1; i < p.n; i++) if (gcd(i, p.n) === 1) c++; return c; },
  factpm: p => { const f = n => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; }; return new Q(f(p.n) + (p.plus ? 1n : -1n) * f(p.n - 2), f(p.n - 1)); },
  fracchain: p => { const a = p.a, b = p.b; return p.minus ? q(1, a).sub(q(1, a * b)).sub(q(1, a * b * b)) : q(1, a).add(q(1, a * b)).add(q(1, a * b * b)); },
  est1: p => p.xs ? p.xs[0] + p.xs[1] - p.xs[2] : p.b && p.a > 0 && !p.xs ? null : null,
};
// numeric verifier helpers for those marked null above: brute-force via floats where meaningful
const F = {
  gcdLcm: (p, a) => p.t ? p.t.reduce((x, y) => x * y / gcd(x, y)) === Number(a.v.n) : true,
  divisors: (p, a) => { let c = 0, s = 0, o = 0; for (let i = 1; i <= p.n; i++) if (p.n % i === 0) { c++; s += i; if (i % 2) o++; } return [c, s, o].includes(Number(a.v.n)); },
  primes: (p, a) => { if (p.n) { let x = p.n - 1; while (!isP(x)) x--; return x === Number(a.v.n); } const ps = []; for (let i = p.lo; i <= p.hi; i++) if (isP(i)) ps.push(i); return [ps.length, ps.reduce((x, y) => x + y, 0)].includes(Number(a.v.n)); },
  counting: (p, a) => { const n = Number(a.v.n); if (p.kd === 'word') { const cnt = {}; for (const ch of p.w) cnt[ch] = (cnt[ch] || 0) + 1; return Object.values(cnt).reduce((x, c) => x / fact(c), fact(p.w.length)) === n; } if (p.kd === 'factdiv') return fact(p.a) / fact(p.b) === n; if (p.kd === 'C') return n === C(p.n, p.k); let P = 1; for (let i = 0; i < p.k; i++) P *= p.n - i; return n === P; },
  rightTri: (p, a) => { const v = a.v.num(); const c = Math.hypot(p.a ?? 0, p.b ?? 0); return ({ hyp: () => Math.abs(v - Math.hypot(p.a, p.b)) < 1e-9, leg: () => Math.abs(v - Math.sqrt(p.c ** 2 - p.a ** 2)) < 1e-9, area: () => Math.abs(v - p.b * Math.sqrt(p.c ** 2 - p.b ** 2) / 2) < 1e-9, alt: () => Math.abs(v - p.a * p.b / c) < 1e-9 })[p.kd](); },
  polygon: (p, a) => { const v = a.v.num(); return ({ interior: () => Math.abs(v - (180 - 360 / p.n)) < 1e-9, exterior: () => Math.abs(v - 360 / p.n) < 1e-9, sum: () => v === 180 * (p.m - 2), diag: () => v === p.m * (p.m - 3) / 2, sides: () => v === p.n })[p.kd](); },
  coord: (p, a) => { const v = a.v.num(); return ({ dist: () => Math.abs(v - Math.hypot(p.a, p.b)) < 1e-9, mid: () => v === (p.x1 + p.x2) / 2, slope: () => Math.abs(v - (p.y2 - p.y1) / (p.x2 - p.x1)) < 1e-9, lineSlope: () => Math.abs(v + p.a / p.b) < 1e-9, yint: () => Math.abs(v - p.c / p.b) < 1e-9, ptLine: () => Math.abs(v - Math.abs(p.sA * p.A0 * p.x0 + p.sB * p.B0 * p.y0 + p.cc) / Math.hypot(p.A0, p.B0)) < 1e-9 })[p.kd](); },
  conics: (p, a) => { const v = a.v.num(); if (p.R) return v === p.R && p.R > 0; return v === p.a * p.b; },
  powers: (p, a) => { const v = a.v.num(); return ({ sq: () => p.n * p.n, sqrt: () => p.n, cube: () => p.n ** 3, cbrt: () => p.n, p2: () => 2 ** p.e, p3: () => p.b ** p.e })[p.kd]() === v; },
  sets: (p, a) => { const v = a.v.num(); if (p.T) return v === p.T - (p.a + p.b - p.both); if (p.n1) return v === p.n1 + p.n2 - p.k; return v === 2 ** p.n - (p.kd === 'proper' ? 1 : 0); },
  prob: (p, a) => { if (p.s) { let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === p.s) c++; return a.v.eq(q(c, 36)); } if (p.n) return a.v.eq(q(C(p.n, p.k), 2 ** p.n)); if (a.type === 'text') { const T = p.red + p.blue + p.green; const g = gcd(p.red, T - p.red); return a.v === `${p.red / g}:${(T - p.red) / g}`; } const T = p.red + p.blue + p.green; return a.v.eq(q(p.red * (p.red - 1), T * (T - 1))); },
  trig: (p, a) => { const v = a.v.num(); const S = d => Math.round(Math.sin(d * Math.PI / 180) * 1e9) / 1e9, Co = d => Math.round(Math.cos(d * Math.PI / 180) * 1e9) / 1e9, T = d => Math.round(Math.tan(d * Math.PI / 180) * 1e9) / 1e9; if (p.f) { const f = { sin: S, cos: Co, tan: T }; return Math.abs(f[p.f](p.a1) + f[p.f2](p.a2) - v) < 1e-9; } if (p.k) return v === p.k; if (p.d) return Math.abs(v - p.d / 180) < 1e-12; if (p.b && !p.a) return Math.abs(v - 2 / p.b) < 1e-12; return Math.abs(v - S(p.a) * Co(p.b)) < 1e-9; },
  volume: (p, a) => { const v = a.v.num(); const want = ({ box: () => p.a * p.b * p.c, boxSA: () => 2 * (p.a * p.b + p.b * p.c + p.a * p.c), cubeSA: () => 6 * p.s * p.s, cyl: () => p.rr * p.rr * p.h, sphere: () => 4 / 3 * p.rr ** 3, sphSA: () => 4 * p.rr ** 2, cone: () => p.rr * p.rr * p.h / 3, boxDiag: () => Math.hypot(p.a, p.b, p.c) })[p.kd](); return Math.abs(want - v) < 1e-9; },
  area: (p, a) => { const v = a.v.num(); const want = ({ rectP: () => (p.P / 2 - p.w) * p.w, triangle: () => p.b * p.h / 2, trap: () => (p.b1 + p.b2) * p.h / 2, rhombus: () => p.d1 ? p.d1 * p.d2 / 2 : 4 * Math.hypot(p.a, p.b), circle: () => (p.d / 2) ** 2, circum: () => 2 * Math.sqrt(p.A0), equi: () => p.s * p.s / 4, sqdiag: () => p.d * p.d / 2, sector: () => p.rr * p.rr * p.ang / 360 })[p.kd](); return Math.abs(want - v) < 1e-9; },
  platonic: (p, a) => { const v = a.v.num(); if (p.F) return v === p.F + p.V - 2; const t = { tetrahedron: [4, 4, 6], cube: [6, 8, 12], octahedron: [8, 6, 12], dodecahedron: [12, 20, 30], icosahedron: [20, 12, 30] }[p.name]; return v === t[['faces', 'vertices', 'edges'].indexOf(p.kd)]; },
  vertex: (p, a) => { const h = -p.b / (2 * p.a); const k = p.a * h * h + p.b * h + p.c; const v = a.v.num(); return Math.abs(v - h) < 1e-9 || Math.abs(v - k) < 1e-9; },
  deriv: (p, a) => { const f = x => p.cs.reduce((s, c) => s * x + c, 0); const h = 1e-4; const d1 = (f(p.x + h) - f(p.x - h)) / (2 * h), d2 = (f(p.x + h) - 2 * f(p.x) + f(p.x - h)) / (h * h); const v = a.v.num(); return Math.abs(v - d1) < 1e-3 || Math.abs(v - d2) < 1e-2; },
  integral: (p, a) => { const f = x => p.cs.reduce((s, c) => s * x + c, 0); let s = 0; const n = 20000, dx = (p.hi - p.lo) / n; for (let i = 0; i < n; i++) s += f(p.lo + (i + 0.5) * dx) * dx; return Math.abs(s - a.v.num()) < 1e-4; },
  critical: (p, a) => { const f = x => p.cs.reduce((s, c) => s * x + c, 0); const v = a.v.num(); let best = null; for (let x = -10; x <= 10; x += 0.001) { const y = f(x); if (f(x - 0.001) > y && f(x + 0.001) > y) best = { min: x, val: y }; } const xs = []; for (let x = -10; x <= 10; x += 0.001) { const y = f(x); if (f(x - 0.001) < y && f(x + 0.001) < y) xs.push(x); } return (best && (Math.abs(best.min - v) < 0.01 || Math.abs(best.val - v) < 0.01)) || xs.some(x => Math.abs(x - v) < 0.01); },
  units: (p, a) => { const T = { 'miles>feet': 5280, 'miles>yards': 1760, 'yards>inches': 36, 'feet>inches': 12, 'yards>feet': 3, 'gallons>quarts': 4, 'gallons>pints': 8, 'gallons>cups': 16, 'quarts>pints': 2, 'quarts>cups': 4, 'pints>cups': 2, 'cups>fluid ounces': 8, 'quarts>fluid ounces': 32, 'gallons>fluid ounces': 128, 'pounds>ounces': 16, 'tons>pounds': 2000, 'hours>minutes': 60, 'days>hours': 24, 'weeks>days': 7, 'minutes>seconds': 60, 'square feet>square inches': 144, 'square yards>square feet': 9, 'cubic yards>cubic feet': 27, 'cubic feet>cubic inches': 1728, 'gallons>cubic inches': 231, 'inches>centimeters': 2.54, 'meters>centimeters': 100, 'kilometers>meters': 1000, 'liters>milliliters': 1000, 'kilograms>grams': 1000 }; const f = T[p.from + '>' + p.to]; const [nn, dd] = p.n.split('/').map(Number); const n = nn / (dd || 1); const want = p.dir === 'fwd' ? n * f : n / f; return Math.abs(want - a.v.num()) < 1e-9; },
  repdec: (p, a) => { const s = '0.' + p.pre + p.rep.repeat(12); return Math.abs(parseFloat(s) - a.v.num()) < 1e-12 && p.rep.length > 0; }, orderOps: () => true, mean: (p, a) => { if (!p.xs || p.n !== undefined) return true; const s = p.xs.slice().sort((x, y) => x - y); const L = s.length; const med = L % 2 ? s[(L - 1) / 2] : (s[L / 2 - 1] + s[L / 2]) / 2; const mean = p.xs.reduce((x, y) => x + y) / L; return Math.abs(a.v.num() - med) < 1e-9 || Math.abs(a.v.num() - mean) < 1e-9; },
  fdp: (p, a) => p.b ? (a.v.eq(q(p.a, p.b)) || a.v.eq(q(100 * p.a, p.b))) : true,
  exponents: (p, a) => { const v = a.v.num(); if (p.e1) return true; if (p.tgt !== undefined) return Math.abs(Math.pow(p.b, v) - p.tgt) < 1e-6 * p.tgt; if (p.den) return Math.abs(Math.pow(p.b, p.num / p.den) - v) < 1e-6 * v; return Math.abs(Math.pow(p.b, -p.num / p.n) - v) < 1e-9; },
  logs: (p, a) => { const v = a.v.num(); if (p.xs) return Math.abs(Math.log(p.xs[0] * p.xs[1] / p.xs[2]) / Math.log(p.b) - v) < 1e-9; if (p.x && p.y) return Math.abs(Math.log10(p.x * p.y) - v) < 1e-9; if (p.x) return Math.abs(Math.log(p.x) / Math.log(p.b) - v) < 1e-9; return v === p.b ** p.e || v === p.e; },
  complex: (p, a) => { if (p.n) return a.v === ['1', 'i', '-1', '-i'][p.n % 4]; if (p.x) return a.v.num() === Math.hypot(p.x, p.y); if (p.c !== undefined) return a.v === NS.cx(p.a * p.c - p.b * p.d, p.a * p.d + p.b * p.c); return a.v.num() === p.a * p.a + p.b * p.b; },
  absInv: (p, a) => p.c !== undefined ? true : (a.v.eq(q(p.b, p.a)) || a.v.eq(q(-p.a, p.b))),
  matrix: (p, a) => { const v = a.v.num(); if (p.m) { const m = p.m; const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); return det === v; } if (p.A1) return v === p.A1[p.i][0] * p.B1[0][p.j] + p.A1[p.i][1] * p.B1[1][p.j]; return true; },
  vectors: (p, a) => { const v = a.v.num(); if (p.x) return v === Math.hypot(p.x, p.y); if (p.rr) { const t = p.th * Math.PI / 180; return Math.abs(v - p.rr * Math.cos(t)) < 1e-9 || Math.abs(v - p.rr * Math.sin(t)) < 1e-9; } return true; },
  roman: (p, a) => p.n ? roman(a.v) === p.n : true,
  est1: (p, a) => { const v = a.v.num(); if (p.xs) return true; return Math.abs(v - p.a * (p.b > 0 ? 1 : 1) * 0) >= 0 && (Math.abs(v - p.a * p.b) < 1e-6 || Math.abs(v - p.a / p.b) < 1e-9); },
  est2: (p, a) => { const v = a.v.num(); const c = [p.p * p.n / 100, p.x * p.n, p.a * p.b * (p.c || 1), p.a * p.b]; return c.some(x => Math.abs(x - v) < 1e-6 * Math.abs(x)); },
  est3: (p, a) => { const v = a.v.num(); const c = [Math.sqrt(p.n), p.a * p.b / p.c, p.n * 2.54, p.x * p.n, p.a * p.a * p.b]; return c.some(x => Math.abs(x - v) < 1e-5 * Math.abs(x)); },
  est4: (p, a) => { const v = a.v.num(); const c = [p.b ** p.e, p.k * Math.PI ** p.n, Math.cbrt(p.n) * p.m, p.a / p.b, Math.sqrt(p.n) * p.m]; return c.some(x => Math.abs(x - v) < 1e-5 * Math.abs(x)); },
};

{ const X = require('./verify_uil')(NS); Object.assign(V, X.V); Object.assign(F, X.F); }
{ const X = require('./verify_ms')(NS); Object.assign(V, X.V); Object.assign(F, X.F); }
{ const X = require('./verify_new')(NS); Object.assign(V, X.V); Object.assign(F, X.F); }
/* ---------- run ---------- */
let fails = 0, total = 0; const counts = {}; const failedIds = new Set();
const bad = (g, lv, seed, msg, out) => { fails++; failedIds.add(g.id); if (fails <= 60) console.log(`FAIL ${g.id}/${lv} seed=${seed}: ${msg}\n   prompt: ${out && out.p && out.p.h}\n   key: ${out && out.a && NS.keyText(out.a)}`); };
const toVal = x => x instanceof Q ? x : typeof x === 'number' ? (Number.isInteger(x) ? q(x) : x) : x;
for (const g of NS.GENS) {
  for (const lv of ['ms', 'hs']) {
    if (!g.col[lv]) continue;
    // raw generator output, then every difficulty level through NS.makeProblem (which also hands
    // the level to the generator, so ranges that widen for Hard and Super-hard get checked too)
    const ND = Math.max(25, Math.floor(N / 8));
    for (const [diff, n] of [[null, N], ['warmup', ND], ['contest', ND], ['hard', ND], ['super', ND]])
    for (let i = 0; i < n; i++) {
      const seed = (i * 2654435761 + g.id.length * 97 + (diff ? diff.length * 7919 : 0)) >>> 0; const r = new NS.Rng(seed); let out;
      total++; counts[g.id] = (counts[g.id] || 0) + 1;
      try { out = diff ? NS.makeProblem(g.id, lv, seed, diff) : g.gen(r, lv); if (process.env.MUT && out.a.type === 'num') out.a = { ...out.a, v: out.a.v.add(out.a.est ? out.a.v.mul(NS.q(1, 10)) : 1) }; if (process.env.MUT && out.a.type === 'text') out.a = { ...out.a, v: out.a.v + '1', alts: [] }; } catch (e) { bad(g, lv, seed, 'threw ' + e.stack.split('\n').slice(0, 2).join(' ')); continue; }
      const all = out.p.h + (out.steps || []).join('|') + (out.suffix || '') + (out.form || '');
      if (/undefined|NaN|null|\[object|Infinity/.test(all)) { bad(g, lv, seed, 'bad text: ' + all.match(/.{0,30}(undefined|NaN|null|\[object|Infinity).{0,20}/)[0], out); continue; }
      if (!out.a || !['num', 'text'].includes(out.a.type)) { bad(g, lv, seed, 'no answer', out); continue; }
      if (!out.steps || out.steps.length < 1) { bad(g, lv, seed, 'no steps', out); continue; }
      // key must be accepted by the checker in at least its canonical form
      const a = out.a;
      if (a.type === 'num') {
        const forms = [];
        if (a.v.isInt()) forms.push(a.v.n.toString());
        else { if (a.form !== 'frac' && a.form !== 'dec') forms.push(a.v.toMixedStr()); if (a.form !== 'mixed' && a.form !== 'dec') forms.push(a.v.toFracStr()); if (a.form === 'dec' || (a.form === 'any' && a.v.terminates())) forms.push(a.v.toDecStr()); }
        if (a.form === 'dec' && !a.v.terminates()) { bad(g, lv, seed, 'decimal requested for non-terminating value', out); continue; }
        for (const f of forms) if (f !== null && !a.est && !NS.check(a, f).ok) bad(g, lv, seed, `key form "${f}" rejected: ${JSON.stringify(NS.check(a, f))}`, out);
        if (a.est) { const s = String(Math.round(a.v.num())); if (!NS.check(a, s).ok) bad(g, lv, seed, 'rounded estimate rejected', out); if (a.v.num() === 0) bad(g, lv, seed, 'zero estimate', out); }
        if (a.form === 'mixed' && a.v.abs().cmp(1) < 0) bad(g, lv, seed, 'mixed number requested for proper fraction', out);
      } else if (!NS.check(a, a.v).ok) bad(g, lv, seed, 'text key rejected', out);
      // independent verifier
      const vf = V[g.id]; let ind = vf ? vf(out.params || {}) : null;
      if (ind !== null && ind !== undefined) {
        ind = toVal(ind);
        if (typeof ind === 'number' && !Number.isInteger(ind)) { if (Math.abs(a.v.num() - ind) > 1e-9 * Math.max(1, Math.abs(ind))) bad(g, lv, seed, `verifier ${ind} ≠ key`, out); }
        else if (typeof ind === 'string') { if (a.v !== ind) bad(g, lv, seed, `verifier "${ind}" ≠ key "${a.v}"`, out); }
        else if (g.id === 'geoSeries') { if (Math.abs(ind.num() - a.v.num()) > 1e-9) bad(g, lv, seed, 'series mismatch', out); }
        else if (ind instanceof Q && a.type === 'num' && !ind.eq(a.v)) bad(g, lv, seed, `verifier ${ind} ≠ key ${a.v}`, out);
      }
      if (F[g.id] && !F[g.id](out.params || {}, a)) bad(g, lv, seed, 'brute-force check failed ' + JSON.stringify(out.params), out);
      // prompt arithmetic must evaluate to the key
      if (g.eval && a.type === 'num') {
        try { const ev = evalExpr(out.p.t); if (!ev.eq(a.v)) bad(g, lv, seed, `prompt evaluates to ${ev} but key is ${a.v}  [${out.p.t}]`, out); }
        catch (e) { bad(g, lv, seed, 'eval error ' + e.message, out); }
      }
      // the last highlighted value in the worked steps should be the answer
      if (!a.est && !process.env.NOMARK) {
        const mv = markValue(out.steps.join(' '));
        if (mv !== null) {
          if (a.type === 'num') {
            const pv = NS.parseInput(mv.replace(/[°%]$/, '').replace(/^\$/, ''));
            if (pv.kind !== 'num' || !pv.v.eq(a.v)) bad(g, lv, seed, `steps end with "${mv}" but key is ${a.v}`, out);
          } else if (NS.normText(mv.replace(/\s/g, ''), a.kind) !== NS.normText(a.v, a.kind) && !(a.alts || []).some(x => NS.normText(mv, a.kind) === NS.normText(x, a.kind))) bad(g, lv, seed, `steps end with "${mv}" but key is ${a.v}`, out);
        } else bad(g, lv, seed, 'steps have no highlighted answer', out);
      }
    }
  }
}
if (failedIds.size) console.log('Generators with failures: ' + [...failedIds].join(' '));
console.log(`\n${NS.GENS.length} generators, ${total} problems checked, ${fails} failures.`);
process.exit(fails ? 1 : 0);
