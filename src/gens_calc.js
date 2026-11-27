/* ===== high school columns 3–4: trig, matrices, vectors, calculus ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn; const poly = NS.poly, evalPoly = NS.evalPoly;

  /* ---------- trig ---------- */
  const SIN = { 0: q(0), 30: q(1, 2), 90: q(1), 150: q(1, 2), 180: q(0), 210: q(-1, 2), 270: q(-1), 330: q(-1, 2), 360: q(0) };
  const COS = { 0: q(1), 60: q(1, 2), 90: q(0), 120: q(-1, 2), 180: q(-1), 240: q(-1, 2), 270: q(0), 300: q(1, 2), 360: q(1) };
  const TAN = { 0: q(0), 45: q(1), 135: q(-1), 180: q(0), 225: q(1), 315: q(-1) };
  G({
    id: 'trig', trick: 'trig', col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['val', 'val', 'pyth', 'rad', 'period', 'prod']);
      if (kd === 'val') {
        const f = r.pick(['sin', 'cos', 'tan']); const tbl = { sin: SIN, cos: COS, tan: TAN }[f]; const angs = Object.keys(tbl).map(Number);
        const a1 = r.pick(angs), f2 = r.pick(['sin', 'cos']), t2 = { sin: SIN, cos: COS }[f2]; const a2 = r.pick(Object.keys(t2).map(Number));
        const v = tbl[a1].add(t2[a2]);
        return { p: H.cat(`${f} ${a1}° + ${f2} ${a2}° =`), a: A.num(v), params: { f, a1, f2, a2 }, steps: [`${f} ${a1}° = ${H.Qf(tbl[a1]).h}; ${f2} ${a2}° = ${H.Qf(t2[a2]).h}.`, `Sum: ${hl(H.Qf(v).h)}`] };
      }
      if (kd === 'pyth') { const a = r.int(5, 85), k = r.int(2, 9); return { p: H.L(`${k}\\sin^2 ${a}^\\circ + ${k}\\cos^2 ${a}^\\circ =`), a: A.num(k), params: { a, k }, steps: [`sin²θ + cos²θ = 1 for any angle.`, `${k} × 1 = ${hl(k)}`] }; }
      if (kd === 'rad') { const d = r.pick([15, 30, 36, 40, 45, 60, 72, 75, 105, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]); const v = q(d, 180); return { p: H.cat(`${d}° = kπ radians. k =`), a: A.num(v), params: { d }, steps: [`Multiply by π/180: k = ${d}/180.`, `= ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'period') { const amp = r.int(2, 9), b = r.int(2, 8); const f = r.pick(['sin', 'cos']); const v = q(2, b); return { p: H.cat(`The period of y = ${amp} ${f}(${b}x) is kπ. k =`), a: A.num(v), params: { b }, steps: [`Period = 2π ÷ ${b}.`, `k = 2/${b} = ${hl(H.Qi(v).h)}`] }; }
      const a = r.pick([30, 150, 210, 330]), b = r.pick([60, 120, 240, 300]); const v = SIN[a].mul(COS[b]);
      return { p: H.cat(`sin ${a}° × cos ${b}° =`), a: A.num(v), params: { a, b }, steps: [`sin ${a}° = ${H.Qf(SIN[a]).h}, cos ${b}° = ${H.Qf(COS[b]).h}.`, `Product: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- determinants & matrices ---------- */
  const mat = rows => H.L(`\\begin{vmatrix} ${rows.map(r => r.join(' & ')).join(' \\\\ ')} \\end{vmatrix}`);
  const bmat = rows => H.L(`\\begin{bmatrix} ${rows.map(r => r.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`);
  G({
    id: 'matrix', trick: 'matrices', col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['d2', 'd2', 'd3', 'prod']);
      if (kd === 'd2') { const [a, b, c, d] = [r.int(-9, 9), r.int(-9, 9), r.int(-9, 9), r.int(-9, 9)]; const v = a * d - b * c;
        return { p: H.cat(mat([[a, b], [c, d]]), ' ='), a: A.num(v), params: { a, b, c, d }, steps: [`${NS.m('ad - bc')} = (${a})(${d}) − (${b})(${c}).`, `${a * d} − ${b * c} = ${hl(v)}`] }; }
      if (kd === 'd3') { const m = [[r.int(1, 4), r.int(0, 3), r.int(0, 2)], [0, r.int(1, 5), r.int(-3, 3)], [0, 0, r.int(1, 4)]]; if (r.chance(0.5)) { m[1][0] = 0; m[2][0] = 0; m[2][1] = 0; }
        const v = m[0][0] * m[1][1] * m[2][2];
        return { p: H.cat(mat(m), ' ='), a: A.num(v), params: { m }, steps: [`Everything below the main diagonal is 0 (triangular), so the determinant is the product of the diagonal.`, `${m[0][0]} × ${m[1][1]} × ${m[2][2]} = ${hl(v)}`] }; }
      const A1 = [[r.int(-3, 5), r.int(-3, 5)], [r.int(-3, 5), r.int(-3, 5)]], B1 = [[r.int(-3, 5), r.int(-3, 5)], [r.int(-3, 5), r.int(-3, 5)]];
      const i = r.int(0, 1), j = r.int(0, 1); const v = A1[i][0] * B1[0][j] + A1[i][1] * B1[1][j];
      const pos = ['first', 'second'];
      return { p: H.cat(H.L(`M = ${bmat(A1).l}${bmat(B1).l}`), `. The entry in row ${i + 1}, column ${j + 1} of `, H.L('M'), ' is'), a: A.num(v), params: { A1, B1, i, j }, steps: [`Row ${i + 1} of the first dotted with column ${j + 1} of the second.`, `(${A1[i][0]})(${B1[0][j]}) + (${A1[i][1]})(${B1[1][j]}) = ${hl(v)}`] };
    },
  });

  /* ---------- vectors & polar ---------- */
  G({
    id: 'vectors', trick: 'vectors', col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['dot', 'mag', 'polar', 'rect']);
      if (kd === 'dot') { const a = r.int(-6, 9), b = r.int(-6, 9), c = r.int(-6, 9), d = r.int(-6, 9); const v = a * c + b * d;
        return { p: H.cat(`⟨${a}, ${b}⟩ · ⟨${c}, ${d}⟩ =`.replace(/-/g, '−')), a: A.num(v), params: { a, b, c, d }, steps: [`Multiply matching parts and add: (${a})(${c}) + (${b})(${d}).`, `= ${hl(v)}`] }; }
      const [x, y, z] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25], [9, 40, 41]]);
      if (kd === 'mag') { const sx = r.sign(), sy = r.sign(); return { p: H.cat(`The magnitude of ⟨${sx * x}, ${sy * y}⟩ is`.replace(/-/g, '−')), a: A.num(z), params: { x, y }, steps: [`√(${x}² + ${y}²). It is ${NS.an(x)} ${x}–${y}–${z} triple.`, `= ${hl(z)}`] }; }
      if (kd === 'polar') { const sx = r.sign(), sy = r.sign(); return { p: H.cat(`Let (${sx * x}, ${sy * y}) be the rectangular coordinates for the polar coordinates (r, θ), r > 0. r =`.replace(/-/g, '−')), a: A.num(z), params: { x, y }, steps: [`r = √(x² + y²).`, `= ${hl(z)}`] }; }
      const rr = 2 * r.int(1, 9); const th = r.pick([60, 120, 240, 300, 30, 150, 210, 330]); const useX = [60, 120, 240, 300].includes(th); const cs = useX ? { 60: q(1, 2), 120: q(-1, 2), 240: q(-1, 2), 300: q(1, 2) }[th] : { 30: q(1, 2), 150: q(1, 2), 210: q(-1, 2), 330: q(-1, 2) }[th];
      const v = cs.mul(rr);
      return { p: H.cat(`Let (x, y) be the rectangular coordinates for the polar coordinates (${rr}, ${th}°). ${useX ? 'x' : 'y'} =`), a: A.num(v), params: { rr, th }, steps: [`${useX ? 'x = r cos θ' : 'y = r sin θ'} = ${rr} × ${H.Qf(cs).h}.`, `= ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- greatest integer ---------- */
  G({
    id: 'gint', trick: 'greatestInt', col: { ms: 0, hs: 4 },
    gen(r) {
      const a = (r.int(-99, 99) / 10) || 2.3, b = (r.int(-99, 99) / 10) || -1.4;
      const fa = Math.floor(a), fb = Math.floor(b); const v = fa + fb;
      const fmt = x => String(x).replace('-', '−');
      return { p: H.cat(H.floor(fmt(a)), ' + ', H.floor(fmt(b)), ' ='), a: A.num(v), params: { a, b }, steps: [`⟦x⟧ is the greatest integer ≤ x. For negatives that means going down: ⟦${fmt(a)}⟧ = ${fmt(fa)}, ⟦${fmt(b)}⟧ = ${fmt(fb)}.`, `Sum: ${hl(fmt(v))}`] };
    },
  });

  /* ---------- limits ---------- */
  G({
    id: 'limits', trick: 'limits', col: { ms: 0, hs: 4 },
    gen(r) {
      const lim = (to, body) => H.cat(H.L(`\\lim_{x \\to ${to === '∞' ? '\\infty' : to}}`), body);
      if (r.chance(0.5)) { const a = r.int(1, 9), b = r.int(-9, 9), c = r.int(1, 9), d = r.int(-9, 9), e = r.int(-9, 9); const v = q(a, c);
        return { p: H.cat(lim('∞', H.frac(poly([a, b, d]), poly([c, e, r.int(1, 9)]))), ' ='), a: A.num(v), params: { a, c }, steps: [`Same degree on top and bottom: the limit is the ratio of leading coefficients.`, `${a}/${c} = ${hl(H.Qf(v).h)}`] }; }
      const k = r.int(-6, 7) || 3, m = r.int(-5, 9); const v = k + m; // (x - k)(x + m)/(x - k)
      const top = poly([1, m - k, -k * m]); const bot = poly([1, -k]);
      return { p: H.cat(lim(k, H.frac(top, bot)), ' ='), a: A.num(v), params: { k, m }, steps: [`Factor the top: (x ${-k < 0 ? '−' : '+'} ${Math.abs(k)})(x ${m < 0 ? '−' : '+'} ${Math.abs(m)}). Cancel the (x ${-k < 0 ? '−' : '+'} ${Math.abs(k)}).`, `Plug in x = ${k}: ${k} ${m < 0 ? '−' : '+'} ${Math.abs(m)} = ${hl(v)}`] };
    },
  });

  /* ---------- derivatives & tangent slopes ---------- */
  const deriv = cs => { const n = cs.length - 1; return cs.slice(0, -1).map((c, i) => c * (n - i)); };
  NS.deriv = deriv;
  G({
    id: 'deriv', trick: 'derivatives', col: { ms: 0, hs: 4 },
    gen(r) {
      const deg = r.int(2, 4); const cs = Array.from({ length: deg + 1 }, (_, i) => i === 0 ? r.int(1, 5) * r.sign() : r.int(-9, 9));
      const x = r.pick([-2, -1, 1, 2, 3]); const d1 = deriv(cs);
      const kd = r.pick(['fp', 'tangent', 'fpp']);
      if (kd === 'fpp') { const d2 = deriv(d1); const v = evalPoly(d2, q(x)); return { p: H.cat('If f(x) = ', poly(cs), `, then f″(${x}) =`), a: A.num(v), params: { cs, x }, steps: [`f′(x) = ${poly(d1).h}; f″(x) = ${poly(d2).h}.`, `f″(${x}) = ${hl(fm(v.n.toString()))}`] }; }
      const v = evalPoly(d1, q(x));
      if (kd === 'tangent') return { p: H.cat('The slope of the line tangent to y = ', poly(cs), ` at x = ${x} is`), a: A.num(v), params: { cs, x }, steps: [`Slope = y′(${x}). Power rule: y′ = ${poly(d1).h}.`, `y′(${x}) = ${hl(fm(v.n.toString()))}`] };
      return { p: H.cat('If f(x) = ', poly(cs), `, then f′(${x}) =`), a: A.num(v), params: { cs, x }, steps: [`Power rule: f′(x) = ${poly(d1).h}.`, `f′(${x}) = ${hl(fm(v.n.toString()))}`] };
    },
  });

  /* ---------- definite integrals ---------- */
  G({
    id: 'integral', trick: 'integrals', col: { ms: 0, hs: 4 },
    gen(r) {
      const deg = r.int(1, 3); const cs = Array.from({ length: deg + 1 }, (_, i) => (i === 0 ? (deg + 1) * r.int(1, 3) : (deg + 1 - i) * r.int(-3, 3)) * (i === 0 ? r.sign() : 1));
      const lo = r.int(-1, 1), hi = lo + r.int(1, 3);
      const anti = x => cs.reduce((acc, c, i) => { const e = deg - i + 1; return acc.add(q(c, e).mul(q(x).pow(e))); }, q(0));
      const v = anti(hi).sub(anti(lo));
      const F = cs.map((c, i) => { const e = deg - i + 1; const co = q(c, e); return co.isInt() ? Number(co.n) : null; });
      const Fstr = F.every(x => x !== null) ? poly([...F, 0]).h : 'the antiderivative';
      return { p: H.L(`\\int_{${lo}}^{${hi}} \\left(${poly(cs).l}\\right)\\,dx =`), a: A.num(v), params: { cs, lo, hi }, steps: [`Antiderivative: ${Fstr}.`, `Evaluate at ${hi} and ${lo}, subtract: ${H.Qf(anti(hi)).h} − (${H.Qf(anti(lo)).h}) = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- critical values & extrema ---------- */
  G({
    id: 'critical', trick: 'critical', col: { ms: 0, hs: 4 },
    gen(r) {
      const a = r.int(1, 4); const p = r.int(1, 5); // f = a x^3 - 3a p^2 x + c : f' = 3a(x^2 - p^2)
      const c = r.int(-9, 9); const cs = [a, 0, -3 * a * p * p, c];
      const kd = r.pick(['min', 'max', 'val']);
      if (kd === 'val') { const v = evalPoly(cs, q(p)); return { p: H.cat('The local minimum value of f(x) = ', poly(cs), ' is'), a: A.num(v), params: { cs }, steps: [`f′(x) = ${3 * a}x² − ${3 * a * p * p} = 0 at x = ±${p}. The min is at x = ${p} (leading coefficient positive).`, `f(${p}) = ${hl(fm(v.n.toString()))}`] }; }
      return { p: H.cat(`f(x) = `, poly(cs), ` has a local ${kd === 'min' ? 'minimum' : 'maximum'} at x =`), a: A.num(kd === 'min' ? p : -p), params: { cs, kd }, steps: [`f′(x) = ${3 * a}(x² − ${p * p}) = 0 at x = ±${p}.`, `Cubic with positive leading coefficient: max on the left, min on the right. x = ${hl(kd === 'min' ? p : -p)}`] };
    },
  });

  /* ---------- asymptotes ---------- */
  G({
    id: 'asymptote', trick: 'asymptotes', col: { ms: 0, hs: 4 },
    gen(r) {
      const a = r.int(1, 9), b = r.int(-9, 9), c = r.int(1, 9) * r.sign(), d = r.int(-12, 12);
      if (r.chance(0.5)) { const v = q(a, c); return { p: H.cat('The horizontal asymptote of y = ', H.frac(poly([a, 0, b]), poly([c, 0, d || 1])), ' is y ='), a: A.num(v), params: { a, c }, steps: [`Equal degrees: y = ratio of leading coefficients.`, `y = ${hl(H.Qf(v).h)}`] }; }
      const k = r.int(-9, 9) || 2; const m = r.int(1, 5); let b2 = b; if (q(-b2).eq(q(k, m))) b2 += 1; const top = poly([1, b2]);
      const v = q(k, m);
      return { p: H.cat('The vertical asymptote of y = ', H.frac(top, poly([m, -k])), ' is x ='), a: A.num(v), params: { k, m, b }, steps: [`Set the bottom to 0: ${m === 1 ? '' : m}x = ${k}.`, `x = ${hl(H.Qf(v).h)}`] };
    },
  });
})();

/* ---------- remainder theorem ---------- */
(function () {
  const { H, ans: A, q, G } = NS; const hl = NS.hl, fm = NS.fmtn;
  G({
    id: 'remThm', trick: 'remainderThm', col: { ms: 0, hs: 4 },
    gen(r) {
      const cs = [r.int(1, 3) * r.sign(), r.int(-6, 6), r.int(-9, 9), r.int(-12, 12)]; const a = r.pick([-3, -2, -1, 1, 2, 3]);
      const v = NS.evalPoly(cs, q(a));
      return { p: H.cat('The remainder when ', NS.poly(cs), ` is divided by x ${a < 0 ? '+' : '−'} ${Math.abs(a)} is`), a: A.num(v), params: { cs, a },
        steps: [`Remainder theorem: dividing by x ${a < 0 ? '+' : '−'} ${Math.abs(a)} leaves f(${a}).`, `f(${a}) = ${cs.map((c, i) => c * a ** (3 - i)).map((t, i) => (i === 0 ? (t < 0 ? '−' : '') : (t < 0 ? ' − ' : ' + ')) + Math.abs(t)).join('')}`, `= ${hl(fm(v.n.toString()))}`] };
    },
  });
})();
