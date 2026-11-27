// Independent checks for gens_new.js. Each recomputes the answer without the generator's shortcut:
// floating point for roots and trig, brute force for congruences and divisor sums, BigInt powers.
module.exports = function (NS) {
  const { q } = NS;
  const D2R = Math.PI / 180;
  const properSum = n => { let s = 0; for (let d = 1; d < n; d++) if (n % d === 0) s += d; return s; };
  let PERF = null;
  const roundTo = (y, d) => Math.round(y * 10 ** d) / 10 ** d;
  const V = {
    sameFront3: p => p.u * p.v,
    roundRoot: p => {
      const y = { one: () => Math.sqrt(p.n), mult: () => p.k * Math.sqrt(p.n), three: () => p.xs.reduce((s, n, i) => s + p.sg[i] * Math.sqrt(n), 0), sum: () => Math.sqrt(p.a) + Math.sqrt(p.b), diff: () => Math.sqrt(p.a) - Math.sqrt(p.b) }[p.kd]();
      const v = roundTo(y, p.d); return Number.isInteger(v) ? v : NS.Q.parseNum(v.toFixed(p.d));
    },
    modRange: p => {
      if (p.kd === 'pow') return Number((BigInt(p.a) ** BigInt(p.e)) % BigInt(p.p));
      const hits = []; for (let x = p.L; x <= p.U; x++) { const lhs = p.kd === 'plus' ? p.b + x : p.a * x + p.b; if ((lhs - p.c) % p.mod === 0) hits.push(x); }
      return hits.length === 1 ? hits[0] : 'not unique';
    },
    derivMore: p => {
      let h = 1e-4, f, x0;
      if (p.kd === 'init') { // integrate f' numerically from a to c (Simpson), add f(a)
        const fp = t => (p.form === 'k' ? p.k : p.form === 'kx' ? p.k * t : p.k * t * t); const n = 200, a = p.a, c = p.c, hh = (c - a) / n;
        let s = fp(a) + fp(c); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fp(a + i * hh); return p.b + s * hh / 3;
      }
      if (p.kd === 'trig') { const g = p.f === 'sin' ? Math.sin : Math.cos; f = t => p.k * g(t); x0 = p.ang * D2R;
        const d = p.second ? (f(x0 + h) - 2 * f(x0) + f(x0 - h)) / (h * h) : (f(x0 + h) - f(x0 - h)) / (2 * h); return Math.round(d * 1e4) / 1e4; }
      h = 1e-5; f = p.form === "lin" ? t => (p.a * t + p.b) ** p.n : t => (t * t + p.c) ** p.n; x0 = p.x0;
      return Math.round((f(x0 + h) - f(x0 - h)) / (2 * h) * 1e3) / 1e3;
    },
    perfectNum: p => {
      const perf = PERF || (PERF = (() => { const o = []; for (let n = 2; o.length < 4; n++) { let t = 1; for (let d = 2; d * d <= n; d++) if (n % d === 0) t += d + (d * d === n ? 0 : n / d); if (t === n) o.push(n); } return o; })());
      if (p.kd === 'sum') return perf.slice(0, p.k).reduce((s, n) => s + n, 0);
      if (p.kd === 'nth') return perf[p.k - 1];
      if (p.kd === 'next') { for (let n = p.k + 1; ; n++) if (properSum(n) > n) return n; }
      if (p.kd === 'proper') return properSum(p.n);
      const s = properSum(p.n); return s > p.n ? 'abundant' : s < p.n ? 'deficient' : 'perfect';
    },
    scaleArea: p => {
      if (p.kd === 'pct' || p.kd === 'cube') { const f = 1 + (p.up ? p.p : -p.p) / 100; return Math.round(Math.abs(f ** p.e - 1) * 100 * 1e6) / 1e6; }
      if (p.kd === 'circle') { const A = c => Math.PI * (c / 2) ** 2; return Math.round(Math.abs(A(p.c2) - A(p.c1)) / Math.PI * 1e6) / 1e6; }
      const A = P => (P / 4) ** 2; return Math.abs(A(p.p2) - A(p.p1));
    },
  };
  const est = (a, want) => Math.abs(a.v.num() - want) <= 1e-6 * Math.abs(want);
  const F = {
    estRoot: (p, a) => est(a, { fourth: () => Math.sqrt(Math.sqrt(p.n)) * p.k, fifth: () => Math.exp(Math.log(p.n) / 5) * p.k, sqrtsum: () => (Math.sqrt(p.a) + Math.sqrt(p.b)) * p.k }[p.kd]()),
  };
  return { V, F };
};
