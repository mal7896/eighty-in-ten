/* ===== fractions, decimals, percents, everyday arithmetic ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn; const $m = x => Number(x.num()).toFixed(2);

  /* ---------- fraction / decimal / percent table ---------- */
  const TABLE = {
    ms: [[1, 8], [3, 8], [5, 8], [7, 8], [1, 6], [5, 6], [1, 3], [2, 3], [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9], [1, 12], [5, 12], [7, 12], [11, 12], [1, 16], [3, 16], [5, 16], [1, 11], [2, 11], [3, 11]],
    hs: [[3, 8], [5, 8], [7, 8], [5, 6], [2, 9], [4, 9], [7, 9], [5, 12], [7, 12], [11, 12], [3, 16], [5, 16], [7, 16], [9, 16], [11, 16], [13, 16], [15, 16], [2, 11], [3, 11], [5, 11], [7, 11], [9, 11], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [3, 14], [5, 14], [1, 13]],
  };
  const unit = b => ({ 8: '1/8 = 12.5%', 6: '1/6 = 16 2/3%', 3: '1/3 = 33 1/3%', 9: '1/9 = 11 1/9%', 12: '1/12 = 8 1/3%', 16: '1/16 = 6.25%', 11: '1/11 = 9 1/11%', 7: '1/7 = 14 2/7%', 14: '1/14 = 7 1/7%', 13: '1/13 = 7 9/13%' }[b]);
  G({
    id: 'fdp', trick: 'fdpTable', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(['f2p', 'f2p', 'p2f', 'f2d', 'f2d40', 'd2f']);
      if (kd === 'f2d40') {
        const den = lv === 'ms' ? r.pick([40, 20, 25, 50]) : r.pick([40, 80, 16, 125]);
        let a; do { a = r.int(1, den * 1.6); } while (M.gcd(a, den) !== 1);
        const v = q(a, den);
        const how = den === 40 ? `÷ 4 gives ${H.dec(q(a, 4)).h}, then one more place left` : den === 80 ? `÷ 8 gives ${H.dec(q(a, 8)).h}, then one more place left` : den === 20 ? `×5 over 100: ${a * 5}/100` : den === 25 ? `×4 over 100: ${a * 4}/100` : den === 50 ? `×2 over 100: ${a * 2}/100` : den === 16 ? `half of ${H.dec(q(a, 8)).h}` : `×8 over 1000: ${a * 8}/1000`;
        return { p: H.cat(H.frac(a, den), ' ='), a: A.num(v, 'dec'), form: '(decimal)', params: { a, den }, steps: [`${a}/${den}: ${how}.`, `Answer: ${hl(H.dec(v).h)}`] };
      }
      const [a, b] = r.pick(TABLE[lv]);
      const f = q(a, b), pct = f.mul(100);
      if (kd === 'f2p') return { p: H.cat(H.frac(a, b), ' ='), suffix: '%', a: A.num(pct), params: { a, b }, steps: [`Know the unit fraction: ${unit(b)}.`, `${a} of them: ${a} × that = ${hl(H.Qf(pct).h)}%`] };
      if (kd === 'p2f') {
        const ps = pct.terminates() ? H.dec(pct) : H.Qf(pct);
        return { p: H.cat(ps, '% ='), a: A.num(f, 'frac'), form: '(common fraction)', params: { a, b }, steps: [`${unit(b)}.`, `${H.Qf(pct).h}% is ${a} of those, so it is ${hl(H.frac(a, b).h)}`] };
      }
      if (kd === 'f2d' && f.terminates()) return { p: H.cat(H.frac(a, b), ' ='), a: A.num(f, 'dec'), form: '(decimal)', params: { a, b }, steps: [`${unit(b)}, so ${a}/${b} = ${H.dec(pct).h}% = ${hl(H.dec(f).h)}`] };
      // decimal → fraction
      const [c, d] = r.pick([[1, 8], [3, 8], [5, 8], [7, 8], [3, 16], [5, 16], [7, 16], [9, 16], [1, 16], [3, 40], [7, 40], [9, 40], [11, 40], [3, 80], [13, 20], [17, 25]]);
      const v = q(c, d);
      return { p: H.cat(H.dec(v), ' ='), a: A.num(v, 'frac'), form: '(common fraction)', params: { c, d }, steps: [`Recognize it from the table, or write it over a power of 10 and reduce.`, `${H.dec(v).h} = ${hl(H.frac(c, d).h)}`] };
    },
  });

  /* ---------- adding / subtracting fractions & mixed numbers ---------- */
  G({
    id: 'fracOps', trick: 'fracAdd', col: { ms: 1, hs: 1 }, eval: true,
    gen(r, lv) {
      if (r.chance(0.5)) { // switch and negate
        let b, d; do { b = r.pick([3, 4, 5, 6, 8, 9, 10, 12]); d = r.pick([2, 3, 4, 6, 8, 12, 5, 10]); } while (M.lcm(b, d) > (lv === 'ms' ? 24 : 40) || b === d && r.chance(0.5));
        const a = r.int(1, b - 1), c = r.int(1, d - 1);
        if (M.gcd(a, b) !== 1 || M.gcd(c, d) !== 1) return this.gen(r, lv);
        const w1 = r.int(1, 9), w2 = w1 + r.int(2, 8);
        const x = q(w1 * b + a, b), y = q(w2 * d + c, d); const v = x.sub(y);
        return { p: H.cat(H.mixed(w1, a, b), ' − ', H.mixed(w2, c, d), ' ='), a: A.num(v), params: { w1, a, b, w2, c, d },
          steps: [`The answer will be negative. Flip it: find ${w2} ${c}/${d} − ${w1} ${a}/${b}, then make it negative.`, `Common denominator ${M.lcm(b, d)}: ${H.Qf(y).h} − ${H.Qf(x).h} = ${H.Qf(v.neg()).h}`, `Answer: ${hl(H.Qf(v).h)}`] };
      }
      let b, d; do { b = r.int(2, 12); d = r.int(2, 12); } while (b === d || M.lcm(b, d) > (lv === 'ms' ? 36 : 60));
      let a = r.int(1, b - 1), c = r.int(1, d - 1); while (M.gcd(a, b) !== 1) a = r.int(1, b - 1); while (M.gcd(c, d) !== 1) c = r.int(1, d - 1);
      const plus = r.chance(0.6); const v = plus ? q(a, b).add(q(c, d)) : q(a, b).sub(q(c, d)); const L = M.lcm(b, d);
      return { p: H.cat(H.frac(a, b), plus ? ' + ' : ' − ', H.frac(c, d), ' ='), a: A.num(v), params: { a, b, c, d, plus },
        steps: [`Common denominator ${L}: ${a * L / b}/${L} ${plus ? '+' : '−'} ${c * L / d}/${L} = ${plus ? a * L / b + c * L / d : a * L / b - c * L / d}/${L}.`, `Reduce if you can: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- a/b + b/a ---------- */
  G({
    id: 'abba', trick: 'aOverB', col: { ms: 3, hs: 2 }, eval: true,
    gen(r, lv) {
      let a, b; do { a = r.int(2, lv === 'ms' ? 12 : 19); b = a + r.int(1, 4); } while (M.gcd(a, b) !== 1);
      if (r.chance(0.5)) [a, b] = [b, a];
      const lo = Math.min(a, b), hi = Math.max(a, b), gap = hi - lo;
      const kd = lv === 'ms' ? r.pick(['sum', 'sum', 'm2']) : r.pick(['sum', 'm2', 'm1']);
      if (kd === 'm1') { // lo/hi + gap/lo  = lo/hi + hi/lo − 1
        const v = q(lo, hi).add(q(gap, lo));
        return { p: H.cat(H.frac(lo, hi), ' + ', H.frac(gap, lo), ' ='), a: A.num(v), params: { lo, hi },
          steps: [`${gap}/${lo} = ${hi}/${lo} − 1. So this is ${lo}/${hi} + ${hi}/${lo} − 1.`, `${lo}/${hi} + ${hi}/${lo} = 2 + ${gap * gap}/${lo * hi}.`, `Subtract 1: ${hl(H.Qf(v).h)}`] };
      }
      const s = q(a, b).add(q(b, a)); const v = kd === 'sum' ? s : s.sub(2);
      return { p: H.cat(H.frac(a, b), ' + ', H.frac(b, a), kd === 'm2' ? ' − 2 =' : ' ='), a: A.num(v), params: { a, b, kd },
        steps: [`${NS.m('\\frac ab + \\frac ba = 2 + \\frac{(a-b)^2}{ab}')}`, `Difference ${gap}, product ${a * b}: 2 + ${gap * gap}/${a * b}.`, ...(kd === 'm2' ? [`The − 2 cancels the 2, leaving ${hl(H.Qf(v).h)}`] : [`Answer: ${hl(H.Qf(v).h)}`])] };
    },
  });

  /* ---------- a/b − (na − 1)/(nb + 1) ---------- */
  G({
    id: 'nfrac', trick: 'nearFrac', col: { ms: 4, hs: 3 }, eval: true,
    gen(r, lv) {
      let a, b; do { a = r.int(1, 9); b = r.int(a + 1, 13); } while (M.gcd(a, b) !== 1);
      const n = r.int(2, lv === 'ms' ? 5 : 9);
      const plus = r.chance(0.5); // (na-1)/(nb+1) vs (na+1)/(nb-1)
      const c = plus ? n * a - 1 : n * a + 1, d = plus ? n * b + 1 : n * b - 1;
      if (c <= 0 || M.gcd(c, d) !== 1) return this.gen(r, lv);
      const v = q(a, b).sub(q(c, d));
      return { p: H.cat(H.frac(a, b), ' − ', H.frac(c, d), ' ='), a: A.num(v), params: { a, b, c, d },
        steps: [`${d} is ${n}×${b} ${plus ? '+' : '−'} 1 and ${c} is ${n}×${a} ${plus ? '−' : '+'} 1. Cross-multiplying gives ${a}×${d} − ${b}×${c} = ${plus ? '' : '−'}(${a} + ${b}).`, `So the answer is ${plus ? '' : '−'}${a + b} / (${b}×${d}) = ${plus ? '' : '−'}${a + b}/${b * d}.`, `Reduced: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- percents ---------- */
  const PFR = [[12.5, 1, 8], [37.5, 3, 8], [62.5, 5, 8], [87.5, 7, 8], [25, 1, 4], [75, 3, 4], [20, 1, 5], [60, 3, 5], [40, 2, 5], [80, 4, 5]];
  G({
    id: 'pct', trick: 'percent', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(['swap', 'swap', 'table', 'what', 'whole', lv === 'hs' ? 'chain' : 'table']);
      if (kd === 'swap') {
        const y = r.pick([25, 50, 20, 40, 75, 200, 125]); let x = r.int(6, 96); if (y === 125) x = 8 * r.int(1, 12);
        const v = q(x * y, 100);
        return { p: H.cat(`${x}% of ${y} =`), a: A.num(v), params: { x, y }, steps: [`x% of y is the same as y% of x.`, `${y}% of ${x} is easier: ${hl(H.Qf(v).h)}`] };
      }
      if (kd === 'table') {
        const [pc, a, b] = r.pick(PFR); const n = b * r.int(3, 25);
        const v = q(a * n, b);
        return { p: H.cat(`${pc}% of ${n} =`), a: A.num(v), params: { pc, n }, steps: [`${pc}% = ${a}/${b}.`, `${n} ÷ ${b} × ${a} = ${hl(H.Qf(v).h)}`] };
      }
      if (kd === 'what') {
        const b = r.pick([40, 80, 16, 24, 32, 48, 60, 120, 25, 200]); const a = r.int(2, b + 10);
        const v = q(a * 100, b);
        return { p: H.cat(`${a} is what percent of ${b}?`), suffix: '%', a: A.num(v), params: { a, b }, steps: [`Percent = part ÷ whole × 100 = ${a}/${b} × 100.`, `Answer: ${hl(H.Qf(v).h)}%`] };
      }
      if (kd === 'whole') {
        const [pc, a, b] = r.pick(PFR); const part = a * r.int(2, 15);
        const v = q(part * b, a);
        return { p: H.cat(`${part} is ${pc}% of what number?`), a: A.num(v), params: { pc, part }, steps: [`${pc}% = ${a}/${b}, so the whole is ${part} ÷ ${a}/${b} = ${part} × ${b}/${a}.`, `Answer: ${hl(H.Qf(v).h)}`] };
      }
      // chain: increase then decrease
      const up = r.pick([10, 20, 25, 50]), dn = r.pick([10, 20, 25, 50]); const n = r.pick([40, 80, 120, 200, 160]);
      const v = q(n).mul(q(100 + up, 100)).mul(q(100 - dn, 100));
      return { p: H.cat(`${n} increased by ${up}%, then decreased by ${dn}%, is`), a: A.num(v), params: { n, up, dn }, steps: [`Multiply by ${H.dec(q(100 + up, 100)).h} then by ${H.dec(q(100 - dn, 100)).h}.`, `${n} × ${H.dec(q(100 + up, 100)).h} = ${H.Qf(q(n).mul(q(100 + up, 100))).h}; × ${H.dec(q(100 - dn, 100)).h} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- comparing fractions and decimals ---------- */
  G({
    id: 'compare', trick: 'compare', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const larger = r.chance(0.6);
      if (r.chance(0.5)) { // two fractions
        let a, b, c, d; do { b = r.int(5, 15); d = r.int(5, 15); a = r.int(Math.ceil(b / 2), b - 1); c = r.int(Math.ceil(d / 2), d - 1); } while (b === d || M.gcd(a, b) !== 1 || M.gcd(c, d) !== 1 || a * d === b * c || Math.abs(a / b - c / d) > 0.06);
        const x = q(a, b), y = q(c, d); const pickX = (x.cmp(y) > 0) === larger; const v = pickX ? x : y;
        return { p: H.cat(`Which is ${larger ? 'larger' : 'smaller'}: `, H.frac(a, b), ' or ', H.frac(c, d), '?'), a: A.num(v), params: { a, b, c, d, larger },
          steps: [`Cross-multiply: ${a}×${d} = ${a * d} and ${c}×${b} = ${c * b}.`, `The bigger cross product sits with the bigger fraction: ${x.cmp(y) > 0 ? `${a}/${b}` : `${c}/${d}`} is larger.`, `Answer: ${hl(H.frac(Number(v.n), Number(v.d)).h)}`] };
      }
      let a, b; do { b = r.pick([3, 6, 7, 9, 11, 12, 13, 14]); a = r.int(1, b - 1); } while (M.gcd(a, b) !== 1);
      const f = q(a, b); const k = f.mul(100).n * 1n / f.mul(100).d; // floor of percent
      const dv = q(Number(k) + r.pick([0, 1]), 100); // two-place decimal just below/above
      if (dv.eq(f)) return this.gen(r, lv);
      const pickF = (f.cmp(dv) > 0) === larger; const v = pickF ? f : dv;
      const decf = (Number(f.n) / Number(f.d)).toFixed(4).replace(/^0/, '');
      return { p: H.cat(`Which is ${larger ? 'larger' : 'smaller'}: `, H.frac(a, b), ' or ', H.dec(dv), '?'), a: { ...A.num(v), show: pickF ? H.frac(a, b).h : H.dec(dv).h }, params: { a, b, dv: dv.toDecStr(), larger },
        steps: [`${a}/${b} = ${decf}…`, `Compare with ${H.dec(dv).h}: ${f.cmp(dv) > 0 ? `${a}/${b} is larger` : `${H.dec(dv).h} is larger`}.`, `Answer: ${hl(pickF ? H.frac(a, b).h : H.dec(dv).h)}`] };
    },
  });

  /* ---------- repeating decimals → fractions ---------- */
  G({
    id: 'repdec', trick: 'repeating', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['a', 'ab', 'ab', 'abb'] : ['ab', 'abb', 'abb', 'abcc', 'abc']);
      let v, shown, steps;
      if (kd === 'a') { const a = r.int(1, 8); v = q(a, 9); shown = `.${a}${a}${a}`; steps = [`One digit repeating: put it over 9.`, `${a}/9 = ${hl(H.Qi(v).h)}`]; }
      else if (kd === 'ab') { let ab; do { ab = r.int(10, 98); } while (ab % 11 === 0); v = q(ab, 99); const s = String(ab).padStart(2, '0'); shown = `.${s}${s}${s}`; steps = [`Two digits repeating: put them over 99.`, `${ab}/99 → reduce → ${hl(H.Qi(v).h)}`]; }
      else if (kd === 'abc') { let abc; do { abc = r.int(101, 998); } while (abc % 111 === 0); v = q(abc, 999); const s = String(abc); shown = `.${s}${s}`; steps = [`Three digits repeating: put them over 999.`, `${abc}/999 → reduce → ${hl(H.Qi(v).h)}`]; }
      else if (kd === 'abb') { let a, b; do { a = r.int(0, 9); b = r.int(1, 9); } while (a === b); v = q(10 * a + b - a, 90); shown = `.${a}${b}${b}${b}`; steps = [`One digit, then one repeating: (all digits − the part that doesn't repeat) over 90.`, `(${10 * a + b} − ${a})/90 = ${9 * a + b}/90 → ${hl(H.Qi(v).h)}`]; }
      else { let a, bc; do { a = r.int(1, 9); bc = r.int(10, 98); } while (bc % 11 === 0); v = q(100 * a + bc - a, 990); const s = String(bc); shown = `.${a}${s}${s}`; steps = [`One digit, then two repeating: take all three digits, subtract the first one, and put it over 990.`, `(${100 * a + bc} − ${a})/990 = ${100 * a + bc - a}/990 → ${hl(H.Qi(v).h)}`]; }
      const rep = { a: 1, ab: 2, abc: 3, abb: 1, abcc: 2 }[kd]; const body = shown.slice(1); const pre = body.slice(0, kd === 'abb' || kd === 'abcc' ? 1 : 0);
      return { p: H.cat(H.rep(shown), ' ='), a: A.num(v, 'frac'), form: '(common fraction)', params: { pre, rep: body.slice(pre.length, pre.length + rep) }, steps };
    },
  });

  /* ---------- ratio & proportion ---------- */
  G({
    id: 'ratio', trick: 'ratio', col: { ms: 2, hs: 2 },
    gen(r) {
      const a = r.int(2, 12), b = r.int(2, 15), k = r.int(2, 9);
      if (a === b) return this.gen(r);
      if (r.chance(0.5)) return { p: H.cat(`${a} is to ${b} as ${a * k} is to`), a: A.num(b * k), params: { a, b, k }, steps: [`${a * k} is ${k} times ${a}, so the answer is ${k} times ${b}.`, `Answer: ${hl(b * k)}`] };
      return { p: H.cat('If ', H.frac(a * k, 'x'), ' = ', H.frac(a, b), ', then x ='), a: A.num(b * k), params: { a, b, k }, steps: [`${a * k} is ${k} × ${a}, so x is ${k} × ${b}.`, `x = ${hl(b * k)}`] };
    },
  });

  /* ---------- consumer problems ---------- */
  G({
    id: 'consumer', trick: 'consumer', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(['unit', 'unit', 'discount', 'tip', lv === 'hs' ? 'interest' : 'discount']);
      if (kd === 'unit') {
        const n = r.pick([3, 4, 5, 6, 8, 12]), each = r.pick([15, 20, 25, 30, 35, 40, 45, 60, 75]), m = r.int(2, 20);
        if (m === n) return this.gen(r, lv);
        const v = q(m * each, 100);
        return { p: H.cat(`If ${n} pens cost $${$m(q(n * each, 100))}, then ${m} pens cost`), pre: '$', a: A.num(v, 'money'), params: { n, each, m },
          steps: [`One pen costs $${$m(q(n * each, 100))} ÷ ${n} = $${$m(q(each, 100))}.`, `${m} pens: ${m} × $${$m(q(each, 100))} = $${hl($m(v))}`] };
      }
      if (kd === 'discount') {
        const price = r.pick([20, 40, 60, 80, 120, 160, 48, 36, 72]), off = r.pick([10, 20, 25, 30, 40, 15]);
        const v = q(price * (100 - off), 100);
        return { p: H.cat(`A $${price} jacket is ${off}% off. The sale price is`), pre: '$', a: A.num(v, 'money'), params: { price, off }, steps: [`You pay ${100 - off}% of the price.`, `${100 - off}% of ${price} = $${hl(H.Qf(v).h)}`] };
      }
      if (kd === 'tip') {
        const bill = r.pick([20, 30, 40, 60, 80, 24, 36, 50]), tip = r.pick([15, 20, 10, 18]);
        const v = q(bill * (100 + tip), 100);
        return { p: H.cat(`A $${bill} meal plus ${[8, 11, 18].includes(tip) ? 'an' : 'a'} ${tip}% tip costs`), pre: '$', a: A.num(v, 'money'), params: { bill, tip }, steps: [`${tip}% of ${bill} = ${H.dec(q(bill * tip, 100)).h}.`, `${bill} + ${H.dec(q(bill * tip, 100)).h} = $${hl(H.dec(v).h)}`] };
      }
      const P = r.pick([200, 400, 500, 800, 1000, 1200]), rt = r.pick([2, 3, 4, 5, 6]), t = r.int(2, 5);
      const v = q(P * rt * t, 100);
      return { p: H.cat(`$${P} at ${rt}% simple interest for ${t} years earns`), pre: '$', a: A.num(v, 'money'), params: { P, rt, t }, steps: [`Interest = principal × rate × time.`, `${P} × ${rt}/100 × ${t} = $${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- order of operations ---------- */
  G({
    id: 'orderOps', trick: 'orderOps', col: { ms: 1, hs: 1 }, eval: true,
    gen(r, lv) {
      const kd = r.pick(['a', 'b', 'c']);
      if (kd === 'a') { const c = r.int(2, 9), d = r.int(2, 6), e = c * d * r.int(1, 3); const a = r.int(10, 50), b = r.int(2, 9);
        const v = a - e / c * b + d * d; const p = H.cat(`${a} − ${e} ÷ ${c} × ${b} + `, H.pow(d, 2), ' =');
        return { p, a: A.num(v), params: { a, e, c, b, d }, steps: [`Exponent first: ${d}² = ${d * d}.`, `Then ÷ and × left to right: ${e} ÷ ${c} = ${e / c}, × ${b} = ${e / c * b}.`, `${a} − ${e / c * b} + ${d * d} = ${hl(fm(v))}`] }; }
      if (kd === 'b') { const a = r.int(3, 12), b = r.int(1, 9), c = r.pick([2, 3, 4, 6]); const sq = (a - b) * (a - b); const k = sq % c === 0 ? 0 : 0; void k;
        const e = r.int(2, 12); const tot = (a - b) * (a - b) * c + e; const v = (a - b) * (a - b) * c - e;
        void tot; return { p: H.cat(H.pow(`(${a} − ${b})`, 2), ` × ${c} − ${e} =`), a: A.num(v), params: { a, b, c, e }, steps: [`Parentheses: ${a} − ${b} = ${a - b}. Square: ${sq}.`, `${sq} × ${c} = ${sq * c}, minus ${e} = ${hl(fm(v))}`] }; }
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), d = r.int(10, 30);
      const v = -a * b + d - c * (a + b);
      return { p: H.cat(`−${a} × ${b} + ${d} − ${c}(${a} + ${b}) =`), a: A.num(v), params: { a, b, c, d }, steps: [`−${a} × ${b} = ${-a * b}; ${c} × ${a + b} = ${c * (a + b)}.`, `${-a * b} + ${d} − ${c * (a + b)} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- mean, median, mode ---------- */
  G({
    id: 'mean', trick: 'meanMedian', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(['mean', 'missing', 'median']);
      if (kd === 'mean') { const xs = Array.from({ length: r.int(4, 5) }, () => r.int(8, 60)); const s = xs.reduce((x, y) => x + y, 0); const v = q(s, xs.length);
        return { p: H.cat(`The mean of ${xs.join(', ')} is`), a: A.num(v), params: { xs }, steps: [`Sum: ${s}. Divide by ${xs.length}.`, `Answer: ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'missing') { const n = r.int(4, 6), m = r.int(10, 40); const xs = Array.from({ length: n - 1 }, () => r.int(m - 9, m + 9)); const last = n * m - xs.reduce((x, y) => x + y, 0);
        if (last <= 0) return this.gen(r, lv);
        return { p: H.cat(`The mean of ${n} numbers is ${m}. ${n - 1} of them are ${xs.join(', ')}. The last one is`), a: A.num(last), params: { n, m, xs }, steps: [`Total must be ${n} × ${m} = ${n * m}.`, `${n * m} − ${xs.reduce((x, y) => x + y, 0)} = ${hl(last)}`] }; }
      const xs = Array.from({ length: r.pick([5, 6, 7]) }, () => r.int(3, 70)); const s = xs.slice().sort((x, y) => x - y);
      const L = s.length; const v = L % 2 ? q(s[(L - 1) / 2]) : q(s[L / 2 - 1] + s[L / 2], 2);
      return { p: H.cat(`The median of ${xs.join(', ')} is`), a: A.num(v), params: { xs }, steps: [`Sort: ${s.join(', ')}.`, L % 2 ? `Middle value: ${hl(s[(L - 1) / 2])}` : `Average the two middles: (${s[L / 2 - 1]} + ${s[L / 2]})/2 = ${hl(H.Qf(v).h)}`] };
    },
  });
})();
