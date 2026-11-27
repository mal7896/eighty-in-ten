/* ===== algebra ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn;
  const sgn = (k, first = false) => k < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + ');
  // polynomial to markup; coeffs from highest degree
  function poly(cs, v = 'x') {
    const deg = cs.length - 1; let l = '', t = ''; let first = true;
    cs.forEach((c, i) => {
      const e = deg - i; if (c === 0) return;
      const a = Math.abs(c); const neg = c < 0;
      const coef = (a === 1 && e > 0) ? '' : String(a);
      const vp = e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`;
      l += (first ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + coef + vp;
      t += (neg ? '-' : first ? '' : '+') + (coef || (e ? '1' : '')) + (e ? `*${v}^${e}` : '');
      first = false;
    });
    if (first) { l = '0'; t = '0'; }
    return NS.H.L(l, t);
  }
  NS.poly = poly;
  const evalPoly = (cs, x) => cs.reduce((acc, c) => acc.mul(x).add(c), q(0));
  NS.evalPoly = evalPoly;

  /* ---------- substitution ---------- */
  G({
    id: 'subst', trick: 'substitution', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const a = r.int(1, 5) * r.sign(), b = r.int(-9, 9), c = r.int(-12, 12); const x = r.int(-6, 8);
      const v = evalPoly([a, b, c], q(x));
      return { p: H.cat(`If x = ${x}, then `, poly([a, b, c]), ' ='), a: A.num(v), params: { a, b, c, x },
        steps: [`${a}(${x})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${x}) ${c < 0 ? '−' : '+'} ${Math.abs(c)}`, `= ${a * x * x} ${b * x < 0 ? '−' : '+'} ${Math.abs(b * x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${hl(fm(v.n.toString()))}`] };
    },
  });

  /* ---------- simple equations ---------- */
  G({
    id: 'equation', trick: 'equations', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const x = r.int(-9, 15) || 4;
      if (r.chance(0.5)) {
        const a = r.int(2, 9), c = r.int(1, a - 1) || 1; const b = r.int(-15, 15), d = a * x + b - c * x;
        return { p: H.cat(`If ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c === 1 ? '' : c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}, then x =`), a: A.num(x), params: { a, b, c, d },
          steps: [`Move x terms left, numbers right: ${a - c}x = ${d - b}.`, `x = ${hl(x)}`] };
      }
      const den = r.pick([2, 3, 4, 5]); const num = r.int(1, den - 1) || 1; if (M.gcd(num, den) !== 1) return this.gen(r, lv);
      const X = den * r.int(-6, 9); const b = r.int(-12, 12); const rhs = num * X / den + b;
      return { p: H.cat('If ', H.frac(num, den), `x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${rhs}, then x =`), a: A.num(X), params: { num, den, b, rhs },
        steps: [`${num}/${den} x = ${rhs - b}.`, `x = ${rhs - b} × ${den}/${num} = ${hl(X)}`] };
    },
  });

  /* ---------- absolute value & inverses ---------- */
  G({
    id: 'absInv', trick: 'absInverse', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['abs', 'recip', 'addinv']);
      if (kd === 'abs') { const a = r.int(-15, 15), b = r.int(1, 20), c = r.int(-9, 9), d = r.int(1, 15);
        const v = Math.abs(a - b) - Math.abs(c - d);
        return { p: H.cat(H.abs(`${a} − ${b}`), ' − ', H.abs(`${c} − ${d}`), ' ='), a: A.num(v), params: { a, b, c, d }, steps: [`|${a - b}| = ${Math.abs(a - b)}, |${c - d}| = ${Math.abs(c - d)}.`, `${Math.abs(a - b)} − ${Math.abs(c - d)} = ${hl(v)}`] }; }
      let a, b; do { b = r.int(2, 9); a = r.int(1, 30); } while (M.gcd(a, b) !== 1 || a % b === 0);
      const x = q(a, b);
      if (kd === 'recip') return { p: H.cat('The multiplicative inverse of ', H.Qf(x), ' is'), a: A.num(q(b, a)), params: { a, b }, steps: [`Write it as an improper fraction: ${a}/${b}.`, `Flip it: ${hl(H.Qi(q(b, a)).h)}`] };
      return { p: H.cat('The additive inverse of ', H.Qf(x), ' is'), a: A.num(x.neg()), params: { a, b }, steps: [`The additive inverse is the opposite.`, `${hl(H.Qf(x.neg()).h)}`] };
    },
  });

  /* ---------- systems of equations ---------- */
  G({
    id: 'system', trick: 'systems', col: { ms: 3, hs: 2 },
    gen(r) {
      const x = r.int(1, 15), y = r.int(-8, 12); if (x === y) return this.gen(r);
      const kd = r.pick(['xy', 'x', 'sumsq']);
      const v = kd === 'xy' ? x * y : kd === 'x' ? x : x * x + y * y;
      const ask = kd === 'xy' ? 'xy =' : kd === 'x' ? 'x =' : 'x² + y² =';
      return { p: H.cat(`If x + y = ${x + y} and x − y = ${x - y}, then ${ask}`), a: A.num(v), params: { x, y, kd },
        steps: [`Add the equations: 2x = ${2 * x}, so x = ${x}. Then y = ${y}.`, kd === 'sumsq' ? `Or use x² + y² = ((x+y)² + (x−y)²)/2 = ${hl(v)}` : `Answer: ${hl(v)}`] };
    },
  });

  /* ---------- quadratic roots: sum, product, discriminant ---------- */
  G({
    id: 'roots', trick: 'roots', col: { ms: 4, hs: 3 },
    gen(r, lv) {
      if (lv === 'ms' || r.chance(0.3)) { // factorable, larger root
        const p1 = r.int(-9, 9), p2 = r.int(-9, 12); if (p1 === p2) return this.gen(r, lv);
        const b = -(p1 + p2), c = p1 * p2;
        return { p: H.cat('If ', poly([1, b, c]), ' = 0, the larger root is'), a: A.num(Math.max(p1, p2)), params: { b, c }, steps: [`Factor: two numbers that multiply to ${c} and add to ${-b}: ${p1} and ${p2}.`, `Roots ${p1} and ${p2}. Larger: ${hl(Math.max(p1, p2))}`] };
      }
      if (r.chance(0.2)) { const a = r.int(1, 4), b = r.int(-12, 12), c = r.int(-9, 9), d = r.int(-15, 15) || 6; const prod = r.chance(0.5); const v = prod ? q(-d, a) : q(-b, a);
        return { p: H.cat('For ', poly([a, b, c, d]), ` = 0, the ${prod ? 'product' : 'sum'} of the roots is`), a: A.num(v), params: { a, b, c, d, cubic: prod ? 'prod' : 'sum' }, steps: [prod ? `For a cubic, the product of the roots is ${NS.m('-\\frac da')} = ${-d}/${a}.` : `For a cubic, the sum of the roots is ${NS.m('-\\frac ba')} = ${-b}/${a}.`, `Answer: ${hl(H.Qf(v).h)}`] }; }
      const a = r.int(2, 6), b = r.int(-15, 15), c = r.int(-12, 12) || 5; const kd = r.pick(['sum', 'prod', 'disc', 'sumsq']);
      const s = q(-b, a), p = q(c, a);
      const v = kd === 'sum' ? s : kd === 'prod' ? p : kd === 'disc' ? q(b * b - 4 * a * c) : s.mul(s).sub(p.mul(2));
      const ask = { sum: 'the sum of the roots is', prod: 'the product of the roots is', disc: 'the discriminant is', sumsq: 'the sum of the squares of the roots is' }[kd];
      const st = { sum: [`Sum of the roots: ${NS.m('-\\frac ba')} = ${-b}/${a}.`], prod: [`Product of the roots: ${NS.m('\\frac ca')} = ${c}/${a}.`], disc: [`${NS.m('b^2 - 4ac')} = ${b * b} − 4(${a})(${c}).`], sumsq: [`${NS.m('r^2 + s^2 = (r+s)^2 - 2rs')}, with ${NS.m('r+s =')} ${H.Qf(s).h} and ${NS.m('rs =')} ${H.Qf(p).h}.`] }[kd];
      return { p: H.cat('For ', poly([a, b, c]), ` = 0, ${ask}`), a: A.num(v), params: { a, b, c, kd }, steps: [...st, `Answer: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- vertex of a parabola ---------- */
  G({
    id: 'vertex', trick: 'vertex', col: { ms: 4, hs: 3 },
    gen(r) {
      const a = r.int(1, 4) * r.sign(), h = r.int(-6, 6), k = r.int(-15, 15);
      const b = -2 * a * h, c = a * h * h + k; const kd = r.pick(['h', 'k', 'ext']);
      if (kd === 'h') return { p: H.cat('The x-coordinate of the vertex of y = ', poly([a, b, c]), ' is'), a: A.num(h), params: { a, b, c }, steps: [`${NS.m('x = -\\frac{b}{2a}')} = ${-b}/${2 * a}.`, `= ${hl(h)}`] };
      const word = a > 0 ? 'minimum' : 'maximum';
      return { p: H.cat(`The ${word} value of y = `, poly([a, b, c]), ' is'), a: A.num(k), params: { a, b, c }, steps: [`The vertex is at ${NS.m('x = -\\frac{b}{2a}')} = ${h}.`, `Plug in: y = ${a}(${h})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${h}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${hl(k)}`] };
    },
  });

  /* ---------- laws of exponents ---------- */
  G({
    id: 'exponents', trick: 'exponents', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = lv === 'ms' ? r.pick(['combine', 'solve']) : r.pick(['frac', 'combine', 'solve', 'neg']);
      if (kd === 'combine') { const b = r.pick([2, 3, 5]); const e1 = r.int(4, 12), e2 = r.int(3, 10), e3 = r.int(e1 + e2 - 5, e1 + e2 - 1);
        const v = q(b).pow(e1 + e2 - e3);
        return { p: H.cat(H.pow(b, e1), ' × ', H.pow(b, e2), ' ÷ ', H.pow(b, e3), ' ='), a: A.num(v), params: { b, e1, e2, e3 }, steps: [`Same base: add then subtract exponents: ${e1} + ${e2} − ${e3} = ${e1 + e2 - e3}.`, `${b}^${e1 + e2 - e3} = ${hl(fm(v.n.toString()))}`] }; }
      if (kd === 'solve') { const [b, base, k1] = r.pick([[4, 2, 2], [8, 2, 3], [9, 3, 2], [27, 3, 3], [25, 5, 2], [16, 2, 4]]); let e = r.int(2, 7); if (lv === 'ms') e = k1 * r.int(1, k1 === 2 ? 3 : 2); const tgt = base ** e;
        const v = q(e, k1); return { p: H.cat('If ', H.pow(b, 'x'), ` = ${fm(tgt)}, then x =`), a: A.num(v), params: { b, e, tgt }, steps: [`Write both as powers of ${base}: ${base}^(${k1}x) = ${base}^${e}.`, `${k1}x = ${e}, x = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'frac') { const [b, root] = r.pick([[8, 2], [27, 3], [16, 2], [32, 2], [64, 2], [125, 5], [81, 3], [64, 4]]); const n = Math.round(Math.log(b) / Math.log(root));
        const choices = [2, 3, 4, 5].filter(k => n % k === 0 || true); void choices;
        const den = r.pick([2, 3, 4, 5, 6].filter(k => n % k === 0)); const num = r.int(1, 4); if (!den) return this.gen(r, lv);
        const v = q(root).pow(n / den * num);
        return { p: H.cat(H.pow(b, H.raw(`${num}/${den}`, `${num}/${den}`)), ' ='), a: A.num(v), params: { b, num, den }, steps: [`Root first: the ${den === 2 ? 'square' : den === 3 ? 'cube' : den + 'th'} root of ${b} is ${root ** (n / den)}.`, `Then power ${num}: ${hl(fm(v.n.toString()))}`] }; }
      const [b, root, n] = r.pick([[8, 2, 3], [27, 3, 3], [16, 4, 2], [4, 2, 2], [9, 3, 2], [32, 2, 5], [125, 5, 3]]); const num = r.pick([1, 2]); const v = q(1).div(q(root).pow(num));
      return { p: H.cat(H.pow(b, H.raw(`−${num}/${n}`, `-${num}/${n}`)), ' ='), a: A.num(v), params: { b, num, n }, steps: [`Negative exponent means reciprocal. Root: ${root}. Power ${num}: ${root ** num}.`, `Reciprocal: ${hl(H.Qi(v).h)}`] };
    },
  });

  /* ---------- logarithms ---------- */
  G({
    id: 'logs', trick: 'logs', col: { ms: 4, hs: 3 }, w: 0.8,
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['eval', 'solve', 'sum', 'combo', 'combo'] : ['eval', 'frac', 'solve', 'sum', 'combo']);
      const L = b => H.L(`\\log_{${b}}`);
      if (kd === 'combo') { // log_b x + log_b y − log_b z with xy/z a power of b
        const b = r.pick([2, 3, 5, 6]); let x, y, z, e; do { e = r.int(1, 3); z = r.int(2, 12); const P = z * b ** e; const ds = M.divisors(P).filter(d => d > 1 && d < P && d <= 60 && P / d <= 99); if (!ds.length) { x = 0; continue; } x = r.pick(ds); y = P / x; } while (!x || x === z || y === z || x === b || y === b);
        return { p: H.cat(L(b), ` ${x} + `, L(b), ` ${y} − `, L(b), ` ${z} =`), a: A.num(e), params: { b, xs: [x, y, z] }, steps: [`Adding logs multiplies, subtracting divides: ${NS.m(`\\log_{${b}} \\frac{${x} \\cdot ${y}}{${z}} = \\log_{${b}} ${x * y / z}`)}.`, `${x * y / z} = ${b}^${e}, so the answer is ${hl(e)}`] }; }
      if (kd === 'eval') { const b = r.pick([2, 3, 4, 5, 7]); const e = r.int(2, b === 2 ? 9 : 4); return { p: H.cat(L(b), ` ${fm(b ** e)} =`), a: A.num(e), params: { b, e }, steps: [`${b} to what power is ${fm(b ** e)}?`, `${b}^${e} = ${fm(b ** e)}, so the answer is ${hl(e)}`] }; }
      if (kd === 'frac') { const [b, x, v] = r.pick([[4, 8, q(3, 2)], [8, 4, q(2, 3)], [9, 27, q(3, 2)], [27, 9, q(2, 3)], [16, 8, q(3, 4)], [8, 16, q(4, 3)], [32, 8, q(3, 5)], [4, 32, q(5, 2)]]);
        return { p: H.cat(L(b), ` ${x} =`), a: A.num(v), params: { b, x }, steps: [`Write both as powers of a common base.`, `${b}^(${H.Qi(v).h}) = ${x}, so the answer is ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'solve') { const b = r.pick([2, 3, 5, 6]); const e = r.int(2, 4); return { p: H.cat('If ', L(b), ` x = ${e}, then x =`), a: A.num(b ** e), params: { b, e }, steps: [`Rewrite: x = ${b}^${e}.`, `x = ${hl(b ** e)}`] }; }
      const [x, y] = r.pick([[25, 4], [50, 2], [20, 5], [125, 8], [250, 4], [2, 500], [40, 25]]); const v = Math.round(Math.log10(x * y));
      return { p: H.cat(`log ${x} + log ${y} =`), a: A.num(v), params: { x, y }, steps: [`${NS.m('\\log a + \\log b = \\log ab')}, so this is log ${x * y}.`, `= ${hl(v)}`] };
    },
  });

  /* ---------- complex numbers ---------- */
  const cx = (a, b) => { // format a + bi
    if (b === 0) return String(a); const bs = Math.abs(b) === 1 ? 'i' : `${Math.abs(b)}i`;
    if (a === 0) return (b < 0 ? '-' : '') + bs; return `${a}${b < 0 ? '-' : '+'}${bs}`;
  };
  NS.cx = cx;
  const cxd = (a, b) => cx(a, b).replace(/(\d)([+-])/, '$1 $2 ').replace(/-/g, '−');
  G({
    id: 'complex', trick: 'complex', col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['ipow', 'mult', 'mod', 'conj']);
      if (kd === 'ipow') { const n = r.int(10, 99); const v = ['1', 'i', '-1', '-i'][n % 4]; return { p: H.cat(H.pow(H.i('i'), n), ' ='), a: A.text(v, 'complex'), params: { n }, steps: [`Powers of i repeat every 4: i, −1, −i, 1.`, `${n} ÷ 4 leaves ${n % 4}, so i^${n} = i^${n % 4} = ${hl(v.replace('-', '−'))}`] }; }
      const a = r.int(-6, 7), b = r.int(-6, 6) || 2, c = r.int(-5, 7) || 3, d = r.int(-6, 6) || -1;
      if (kd === 'mult') { const re = a * c - b * d, im = a * d + b * c; const v = cx(re, im);
        return { p: H.cat(`(${cxd(a, b)})(${cxd(c, d)}) =`), a: A.text(v, 'complex'), params: { a, b, c, d }, steps: [`FOIL, then i² = −1.`, `Real part: (${a})(${c}) − (${b})(${d}) = ${re}. Imaginary part: (${a})(${d}) + (${b})(${c}) = ${im}.`, `Answer: ${hl(v.replace(/-/g, '−'))}`] }; }
      if (kd === 'mod') { const [x, y, z] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25], [9, 12, 15]]); const sx = r.sign(), sy = r.sign();
        return { p: H.cat(H.abs(cxd(sx * x, sy * y)), ' ='), a: A.num(z), params: { x, y }, steps: [`${NS.m('|a+bi| = \\sqrt{a^2+b^2}')} = √(${x * x} + ${y * y}).`, `= ${hl(z)}`] }; }
      const v = a * a + b * b; return { p: H.cat(`(${cxd(a, b)})(${cxd(a, -b)}) =`), a: A.num(v), params: { a, b }, steps: [`${NS.m('(a+bi)(a-bi) = a^2 + b^2')}.`, `${a * a} + ${b * b} = ${hl(v)}`] };
    },
  });

  /* ---------- binomial expansion ---------- */
  G({
    id: 'binomial', trick: 'binomial', col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['coef', 'sum', 'terms']);
      const n = r.int(4, 7), a = r.int(1, 3), b = r.int(1, 4) * r.sign();
      const bt = `(${a === 1 ? '' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`;
      if (kd === 'coef') { const k = r.int(1, n - 1); const v = M.C(n, k) * a ** k * b ** (n - k);
        return { p: H.cat('The coefficient of ', H.pow('x', k), ' in the expansion of ', H.pow(bt, n), ' is'), a: A.num(v), params: { n, a, b, k }, steps: [`The term is ${NS.m(`\\binom{${n}}{${k}}(${a}x)^{${k}}(${b})^{${n - k}}`)}.`, `${M.C(n, k)} × ${a ** k} × ${b ** (n - k)} = ${hl(fm(v))}`] }; }
      if (kd === 'sum') { const v = (a + b) ** n; return { p: H.cat('The sum of the coefficients of ', H.pow(bt, n), ' is'), a: A.num(v), params: { n, a, b }, steps: [`Set x = 1: (${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)})^${n}.`, `${a + b}^${n} = ${hl(fm(v))}`] }; }
      return { p: H.cat('The number of terms in the expansion of ', H.pow(bt, n + 3), ' is'), a: A.num(n + 4), params: { n }, steps: [`(x + y)^n has n + 1 terms.`, `${n + 3} + 1 = ${hl(n + 4)}`] };
    },
  });

  /* ---------- direct & inverse variation ---------- */
  G({
    id: 'variation', trick: 'variation', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const inv = r.chance(0.5); const x1 = r.int(2, 12), y1 = r.int(2, 15); const x2 = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20].filter(t => t !== x1));
      const v = inv ? q(x1 * y1, x2) : q(y1 * x2, x1);
      return { p: H.cat(`y varies ${inv ? 'inversely' : 'directly'} as x. If y = ${y1} when x = ${x1}, then when x = ${x2}, y =`), a: A.num(v), params: { inv, x1, y1, x2 },
        steps: [inv ? `Inverse: xy stays the same: ${x1} × ${y1} = ${x1 * y1}.` : `Direct: y/x stays the same: ${y1}/${x1}.`, inv ? `y = ${x1 * y1} ÷ ${x2} = ${hl(H.Qf(v).h)}` : `y = ${y1}/${x1} × ${x2} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- inequalities ---------- */
  G({
    id: 'ineq', trick: 'inequalities', col: { ms: 3, hs: 3 },
    gen(r) {
      if (r.chance(0.5)) { const a = r.int(2, 9), b = r.int(1, 12) * r.sign(), c = r.int(-10, 40); const lim = q(c - b, a);
        const largest = lim.isInt() ? Number(lim.n) - 1 : Math.floor(lim.num());
        return { p: H.cat(`The largest integer x with ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} < ${c} is`), a: A.num(largest), params: { a, b, c }, steps: [`${a}x < ${c - b}, so x < ${H.Qf(lim).h}.`, `Largest integer: ${hl(largest)}`] }; }
      let h = r.int(-5, 8); if (!h) h = 3; const k = r.int(2, 9); const strict = r.chance(0.5); const n = strict ? 2 * k - 1 : 2 * k + 1;
      return { p: H.cat(`How many integers satisfy |x ${h < 0 ? '+' : '−'} ${Math.abs(h)}| ${strict ? '<' : '≤'} ${k}?`), a: A.num(n), params: { h, k, strict }, steps: [`${h - k} ${strict ? '<' : '≤'} x ${strict ? '<' : '≤'} ${h + k}.`, `Count: ${hl(n)}`] };
    },
  });

  /* ---------- functions: composite & inverse ---------- */
  G({
    id: 'functions', trick: 'functions', col: { ms: 0, hs: 4 },
    gen(r) {
      const a = r.int(2, 6), b = r.int(-9, 9), c = r.int(1, 3), d = r.int(-5, 5); const x = r.int(-3, 4);
      const f = H.L(`f(x) = ${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`);
      if (r.chance(0.5)) { const g = c * x * x + d; const v = a * g + b;
        return { p: H.cat(f, ' and ', H.L(`g(x) = ${c === 1 ? '' : c}x^2 ${d < 0 ? '-' : '+'} ${Math.abs(d)}`), '. Then ', H.L(`f(g(${x})) =`)), a: A.num(v), params: { a, b, c, d, x }, steps: [`Inside first: g(${x}) = ${g}.`, `f(${g}) = ${a}(${g}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${hl(v)}`] }; }
      if (r.chance(0.3)) { const m = r.int(2, 6), k = r.int(1, 12) * m + r.pick([0, 0, 1, 2]); const v = q(k, m);
        return { p: H.cat('The domain of f(x) = ', H.sqrt(`${k} − ${m}x`), ' is x ≤ k. k ='), a: A.num(v), params: { m, k, dom: 1 }, steps: [`The inside of a square root can't be negative: ${k} − ${m}x ≥ 0.`, `x ≤ ${k}/${m}, so k = ${hl(H.Qf(v).h)}`] }; }
      const y = a * x + b;
      return { p: H.cat(f, '. If ', H.L('f^{-1}'), ' is the inverse of ', H.L('f'), ', then ', H.L(`f^{-1}(${y}) =`)), a: A.num(x), params: { a, b, y }, steps: [`f⁻¹(${y}) is the x with f(x) = ${y}.`, `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${y}, so x = ${hl(x)}`] };
    },
  });
})();
