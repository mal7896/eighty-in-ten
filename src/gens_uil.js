/* ===== problem types drawn from recent UIL and TMSCA high school tests, columns 1 and 2 ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn, m = NS.m;
  const blank = () => H.L('\\underline{\\phantom{0000}}', '');
  const cents = c => (c < 0 ? '−' : '') + (Math.abs(c) / 100).toFixed(2);
  const decQ = s => Q.parseNum(s);
  const decStr = v => Q.from(v).toDecStr().replace(/^(-?)0\./, '$1.');

  /* ---------- plain adding and subtracting (problems 1 and 2 on nearly every test) ---------- */
  G({
    id: 'addsub', trick: 'addSub', col: { ms: 1, hs: 1 }, lead: true,
    gen(r, lv) {
      const kd = r.pick(['add', 'add', 'sub', 'sub', 'neg', 'three', 'blank', 'money']);
      if (kd === 'add') { const a = r.int(110, 999), b = r.int(1001, 2999); const [x, y] = r.chance(0.5) ? [a, b] : [b, a]; const v = x + y;
        const big = Math.max(x, y), sm = Math.min(x, y), hund = Math.floor(sm / 100) * 100;
        return { p: H.cat(H.n(x), ' + ', H.n(y), ' ='), a: A.num(v), params: { kd, x, y }, steps: [`Start from the bigger number and add the smaller one in pieces: ${fm(big)} + ${hund} = ${fm(big + hund)}.`, `${fm(big + hund)} + ${sm - hund} = ${hl(fm(v))}`] }; }
      if (kd === 'sub' || kd === 'neg') { let x = r.int(1001, 2999), y = r.int(110, 999); if (kd === 'neg') { x = r.int(1500, 2099); y = x + r.int(12, 140); }
        const v = x - y;
        if (v > 0) { const up = Math.ceil(y / 100) * 100; return { p: H.cat(H.n(x), ' − ', H.n(y), ' ='), a: A.num(v), params: { kd, x, y }, steps: [`Round ${y} up to ${up}: ${fm(x)} − ${up} = ${fm(x - up)}.`, `You took away ${up - y} too many, so add it back: ${fm(x - up)} + ${up - y} = ${hl(fm(v))}`] }; }
        return { p: H.cat(H.n(x), ' − ', H.n(y), ' ='), a: A.num(v), params: { kd, x, y }, steps: [`The second number is bigger, so the answer is negative. Find the gap: ${fm(y)} − ${fm(x)} = ${y - x}.`, `Answer: ${hl(fm(v))}`] }; }
      if (kd === 'three') { const a = r.int(301, 899), b = r.int(150, a - 50), c = r.int(2, 30); const plus = r.chance(0.5); const v = plus ? a - b + c : a + b - c;
        return { p: plus ? H.cat(H.n(a), ' − ', H.n(b), ' + ', H.n(c), ' =') : H.cat(H.n(a), ' + ', H.n(b), ' − ', H.n(c), ' ='), a: A.num(v), params: { kd, a, b, c, plus },
          steps: [plus ? `Left to right: ${a} − ${b} = ${a - b}.` : `Left to right: ${a} + ${b} = ${a + b}.`, plus ? `${a - b} + ${c} = ${hl(fm(v))}` : `${a + b} − ${c} = ${hl(fm(v))}`] }; }
      if (kd === 'blank') { const f = r.pick(['xMinus', 'plusX', 'minusX']); const a = r.int(1100, 3999), b = r.int(105, 999);
        if (f === 'xMinus') { const v = a + b; return { p: H.cat(blank(), ' − ', H.n(b), ' = ', H.n(a)), a: A.num(v), params: { kd, f, a, b }, steps: [`The blank minus ${b} leaves ${fm(a)}, so the blank is ${fm(a)} + ${b}.`, `= ${hl(fm(v))}`] }; }
        if (f === 'plusX') { const v = b; return { p: H.cat(H.n(a), ' + ', blank(), ' = ', H.n(a + b)), a: A.num(v), params: { kd, f, a, b }, steps: [`The blank is the gap from ${fm(a)} up to ${fm(a + b)}.`, `${fm(a + b)} − ${fm(a)} = ${hl(v)}`] }; }
        const v = b; return { p: H.cat(H.n(a), ' − ', blank(), ' = ', H.n(a - b)), a: A.num(v), params: { kd, f, a, b }, steps: [`The blank is the gap from ${fm(a - b)} up to ${fm(a)}.`, `${fm(a)} − ${fm(a - b)} = ${hl(v)}`] }; }
      // money: three prices
      const cs = [r.int(101, 999), r.int(101, 999), r.int(1001, 2999)]; const minus = r.chance(0.35); const v = minus ? cs[0] - cs[1] + cs[2] : cs[0] + cs[1] + cs[2];
      return { p: H.cat(`$${cents(cs[0])} ${minus ? '−' : '+'} $${cents(cs[1])} + $${cents(cs[2])} =`), pre: '$', a: A.num(q(v, 100), 'money'), params: { kd, cs, minus },
        steps: [`Work in cents: ${cs[0]} ${minus ? '−' : '+'} ${cs[1]} + ${cs[2]} = ${v} cents.`, `That's $${hl(cents(v))}`] };
    },
  });

  /* ---------- decimal adding and subtracting ---------- */
  G({
    id: 'decAS', trick: 'addSub', col: { ms: 1, hs: 1 }, lead: true, eval: true,
    gen(r, lv, x = 1) {
      // real tests use small decimals here (12.4 − 8.55); the 3-digit, 3-place ones are for Hard and up
      const d = x >= 2 ? () => { const p = r.pick([1, 2, 3]); return Q.from(q(r.int(10 ** p * 10, 10 ** p * 999), 10 ** p)); } : () => { const p = r.pick([1, 2, 2]); return Q.from(q(r.int(10 ** p, 10 ** p * (r.chance(0.7) ? 99 : 199)), 10 ** p)); };
      const kd = r.pick(['add', 'sub', 'three']);
      let xs = kd === 'three' ? [d(), d(), d()] : [d(), d()];
      if (kd !== 'add' && xs[0].cmp(xs[1]) < 0) [xs[0], xs[1]] = [xs[1], xs[0]];
      const ops = kd === 'add' ? ['+'] : kd === 'sub' ? ['−'] : r.pick([['−', '−'], ['−', '+'], ['+', '−']]);
      let v = xs[0]; ops.forEach((o, i) => { v = o === '+' ? v.add(xs[i + 1]) : v.sub(xs[i + 1]); });
      const pr = [H.dec(xs[0])]; ops.forEach((o, i) => pr.push(` ${o} `, H.dec(xs[i + 1]))); pr.push(' =');
      const places = Math.max(...xs.map(x => (x.toDecStr().split('.')[1] || '').length));
      const pad = x => { const s = x.toDecStr(); const [w, f = ''] = s.split('.'); return places ? `${w}.${f.padEnd(places, '0')}` : w; };
      return { p: H.cat(...pr), form: '(decimal)', a: A.num(v, 'dec'), params: { xs: xs.map(x => x.toDecStr()), ops },
        steps: [`Line up the decimal points (fill in zeros): ${xs.map(pad).join(' ').replace(/ /g, ' · ')}.`.replace(/ · /g, ' and '), `${pad(xs[0])} ${ops.map((o, i) => `${o} ${pad(xs[i + 1])}`).join(' ')} = ${hl(decStr(v))}`] };
    },
  });

  /* ---------- dividing by friendly numbers ---------- */
  G({
    id: 'divide', trick: 'divideFriendly', col: { ms: 1, hs: 1 }, eval: true,
    gen(r) {
      const kd = r.pick(['by5', 'by25', 'byDec', 'byDec', 'smallDec', 'mixed']);
      if (kd === 'by5') { const n = r.int(1001, 9999); const v = q(n, 5);
        return { p: H.cat(H.n(n), ' ÷ 5 ='), form: v.isInt() ? undefined : '(decimal)', a: A.num(v, v.isInt() ? 'any' : 'dec'), params: { kd, n, d: '5' }, steps: [`Dividing by 5 is the same as doubling and dividing by 10.`, `${fm(n)} × 2 = ${fm(2 * n)}, then ÷ 10 = ${hl(decStr(v))}`] }; }
      if (kd === 'by25') { const n = r.int(101, 2999); const v = q(n, 25);
        return { p: H.cat(H.n(n), ' ÷ 25 ='), form: v.isInt() ? undefined : '(decimal)', a: A.num(v, v.isInt() ? 'any' : 'dec'), params: { kd, n, d: '25' }, steps: [`Dividing by 25 is the same as multiplying by 4 and dividing by 100.`, `${fm(n)} × 4 = ${fm(4 * n)}, then ÷ 100 = ${hl(decStr(v))}`] }; }
      if (kd === 'byDec') { const ds = r.pick(['0.25', '0.125', '0.4', '0.8', '1.25', '0.75', '2.5', '0.2', '0.375', '0.625']); const dv = decQ(ds); const inv = Q.from(1).div(dv);
        let n = r.int(12, 640); if (!Q.from(n).mul(inv).terminates()) n *= Number(inv.d); const v = Q.from(n).mul(inv);
        return { p: H.cat(H.n(n), ' ÷ ', H.dec(ds), ' ='), a: A.num(v), params: { kd, n, d: ds }, steps: [`${H.dec(ds).h} = ${H.Qi(dv).h}, and dividing by a fraction means multiplying by its flip, ${H.Qi(inv).h}.`, `${fm(n)} × ${H.Qi(inv).h} = ${hl(v.terminates() && !v.isInt() ? decStr(v) : H.Qf(v).h)}`] }; }
      if (kd === 'smallDec') { const dvr = r.pick([4, 5, 6, 8]); const v = Q.from(q(r.int(301, 1999), dvr === 8 ? 200 : 100)); const n = v.mul(dvr); const w = Math.floor(n.num() / dvr) * dvr;
        return { p: H.cat(H.dec(n), ' ÷ ', H.n(dvr), ' ='), form: '(decimal)', a: A.num(v, 'dec'), params: { kd, n: n.toDecStr(), d: String(dvr) }, steps: [`Split it into a part that divides evenly and the rest: ${w} + ${decStr(n.sub(w))}.`, `${w / dvr} + ${decStr(n.sub(w))} ÷ ${dvr} = ${hl(decStr(v))}`] }; }
      const dvr = r.pick([6, 7, 8, 12, -5, 5, 3]); const n = r.int(1001, 2999); if (n % dvr === 0) return this.gen(r);
      const v = q(n, dvr); const w = Math.trunc(n / dvr), rem = Math.abs(n - w * dvr);
      return { p: H.cat(H.n(n), ' ÷ ', dvr < 0 ? `(${dvr})` : H.n(dvr), ' ='), form: '(mixed number)', a: A.num(v, 'mixed'), params: { kd, n, d: String(dvr) },
        steps: [`${fm(n)} ÷ ${Math.abs(dvr)} = ${Math.abs(w)} remainder ${rem}${dvr < 0 ? ', and a positive divided by a negative is negative' : ''}.`, `Answer: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- percents with fractions and decimals in them ---------- */
  G({
    id: 'pctConv', trick: 'fdpTable', col: { ms: 1, hs: 1 },
    gen(r) {
      const kd = r.pick(['p2d', 'p2d', 'p2f', 'p2f', 'f2p']);
      if (kd === 'p2d') { const p = r.pick([Q.from(q(r.int(1, 99), 100)), Q.from(q(r.int(1, 19), 4)), Q.from(q(r.int(21, 79), 4)), Q.from(q(r.int(3, 39), 8)), Q.from(r.int(101, 350))]);
        const v = p.div(100); const show = p.isInt() || p.terminates() && p.d <= 2n ? H.dec(p) : (p.cmp(1) > 0 ? H.Qf(p) : H.dec(p));
        return { p: H.cat(show, '% ='), form: '(decimal)', a: A.num(v, 'dec'), params: { kd, p: p.toFracStr() }, steps: [`Percent means "out of 100", so divide by 100: move the decimal point two places left.`, `${show.h}% = ${H.dec(p).h} ÷ 100 = ${hl(decStr(v))}`] }; }
      if (kd === 'p2f') { const p = r.pick([Q.from(r.int(1, 99)), Q.from(q(r.int(1, 49) * 2 + 1, 2)), Q.from(q(r.int(1, 39) * 4 + r.pick([1, 3]), 4)), Q.from(q(r.int(1, 19) * 3 + r.pick([1, 2]), 3)), Q.from(q(r.pick([1, 3, 5, 7, 9]), 4)), Q.from(r.int(105, 375))]);
        const v = p.div(100); const show = p.isInt() ? H.n(p.n.toString()) : p.cmp(1) < 0 ? H.dec(p) : H.Qf(p);
        return { p: H.cat(show, '% ='), form: v.cmp(1) > 0 ? '(improper fraction)' : '(fraction)', a: A.num(v, 'frac'), params: { kd, p: p.toFracStr() }, steps: [`Put it over 100: ${show.h}% = ${H.Qi(p).h} ÷ 100.`, `${H.Qi(p).h} × ${m('\\tfrac{1}{100}')} = ${hl(H.Qi(v).h)}`] }; }
      const [a, b] = r.pick([[1, 16], [3, 16], [5, 16], [1, 8], [3, 8], [5, 8], [7, 8], [1, 32], [27, 25], [7, 40], [9, 40], [13, 20], [11, 80], [5, 4], [17, 16]]);
      const v = q(100 * a, b);
      return { p: H.cat(H.frac(a, b), ' ='), suffix: v.isInt() ? '%' : '% (decimal)', a: A.num(v, 'dec'), params: { kd, a, b }, steps: [`A fraction becomes a percent when you multiply by 100.`, `${H.frac(a, b).h} × 100 = ${hl(decStr(v))}%`] };
    },
  });

  /* ---------- n × k ± k·j: pull out the common factor ---------- */
  G({
    id: 'factorK', trick: 'factorOut', col: { ms: 1, hs: 1 }, eval: true,
    gen(r) {
      const k = r.pick([2, 3, 4, 4, 5, 6, 6, 8, 9, 12]); const round = r.pick([100, 1000, 1000, 2000, 1500, 2500, 1200]);
      const j = r.int(1, Math.min(12, round / 50)); const plus = r.chance(0.7);
      const n = plus ? round - j : round + j; const c = k * j; const v = n * k + (plus ? c : -c);
      const order = r.chance(0.5);
      const p = order ? H.cat(H.n(n), ' × ', H.n(k), plus ? ' + ' : ' − ', H.n(c), ' =') : H.cat(H.n(k), ' × ', H.n(n), plus ? ' + ' : ' − ', H.n(c), ' =');
      return { p, a: A.num(v), params: { n, k, c, plus },
        steps: [`${c} = ${k} × ${j}, so both parts have a factor of ${k}: ${k} × (${fm(n)} ${plus ? '+' : '−'} ${j}).`, `${k} × ${fm(round)} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- number patterns built on 9 and 8 ---------- */
  G({
    id: 'ninePat', trick: 'ninePatterns', col: { ms: 1, hs: 1 }, eval: true,
    gen(r) {
      const kd = r.pick(['ones', 'eights', 'eightsDown', 'nineEight', 'repunitSq']);
      if (kd === 'ones') { const d = r.int(2, 8); const n = Number('123456789'.slice(0, d)); const v = 9 * n + d + 1;
        return { p: H.cat('9 × ', H.n(n), ' + ', String(d + 1), ' ='), a: A.num(v), params: { kd, n, d }, steps: [`The pattern: 9 × 12 + 3 = 111, 9 × 123 + 4 = 1111, and so on. The answer has one more 1 than the number has digits.`, `${d} digits → ${d + 1} ones: ${hl(fm(v))}`] }; }
      if (kd === 'eights') { const d = r.int(1, 5); const n = Number('98765'.slice(0, d)); const add = 8 - d; const v = n * 9 + add;
        return { p: H.cat(H.n(n), ' × 9 + ', String(add), ' ='), a: A.num(v), params: { kd, n, add }, steps: [`The pattern: 9 × 9 + 7 = 88, 98 × 9 + 6 = 888, 987 × 9 + 5 = 8888. Each step down adds an 8.`, `${d} digit${d > 1 ? 's' : ''} → ${d + 1} eights: ${hl(fm(v))}`] }; }
      if (kd === 'eightsDown') { const d = r.int(2, 6); const n = Number('654321'.slice(6 - d)); const v = 9 * n - 1;
        return { p: H.cat('9 × ', H.n(n), ' − 1 ='), a: A.num(v), params: { kd, n }, steps: [`9 × 21 − 1 = 188, 9 × 321 − 1 = 2888, 9 × 4321 − 1 = 38888: one less than the first digit, then a row of 8s.`, `${d - 1}, then ${d} eights: ${hl(fm(v))}`] }; }
      if (kd === 'nineEight') { const d = r.int(2, 8); const n = Number('123456789'.slice(0, d)); const v = n * 8 + d;
        return { p: H.cat(H.n(n), ' × 8 + ', String(d), ' ='), a: A.num(v), params: { kd, n, d }, steps: [`The pattern: 12 × 8 + 2 = 98, 123 × 8 + 3 = 987. The digits count down from 9.`, `${d} digits counting down from 9: ${hl(fm(v))}`] }; }
      const d = r.int(3, 7); const n = Number('1'.repeat(d)); const v = BigInt(n) * BigInt(n);
      return { p: H.cat(H.pow(n, 2), ' ='), a: A.num(new Q(v)), params: { kd, n }, steps: [`A string of ones squared counts up and back down: 111² = 12321.`, `Up to ${d} and back: ${hl(fm(v.toString()))}`] };
    },
  });

  /* ---------- a² − b² = c × ___ ---------- */
  G({
    id: 'dsqBlank', trick: 'diffsq', col: { ms: 2, hs: 1 },
    gen(r) {
      let a, b; do { a = r.int(11, 39); b = r.int(5, a + 9); } while (a === b || Math.abs(a - b) > 12);
      const v0 = a * a - b * b; const choices = [a + b, Math.abs(a - b), 9].filter(c => c > 1 && v0 % c === 0);
      const c = r.pick(choices); const v = v0 / c;
      return { p: H.cat(H.pow(a, 2), ' − ', H.pow(b, 2), ' = ', H.n(c), ' × ', blank()), a: A.num(v), params: { a, b, c },
        steps: [`${m('a^2 - b^2 = (a - b)(a + b)')}: ${a}² − ${b}² = (${a - b})(${a + b}).`, `${a - b} × ${a + b} = ${v0}, and ${v0} ÷ ${c} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- GCD and LCM combinations ---------- */
  G({
    id: 'gcdLcm2', trick: 'gcdLcm', col: { ms: 2, hs: 1 },
    gen(r) {
      const g = r.pick([2, 3, 4, 6, 7, 8, 12, 13, 14, 17]); let x, y; do { x = r.int(2, 7); y = r.int(2, 8); } while (x === y || M.gcd(x, y) !== 1);
      const a = g * x, b = g * y; const L = a * b / g; const kd = r.pick(['sum', 'diff', 'times']);
      if (kd === 'sum') return { p: H.cat(`The sum of the LCM and the GCD of ${a} and ${b} is`), a: A.num(L + g), params: { kd, a, b }, steps: [`GCD(${a}, ${b}) = ${g}. LCM = ${a} × ${b} ÷ ${g} = ${L}.`, `${L} + ${g} = ${hl(L + g)}`] };
      if (kd === 'diff') return { p: H.cat(`The GCD of ${a} and ${b} minus their LCM is`), a: A.num(g - L), params: { kd, a, b }, steps: [`GCD = ${g}. LCM = ${a} × ${b} ÷ ${g} = ${L}.`, `${g} − ${L} = ${hl(fm(g - L))}`] };
      return { p: H.cat(`The LCM of ${a} and ${b} is ${a} ×`), a: A.num(L / a), params: { kd, a, b }, steps: [`The LCM is ${a} times whatever ${b} has that ${a} doesn't: ${b} ÷ GCD(${a}, ${b}) = ${b} ÷ ${g}.`, `= ${hl(L / a)}`] };
    },
  });

  /* ---------- more divisor questions ---------- */
  G({
    id: 'divisors2', trick: 'divisors', col: { ms: 3, hs: 1 },
    gen(r) {
      const kd = r.pick(['sum', 'properSum', 'properProd', 'primeSum', 'bigPrime', 'countProd']);
      if (kd === 'sum' || kd === 'properSum') { const n = r.pick([12, 16, 18, 20, 24, 25, 26, 28, 30, 32, 36, 40, 45, 49, 50, 64, 81, 100]); const f = M.factor(n);
        const s = f.reduce((t, [p, e]) => t * (p ** (e + 1) - 1) / (p - 1), 1); const v = kd === 'sum' ? s : s - n;
        return { p: H.cat(kd === 'sum' ? `The sum of the positive divisors of ${n} is` : `The sum of the proper divisors of ${n} is`), a: A.num(v), params: { kd, n },
          steps: [`${n} = ${f.map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}. Sum of divisors: ${f.map(([p, e]) => `(${Array.from({ length: e + 1 }, (_, i) => p ** i).join(' + ')})`).join(' × ')} = ${s}.`, kd === 'sum' ? `= ${hl(s)}` : `Proper divisors leave out ${n} itself: ${s} − ${n} = ${hl(v)}`] }; }
      if (kd === 'properProd') { const n = r.pick([8, 16, 25, 27, 49, 32, 81, 10, 14, 15, 21]); const ds = M.divisors(n).filter(d => d < n); const v = ds.reduce((x, y) => x * y, 1);
        return { p: H.cat(`The product of the proper divisors of ${n} is`), a: A.num(v), params: { kd, n }, steps: [`Proper divisors of ${n}: ${ds.join(', ')}.`, `${ds.join(' × ')} = ${hl(fm(v))}`] }; }
      if (kd === 'primeSum') { const n = r.pick([26, 30, 42, 66, 70, 78, 105, 135, 110, 130, 154, 165, 182, 210]); const ps = M.factor(n).map(([p]) => p); const v = ps.reduce((x, y) => x + y, 0);
        return { p: H.cat(`The sum of the prime divisors of ${n} is`), a: A.num(v), params: { kd, n }, steps: [`${n} = ${M.factor(n).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}. Each prime counts once.`, `${ps.join(' + ')} = ${hl(v)}`] }; }
      if (kd === 'bigPrime') { const [a, b] = [r.pick([38, 34, 46, 51, 57, 58, 62, 69, 74, 87, 93]), r.pick([27, 12, 25, 16, 45, 35])]; const n = a * b; const ps = M.factor(n).map(([p]) => p); const v = Math.max(...ps);
        return { p: H.cat(`The largest prime divisor of ${a} × ${b} is`), a: A.num(v), params: { kd, n }, steps: [`Factor each part instead of multiplying: ${a} = ${M.factor(a).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}, ${b} = ${M.factor(b).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}.`, `Largest prime: ${hl(v)}`] }; }
      const ps = r.pick([[2, 3, 5, 7], [2, 3, 5], [2, 5, 6], [2, 3, 4, 5], [4, 9, 5], [8, 3, 7]]); const n = ps.reduce((x, y) => x * y, 1); const f = M.factor(n); const v = f.reduce((t, [, e]) => t * (e + 1), 1);
      return { p: H.cat(`The number of positive integral divisors of ${ps.join(' × ')} is`), a: A.num(v), params: { kd, n }, steps: [`Write it as primes: ${f.map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}.`, `Add 1 to each exponent and multiply: ${f.map(([, e]) => e + 1).join(' × ')} = ${hl(v)}`] };
    },
  });

  /* ---------- mean, median, mode, range ---------- */
  G({
    id: 'stats', trick: 'meanMedian', col: { ms: 1, hs: 1 },
    gen(r) {
      const kd = r.pick(['medMode', 'rangeMode', 'missing', 'mean', 'medModeRange']);
      if (kd === 'missing') { const k = r.int(4, 6); const xs = Array.from({ length: k - 1 }, () => r.int(2, 30)); const mean = r.int(Math.ceil(xs.reduce((a, b) => a + b) / k) + 1, 35); const v = mean * k - xs.reduce((a, b) => a + b);
        return { p: H.cat(`The arithmetic mean of ${xs.join(', ')} and `, blank(), ` is ${mean}.`), a: A.num(v), params: { kd, xs, mean }, steps: [`${k} numbers with mean ${mean} add up to ${k} × ${mean} = ${k * mean}.`, `${k * mean} − (${xs.join(' + ')}) = ${hl(v)}`] }; }
      if (kd === 'mean') { const k = r.pick([5, 6, 8]); let xs; do { xs = Array.from({ length: k }, () => r.int(1, 12)); } while (xs.reduce((a, b) => a + b) % k !== 0 && r.chance(0.6));
        const v = q(xs.reduce((a, b) => a + b), k); return { p: H.cat(`The arithmetic mean of ${xs.join(', ')} is`), a: A.num(v), params: { kd, xs }, steps: [`Add them: ${xs.join(' + ')} = ${xs.reduce((a, b) => a + b)}.`, `Divide by ${k}: ${hl(H.Qf(v).h)}`] }; }
      // a list with one clear mode
      let xs; do { const md = r.int(0, 9); xs = r.shuffle([md, md, md, ...Array.from({ length: r.int(5, 8) }, () => r.int(0, 9))]); } while (!uniqueMode(xs));
      const s = xs.slice().sort((a, b) => a - b), L = s.length; const med = L % 2 ? q(s[(L - 1) / 2]) : q(s[L / 2 - 1] + s[L / 2], 2);
      const mode = uniqueMode(xs); const range = s[L - 1] - s[0];
      const sorted = `In order: ${s.join(', ')}.`;
      if (kd === 'medMode') { const v = med.add(mode); return { p: H.cat(`The sum of the median and the mode of ${xs.join(', ')} is`), a: A.num(v), params: { kd, xs }, steps: [sorted, `Median ${H.Qf(med).h}, mode ${mode}: ${H.Qf(med).h} + ${mode} = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'rangeMode') { const v = range - mode; return { p: H.cat(`For the set {${xs.join(', ')}}, the range minus the mode is`), a: A.num(v), params: { kd, xs }, steps: [sorted, `Range ${s[L - 1]} − ${s[0]} = ${range}. Mode ${mode}. ${range} − ${mode} = ${hl(fm(v))}`] }; }
      const v = med.add(mode).add(range); return { p: H.cat(`The sum of the median, the mode and the range of ${xs.join(', ')} is`), a: A.num(v), params: { kd, xs }, steps: [sorted, `Median ${H.Qf(med).h} + mode ${mode} + range ${range} = ${hl(H.Qf(v).h)}`] };
    },
  });
  function uniqueMode(xs) { const c = {}; xs.forEach(x => { c[x] = (c[x] || 0) + 1; }); const top = Math.max(...Object.values(c)); const ks = Object.keys(c).filter(k => c[k] === top); return ks.length === 1 ? +ks[0] : null; }

  /* ---------- shopping, tax and pay ---------- */
  G({
    id: 'consumer2', trick: 'consumer', col: { ms: 2, hs: 1 },
    gen(r) {
      const kd = r.pick(['unitCost', 'gallons', 'perUnit', 'tax', 'salary', 'salary2', 'pctMoney']);
      if (kd === 'unitCost') { const n = r.pick([3, 4, 5, 6]); const each = r.int(8, 45); const c = n * each; const k = r.pick([10, 12, 15, 20, 24]); const v = each * k;
        return { p: H.cat(`If ${n} pens cost ${c} cents, then ${k} pens cost`), pre: '$', a: A.num(q(v, 100), 'money'), params: { kd, n, c, k }, steps: [`One pen costs ${c} ÷ ${n} = ${each} cents.`, `${k} × ${each} = ${v} cents = $${hl(cents(v))}`] }; }
      if (kd === 'gallons') { const g = r.pick([5, 6, 8, 12, 15]); const pc = r.int(249, 399); const v = g * pc;
        return { p: H.cat(`${g} gallons at $${cents(pc)} a gallon costs`), pre: '$', a: A.num(q(v, 100), 'money'), params: { kd, g, pc }, steps: [`Round the price up to $${cents(Math.ceil(pc / 100) * 100)} and take back the extra: ${g} × ${Math.ceil(pc / 100) * 100 - pc} = ${g * (Math.ceil(pc / 100) * 100 - pc)} cents.`, `${g} × $${cents(Math.ceil(pc / 100) * 100)} − $${cents(g * (Math.ceil(pc / 100) * 100 - pc))} = $${hl(cents(v))}`] }; }
      if (kd === 'perUnit') { const [u, big, k] = r.pick([['ounce', 'a pound', 16], ['pint', 'a gallon', 8], ['cup', 'a quart', 4], ['quart', 'a gallon', 4]]);
        const pc = r.int(35, 260); const n = r.pick([2, 3, 4].filter(t => t < k)); const v = pc * k;
        return { p: H.cat(`If ${n} ${u}s sell for $${cents(pc * n)}, then ${big} costs`), pre: '$', a: A.num(q(v, 100), 'money'), params: { kd, pc, n, k, u }, steps: [`${big[0].toUpperCase() + big.slice(1)} is ${k} ${u}s, and one ${u} costs $${cents(pc)}.`, `${k} × $${cents(pc)} = $${hl(cents(v))}`] }; }
      if (kd === 'tax') { const price = r.pick([20, 40, 60, 80, 120, 200]); const rate = r.pick([q(13, 2), q(15, 2), q(17, 2), q(25, 4), q(33, 4)]); const v = Q.from(price).mul(rate).div(100);
        return { p: H.cat(`The sales tax on a $${price}.00 item at ${H.dec(rate).h}% is`), pre: '$', a: A.num(v, 'money'), params: { kd, price, rate: rate.toFracStr() }, steps: [`${H.dec(rate).h}% of ${price} = ${price} × ${H.dec(rate).h} ÷ 100.`, `= $${hl(Number(v.num()).toFixed(2))}`] }; }
      if (kd === 'salary' || kd === 'salary2') { const s = r.pick([600, 640, 720, 780, 800, 840, 900, 960]); const p1 = r.pick([5, 10, 4, 3]); const up = r.chance(0.7); let v = Q.from(s).mul(100 + (up ? p1 : -p1)).div(100); let step2 = '';
        if (kd === 'salary2') { const p2 = r.pick([2, 5, 10]); const before = v; v = v.mul(100 + p2).div(100); if (!v.mul(100).isInt()) return this.gen(r); step2 = ` Then ${p2}% more: ${Number(before.num()).toFixed(2)} × ${(1 + p2 / 100).toFixed(2)} = ${Number(v.num()).toFixed(2)}.`;
          return { p: H.cat(`A weekly salary of $${s} is raised ${p1}%, and then the new salary is raised ${p2}%. The final salary is`), pre: '$', a: A.num(v, 'money'), params: { kd, s, p1, p2, up }, steps: [`${p1}% of ${s} is ${s * p1 / 100}, so ${s} + ${s * p1 / 100} = ${s + s * p1 / 100}.${step2}`, `$${hl(Number(v.num()).toFixed(2))}`] }; }
        return { p: H.cat(`A weekly salary of $${s} is ${up ? 'increased' : 'decreased'} ${p1}%. The new salary is`), pre: '$', a: A.num(v, 'money'), params: { kd, s, p1, up }, steps: [`${p1}% of ${s} = ${H.dec(q(s * p1, 100)).h}.`, `${s} ${up ? '+' : '−'} ${H.dec(q(s * p1, 100)).h} = $${hl(Number(v.num()).toFixed(2))}`] }; }
      const [pq, pf] = r.pick([['37.5', q(3, 8)], ['62.5', q(5, 8)], ['12.5', q(1, 8)], ['87.5', q(7, 8)], ['75', q(3, 4)], ['20', q(1, 5)], ['60', q(3, 5)]]); const amt = Number(pf.d) * r.int(30, 600);
      const v = pf.mul(q(amt, 100));
      return { p: H.cat(`${pq}% of $${cents(amt)} is`), pre: '$', a: A.num(v, 'money'), params: { kd, pq, amt }, steps: [`${pq}% = ${H.Qi(pf).h}.`, `${H.Qi(pf).h} × ${cents(amt)} = $${hl(Number(v.num()).toFixed(2))}`] };
    },
  });

  /* ---------- conversions with a given rate ---------- */
  G({
    id: 'rateConv', trick: 'units', col: { ms: 2, hs: 1 },
    gen(r) {
      const kd = r.pick(['gram', 'gram2', 'deka']);
      if (kd === 'gram') { const oz = r.pick([2, 4, 6, 8, 12, 1.6, 3.2, 0.8, 9.6]); const v = Q.from(String(oz)).div(decQ('0.04'));
        return { p: H.cat(`If 1 gram = .04 oz, then ${oz} oz =`), suffix: 'grams', a: A.num(v), params: { kd, oz: String(oz), per: '0.04', g: 1 }, steps: [`Each gram is .04 oz, so divide: ${oz} ÷ .04 = ${oz} × 25.`, `= ${hl(H.Qf(v).h)} grams`] }; }
      if (kd === 'gram2') { const g = r.pick([2, 5, 4]); const per = Q.from(q(4 * g, 100)); const oz = r.pick([6, 3, 12, 2.4, 1.2]); const v = Q.from(String(oz)).div(per).mul(g);
        return { p: H.cat(`If ${g} grams = ${H.dec(per).h} oz, then ${oz} oz =`), suffix: 'grams', a: A.num(v), params: { kd, oz: String(oz), per: per.toDecStr(), g }, steps: [`${g} grams is ${H.dec(per).h} oz, so 1 oz is ${g} ÷ ${H.dec(per).h} grams.`, `${oz} × ${g} ÷ ${H.dec(per).h} = ${hl(H.Qf(v).h)} grams`] }; }
      const per = r.pick(['0.4', '0.35', '0.5']); const oz = r.pick(per === '0.35' ? ['7', '2.1', '14'] : per === '0.5' ? ['3', '4.5', '6'] : ['2.6', '4', '6', '1.2']); const dk = Q.from(oz).div(decQ(per)); const v = dk.mul(10);
      return { p: H.cat(`If 1 dekagram = ${H.dec(per).h} oz, then ${oz} oz =`), suffix: 'grams', a: A.num(v), params: { kd, oz, per, g: 10 }, steps: [`${oz} ÷ ${H.dec(per).h} = ${H.Qf(dk).h} dekagrams. A dekagram is 10 grams.`, `${H.Qf(dk).h} × 10 = ${hl(H.Qf(v).h)} grams`] };
    },
  });

  /* ---------- units, mixed and partial ---------- */
  const U = { gallon: { quart: 4, pint: 8, cup: 16, 'fluid ounce': 128 }, quart: { pint: 2, cup: 4, 'fluid ounce': 32 }, foot: { inch: 12 }, yard: { foot: 3, inch: 36 }, peck: { quart: 8 }, bushel: { peck: 4, quart: 32 }, fathom: { foot: 6, inch: 72 }, minute: { second: 60 }, hour: { minute: 60 }, pound: { ounce: 16 } };
  const pl = u => ({ foot: 'feet', inch: 'inches', 'fluid ounce': 'fluid ounces', pint: 'pints', quart: 'quarts', cup: 'cups', gallon: 'gallons', yard: 'yards', peck: 'pecks', bushel: 'bushels', fathom: 'fathoms', minute: 'minutes', second: 'seconds', hour: 'hours', pound: 'pounds', ounce: 'ounces' })[u];
  NS.UCONV = U;
  G({
    id: 'unitsMore', trick: 'units', col: { ms: 2, hs: 1 },
    gen(r) {
      const kd = r.pick(['fracOf', 'pctOf', 'down', 'up']);
      if (kd === 'fracOf') { const [big, small] = r.pick([['gallon', 'quart'], ['gallon', 'pint'], ['foot', 'inch'], ['yard', 'foot'], ['pound', 'ounce'], ['hour', 'minute']]); const f = U[big][small];
        let a, b, num, den, tot; do { a = r.int(1, 6); b = r.int(1, f - 1); tot = a * f + b; den = r.pick([2, 3, 4, 5, 7, 8]); num = r.int(1, den - 1); } while (tot % den || M.gcd(num, den) !== 1);
        const target = small === 'quart' && r.chance(0.5) ? 'pint' : small; const tf = target === small ? 1 : U[small][target]; const v = tot * num / den * tf;
        return { p: H.cat(H.frac(num, den), ` of ${a} ${a > 1 ? pl(big) : big} ${b} ${b > 1 ? pl(small) : small} =`), suffix: pl(target), a: A.num(v), params: { kd, big, small, a, b, num, den, target },
          steps: [`Convert to ${pl(small)} first: ${a} × ${f} + ${b} = ${tot} ${pl(small)}${tf > 1 ? `, which is ${tot * tf} ${pl(target)}` : ''}.`, `${H.frac(num, den).h} of ${tot * tf} = ${hl(v)}`] }; }
      if (kd === 'pctOf') { const [small, n] = r.pick([['cup', r.pick([2, 3, 4, 6, 10, 12])], ['fluid ounce', r.pick([16, 32, 8, 48, 64, 96])], ['pint', r.pick([1, 3, 5, 6])], ['quart', r.pick([1, 3])]]); const f = U.gallon[small]; const v = q(100 * n, f);
        return { p: H.cat(`${n} ${n > 1 ? pl(small) : small} is what percent of a gallon?`), suffix: '%', a: A.num(v), params: { kd, small, n }, steps: [`A gallon is ${f} ${pl(small)}.`, `${n} ÷ ${f} × 100 = ${hl(H.Qf(v).h)}%`] }; }
      const [big, small] = r.pick([['bushel', 'peck'], ['fathom', 'foot'], ['quart', 'cup'], ['gallon', 'quart'], ['minute', 'second'], ['yard', 'inch'], ['foot', 'inch']]); const f = U[big][small];
      if (kd === 'down') { const n = r.pick([q(r.int(2, 30)), q(r.int(3, 19), 2), q(r.int(5, 39), 4)]); const v = n.mul(f);
        return { p: H.cat(n.isInt() ? H.n(n.n.toString()) : H.Qf(n), ` ${pl(big)} =`), suffix: pl(small), a: A.num(v), params: { kd, big, small, n: n.toFracStr() }, steps: [`Big unit to small unit: multiply. 1 ${big} = ${f} ${pl(small)}.`, `${H.Qf(n).h} × ${f} = ${hl(H.Qf(v).h)}`] }; }
      const n = r.int(f + 1, f * 150); const v = q(n, f); const dec = v.terminates();
      return { p: H.cat(H.n(n), ` ${pl(small)} =`), suffix: pl(big) + (dec && !v.isInt() ? ' (decimal)' : ''), a: A.num(v, dec ? 'any' : 'mixed'), params: { kd, big, small, n: String(n) }, steps: [`Small unit to big unit: divide. 1 ${big} = ${f} ${pl(small)}.`, `${fm(n)} ÷ ${f} = ${hl(dec ? decStr(v) : H.Qf(v).h)}`] };
    },
  });

  /* ---------- percents: two at a time ---------- */
  G({
    id: 'pctPlus', trick: 'percent', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['isPctOf', 'isPctOf', 'repPct', 'chain', 'moreLess', 'relChain']);
      if (kd === 'isPctOf') { const f = r.pick(['ofBlank', 'pctBlank']);
        if (f === 'ofBlank') { const a = r.pick([12, 16, 18, 19, 24, 25, 36, 48]); const k = r.pick([2, 3, 4, 1.5]); const b = a * k; const x = k === 1.5 ? r.int(3, 40) * 30 : r.int(3, 40) * k * 10; const v = Q.from(q(a * x)).div(Q.from(String(b)));
          return { p: H.cat(`${a}% of ${fm(x)} is ${b}% of`), a: A.num(v), params: { kd, f, a, x, b: String(b) }, steps: [`${a}% of ${fm(x)} = ${b}% of the blank, and ${b}% is ${k} times ${a}%, so the blank is ${fm(x)} ÷ ${k}.`, `= ${hl(H.Qf(v).h)}`] }; }
        const a = r.pick([12, 18, 20, 24, 30, 36, 15]); const x = r.pick([200, 300, 400, 600, 800, 900]); const y = r.pick([100, 200, 300, 150, 400].filter(t => t !== x)); const v = q(a * x, y);
        return { p: H.cat(`${a}% of ${x} is what percent of ${y}?`), suffix: '%', a: A.num(v), params: { kd, f, a, x, y }, steps: [`${a}% of ${x} = ${H.Qf(q(a * x, 100)).h}.`, `${H.Qf(q(a * x, 100)).h} out of ${y} is ${hl(H.Qf(v).h)}%`] }; }
      if (kd === 'repPct') { const [label, frac] = r.pick([['58.333…', q(7, 12)], ['41.666…', q(5, 12)], ['83.333…', q(5, 6)], ['16.666…', q(1, 6)], ['66.666…', q(2, 3)], ['44.444…', q(4, 9)], ['55.555…', q(5, 9)], ['14.2857…', q(1, 7)]]);
        const base = r.int(2, 15) * Number(frac.d); const part = frac.mul(base);
        return { p: H.cat(`${fm(Number(part.n))} is ${label}% of`), a: A.num(base), params: { kd, frac: frac.toFracStr(), part: part.toFracStr() }, steps: [`${label}% is ${H.Qi(frac).h}.`, `${Number(part.n)} ÷ ${H.Qi(frac).h} = ${hl(fm(base))}`] }; }
      if (kd === 'chain') { const [f1, f1l] = r.pick([[q(1, 4), H.frac(1, 4).h], [q(5, 8), H.frac(5, 8).h], [q(3, 8), H.frac(3, 8).h], [q(2, 5), H.frac(2, 5).h], [q(2, 3), H.frac(2, 3).h]]); const [p2, f2] = r.pick([['37.5', q(3, 8)], ['75', q(3, 4)], ['25', q(1, 4)], ['62.5', q(5, 8)], ['40', q(2, 5)]]);
        const n = r.pick([32, 48, 64, 40, 80, 96, 120, 160]); const v = f1.mul(f2).mul(n);
        return { p: H.cat(`${f1l} of ${p2}% of ${n} is`), a: A.num(v), params: { kd, f1: f1.toFracStr(), f2: f2.toFracStr(), n }, steps: [`${p2}% = ${H.Qi(f2).h}. Multiply the fractions first: ${f1l} × ${H.Qi(f2).h} = ${H.Qi(f1.mul(f2)).h}.`, `${H.Qi(f1.mul(f2)).h} × ${n} = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'moreLess') { let a, b; do { a = r.pick([q(r.int(4, 60)), q(r.int(7, 49) * 2 + 1, 2)]); b = r.pick([q(r.int(4, 60)), q(r.int(7, 49) * 2 + 1, 2)]); } while (a.eq(b) || !b.sub(a).abs().div(a).mul(100).mul(3).isInt());
        const v = b.sub(a).abs().div(a).mul(100); const more = b.cmp(a) > 0;
        return { p: H.cat(H.Qf(b), ` is what percent ${more ? 'more' : 'less'} than `, H.Qf(a), '?'), suffix: '%', a: A.num(v), params: { kd, a: a.toFracStr(), b: b.toFracStr() }, steps: [`Change ÷ original: ${H.Qf(b.sub(a).abs()).h} ÷ ${H.Qf(a).h}.`, `× 100 = ${hl(H.Qf(v).h)}%`] }; }
      const [f1, f2] = [r.pick([q(4, 5), q(3, 4), q(2, 3), q(3, 5), q(5, 8)]), r.pick([q(1, 2), q(1, 4), q(2, 5), q(3, 4)])]; const v = Q.from(1).div(f1.mul(f2)).mul(100);
      if (!v.isInt() && !v.mul(3).isInt()) return this.gen(r);
      return { p: H.cat('If P is ', H.Qi(f1), ' of Q and Q is ', H.Qi(f2), ' of R, then R is what percent of P?'), suffix: '%', a: A.num(v), params: { kd, f1: f1.toFracStr(), f2: f2.toFracStr() },
        steps: [`P = ${H.Qi(f1).h} × ${H.Qi(f2).h} × R = ${H.Qi(f1.mul(f2)).h} R.`, `So R is ${H.Qi(Q.from(1).div(f1.mul(f2))).h} of P = ${hl(H.Qf(v).h)}%`] };
    },
  });

  /* ---------- sums of decimals and repeating decimals ---------- */
  G({
    id: 'repSum', trick: 'repeating', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['decFrac', 'repSum', 'recip']);
      if (kd === 'decFrac') { const den = r.pick([8, 16]); const ks = r.shuffle(Array.from({ length: den - 1 }, (_, i) => i + 1).filter(i => den === 16 ? i % 2 : true)).slice(0, 3).sort((a, b) => a - b);
        const signs = r.pick([['+', '+'], ['+', '−'], ['−', '+']]); let v = q(ks[0], den); ks.slice(1).forEach((k, i) => { v = signs[i] === '+' ? v.add(q(k, den)) : v.sub(q(k, den)); });
        const ds = ks.map(k => H.dec(q(k, den)).h);
        return { p: H.cat(`${ds[0]} ${signs[0]} ${ds[1]} ${signs[1]} ${ds[2]} =`), form: '(fraction)', a: A.num(v, 'frac'), params: { kd, ks, den, signs }, steps: [`These are ${den}ths: ${ks.map(k => `${k}/${den}`).join(', ')}.`, `${ks[0]} ${signs[0]} ${ks[1]} ${signs[1]} ${ks[2]} = ${ks[0] + (signs[0] === '+' ? ks[1] : -ks[1]) + (signs[1] === '+' ? ks[2] : -ks[2])}, over ${den}: ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'repSum') { const ds = r.distinct(3, 1, 8); const v = q(ds[0] + ds[1] + ds[2], 9);
        return { p: H.cat(ds.map(d => `.${d}${d}${d}…`).join(' + '), ' ='), a: A.num(v), params: { kd, ds }, steps: [`Each one is ninths: ${ds.map(d => `${d}/9`).join(' + ')}.`, `${ds.reduce((a, b) => a + b)}/9 = ${hl(H.Qf(v).h)}`] }; }
      const [txt, val] = r.pick([['2.777…', q(25, 9)], ['0.08333…', q(1, 12)], ['0.41666…', q(5, 12)], ['1.41666…', q(17, 12)], ['0.91666…', q(11, 12)], ['1.222…', q(11, 9)], ['0.1666…', q(1, 6)], ['2.333…', q(7, 3)], ['0.58333…', q(7, 12)]]);
      const which = r.pick(['multiplicative', 'multiplicative', 'additive']); const v = which === 'additive' ? val.neg() : Q.from(1).div(val);
      return { p: H.cat(`The ${which} inverse of ${txt.replace(/^0\./, '.')} is`), a: A.num(v), params: { kd, val: val.toFracStr(), which }, steps: [`${txt.replace(/^0\./, '.')} = ${H.Qi(val).h}.`, which === 'additive' ? `Change the sign: ${hl(H.Qi(v).h)}` : `Flip it: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- the term next to a given term ---------- */
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  NS.SEQFAM = {
    arith: (a, d) => n => a + (n - 1) * d, tri: () => n => n * (n + 1) / 2, prime: () => n => PRIMES[n - 1], cube: () => n => n ** 3, geo: (a, k) => n => a * k ** (n - 1), plus: (a) => n => a + (n - 1) * n / 2, sq: () => n => n * n,
  };
  G({
    id: 'seqNeighbor', trick: 'sequences', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['arith', 'tri', 'prime', 'cube', 'geo', 'plus', 'sq']); let f, a, d, why;
      if (kd === 'arith') { a = r.int(1, 30); d = r.int(2, 9); f = NS.SEQFAM.arith(a, d); why = n => `Each step adds ${d}.`; }
      else if (kd === 'tri') { f = NS.SEQFAM.tri(); why = n => `Term n of the triangular numbers is the previous one plus n.`; }
      else if (kd === 'prime') { f = NS.SEQFAM.prime(); why = () => `These are the primes.`; }
      else if (kd === 'cube') { f = NS.SEQFAM.cube(); why = () => `These are the cubes.`; }
      else if (kd === 'geo') { a = 1; d = r.pick([2, 3]); f = NS.SEQFAM.geo(1, d); why = () => `Each term is ${d} times the one before.`; }
      else if (kd === 'plus') { a = r.int(1, 3); f = NS.SEQFAM.plus(a); why = n => `The gaps go up by one each time (1, 2, 3, …), so term n is term n − 1 plus ${'n − 1'}.`; }
      else { f = NS.SEQFAM.sq(); why = () => `These are the squares.`; }
      const n = kd === 'prime' ? r.int(9, 20) : kd === 'geo' ? r.int(6, d === 2 ? 11 : 8) : r.int(10, 18);
      const back = kd === 'arith' && r.chance(0.5) ? r.pick([-3, -2, 2, 3, 5]) : -1; const t = n + back;
      const first = [1, 2, 3, 4, 5].map(f); const v = f(t);
      const gap = back === -1 ? (kd === 'tri' ? `${fm(f(n))} − ${n} = ${hl(fm(v))}` : kd === 'plus' ? `${fm(f(n))} − ${n - 1} = ${hl(fm(v))}` : kd === 'geo' ? `${fm(f(n))} ÷ ${d} = ${hl(fm(v))}` : kd === 'arith' ? `${fm(f(n))} − ${d} = ${hl(fm(v))}` : `It's term ${t}: ${hl(fm(v))}`) : `${back > 0 ? 'Go up' : 'Go down'} ${Math.abs(back)} steps of ${d}: ${fm(f(n))} ${back > 0 ? '+' : '−'} ${Math.abs(back) * d} = ${hl(fm(v))}`;
      return { p: H.cat(`The ${NS.ord(n)} term of ${first.map(fm).join(', ')}, … is ${fm(f(n))}. The ${NS.ord(t)} term is`), a: A.num(v), params: { kd, a, d, n, t }, steps: [why(n), gap] };
    },
  });

  /* ---------- more sums ---------- */
  G({
    id: 'sumsMore', trick: 'sums', col: { ms: 2, hs: 2 }, series: true,
    gen(r) {
      const kd = r.pick(['tri', 'oddCount', 'sigma', 'cubeRoot']);
      if (kd === 'tri') { const n = r.int(5, 11); const ts = Array.from({ length: n }, (_, i) => (i + 1) * (i + 2) / 2); const v = n * (n + 1) * (n + 2) / 6;
        return { p: H.cat(`${ts.slice(0, 4).join(' + ')} + … + ${ts[n - 1]} =`), a: A.num(v), params: { kd, n }, steps: [`These are the first ${n} triangular numbers. Their sum is ${m('\\tfrac{n(n+1)(n+2)}{6}')}.`, `${n} × ${n + 1} × ${n + 2} ÷ 6 = ${hl(fm(v))}`] }; }
      if (kd === 'oddCount') { const k = r.pick([5, 5, 7]); const a = r.int(11, 60), d = r.int(5, 15) * (r.chance(0.2) ? -1 : 1); const xs = Array.from({ length: k }, (_, i) => a + i * d); if (xs.some(x => x <= 0)) return this.gen(r); const mid = xs[(k - 1) / 2]; const v = k * mid;
        return { p: H.cat(xs.join(' + '), ' ='), a: A.num(v), params: { kd, xs }, steps: [`Evenly spaced with an odd count, so the sum is the count times the middle term.`, `${k} × ${mid} = ${hl(fm(v))}`] }; }
      if (kd === 'sigma') { const n = r.int(5, 12); const f = r.pick(['alt', 'lin']); let v = 0;
        if (f === 'alt') { for (let k = 1; k <= n; k++) v += (-1) ** k * k; return { p: H.cat(H.L(`\\sum_{k=1}^{${n}} (-1)^k\\,k`), ' ='), a: A.num(v), params: { kd, f, n }, steps: [`Write it out: −1 + 2 − 3 + 4 − … Pair the terms: each pair (−odd + even) is +1.`, n % 2 ? `${(n - 1) / 2} pairs give ${(n - 1) / 2}, then the last term −${n}: ${hl(v)}` : `${n / 2} pairs, each +1: ${hl(v)}`] }; }
        const c = r.int(2, 5), d = r.int(-4, 4) || 1; for (let k = 1; k <= n; k++) v += c * k + d;
        return { p: H.cat(H.L(`\\sum_{k=1}^{${n}} (${c}k ${d < 0 ? '-' : '+'} ${Math.abs(d)})`), ' ='), a: A.num(v), params: { kd, f, n, c, d }, steps: [`${c} times (1 + 2 + … + ${n}) plus ${n} copies of ${d}: ${c} × ${n * (n + 1) / 2} ${d < 0 ? '−' : '+'} ${n * Math.abs(d)}.`, `= ${hl(v)}`] }; }
      const n = r.int(3, 9); const v = n * (n + 1) / 2; const terms = Array.from({ length: n }, (_, i) => `${i + 1}^3`).join(' + ');
      return { p: H.cat(H.L(`\\sqrt{${n <= 4 ? terms : `1^3 + 2^3 + \\cdots + ${n}^3`}}`), ' ='), a: A.num(v), params: { kd, n }, steps: [`The sum of the first n cubes is the square of 1 + 2 + … + n.`, `So the root is 1 + 2 + … + ${n} = ${hl(v)}`] };
    },
  });

  /* ---------- sums and products of two numbers ---------- */
  G({
    id: 'symPQ', trick: 'symmetricSums', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['pq', 'two', 'sq']); let p, qq; do { p = r.int(3, 19) * r.sign(); qq = r.int(2, 19); } while (p === qq || p === -qq);
      if (kd === 'pq') { const P = p * qq, D = p - qq, S = Math.abs(p + qq);
        return { p: H.cat('If ', H.L(`pq = ${P}`), ' and ', H.L(`p - q = ${D}`), ', then ', H.L('|p + q|'), ' ='), a: A.num(S), params: { kd, P, D }, steps: [`${m('(p+q)^2 = (p-q)^2 + 4pq')} = ${D * D} + ${4 * P} = ${S * S}.`, `${m('|p+q|')} = ${hl(S)}`] }; }
      if (kd === 'two') { const a = Math.abs(p), b = qq; const big = Math.max(a, b), sm = Math.min(a, b); if (big === sm) return this.gen(r); const D = big - sm, P = big * sm, S = big + sm;
        return { p: H.cat(`Two positive numbers have a difference of ${D} and a product of ${P}. Their sum is`), a: A.num(S), params: { kd, P, D }, steps: [`(sum)² = (difference)² + 4 × product = ${D * D} + ${4 * P} = ${S * S}.`, `Sum = ${hl(S)}`] }; }
      const S = p + qq, P = p * qq; const v = S * S - 2 * P;
      return { p: H.cat('If ', H.L(`x + y = ${S}`), ' and ', H.L(`xy = ${P}`), ', then ', H.L('x^2 + y^2'), ' ='), a: A.num(v), params: { kd, S, P }, steps: [`${m('x^2 + y^2 = (x+y)^2 - 2xy')}.`, `${S * S} − ${2 * P < 0 ? `(${2 * P})` : 2 * P} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- writing numbers from words ---------- */
  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const w100 = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  const w1000 = n => [Math.floor(n / 100) ? ONES[Math.floor(n / 100)] + ' hundred' : '', n % 100 ? w100(n % 100) : ''].filter(Boolean).join(' ');
  NS.numWords = n => [Math.floor(n / 1000) ? w1000(Math.floor(n / 1000)) + ' thousand' : '', n % 1000 ? w1000(n % 1000) : ''].filter(Boolean).join(' ');
  const FRACW = [[1, 2, 'a half'], [1, 4, 'a fourth'], [3, 4, 'three-fourths'], [1, 5, 'a fifth'], [2, 5, 'two-fifths'], [3, 5, 'three-fifths'], [4, 5, 'four-fifths'], [1, 8, 'an eighth'], [3, 8, 'three-eighths'], [5, 8, 'five-eighths'], [7, 8, 'seven-eighths'], [3, 10, 'three-tenths'], [7, 10, 'seven-tenths']];
  G({
    id: 'numWords', trick: 'numberWords', col: { ms: 2, hs: 2 },
    gen(r) {
      const W = r.int(1, 9); const [a, b, fw] = r.pick(FRACW);
      const rest = r.pick([r.int(1001, 99999), r.int(10, 999), r.int(1, 99) * 1000 + r.int(1, 99), r.int(1, 9) * 1000 + r.int(1, 9) * 100 + r.int(1, 99), r.int(10, 99) * 1000]);
      const v = W * 1000000 + a * 1000000 / b + rest; const plus = r.chance(0.35);
      const phrase = `${ONES[W]} and ${fw} million`;
      const p = plus ? `${phrase[0].toUpperCase() + phrase.slice(1)} plus ${NS.numWords(rest)} is` : `Write ${phrase} ${NS.numWords(rest)} in digits.`;
      return { p: H.cat(p), a: A.num(v), params: { kd: plus ? 'plus' : 'write', W, a, b, rest, text: p },
        steps: [`${ONES[W][0].toUpperCase() + ONES[W].slice(1)} and ${fw} million = ${W} × 1,000,000 + ${H.frac(a, b).h} × 1,000,000 = ${fm(W * 1000000 + a * 1000000 / b)}.`, `Add ${NS.numWords(rest)} (${fm(rest)}): ${hl(fm(v))}`] };
    },
  });

  /* ---------- divisibility: find the missing digit ---------- */
  G({
    id: 'divisibility', trick: 'divisibilityRules', col: { ms: 2, hs: 2 },
    gen(r) {
      const d = r.pick([3, 4, 6, 6, 8, 9, 11, 12, 15, 18]);
      for (let tries = 0; tries < 200; tries++) {
        const len = r.int(4, 5); const digs = Array.from({ length: len - 1 }, (_, i) => i === 0 ? r.int(1, 9) : r.int(0, 9)); const pos = r.chance(0.7) ? len - 1 : r.int(1, len - 1);
        const ok = []; for (let k = 0; k <= 9; k++) { const ds = digs.slice(); ds.splice(pos, 0, k); if (Number(ds.join('')) % d === 0) ok.push(k); }
        if (ok.length !== 1) continue; const k = ok[0]; const shown = digs.slice(); shown.splice(pos, 0, 'k');
        const rule = { 3: 'digit sum divisible by 3', 4: 'last two digits divisible by 4', 6: 'even and digit sum divisible by 3', 8: 'last three digits divisible by 8', 9: 'digit sum divisible by 9', 11: 'alternating digit sum divisible by 11', 12: 'divisible by both 3 and 4', 15: 'divisible by both 3 and 5', 18: 'even and digit sum divisible by 9' }[d];
        return { p: H.cat(`The ${len}-digit number ${shown.join('')} is divisible by ${d}. k =`), a: A.num(k), params: { digs, pos, d },
          steps: [`Divisible by ${d} means: ${rule}.`, `Only one digit works: k = ${hl(k)}`] };
      }
      return this.gen(r);
    },
  });

  /* ---------- exponent rules ---------- */
  G({
    id: 'expRules', trick: 'exponents', col: { ms: 2, hs: 2 },
    gen(r) {
      const kd = r.pick(['laws', 'factor', 'solve']);
      if (kd === 'laws') { const a = r.int(2, 9), b = -r.int(1, 5), c = r.int(1, 9); const v = a + b - c;
        return { p: H.cat('If ', H.L(`A^{${a}} \\times A^{${b}} \\div A^{${c}} = A^k`), ' and A ≠ 1, then k ='), a: A.num(v), params: { kd, a, b, c }, steps: [`Multiplying adds exponents, dividing subtracts them.`, `${a} + (${b}) − ${c} = ${hl(fm(v))}`] }; }
      if (kd === 'factor') { const b = r.pick([3, 4, 5, 6, 7]); const e = r.int(4, 9); const k = b - 1;
        return { p: H.cat(H.L(`${b}^{${e}} - ${b}^{${e - 1}} = ${k} \\times ${b}^{n}`), '. n ='), a: A.num(e - 1), params: { kd, b, e }, steps: [`Factor out ${b}^${e - 1}: ${b}^${e - 1}(${b} − 1) = ${k} × ${b}^${e - 1}.`, `n = ${hl(e - 1)}`] }; }
      const b = r.pick([2, 3, 4, 5]); const x = r.int(2, b === 2 ? 10 : 5); const t = b ** x; const pw = r.pick([[1, 0], [2, 0], [1, 1], [1, -1]]); const v = pw[0] === 2 ? x * x : x + pw[1];
      return { p: H.cat(`If ${b}^x = ${fm(t)}, then ${pw[0] === 2 ? 'x² =' : pw[1] === 0 ? 'x =' : `x ${pw[1] > 0 ? '+' : '−'} 1 =`}`), a: A.num(v), params: { kd, b, t, pw }, steps: [`${fm(t)} = ${b}^${x}, so x = ${x}.`, `Answer: ${hl(v)}`] };
    },
  });

  /* ---------- expanding: sums and products of coefficients ---------- */
  G({
    id: 'expandSum', trick: 'binomial', col: { ms: 4, hs: 2 },
    gen(r) {
      const kd = r.pick(['sq', 'sqAlt', 'prod2', 'coefProd', 'termCoef', 'mixedTerms']);
      if (kd === 'sq' || kd === 'sqAlt') { const a = r.int(2, 9) * r.sign(), b = r.int(1, 9) * r.sign(); const at = kd === 'sq' ? 1 : -1; const v = (a * at + b) ** 2;
        const bin = `(${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`.replace('(1x', '(x').replace('(-1x', '(−x').replace('(-', '(−');
        return { p: H.cat(H.L(`${bin.replace(/−/g, '-')}^2 = ax^2 + bx + c`), '. ', H.L(kd === 'sq' ? 'a + b + c' : 'a - b + c'), ' ='), a: A.num(v), params: { kd, a, b }, steps: [`${m(kd === 'sq' ? 'a + b + c' : 'a - b + c')} is the value of the expression at ${m(kd === 'sq' ? 'x = 1' : 'x = -1')}.`, `(${a * at} ${b < 0 ? '−' : '+'} ${Math.abs(b)})² = ${hl(v)}`] }; }
      if (kd === 'prod2') { const a = r.int(1, 5), b = r.int(1, 9) * r.sign(), c = r.int(1, 5), d = r.int(1, 9) * r.sign(); const v = (a + b) * (c + d);
        const f = (x, y) => `(${x === 1 ? '' : x}x ${y < 0 ? '−' : '+'} ${Math.abs(y)})`;
        return { p: H.cat(H.L(`${f(a, b)}${f(c, d)} = ax^2 + bx + c`.replace(/−/g, '-')), '. ', H.L('a + b + c'), ' ='), a: A.num(v), params: { kd, a, b, c, d }, steps: [`Set ${m('x = 1')}: (${a + b})(${c + d}).`, `= ${hl(v)}`] }; }
      const a = r.int(1, 3), b = r.int(1, 3) * r.sign(), n = r.int(3, 5); const co = k => M.C(n, k) * a ** (n - k) * b ** k;
      const binL = `(${a === 1 ? '' : a}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y)^{${n}}`; 
      if (kd === 'coefProd') { let v = 1; for (let k = 0; k <= n; k++) v *= co(k); if (Math.abs(v) > 60000) return this.gen(r);
        return { p: H.cat('The product of the coefficients of the terms in the expansion of ', H.L(binL), ' is'), a: A.num(v), params: { kd, a, b, n }, steps: [`The coefficients are ${Array.from({ length: n + 1 }, (_, k) => co(k)).join(', ')}.`, `Their product is ${hl(fm(v))}`] }; }
      if (kd === 'termCoef') { const t = r.int(2, n); const v = co(t - 1);
        return { p: H.cat(`The coefficient of the ${NS.ord(t)} term in the expansion of `, H.L(binL), ' is'), a: A.num(v), params: { kd, a, b, n, t }, steps: [`Term ${t} uses ${m(`\\binom{${n}}{${t - 1}}`)} = ${M.C(n, t - 1)}, with x to the ${n - t + 1} and y to the ${t - 1}.`, `${M.C(n, t - 1)} × ${a}^${n - t + 1} × (${b})^${t - 1} = ${hl(fm(v))}`] }; }
      const v = co(1) + co(n - 1);
      return { p: H.cat('In the expansion of ', H.L(binL), ', the sum of the coefficients of the ', H.L(`x^{${n - 1}}y`), ' and ', H.L(`xy^{${n - 1}}`), ' terms is'), a: A.num(v), params: { kd, a, b, n }, steps: [`x^${n - 1}y: ${n} × ${a}^${n - 1} × ${b} = ${co(1)}. xy^${n - 1}: ${n} × ${a} × (${b})^${n - 1} = ${co(n - 1)}.`, `${co(1)} + ${co(n - 1)} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- polynomials that are really a perfect power ---------- */
  G({
    id: 'hiddenPow', trick: 'hiddenPowers', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['sq', 'sq', 'ab'] : ['sq', 'sq', 'cube', 'four', 'ab', 'diffCube']);
      if (kd === 'sq') { const a = r.pick([1, 1, 2, 3, 4]), b = r.int(1, 9) * r.sign(); const x = r.int(5, 25); const v = (a * x + b) ** 2; const cs = [a * a, 2 * a * b, b * b];
        return { p: H.cat(`If f(x) = `, NS.poly ? NS.poly(cs) : H.L(`${cs[0]}x^2`), `, then f(${x}) =`), a: A.num(v), params: { kd, cs, x }, steps: [`f(x) = (${a === 1 ? '' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)})², a perfect square.`, `(${a * x} ${b < 0 ? '−' : '+'} ${Math.abs(b)})² = ${a * x + b}² = ${hl(fm(v))}`] }; }
      if (kd === 'cube' || kd === 'four') { const n = kd === 'cube' ? 3 : 4; const s = r.pick([1, -1]); const c = r.pick([1, 1, 2, 3]); const cs = Array.from({ length: n + 1 }, (_, k) => c * M.C(n, k) * s ** k); const x = r.int(2, kd === 'cube' ? 11 : 6) * (r.chance(0.2) ? -1 : 1); const v = c * (x + s) ** n;
        return { p: H.cat(`If f(x) = `, NS.poly(cs), `, then f(${x}) =`), a: A.num(v), params: { kd, cs, x }, steps: [`The coefficients ${cs.map(Math.abs).join(', ')} are ${c > 1 ? `${c} times ` : ''}a row of Pascal's triangle, so f(x) = ${c > 1 ? c : ''}(x ${s < 0 ? '−' : '+'} 1)^${n}.`, `${c > 1 ? `${c} × ` : ''}(${x + s})^${n} = ${hl(fm(v))}`] }; }
      if (kd === 'ab') { const a = r.int(3, 15), b = r.int(3, 15) * r.sign(); const v = (a + b) ** 2;
        return { p: H.cat(`If a = ${a} and b = ${b}, then a² + 2ab + b² =`), a: A.num(v), params: { kd, a, b }, steps: [`That's (a + b)².`, `(${a + b})² = ${hl(fm(v))}`] }; }
      const x = r.int(-9, 9), y = r.int(-9, 9); if (x === y) return this.gen(r); const v = x ** 3 - y ** 3;
      return { p: H.cat(`If x = ${x} and y = ${y}, then (x − y)(x² + xy + y²) =`), a: A.num(v), params: { kd, x, y }, steps: [`That's ${m('x^3 - y^3')}.`, `${x}³ − (${y})³ = ${x ** 3} − (${y ** 3}) = ${hl(fm(v))}`] };
    },
  });

  /* ---------- similar figures: scale factors ---------- */
  G({
    id: 'similarity', trick: 'geoFacts', col: { ms: 2, hs: 2 },
    gen(r) {
      const a = r.int(2, 6), b = r.int(a + 1, 9), k = r.pick([2, 3, 4, 5]); const what = r.pick(['perimeter', 'area']); const v = what === 'area' ? k * k : k;
      return { p: H.cat(`${NS.An(a)} ${a}" by ${b}" picture is enlarged to ${a * k}" by ${b * k}". Its ${what} is multiplied by`), a: A.num(v), params: { a, b, k, what }, steps: [`Every length is multiplied by ${k}.`, what === 'area' ? `Area grows by the square: ${k}² = ${hl(v)}` : `Perimeter is a length: ${hl(v)}`] };
    },
  });

  /* ---------- special right triangles ---------- */
  G({
    id: 'specialTri', trick: 'rightTri', col: { ms: 3, hs: 3 },
    gen(r) {
      const kd = r.pick(['t45', 't45x', 't30', 't30ft']);
      if (kd === 't45') { const a = r.int(2, 12); const h2 = 2 * a * a;
        return { p: H.cat(`The hypotenuse of a 45°–45°–90° triangle is `, H.sqrt(h2), `. The sum of the lengths of the legs is`), a: A.num(2 * a), params: { kd, h2 }, steps: [`Legs are hypotenuse ÷ √2: √${h2} ÷ √2 = √${h2 / 2} = ${a}.`, `${a} + ${a} = ${hl(2 * a)}`] }; }
      if (kd === 't45x') { const a = r.int(2, 9); const h2 = 2 * a * a;
        return { p: H.cat(`An isosceles right triangle has sides x, x and `, H.sqrt(h2), `. x =`), a: A.num(a), params: { kd, h2 }, steps: [`x² + x² = ${h2}, so x² = ${h2 / 2}.`, `x = ${hl(a)}`] }; }
      if (kd === 't30') { const s = r.int(2, 12);
        return { p: H.cat(`A 30°–60°–90° triangle has a longer leg of `, H.L(`${s}\\sqrt{3}`), `. The sum of the lengths of the other two sides is`), a: A.num(3 * s), params: { kd, s }, steps: [`The longer leg is √3 times the short leg, so the short leg is ${s}. The hypotenuse is twice that, ${2 * s}.`, `${s} + ${2 * s} = ${hl(3 * s)}`] }; }
      const ft = r.int(1, 3), inch = r.int(1, 11); const s = ft * 12 + inch;
      return { p: H.cat(`The shortest side of a 30°–60°–90° triangle is ${ft}' ${inch}". The longest side is`), suffix: 'inches', a: A.num(2 * s), params: { kd, s }, steps: [`${ft}' ${inch}" = ${s} inches. The hypotenuse is twice the short side.`, `2 × ${s} = ${hl(2 * s)} inches`] };
    },
  });
})();
