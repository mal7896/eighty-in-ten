/* ===== more patterns (several from math-magic.org's trick lists) ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn, m = NS.m;

  /* ---------- subtracting reverses ---------- */
  G({
    id: 'subrev', trick: 'subReverse', col: { ms: 1, hs: 1 }, eval: true,
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['2', '3', '3', '4z'] : ['3', '3', '4z', '4']);
      let x, y, steps;
      if (kd === '2') { const a = r.int(2, 9), b = r.int(1, a - 1); x = 10 * a + b; y = 10 * b + a; steps = [`Two-digit reverses always differ by 9 × (difference of the digits).`, `9 × (${a} − ${b}) = ${hl(x - y)}`]; }
      else if (kd === '3') { let a = r.int(2, 9), c = r.int(1, a - 1), b = r.int(0, 9); x = 100 * a + 10 * b + c; y = 100 * c + 10 * b + a; steps = [`The middle digit cancels. Three-digit reverses differ by 99 × (first digit − last digit).`, `99 × ${a - c} = ${hl(x - y)}`]; }
      else if (kd === '4z') { const a = r.int(2, 9), d = r.int(1, a - 1); x = 1000 * a + d; y = 1000 * d + a; steps = [`With zeros in the middle, the difference is 999 × (first − last).`, `999 × ${a - d} = ${hl(fm(x - y))}`]; }
      else { const a = r.int(3, 9), d = r.int(1, a - 1), b = r.int(0, 9), c = r.int(0, 9); x = 1000 * a + 100 * b + 10 * c + d; y = 1000 * d + 100 * c + 10 * b + a;
        steps = [`Outer digits give 999 × (${a} − ${d}) = ${fm(999 * (a - d))}. Middle digits give 90 × (${b} − ${c}) = ${90 * (b - c)}.`, `${fm(999 * (a - d))} ${b - c < 0 ? '−' : '+'} ${Math.abs(90 * (b - c))} = ${hl(fm(x - y))}`]; }
      const flip = r.chance(0.3);
      if (flip) { [x, y] = [y, x]; steps = [steps[0] + ' Here the bigger number comes second, so the answer is negative.', steps[1].replace(/<mark>([^<]*)<\/mark>/, (m0, v) => `<mark>−${v}</mark>`)]; }
      return { p: H.cat(H.n(x), ' − ', H.n(y), ' ='), a: A.num(x - y), params: { x, y }, steps };
    },
  });

  /* ---------- a² + (ka)² ---------- */
  G({
    id: 'sqmult', trick: 'squareMultiples', col: { ms: 2, hs: 2 }, eval: true,
    gen(r, lv) {
      const k = r.pick([2, 3, 3, 7, 10, 4]); const a = k === 10 ? r.int(11, 49) : k === 7 ? r.int(3, 9) : r.int(6, lv === 'ms' ? 25 : 40);
      const b = k * a; const sw = r.chance(0.35);
      const v = a * a + b * b;
      return { p: sw ? H.cat(H.pow(b, 2), ' + ', H.pow(a, 2), ' =') : H.cat(H.pow(a, 2), ' + ', H.pow(b, 2), ' ='), a: A.num(v), params: { a, k },
        steps: [`${b} is ${k} × ${a}, so ${m(`${a}^2 + (${k}\\cdot ${a})^2 = (1 + ${k * k})\\cdot ${a}^2`)}.`, `${1 + k * k} × ${a * a} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- a² + b² − (a − b)² = 2ab ---------- */
  G({
    id: 'twoab', trick: 'twoAB', col: { ms: 3, hs: 2 }, eval: true,
    gen(r) {
      const a = r.int(21, 79), b = r.int(11, a - 5); const c = a - b; const plus = r.chance(0.3);
      if (plus) { const s = a + b; const v = s * s - a * a - b * b; return { p: H.cat(H.pow(s, 2), ' − ', H.pow(a, 2), ' − ', H.pow(b, 2), ' ='), a: A.num(v), params: { a, b, plus }, steps: [`${s} = ${a} + ${b}, and ${m('(a+b)^2 - a^2 - b^2 = 2ab')}.`, `2 × ${a} × ${b} = ${hl(fm(v))}`] }; }
      const v = a * a + b * b - c * c;
      return { p: H.cat(H.pow(a, 2), ' + ', H.pow(b, 2), ' − ', H.pow(c, 2), ' ='), a: A.num(v), params: { a, b, plus }, steps: [`${c} = ${a} − ${b}, and ${m('a^2 + b^2 - (a-b)^2 = 2ab')}.`, `2 × ${a} × ${b} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- √(n(n+1)(n+2)(n+3) + 1) ---------- */
  G({
    id: 'fourcons', trick: 'fourConsecutive', col: { ms: 3, hs: 3 },
    gen(r) {
      const n = r.int(3, 20); const v = n * n + 3 * n + 1;
      return { p: H.cat(H.sqrt(`${n} × ${n + 1} × ${n + 2} × ${n + 3} + 1`), ' ='), a: A.num(v), params: { n },
        steps: [`Four consecutive numbers multiplied, plus 1, is always a perfect square: the square of (first × last + 1).`, `${n} × ${n + 3} + 1 = ${hl(v)}`] };
    },
  });

  /* ---------- dividing by 9 into a mixed number ---------- */
  G({
    id: 'div9', trick: 'divideBy9', col: { ms: 2, hs: 1 },
    gen(r, lv) {
      let n; do { n = r.int(lv === 'ms' ? 101 : 1001, lv === 'ms' ? 2999 : 99999); } while (n % 9 === 0);
      const v = q(n, 9); const d = String(n).split('').map(Number);
      const sums = d.map((_, i) => d.slice(0, i + 1).reduce((x, y) => x + y, 0));
      return { p: H.cat(H.n(n), ' ÷ 9 ='), a: A.num(v, 'mixed'), form: '(mixed number)', params: { n },
        steps: [`Write running digit sums left to right: ${sums.join(', ')}.`, `All but the last sum are the digits of the whole part (carry when a sum passes 9). The last sum over 9 is the fraction; if it is 9 or more, move each extra 9 into the whole part.`, `Answer: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- relatively prime count (Euler's phi) ---------- */
  G({
    id: 'relprime', trick: 'relPrime', col: { ms: 4, hs: 3 }, w: 1.4,
    gen(r) {
      const n = r.pick([12, 15, 18, 20, 21, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 72, 75, 80, 84, 90, 96, 100]);
      const ps = M.factor(n).map(([p]) => p); let phi = n; ps.forEach(p => { phi = phi / p * (p - 1); });
      const wd = r.pick(['less than', 'less than', 'less than or equal to']);
      return { p: H.cat(`How many positive integers ${wd} ${n} are relatively prime to ${n}?`), a: A.num(phi), params: { n },
        steps: [`${n} has prime factors ${ps.length > 1 ? ps.slice(0, -1).join(', ') + ' and ' + ps[ps.length - 1] : ps[0]}. Take ${n} and multiply by ${ps.map(p => `${m(`\\left(1 - \\tfrac1{${p}}\\right)`)}`).join('')}.`, `${n} × ${ps.map(p => `${p - 1}/${p}`).join(' × ')} = ${hl(phi)}`] };
    },
  });

  /* ---------- [n! ± (n−2)!] / (n−1)! ---------- */
  G({
    id: 'factpm', trick: 'factorialTrick', col: { ms: 0, hs: 3 },
    gen(r) {
      const n = r.int(5, 12); const plus = r.chance(0.5);
      const v = q(n).add(q(plus ? 1 : -1, n - 1));
      return { p: H.cat(H.frac(`${n}! ${plus ? '+' : '−'} ${n - 2}!`, `${n - 1}!`), ' ='), a: A.num(v, 'mixed'), form: '(mixed number)', params: { n, plus },
        steps: [`Divide each term by ${n - 1}!: ${m(`\\frac{${n}!}{${n - 1}!} = ${n}`)} and ${m(`\\frac{${n - 2}!}{${n - 1}!} = \\frac{1}{${n - 1}}`)}.`, `${n} ${plus ? '+' : '−'} 1/${n - 1} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- 1/a + 1/ab + 1/ab² ---------- */
  G({
    id: 'fracchain', trick: 'fractionChain', col: { ms: 3, hs: 2 }, eval: true,
    gen(r) {
      const a = r.int(2, 6), b = r.int(2, 5); const minus = r.chance(0.35);
      const v = minus ? q(1, a).sub(q(1, a * b)).sub(q(1, a * b * b)) : q(1, a).add(q(1, a * b)).add(q(1, a * b * b));
      const top = minus ? b * b - b - 1 : b * b + b + 1;
      return { p: H.cat(H.frac(1, a), minus ? ' − ' : ' + ', H.frac(1, a * b), minus ? ' − ' : ' + ', H.frac(1, a * b * b), ' ='), a: A.num(v), params: { a, b, minus },
        steps: [`Each denominator is ${b} times the one before, so use ${a * b * b} for all three.`, `Numerators: ${b * b} ${minus ? '−' : '+'} ${b} ${minus ? '−' : '+'} 1 = ${top}. So ${top}/${a * b * b}, reduced: ${hl(H.Qf(v).h)}`] };
    },
  });
})();
