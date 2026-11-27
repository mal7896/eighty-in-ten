/* ===== number theory, sums, sequences, bases ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn;
  const bigMod = (s, m) => { let r = 0; for (const ch of String(s)) r = (r * 10 + +ch) % m; return r; };

  /* ---------- remainders by divisibility tests ---------- */
  G({
    id: 'rem', trick: 'remainders', col: { ms: 1, hs: 1 },
    gen(r, lv) {
      const m = r.pick(lv === 'ms' ? [9, 9, 3, 4, 8, 11, 6, 5] : [9, 4, 8, 11, 11, 6, 12, 7]);
      const len = lv === 'ms' ? r.int(4, 6) : r.int(5, 7);
      let s = String(r.int(1, 9)); for (let i = 1; i < len; i++) s += r.int(0, 9);
      const rem = bigMod(s, m); const d = s.split('').map(Number);
      let steps;
      if (m === 9 || m === 3) { const sum = d.reduce((a, b) => a + b, 0); steps = [`Add the digits: ${d.join(' + ')} = ${sum}.`, `${sum} ÷ ${m} leaves ${hl(rem)}`]; }
      else if (m === 4 || m === 8) { const k = m === 4 ? 2 : 3; const tail = +s.slice(-k); steps = [`Only the last ${k} digits matter for ${m}: ${tail}.`, `${tail} ÷ ${m} leaves ${hl(rem)}`]; }
      else if (m === 5) steps = [`Only the last digit matters: ${d[d.length - 1]}.`, `Remainder ${hl(rem)}`];
      else if (m === 11) {
        const rev = d.slice().reverse(); const odd = rev.filter((_, i) => i % 2 === 0), even = rev.filter((_, i) => i % 2 === 1);
        const so = odd.reduce((a, b) => a + b, 0), se = even.reduce((a, b) => a + b, 0);
        steps = [`Alternating sum, starting from the ones digit: (${odd.join(' + ')}) − (${even.join(' + ')}) = ${so} − ${se} = ${so - se}.`, `${so - se} mod 11${so - se < 0 ? ' (add 11s until it is 0–10)' : ''} = ${hl(rem)}`];
      } else if (m === 6 || m === 12) {
        const a = m === 6 ? 2 : 4; const ra = bigMod(s, a), r3 = bigMod(s, 3);
        steps = [`Split ${m} = ${a} × 3. Remainder by ${a}: ${ra}. Remainder by 3 (digit sum): ${r3}.`, `The number 0–${m - 1} with both of those remainders is ${hl(rem)}`];
      } else {
        const groups = []; for (let e = s.length; e > 0; e -= 3) groups.push(+s.slice(Math.max(0, e - 3), e));
        const alt = groups.reduce((acc, g, i) => acc + (i % 2 ? -g : g), 0);
        steps = [`7 divides 1001, so split into groups of three from the right and alternate signs: ${groups.map((g, i) => (i ? (i % 2 ? ' − ' : ' + ') : '') + g).join('')} = ${alt}.`, `${alt} ÷ 7 leaves ${hl(rem)}`];
      }
      return { p: H.cat(H.n(s), ` ÷ ${m} has a remainder of`), a: A.num(rem), params: { s, m }, steps };
    },
  });

  /* ---------- remainder of an expression ---------- */
  G({
    id: 'remExpr', trick: 'remExpr', col: { ms: 3, hs: 2 },
    gen(r, lv) {
      const m = r.pick([4, 5, 6, 7, 8, 9]);
      if (lv === 'hs' && r.chance(0.4)) { // power
        const b = r.pick([m - 1, m + 1, 2 * m - 1, 2 * m + 1, m + 2]); const e = r.int(5, 30);
        const rem = Number(BigInt(b) ** BigInt(e) % BigInt(m));
        const br = b % m; const neg = br === m - 1;
        return { p: H.cat(H.pow(b, e), ` ÷ ${m} has a remainder of`), a: A.num(rem), params: { b, e, m },
          steps: neg ? [`${b} leaves ${m - 1}, which is −1 mod ${m}.`, `(−1)^${e} = ${e % 2 ? -1 : 1}${e % 2 ? `, which is ${m - 1}` : ''}. Remainder ${hl(rem)}`] : [`${b} leaves ${br}. Write out the remainders of ${br}, ${br}², ${br}³, … when divided by ${m} until they repeat.`, `Remainder ${hl(rem)}`] };
      }
      const a = r.int(11, 99), b = r.int(11, 99), c = r.int(11, 99);
      const plus = r.chance(0.5); const val = plus ? a * b + c : a * b - c;
      const rem = ((val % m) + m) % m;
      const ra = a % m, rb = b % m, rc = c % m;
      return { p: H.cat(`(${a} × ${b} ${plus ? '+' : '−'} ${c}) ÷ ${m} has a remainder of`), a: A.num(rem), params: { a, b, c, m, plus },
        steps: [`Replace each number by its remainder: (${ra} × ${rb} ${plus ? '+' : '−'} ${rc}) = ${plus ? ra * rb + rc : ra * rb - rc}.`, `${plus ? ra * rb + rc : ra * rb - rc} mod ${m} = ${hl(rem)}`] };
    },
  });

  /* ---------- GCD and LCM ---------- */
  G({
    id: 'gcdLcm', trick: 'gcdLcm', col: { ms: 2, hs: 1 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['g', 'l', 'l3'] : ['g', 'l', 'l3', 'gl']);
      const g = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 14, 15, 18]);
      let x, y; do { x = r.int(2, 9); y = r.int(2, 9); } while (M.gcd(x, y) !== 1 || x === y);
      const a = g * x, b = g * y;
      if (kd === 'g') return { p: H.cat(`The GCD of ${a} and ${b} is`), a: A.num(g), params: { a, b }, steps: [`${a} = ${g} × ${x}, ${b} = ${g} × ${y}, and ${x}, ${y} share nothing.`, `GCD = ${hl(g)}`] };
      if (kd === 'l') return { p: H.cat(`The LCM of ${a} and ${b} is`), a: A.num(M.lcm(a, b)), params: { a, b }, steps: [`GCD is ${g}. LCM = a × b ÷ GCD = ${a} × ${b} ÷ ${g}.`, `= ${a} × ${y} = ${hl(M.lcm(a, b))}`] };
      if (kd === 'gl') return { p: H.cat(`The GCD of ${a} and ${b} times their LCM is`), a: A.num(a * b), params: { a, b }, steps: [`GCD × LCM always equals the product of the two numbers.`, `${a} × ${b} = ${hl(fm(a * b))}`] };
      const t = [r.pick([4, 6, 8, 9, 10, 12]), r.pick([14, 15, 16, 18, 20]), r.pick([21, 24, 27, 30, 36])];
      const L = M.lcm(M.lcm(t[0], t[1]), t[2]);
      return { p: H.cat(`The LCM of ${t[0]}, ${t[1]}, and ${t[2]} is`), a: A.num(L), params: { t }, steps: [`Take the highest power of each prime: ${t.map(n => `${n} = ${M.factor(n).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join('·')}`).join('; ')}.`, `LCM = ${hl(fm(L))}`] };
    },
  });

  /* ---------- divisors ---------- */
  G({
    id: 'divisors', trick: 'divisors', col: { ms: 4, hs: 1 },
    gen(r, lv) {
      const n = r.pick([24, 36, 48, 60, 72, 84, 90, 96, 100, 108, 120, 144, 180, 200, 210, 225, 240, 252, 360, 400, 500]);
      const f = M.factor(n); const fs = NS.m(f.map(([p, e]) => e > 1 ? `${p}^{${e}}` : `${p}`).join(' \\cdot '));
      const kd = lv === 'ms' ? r.pick(['count', 'count', 'sum']) : r.pick(['count', 'sum', 'odd']);
      if (kd === 'count') { const c = f.reduce((s, [, e]) => s * (e + 1), 1);
        return { p: H.cat(`How many positive integral divisors does ${n} have?`), a: A.num(c), params: { n }, steps: [`${n} = ${fs}.`, `Add 1 to each exponent and multiply: ${f.map(([, e]) => e + 1).join(' × ')} = ${hl(c)}`] }; }
      if (kd === 'odd') { const c = f.filter(([p]) => p !== 2).reduce((s, [, e]) => s * (e + 1), 1);
        return { p: H.cat(`How many odd positive divisors does ${n} have?`), a: A.num(c), params: { n }, steps: [`${n} = ${fs}. Ignore the 2s.`, `Odd part exponents +1, multiplied: ${hl(c)}`] }; }
      const s = M.divisors(n).reduce((a, b) => a + b, 0);
      return { p: H.cat(`The sum of the positive divisors of ${n} is`), a: A.num(s), params: { n }, steps: [`${n} = ${fs}.`, `For each prime power ${NS.m('p^e')}, add ${NS.m('1 + p + \\cdots + p^e')}, then multiply the results: ${f.map(([p, e]) => `(${Array.from({ length: e + 1 }, (_, i) => p ** i).join('+')})`).join('')} = ${hl(fm(s))}`] };
    },
  });

  /* ---------- primes ---------- */
  G({
    id: 'primes', trick: 'primes', col: { ms: 1, hs: 1 },
    gen(r) {
      const kd = r.pick(['largestBelow', 'count', 'sum']);
      if (kd === 'largestBelow') { const n = r.int(30, 130); let p = n - 1; while (!M.isPrime(p)) p--;
        return { p: H.cat(`The largest prime number less than ${n} is`), a: A.num(p), params: { n }, steps: [`Walk down from ${n - 1}, skipping evens and multiples of 3, 5, 7.`, `${hl(p)} is prime.`] }; }
      const lo = 10 * r.int(1, 9), hi = lo + r.pick([10, 20]);
      const ps = []; for (let i = lo; i <= hi; i++) if (M.isPrime(i)) ps.push(i);
      if (kd === 'count') return { p: H.cat(`How many primes are between ${lo} and ${hi}?`), a: A.num(ps.length), params: { lo, hi }, steps: [`They are ${ps.join(', ') || 'none'}.`, `Count: ${hl(ps.length)}`] };
      const s = ps.reduce((a, b) => a + b, 0);
      return { p: H.cat(`The sum of the primes between ${lo} and ${hi} is`), a: A.num(s), params: { lo, hi }, steps: [`Primes: ${ps.join(', ') || 'none'}.`, `Sum: ${hl(s)}`] };
    },
  });

  /* ---------- units digit of a power ---------- */
  G({
    id: 'unitsDigit', trick: 'unitsDigit', col: { ms: 3, hs: 3 },
    gen(r) {
      const b = r.pick([2, 3, 7, 8, 12, 13, 17, 23, 27, 4, 9, 14]); const e = r.int(11, 99);
      const u = Number(BigInt(b) ** BigInt(e) % 10n);
      const cyc = []; let x = b % 10; do { cyc.push(x); x = (x * (b % 10)) % 10; } while (x !== cyc[0]);
      const pos = ((e - 1) % cyc.length) + 1;
      return { p: H.cat('The units digit of ', H.pow(b, e), ' is'), a: A.num(u), params: { b, e },
        steps: [`Units digits of powers of ${b % 10} cycle: ${cyc.join(', ')} (length ${cyc.length}).`, `${e} ÷ ${cyc.length} leaves ${e % cyc.length}, so take position ${pos} in the cycle.`, `Units digit: ${hl(u)}`] };
    },
  });

  /* ---------- modular arithmetic (HS) ---------- */
  G({
    id: 'modular', trick: 'modular', col: { ms: 0, hs: 4 },
    gen(r) {
      const m = r.pick([5, 7, 9, 11, 13]); let a; do { a = r.int(2, m - 1); } while (M.gcd(a, m) !== 1);
      const b = r.int(1, m - 1);
      let x = 0; while ((a * x - b) % m !== 0) x++;
      if (r.chance(0.5)) return { p: H.cat(`Find x, 0 ≤ x ≤ ${m - 1}, if ${a}x ≡ ${b} (mod ${m}). x =`), a: A.num(x), params: { a, b, m }, steps: [`Try x = 0, 1, 2, … or add ${m}s to ${b} until ${a} divides it.`, `${a} × ${x} = ${a * x}, and ${a * x} ≡ ${b} (mod ${m}). x = ${hl(x)}`] };
      const m1 = r.pick([3, 4, 5]); let m2; do { m2 = r.pick([7, 8, 9, 11]); } while (M.gcd(m1, m2) !== 1); const r1 = r.int(1, m1 - 1), r2 = r.int(1, m2 - 1);
      let y = 1; while (y % m1 !== r1 || y % m2 !== r2) y++;
      return { p: H.cat(`The smallest positive integer that leaves remainder ${r1} when divided by ${m1} and remainder ${r2} when divided by ${m2} is`), a: A.num(y), params: { m1, m2, r1, r2 }, steps: [`List numbers that leave ${r2} mod ${m2}: ${r2}, ${r2 + m2}, ${r2 + 2 * m2}, …`, `First one that leaves ${r1} mod ${m1}: ${hl(y)}`] };
    },
  });

  /* ---------- sums of series ---------- */
  G({
    id: 'sums', trick: 'sums', col: { ms: 2, hs: 1 }, series: true,
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['n', 'odd', 'even', 'arith', 'sq', 'cube'] : ['n', 'odd', 'even', 'arith', 'sq', 'cube', 'alt']);
      if (kd === 'n') { const n = r.int(12, 40); return { p: H.cat(`1 + 2 + 3 + … + ${n} =`), a: A.num(n * (n + 1) / 2), params: { kd, n }, steps: [`n(n + 1)/2 = ${n} × ${n + 1} / 2.`, `= ${hl(n * (n + 1) / 2)}`] }; }
      if (kd === 'odd') { const k = r.int(8, 30); const last = 2 * k - 1; return { p: H.cat(`1 + 3 + 5 + … + ${last} =`), a: A.num(k * k), params: { kd, k }, steps: [`There are (${last} + 1)/2 = ${k} odd numbers. The sum of the first k odds is k².`, `${k}² = ${hl(k * k)}`] }; }
      if (kd === 'even') { const k = r.int(8, 30); return { p: H.cat(`2 + 4 + 6 + … + ${2 * k} =`), a: A.num(k * (k + 1)), params: { kd, k }, steps: [`There are ${k} terms. Sum = k(k + 1).`, `${k} × ${k + 1} = ${hl(k * (k + 1))}`] }; }
      if (kd === 'arith') { const a = r.int(2, 15), d = r.int(2, 7), n = r.int(6, 15); const L = a + (n - 1) * d; const s = n * (a + L) / 2;
        return { p: H.cat(`${a} + ${a + d} + ${a + 2 * d} + … + ${L} =`), a: A.num(s), params: { kd, a, d, n }, steps: [`Number of terms: (${L} − ${a})/${d} + 1 = ${n}.`, `Sum = terms × average of ends = ${n} × (${a} + ${L})/2 = ${hl(s)}`] }; }
      if (kd === 'sq') { const n = r.int(5, lv === 'ms' ? 10 : 15); const s = n * (n + 1) * (2 * n + 1) / 6;
        return { p: H.cat(H.pow(1, 2), ' + ', H.pow(2, 2), ' + ', H.pow(3, 2), ' + … + ', H.pow(n, 2), ' ='), a: A.num(s), params: { kd, n }, steps: [`n(n + 1)(2n + 1)/6 = ${n} × ${n + 1} × ${2 * n + 1} / 6.`, `= ${hl(s)}`] }; }
      if (kd === 'cube') { const n = r.int(5, 12); const t = n * (n + 1) / 2;
        return { p: H.cat(H.pow(1, 3), ' + ', H.pow(2, 3), ' + … + ', H.pow(n, 3), ' ='), a: A.num(t * t), params: { kd, n }, steps: [`Sum of cubes = (1 + 2 + … + ${n})² = ${t}².`, `= ${hl(fm(t * t))}`] }; }
      const n = r.int(8, 20); const v = (n % 2 ? 1 : -1) * n * (n + 1) / 2;
      return { p: H.cat(H.pow(1, 2), ' − ', H.pow(2, 2), ' + ', H.pow(3, 2), ' − … ', n % 2 ? '+ ' : '− ', H.pow(n, 2), ' ='), a: A.num(v), params: { kd, n }, steps: [`Alternating squares give ±n(n + 1)/2, with the sign of the last term.`, `${n % 2 ? '' : '−'}${n} × ${n + 1}/2 = ${hl(fm(v))}`] };
    },
  });

  /* ---------- arithmetic sequence nth term ---------- */
  G({
    id: 'arithSeq', trick: 'sequences', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      if (lv === 'hs' && r.chance(0.3)) { // geometric nth term
        const a = r.int(1, 5), k = r.pick([2, 3]), n = r.int(5, 8); const v = a * k ** (n - 1);
        return { p: H.cat(`The ${NS.ord(n)} term of ${a}, ${a * k}, ${a * k * k}, … is`), a: A.num(v), params: { a, k, n }, steps: [`Each term is ×${k}. nth term = ${a} × ${k}^(${n}−1).`, `${a} × ${k ** (n - 1)} = ${hl(fm(v))}`] };
      }
      const a = r.int(-5, 15), d = r.int(2, 9) * (r.chance(0.2) ? -1 : 1), n = r.int(12, 40); const v = a + (n - 1) * d;
      return { p: H.cat(`The ${NS.ord(n)} term of ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, … is`), a: A.num(v), params: { a, d, n }, steps: [`nth term = first + (n − 1) × difference.`, `${a} + ${n - 1} × ${d} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- infinite geometric series ---------- */
  G({
    id: 'geoSeries', trick: 'geoSeries', col: { ms: 4, hs: 3 }, w: 1.6,
    gen(r) {
      const num = r.pick([1, 2, 1, 3, -1, -1, 2]), den = r.pick([2, 3, 4, 5]); if (Math.abs(num) >= den) return this.gen(r);
      const ratio = q(num, den); const a = den * den * r.int(1, 3);
      const t2 = q(a).mul(ratio), t3 = t2.mul(ratio); const v = q(a).div(q(1).sub(ratio));
      return { p: H.cat(`${a} ${t2.sign() < 0 ? '−' : '+'} `, H.Qf(t2.abs()), ` ${t3.sign() < 0 ? '−' : '+'} `, H.Qf(t3.abs()), ' + … ='.replace('+ … =', t3.sign() < 0 ? '+ … =' : '+ … =')), a: A.num(v), params: { a, num, den },
        steps: [`Ratio r = ${H.Qf(t2).h} ÷ ${a} = ${H.Qf(ratio).h}.`, `Sum = first ÷ (1 − r) = ${a} ÷ ${H.Qf(q(1).sub(ratio)).h} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- telescoping 1/(n(n+1)) ---------- */
  G({
    id: 'telescope', trick: 'telescope', col: { ms: 3, hs: 2 }, eval: true, series: true,
    gen(r, lv) {
      const s = r.int(1, lv === 'ms' ? 5 : 8), k = r.int(3, 5); const top = r.pick([1, 1, 2, 3]);
      let v = q(0); const parts = [];
      for (let i = 0; i < k; i++) { const n = s + i; v = v.add(q(top, n * (n + 1))); parts.push(H.frac(top, n * (n + 1))); }
      const terms = []; parts.forEach((p, i) => { if (i) terms.push(' + '); terms.push(p); }); terms.push(' =');
      return { p: H.cat(...terms), a: A.num(v), params: { s, k, top },
        steps: [`Denominators are ${Array.from({ length: k }, (_, i) => `${s + i}·${s + i + 1}`).join(', ')}.`, `Sum of numerators over (first factor × last factor): ${top * k}/(${s} × ${s + k}).`, `Answer: ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- consecutive integers ---------- */
  G({
    id: 'consec', trick: 'consecutive', col: { ms: 3, hs: 2 },
    gen(r) {
      const kd = r.pick(['odd3', 'even4', 'int5']);
      if (kd === 'odd3') { const m = 2 * r.int(5, 60) + 1; const s = 3 * m; return { p: H.cat(`The sum of three consecutive odd integers is ${s}. The largest is`), a: A.num(m + 2), params: { m }, steps: [`Middle = ${s} ÷ 3 = ${m}.`, `Largest = ${m} + 2 = ${hl(m + 2)}`] }; }
      if (kd === 'even4') { const a = 2 * r.int(5, 50); const s = 4 * a + 12; return { p: H.cat(`The sum of four consecutive even integers is ${s}. The smallest is`), a: A.num(a), params: { a }, steps: [`${s} ÷ 4 = ${s / 4}, the point between the two middle numbers.`, `Middle pair: ${s / 4 - 1}, ${s / 4 + 1}. Smallest = ${hl(a)}`] }; }
      const m = r.int(10, 90); const s = 5 * m; return { p: H.cat(`The sum of five consecutive integers is ${s}. The largest is`), a: A.num(m + 2), params: { m }, steps: [`Middle = ${s} ÷ 5 = ${m}.`, `Largest = ${hl(m + 2)}`] };
    },
  });

  /* ---------- polygonal numbers & Fibonacci ---------- */
  G({
    id: 'polygonal', trick: 'polygonal', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = lv === 'ms' ? r.pick(['tri', 'tri', 'pent', 'pent', 'hex', 'fib']) : r.pick(['tri', 'pent', 'hex', 'fib', 'fibsum']);
      const n = r.int(6, 20);
      if (kd === 'tri') return { p: H.cat(`The ${NS.ord(n)} triangular number is`), a: A.num(n * (n + 1) / 2), params: { kd, n }, steps: [`Triangular: n(n + 1)/2.`, `${n} × ${n + 1}/2 = ${hl(n * (n + 1) / 2)}`] };
      if (kd === 'pent') return { p: H.cat(`The ${NS.ord(n)} pentagonal number is`), a: A.num(n * (3 * n - 1) / 2), params: { kd, n }, steps: [`Pentagonal: n(3n − 1)/2.`, `${n} × ${3 * n - 1}/2 = ${hl(n * (3 * n - 1) / 2)}`] };
      if (kd === 'hex') return { p: H.cat(`The ${NS.ord(n)} hexagonal number is`), a: A.num(n * (2 * n - 1)), params: { kd, n }, steps: [`Hexagonal: n(2n − 1).`, `${n} × ${2 * n - 1} = ${hl(n * (2 * n - 1))}`] };
      if (kd === 'fib') { const k = r.int(10, 16); const f = [1, 1]; while (f.length < k) f.push(f[f.length - 1] + f[f.length - 2]);
        return { p: H.cat(`The ${NS.ord(k)} term of 1, 1, 2, 3, 5, 8, … is`), a: A.num(f[k - 1]), params: { kd, k }, steps: [`Each term is the sum of the two before it.`, `${f.slice(-4).join(', ')} → the ${NS.ord(k)} is ${hl(f[k - 1])}`] }; }
      const a = r.int(1, 6), b = r.int(1, 9); const f = [a, b]; while (f.length < 10) f.push(f[f.length - 1] + f[f.length - 2]);
      const s = f.reduce((x, y) => x + y, 0);
      return { p: H.cat(`The sum of the first 10 terms of ${f.slice(0, 6).join(', ')}, … is`), a: A.num(s), params: { kd, a, b }, steps: [`For 10 terms of any Fibonacci-style sequence, the sum is 11 × the 7th term.`, `7th term = ${f[6]}. 11 × ${f[6]} = ${hl(s)}`] };
    },
  });

  /* ---------- number bases ---------- */
  const toB = (n, b) => n.toString(b).toUpperCase();
  G({
    id: 'bases', trick: 'bases', col: { ms: 2, hs: 2 },
    gen(r, lv) {
      const kd = lv === 'ms' ? r.pick(['to10', 'from10', 'from10', 'b2b']) : r.pick(['to10', 'from10', 'b2b', 'b2b']);
      if (kd === 'to10') { const b = r.pick([2, 3, 4, 5, 6, 7, 8]); const n = r.int(b * b, b ** 3 * 2); const s = toB(n, b);
        const terms = s.split('').map((d, i) => `${d}×${b}^${s.length - 1 - i}`);
        return { p: H.cat(H.base(s, b), ' = '), suffix: 'base 10', a: A.num(n), params: { s, b }, steps: [`Place values: ${terms.join(' + ')}.`, `= ${hl(n)}`] }; }
      if (kd === 'from10') { const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9]); const n = r.int(b + 2, Math.min(300, b ** 3)); const s = toB(n, b);
        const divs = []; let x = n; while (x) { divs.push(`${x} ÷ ${b} = ${Math.floor(x / b)} r ${x % b}`); x = Math.floor(x / b); }
        return { p: H.cat(H.base(String(n), 10), ' = '), suffix: `base ${b}`, a: A.text(s, 'base'), params: { n, b }, steps: [`Divide by ${b} repeatedly and read the remainders bottom to top.`, divs.join('; '), `Answer: ${hl(s)} in base ${b}`] }; }
      const [b1, b2] = r.pick(lv === 'ms' ? [[2, 4], [2, 8], [4, 2], [8, 2]] : [[2, 4], [2, 8], [4, 2], [8, 2], [2, 16], [3, 9], [9, 3]]); const n = r.int(9, b2 === 16 || b1 === 16 ? 255 : 120); const s = toB(n, b1), t = toB(n, b2);
      const g = Math.round(Math.log(Math.max(b1, b2)) / Math.log(Math.min(b1, b2)));
      return { p: H.cat(H.base(s, b1), ' = '), suffix: `base ${b2}`, a: A.text(t, 'base'), params: { n, b1, b2 }, steps: [b1 < b2 ? `Group the digits in blocks of ${g} from the right; each block becomes one digit in base ${b2}.` : `Expand each digit into ${g} digits in base ${b2}.`, `Answer: ${hl(t)} in base ${b2}`] };
    },
  });

  G({
    id: 'baseOps', trick: 'bases', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const b = r.pick([4, 5, 6, 7, 8, 3]); const x = r.int(b + 1, b * b * 2), y = r.int(2, b * b * 2);
      const op = lv === 'ms' ? r.pick(['+', '+', '−']) : r.pick(['+', '−', '×']);
      let a, steps;
      if (op === '×') { const y2 = r.int(2, b - 1); a = x * y2; steps = [`Work in base 10: ${x} × ${y2} = ${a}.`, `Convert back to base ${b}: ${hl(toB(a, b))}`]; return { p: H.cat(H.base(toB(x, b), b), ' × ', H.base(toB(y2, b), b), ' = '), suffix: `base ${b}`, a: A.text(toB(a, b), 'base'), params: { x, y: y2, b, op }, steps }; }
      if (op === '−' && y > x) return this.gen(r, lv);
      a = op === '+' ? x + y : x - y;
      steps = [`Easiest: convert to base 10. ${NS.m(`${toB(x, b)}_{${b}} = ${x}`)} and ${NS.m(`${toB(y, b)}_{${b}} = ${y}`)}.`, `${x} ${op} ${y} = ${a}, back to base ${b}: ${hl(toB(a, b))}`];
      return { p: H.cat(H.base(toB(x, b), b), ` ${op} `, H.base(toB(y, b), b), ' = '), suffix: `base ${b}`, a: A.text(toB(a, b), 'base'), params: { x, y, b, op }, steps };
    },
  });

  G({
    id: 'baseFrac', trick: 'bases', col: { ms: 0, hs: 4 },
    gen(r) {
      const b = r.pick([2, 4, 5, 8]); const d1 = r.int(1, b - 1), d2 = r.int(1, b - 1);
      const v = q(d1, b).add(q(d2, b * b));
      return { p: H.cat(H.base(`0.${d1}${d2}`, b), ' = '), suffix: 'base 10 (fraction)', a: A.num(v, 'frac'), params: { b, d1, d2 }, steps: [`0.${d1}${d2} in base ${b} = ${d1}/${b} + ${d2}/${b * b}.`, `= ${(d1 * b + d2)}/${b * b} = ${hl(H.Qi(v).h)}`] };
    },
  });
})();
