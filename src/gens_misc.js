/* ===== measurement, memorization, sets, counting, probability ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn;

  /* ---------- unit conversions ---------- */
  // [from, to, factor as Q (1 from = f to), plural labels, level]
  const CONV = [
    ['miles', 'feet', q(5280)], ['miles', 'yards', q(1760)], ['yards', 'inches', q(36)], ['feet', 'inches', q(12)], ['yards', 'feet', q(3)],
    ['gallons', 'quarts', q(4)], ['gallons', 'pints', q(8)], ['gallons', 'cups', q(16)], ['quarts', 'pints', q(2)], ['quarts', 'cups', q(4)], ['pints', 'cups', q(2)], ['cups', 'fluid ounces', q(8)], ['quarts', 'fluid ounces', q(32)], ['gallons', 'fluid ounces', q(128)],
    ['pounds', 'ounces', q(16)], ['tons', 'pounds', q(2000)], ['hours', 'minutes', q(60)], ['days', 'hours', q(24)], ['weeks', 'days', q(7)], ['minutes', 'seconds', q(60)],
    ['square feet', 'square inches', q(144)], ['square yards', 'square feet', q(9)], ['cubic yards', 'cubic feet', q(27)], ['cubic feet', 'cubic inches', q(1728)], ['gallons', 'cubic inches', q(231)],
    ['inches', 'centimeters', q(254, 100)], ['meters', 'centimeters', q(100)], ['kilometers', 'meters', q(1000)], ['liters', 'milliliters', q(1000)], ['kilograms', 'grams', q(1000)],
  ];
  G({
    id: 'units', trick: 'units', col: { ms: 2, hs: 1 },
    gen(r, lv) {
      const [from, to, f] = r.pick(CONV); const one = from === 'feet' ? 'foot' : from === 'square feet' ? 'square foot' : from === 'cubic feet' ? 'cubic foot' : from.replace(/s$/, ''); const flip = r.chance(0.35) && !['inches'].includes(from);
      if (!flip) {
        const n = from === 'miles' || from === 'tons' ? r.pick([q(1, 4), q(1, 2), q(3, 4), q(1, 8), q(3, 8), q(2), q(3), q(1, 3), q(2, 3)]) : from === 'inches' ? q(r.pick([5, 10, 20, 50, 100, 12, 36])) : q(r.int(2, from.includes('cubic') ? 5 : 15));
        const v = n.mul(f);
        return { p: H.cat(H.Qf(n), ` ${n.cmp(1) === 0 ? one : from} =`), suffix: to, a: A.num(v), params: { from, to, n: n.toFracStr(), dir: 'fwd' },
          steps: [`1 ${one} = ${H.Qf(f).h.includes('fr') ? H.dec(f).h : fm(f.n.toString())} ${to}.`, `${H.Qf(n).h} × ${H.Qf(f).h.includes('fr') ? H.dec(f).h : fm(f.n.toString())} = ${hl(H.Qf(v).h)}`] };
      }
      const k = r.pick([q(1, 2), q(1, 4), q(3, 4), q(2), q(3), q(5), q(3, 2)]); const n = f.mul(k);
      if (!n.isInt()) return this.gen(r, lv);
      return { p: H.cat(H.n(n.n.toString()), ` ${n.cmp(1) === 0 ? ({ feet: 'foot', inches: 'inch', 'square feet': 'square foot', 'square inches': 'square inch', 'cubic feet': 'cubic foot', 'cubic inches': 'cubic inch' }[to] || to.replace(/s$/, '')) : to} =`), suffix: from, a: A.num(k), params: { from, to, n: n.toFracStr(), dir: 'back' },
        steps: [`1 ${one} = ${fm(f.n.toString())} ${to}.`, `${fm(n.n.toString())} ÷ ${fm(f.n.toString())} = ${hl(H.Qf(k).h)}`] };
    },
  });

  /* ---------- Roman numerals ---------- */
  const toRoman = n => { const v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [a, b] of v) while (n >= a) { s += b; n -= a; } return s; };
  NS.toRoman = toRoman;
  const romanParts = n => { const out = []; const th = Math.floor(n / 1000) * 1000, hu = Math.floor(n % 1000 / 100) * 100, te = Math.floor(n % 100 / 10) * 10, on = n % 10; [th, hu, te, on].forEach(x => { if (x) out.push(`${x} = ${toRoman(x)}`); }); return out.join(', '); };
  G({
    id: 'roman', trick: 'roman', col: { ms: 1, hs: 1 },
    gen(r) {
      const kd = r.pick(['toArabic', 'toRoman', 'arith']);
      if (kd === 'toArabic') { const n = r.int(40, 3999); const s = toRoman(n); return { p: H.cat(`${s} =`), suffix: '(Arabic numeral)', a: A.num(n), params: { s }, steps: [`Split into place values: ${romanParts(n)}.`, `Total: ${hl(n)}`] }; }
      if (kd === 'toRoman') { const n = r.int(40, 2999); const s = toRoman(n); return { p: H.cat(`${n} =`), suffix: '(Roman numeral)', a: A.text(s, 'roman'), params: { n }, steps: [`Convert each place: ${romanParts(n)}.`, `${hl(s)}`] }; }
      const x = r.int(500, 2500), y = r.int(40, 900); const plus = r.chance(0.5); const v = plus ? x + y : x - y;
      return { p: H.cat(`${toRoman(x)} ${plus ? '+' : '−'} ${toRoman(y)} =`), suffix: '(Arabic numeral)', a: A.num(v), params: { x, y, plus }, steps: [`${toRoman(x)} = ${x}, ${toRoman(y)} = ${y}.`, `${x} ${plus ? '+' : '−'} ${y} = ${hl(v)}`] };
    },
  });

  /* ---------- temperature and speed ---------- */
  G({
    id: 'tempSpeed', trick: 'tempSpeed', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['c2f', 'f2c', 'mph', 'fps']);
      if (kd === 'c2f') { const c = 5 * r.int(-8, 20); const f = c * 9 / 5 + 32; return { p: H.cat(`${c}°C =`), suffix: '°F', a: A.num(f), params: { c }, steps: [`F = 9/5 C + 32. Double ${c} and take off a tenth: ${2 * c} − ${c / 5} = ${9 * c / 5}.`, `${9 * c / 5} + 32 = ${hl(f)}`] }; }
      if (kd === 'f2c') { const f = 32 + 9 * r.int(-8, 20); const c = (f - 32) * 5 / 9; return { p: H.cat(`${f}°F =`), suffix: '°C', a: A.num(c), params: { f }, steps: [`C = 5/9 (F − 32) = 5/9 × ${f - 32}.`, `= ${hl(c)}`] }; }
      if (kd === 'mph') { const m = 15 * r.int(1, 6); const v = m * 22 / 15; return { p: H.cat(`${m} miles per hour =`), suffix: 'feet per second', a: A.num(v), params: { m }, steps: [`15 mph = 22 ft/s.`, `${m} mph = ${m / 15} × 22 = ${hl(v)} ft/s`] }; }
      const ft = 22 * r.int(1, 6); const v = ft * 15 / 22; return { p: H.cat(`${ft} feet per second =`), suffix: 'miles per hour', a: A.num(v), params: { ft }, steps: [`22 ft/s = 15 mph.`, `${ft} ft/s = ${ft / 22} × 15 = ${hl(v)} mph`] };
    },
  });

  /* ---------- powers & roots to memorize ---------- */
  G({
    id: 'powers', trick: 'powers', col: { ms: 1, hs: 1 }, eval: true,
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['sq', 'sq', 'sqrt', 'cube', 'p2'] : ['sq', 'sqrt', 'cube', 'cbrt', 'p2', 'p3']);
      if (kd === 'sq') { const n = r.int(11, lv === 'ms' ? 30 : 50); return { p: H.cat(H.pow(n, 2), ' ='), a: A.num(n * n), params: { kd, n }, steps: [`Memorize squares through ${lv === 'ms' ? 30 : 50}. If you blank: ${n < 50 && n > 40 ? `(50 − ${50 - n})² = (25 − ${50 - n}) | ${(50 - n) ** 2}` : `round to a friendly number and adjust`}.`, `${n}² = ${hl(n * n)}`] }; }
      if (kd === 'sqrt') { const n = r.int(11, lv === 'ms' ? 30 : 60); return { p: H.cat(H.sqrt(n * n), ' ='), a: A.num(n), params: { kd, n }, steps: [`Last digit ${String(n * n).slice(-1)} means the root ends in ${[0, 1, 9, 4, 6, 5].includes(n % 10) ? n % 10 : ''}${n % 10 !== (10 - n % 10) % 10 ? ` or ${(10 - n % 10) % 10}` : ''}; size tells which.`, `√${n * n} = ${hl(n)}`] }; }
      if (kd === 'cube') { const n = r.int(4, lv === 'ms' ? 12 : 20); return { p: H.cat(H.pow(n, 3), ' ='), a: A.num(n ** 3), params: { kd, n }, steps: [`Memorize cubes through ${lv === 'ms' ? 12 : 20}.`, `${n}³ = ${hl(fm(n ** 3))}`] }; }
      if (kd === 'cbrt') { const n = r.int(4, 20) * r.pick([1, 1, -1]); return { p: H.cat(H.cbrt(n ** 3), ' ='), a: A.num(n), params: { kd, n }, steps: [`Cube roots of perfect cubes: the last digit of the cube tells you the last digit of the root.`, `∛${n ** 3} = ${hl(n)}`] }; }
      if (kd === 'p2') { const e = r.int(6, lv === 'ms' ? 10 : 14); return { p: H.cat(H.pow(2, e), ' ='), a: A.num(2 ** e), params: { kd, e }, steps: [`2¹⁰ = 1024 is the anchor.`, `2^${e} = ${hl(fm(2 ** e))}`] }; }
      const [b, e] = r.pick([[3, 5], [3, 6], [3, 7], [5, 4], [5, 5], [6, 4], [7, 4], [4, 5], [4, 6]]);
      return { p: H.cat(H.pow(b, e), ' ='), a: A.num(b ** e), params: { kd, b, e }, steps: [`Build it up: ${Array.from({ length: e }, (_, i) => b ** (i + 1)).join(', ')}.`, `${b}^${e} = ${hl(fm(b ** e))}`] };
    },
  });

  /* ---------- sets ---------- */
  G({
    id: 'sets', trick: 'sets', col: { ms: 3, hs: 2 },
    gen(r) {
      const kd = r.pick(['subsets', 'proper', 'venn', 'union']);
      if (kd === 'subsets' || kd === 'proper') { const n = r.int(3, 7); const letters = 'MATHSUPER'.slice(0, n).split('').join(', '); const v = 2 ** n - (kd === 'proper' ? 1 : 0);
        return { p: H.cat(`How many ${kd === 'proper' ? 'proper ' : ''}subsets does {${letters}} have?`), a: A.num(v), params: { n, kd }, steps: [`A set with ${n} elements has 2^${n} = ${2 ** n} subsets${kd === 'proper' ? '; proper subsets leave out the set itself' : ''}.`, `Answer: ${hl(v)}`] }; }
      if (kd === 'venn') { const T = r.int(25, 40), a = r.int(10, 20), b = r.int(8, 18), both = r.int(3, Math.min(a, b) - 1); const neither = T - (a + b - both); if (neither < 0) return this.gen(r);
        return { p: H.cat(`In a class of ${T}, ${a} play soccer, ${b} play tennis, and ${both} play both. How many play neither?`), a: A.num(neither), params: { T, a, b, both }, steps: [`At least one: ${a} + ${b} − ${both} = ${a + b - both}.`, `Neither: ${T} − ${a + b - both} = ${hl(neither)}`] }; }
      const n1 = r.int(4, 9), n2 = r.int(3, 8), k = r.int(1, Math.min(n1, n2) - 1); const v = n1 + n2 - k;
      return { p: H.cat(`Set A has ${n1} elements, set B has ${n2}, and A ∩ B has ${k}. How many elements are in A ∪ B?`), a: A.num(v), params: { n1, n2, k }, steps: [`|A ∪ B| = |A| + |B| − |A ∩ B|.`, `${n1} + ${n2} − ${k} = ${hl(v)}`] };
    },
  });

  /* ---------- permutations, combinations, factorials ---------- */
  G({
    id: 'counting', trick: 'counting', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = r.pick(['C', 'P', 'factdiv', 'word']);
      if (kd === 'C') { const n = r.int(5, lv === 'ms' ? 10 : 14), k = r.int(2, 4); return { p: H.L(`{}_{${n}}C_{${k}} =`), a: A.num(M.C(n, k)), params: { kd, n, k }, steps: [`Multiply ${k} numbers counting down from ${n}, then divide by ${k}!.`, `${Array.from({ length: k }, (_, i) => n - i).join(' × ')} ÷ ${M.fact(k)} = ${hl(M.C(n, k))}`] }; }
      if (kd === 'P') { const n = r.int(5, 10), k = r.int(2, 3); return { p: H.L(`{}_{${n}}P_{${k}} =`), a: A.num(M.P(n, k)), params: { kd, n, k }, steps: [`Multiply ${k} numbers counting down from ${n}.`, `${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = ${hl(M.P(n, k))}`] }; }
      if (kd === 'factdiv') { const a = r.int(6, 12), b = a - r.int(2, 3); const v = M.fact(a) / M.fact(b); return { p: H.cat(H.frac(`${a}!`, `${b}!`), ' ='), a: A.num(v), params: { kd, a, b }, steps: [`Cancel ${b}! from both: ${Array.from({ length: a - b }, (_, i) => a - i).join(' × ')}.`, `= ${hl(fm(v))}`] }; }
      const w = r.pick(['BOOK', 'LEVEL', 'APPLE', 'TEXAS', 'BANANA', 'COOKIE', 'STATS', 'RADAR', 'SENSE', 'NUMBER', 'LETTER', 'GEESE', 'PEPPER', 'TOOTH']);
      const cnt = {}; for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1; const reps = Object.entries(cnt).filter(([, c]) => c > 1);
      const v = reps.reduce((acc, [, c]) => acc / M.fact(c), M.fact(w.length));
      return { p: H.cat(`How many distinct ways can the letters of ${w} be arranged?`), a: A.num(v), params: { kd, w }, steps: [`${w.length}! = ${M.fact(w.length)}${reps.length ? `, divided by ${reps.map(([ch, c]) => `${c}! for the ${ch}s`).join(' and ')}` : ''}.`, `= ${hl(v)}`] };
    },
  });

  /* ---------- probability & odds ---------- */
  G({
    id: 'prob', trick: 'probability', col: { ms: 4, hs: 3 },
    gen(r) {
      const kd = r.pick(['dice', 'coins', 'marbles', 'odds']);
      if (kd === 'dice') { const s = r.int(2, 12); const ways = 6 - Math.abs(7 - s); const v = q(ways, 36); return { p: H.cat(`Two fair dice are rolled. The probability their sum is ${s} is`), a: A.num(v), params: { s }, steps: [`Ways to make ${s}: ${ways} out of 36.`, `${ways}/36 = ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'coins') { const n = r.int(3, 6), k = r.int(1, n - 1); const v = q(M.C(n, k), 2 ** n); return { p: H.cat(`A fair coin is tossed ${n} times. The probability of exactly ${k} heads is`), a: A.num(v), params: { n, k }, steps: [`${NS.m(`\\binom{${n}}{${k}} = ${M.C(n, k)}`)} ways out of ${NS.m(`2^{${n}} = ${2 ** n}`)}.`, `${M.C(n, k)}/${2 ** n} = ${hl(H.Qi(v).h)}`] }; }
      const red = r.int(2, 9), blue = r.int(2, 9), green = r.int(1, 6); const T = red + blue + green;
      if (kd === 'marbles') { const v = q(red * (red - 1), T * (T - 1)); return { p: H.cat(`A bag has ${red} red, ${blue} blue, and ${green} green marbles. Two are drawn without replacement. The probability both are red is`), a: A.num(v), params: { red, blue, green }, steps: [`${red}/${T} × ${red - 1}/${T - 1}.`, `= ${hl(H.Qi(v).h)}`] }; }
      const g = M.gcd(red, T - red); const o1 = red / g, o2 = (T - red) / g;
      return { p: H.cat(`A bag has ${red} red, ${blue} blue, and ${green} green marbles. The odds in favor of drawing a red marble are`), a: A.text(`${o1}:${o2}`, 'ratio', [`${o1}/${o2}`]), params: { red, blue, green }, steps: [`Odds in favor = favorable : unfavorable = ${red} : ${T - red}.`, `Reduced: ${hl(`${o1} : ${o2}`)}`] };
    },
  });
})();
