/* ===== estimation (*) problems: every 10th problem, ±5% ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn;
  const approxQ = x => { const k = 1e6; return q(Math.round(x * k), k); };
  const round2 = n => { const p = 10 ** Math.max(0, String(Math.abs(Math.round(n))).length - 2); return Math.round(n / p) * p; };

  G({
    id: 'est1', trick: 'estimate', est: true, col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(['mul', 'mul', 'add', 'div']);
      if (kd === 'mul') { const a = r.int(lv === 'ms' ? 112 : 211, 989), b = r.int(lv === 'ms' ? 31 : 112, lv === 'ms' ? 98 : 989); const v = a * b;
        return { p: H.cat(H.n(a), ' × ', H.n(b), ' ='), a: A.est(v), params: { a, b }, steps: [`Round one number, keep the other: ${a} × ${round2(b)} ≈ ${fm(a * round2(b))}.`, `Any integer within 5% of ${fm(v)} counts.`] }; }
      if (kd === 'add') { const xs = [r.int(1000, 9999), r.int(1000, 9999), r.int(100, 9999)]; const v = xs[0] + xs[1] - xs[2];
        return { p: H.cat(H.n(xs[0]), ' + ', H.n(xs[1]), ' − ', H.n(xs[2]), ' ='), a: A.est(v), params: { xs }, steps: [`Round to hundreds: ${Math.round(xs[0] / 100) * 100} + ${Math.round(xs[1] / 100) * 100} − ${Math.round(xs[2] / 100) * 100}.`, `≈ ${fm(Math.round(xs[0] / 100) * 100 + Math.round(xs[1] / 100) * 100 - Math.round(xs[2] / 100) * 100)} (exact ${fm(v)})`] }; }
      const b = r.int(12, 98), qq = r.int(lv === 'ms' ? 21 : 120, lv === 'ms' ? 300 : 999); const a = b * qq + r.int(0, b - 1); const v = q(a, b);
      return { p: H.cat(H.n(a), ' ÷ ', H.n(b), ' ='), a: A.est(v), params: { a, b }, steps: [`How many ${b}s fit? ${b} × ${qq} = ${fm(b * qq)}.`, `≈ ${qq}`] };
    },
  });

  G({
    id: 'est2', trick: 'estimate', est: true, col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const kd = r.pick(['pct', 'frac1000', 'triple', 'mul4']);
      if (kd === 'pct') { const p = r.pick([12.5, 37.5, 62.5, 87.5, 33, 66, 83, 16, 11, 44]); const n = r.int(1000, 99999); const v = Q.parseNum(String(p)).mul(n).div(100);
        const fr = { 12.5: '1/8', 37.5: '3/8', 62.5: '5/8', 87.5: '7/8', 33: '1/3', 66: '2/3', 83: '5/6', 16: '1/6', 11: '1/9', 44: '4/9' }[p];
        return { p: H.cat(`${p}% of ${fm(n)} =`), a: A.est(v), params: { p, n }, steps: [`${p}% is about ${fr}.`, `${fr} of ${fm(n)} ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'frac1000') { const [x, fr, k] = r.pick([[8333, '5/6', 10000], [1667, '1/6', 10000], [3333, '1/3', 10000], [6667, '2/3', 10000], [125, '1/8', 1000], [375, '3/8', 1000], [625, '5/8', 1000], [875, '7/8', 1000], [143, '1/7', 1000], [1111, '1/9', 10000]]); void k;
        const n = r.int(12, 99); const v = x * n;
        return { p: H.cat(H.n(x), ' × ', H.n(n), ' ='), a: A.est(v), params: { x, n }, steps: [`${fm(x)} is about ${fr} of ${fm(k)}.`, `${n} × ${fr} = ${H.Qf(q(n).mul(Q.parseNum(fr.split('/')[0])).div(+fr.split('/')[1])).h}, × ${fm(k)} ≈ ${fm(Math.round(v / 100) * 100)}`] }; }
      if (kd === 'triple') { const a = r.int(11, 49), b = r.int(11, 49), c = r.int(11, 49); const v = a * b * c;
        return { p: H.cat(`${a} × ${b} × ${c} =`), a: A.est(v), params: { a, b, c }, steps: [`Multiply two exactly, round the third: ${a} × ${b} = ${a * b}, × ${round2(c)} ≈ ${fm(a * b * round2(c))}.`, `Exact: ${fm(v)}`] }; }
      const a = r.int(1001, 9999), b = r.int(101, 999); const v = a * b;
      return { p: H.cat(H.n(a), ' × ', H.n(b), ' ='), a: A.est(v), params: { a, b }, steps: [`Round to two significant digits on one side: ${fm(a)} × ${round2(b)}.`, `≈ ${fm(a * round2(b))} (exact ${fm(v)})`] };
    },
  });

  G({
    id: 'est3', trick: 'estimate', est: true, col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['sqrt', 'chain', 'conv', 'sevenths'] : ['sqrt', 'chain', 'sevenths', 'sqprod']);
      if (kd === 'sqrt') { const n = r.int(1000, 99999); const v = approxQ(Math.sqrt(n)); const s = Math.floor(Math.sqrt(n));
        return { p: H.cat(H.sqrt(H.n(n)), ' ='), a: A.est(v), params: { n }, steps: [`${s}² = ${fm(s * s)} and ${s + 1}² = ${fm((s + 1) ** 2)}.`, `So it's about ${s} (any integer from ${Math.ceil(v.num() * 0.95)} to ${Math.floor(v.num() * 1.05)} counts).`] }; }
      if (kd === 'chain') { const a = r.int(101, 999), b = r.int(11, 99), c = r.int(11, 99); const v = q(a * b, c);
        return { p: H.cat(H.n(a), ' × ', H.n(b), ' ÷ ', H.n(c), ' ='), a: A.est(v), params: { a, b, c }, steps: [`Look for cancelling first: ${b}/${c} ≈ ${(b / c).toFixed(2)}.`, `${a} × ${(b / c).toFixed(2)} ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'conv') { const n = r.int(100, 999); const v = Q.parseNum('2.54').mul(n);
        return { p: H.cat(`${n} inches =`), suffix: 'centimeters', a: A.est(v), params: { n }, steps: [`1 in = 2.54 cm, about 2.5.`, `${n} × 2.5 = ${fm(n * 2.5)} (exact ${H.dec(v).h})`] }; }
      if (kd === 'sevenths') { const [x, fr, k] = r.pick([[1428.57, '1/7', 10000], [2857.14, '2/7', 10000], [4285.71, '3/7', 10000], [5714.28, '4/7', 10000], [7142.85, '5/7', 10000], [8571.42, '6/7', 10000], [142.857, '1/7', 1000]]);
        const n = r.int(12, 99); const v = Q.parseNum(String(x)).mul(n);
        return { p: H.cat(H.dec(String(x)), ' × ', H.n(n), ' ='), a: A.est(v), params: { x, n }, steps: [`${x} is ${fr} of ${fm(k)}.`, `${n} × ${fr} × ${fm(k)} ≈ ${fm(Math.round(v.num()))}`] }; }
      const a = r.int(21, 99), b = r.int(21, 99); const v = a * a * b; // a² × b
      return { p: H.cat(H.pow(a, 2), ' × ', H.n(b), ' ='), a: A.est(v), params: { a, b }, steps: [`${a}² = ${a * a}.`, `${a * a} × ${b} ≈ ${fm(a * a * round2(b))}`] };
    },
  });

  G({
    id: 'est4', trick: 'estimate', est: true, col: { ms: 4, hs: 4 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['pow', 'div', 'sqrtmul'] : ['pow', 'pi', 'sqrtmul', 'cube']);
      if (kd === 'pow') { const b = r.int(11, lv === 'ms' ? 19 : 29); const e = b < 20 ? 4 : 3; const v = b ** e;
        return { p: H.cat(H.pow(b, e), ' ='), a: A.est(v), params: { b, e }, steps: [e === 4 ? `${b}⁴ = (${b}²)² = ${b * b}².` : `${b}³ = ${b}² × ${b} = ${b * b} × ${b}.`, `≈ ${fm(v)}`] }; }
      if (kd === 'pi') { const n = r.pick([3, 4, 5]); const k = r.int(2, 9); const v = approxQ(k * Math.PI ** n);
        return { p: H.cat(`${k}`, H.pow(H.i('π'), n), ' ='), a: A.est(v), params: { k, n }, steps: [`π² ≈ 9.87 ≈ 10, π³ ≈ 31, π⁴ ≈ 97.4, π⁵ ≈ 306.`, `${k} × π^${n} ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'cube') { const n = r.int(1000, 99999); const v = approxQ(Math.cbrt(n)) ; const s = Math.floor(Math.cbrt(n) + 1e-9);
        const m = r.int(11, 99); const val = v.mul(m);
        return { p: H.cat(H.cbrt(H.n(n)), ' × ', H.n(m), ' ='), a: A.est(val), params: { n, m }, steps: [`${s}³ = ${fm(s ** 3)}, ${s + 1}³ = ${fm((s + 1) ** 3)}, so ∛${fm(n)} ≈ ${v.num().toFixed(1)}.`, `× ${m} ≈ ${fm(Math.round(val.num()))}`] }; }
      if (kd === 'div') { const a = r.int(10000, 99999), b = r.int(101, 999); const v = q(a, b);
        return { p: H.cat(H.n(a), ' ÷ ', H.n(b), ' ='), a: A.est(v), params: { a, b }, steps: [`${fm(a)} ÷ ${b} ≈ ${fm(a)} ÷ ${round2(b)}.`, `≈ ${Math.round(v.num())}`] }; }
      const n = r.int(200, 9999), m = r.int(11, 99); const v = approxQ(Math.sqrt(n) * m); const s = Math.round(Math.sqrt(n));
      return { p: H.cat(H.sqrt(H.n(n)), ' × ', H.n(m), ' ='), a: A.est(v), params: { n, m }, steps: [`√${fm(n)} ≈ ${Math.sqrt(n).toFixed(1)} (${s}² = ${fm(s * s)}).`, `× ${m} ≈ ${fm(Math.round(v.num()))}`] };
    },
  });
})();
