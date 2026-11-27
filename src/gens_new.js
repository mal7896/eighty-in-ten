/* ===== types added after comparing with other drill sites and the real tests =====
   Rounded square roots, modular equations with a range, f′ given f(a), the chain rule, perfect and
   abundant numbers, area and volume after a scale change, three-digit same-front products, and
   fourth-root estimates. Each sits in the column where real tests put it. */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn, m = NS.m;
  const Qs = x => H.Qf(x).h;
  const lin = (a, b) => NS.poly([a, b]).l;
  const pad2 = n => String(n).padStart(2, '0');
  const isSq = n => Number.isInteger(Math.sqrt(n));
  const sgn = (b, first) => (b < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + ')) + Math.abs(b);

  /* ---------- same front, three digits: 342 × 348 ---------- */
  G({
    id: 'sameFront3', trick: 'sameFront', col: { ms: 2, hs: 2 }, eval: true, w: { ms: 0.4, hs: 0.6 },
    gen(r, lv, x = 1) {
      const f = lv === 'ms' ? (x >= 2 ? r.int(10, 49) : x === 0 ? r.int(10, 15) : r.pick([10, 11, 12, 13, 14, 15, 20, 25, 30, 35, 40, 45])) : (x >= 2 ? r.int(15, 99) : r.int(10, 45));
      const b = r.int(1, 9); const a1 = 10 * f + b, a2 = 10 * f + 10 - b;
      const [u, v] = r.chance(0.5) ? [a1, a2] : [a2, a1];
      const fr = f * (f + 1), bk = b * (10 - b);
      return { p: H.cat(H.n(u), ' × ', H.n(v), ' ='), a: A.num(u * v), params: { u, v },
        steps: [`Both start with ${f}, and the last digits add to 10 (${u % 10} + ${v % 10}).`, `Front: ${f} × ${f + 1} = ${fm(fr)}. Back, two digits: ${b} × ${10 - b} = ${pad2(bk)}.`, `Answer: ${hl(fm(u * v))}`] };
    },
  });

  /* ---------- rounding square roots ---------- */
  const ROOTS = { 2: '1.414', 3: '1.732', 5: '2.236', 6: '2.449', 7: '2.646', 8: '2.828', 10: '3.162' };
  const PLACE = { 0: 'whole number', 1: 'tenth', 2: 'hundredth' };
  // keep away from the rounding line so 3-place memorized values settle it
  const clear = (y, d) => { const t = y * 10 ** d; const f = t - Math.floor(t); return Math.abs(f - 0.5) > 0.12; };
  const rnd = (y, d) => Q.parseNum((Math.round(y * 10 ** d) / 10 ** d).toFixed(d));
  const approx = n => { const s = Math.floor(Math.sqrt(n)); if (ROOTS[n]) return `√${n} ≈ ${ROOTS[n]}`; if (s * s === n) return `√${n} = ${s}`; const k = n - s * s; return `${s}² = ${s * s}, so √${n} ≈ ${s} + ${k}/${2 * s} ≈ ${(s + k / (2 * s)).toFixed(3)}, a touch high; it's ${Math.sqrt(n).toFixed(4)}`; };
  NS.ROOTS = ROOTS;
  G({
    id: 'roundRoot', trick: 'roundRoots', col: { ms: 3, hs: 3 }, w: { ms: 0.3, hs: 0.6 },
    gen(r, lv, x = 1) {
      const msk = x >= 2 ? ['one', 'one', 'mult', 'sum'] : ['one', 'one', 'one', 'mult'];
      const kd = r.pick(lv === 'ms' ? msk : ['one', 'sum', 'sum', 'diff', 'mult', 'three']);
      const mem = [2, 3, 5, 6, 7, 10]; const nonSq = (lo, hi) => { let n; do { n = r.int(lo, hi); } while (isSq(n)); return n; };
      for (let t = 0; t < 60; t++) {
        let y, d, p, pr, why;
        if (kd === 'one') {
          const n = r.chance(0.5) ? r.pick(mem) : nonSq(11, lv === 'ms' ? 60 : 150); d = r.chance(0.5) ? 2 : 1; y = Math.sqrt(n); pr = { kd, n, d };
          p = H.cat('Round ', H.sqrt(n), ` to the nearest ${PLACE[d]}.`); why = [approx(n) + '.'];
        } else if (kd === 'mult') {
          const n = r.pick([2, 3, 5]); const k = r.pick([2, 3, 4, 5, 10, 100]); d = k === 100 ? 0 : 1; y = k * Math.sqrt(n); pr = { kd, n, k, d };
          p = H.cat('Round ', H.L(`${k}\\sqrt{${n}}`), ` to the nearest ${PLACE[d]}.`); why = [`√${n} ≈ ${ROOTS[n]}, so ${k}√${n} ≈ ${k} × ${ROOTS[n]} = ${(k * Number(ROOTS[n])).toFixed(3).replace(/\.?0+$/, '')}.`];
        } else if (kd === 'three') {
          const xs = r.pick([[2, 3, 5], [3, 5, 7], [2, 5, 7], [2, 3, 7], [5, 6, 7]]); const neg = r.int(0, 2); const sg = xs.map((_, i) => (i === neg && i > 0 && r.chance(0.5) ? -1 : 1));
          d = 1; y = xs.reduce((s, n, i) => s + sg[i] * Math.sqrt(n), 0); pr = { kd, xs, sg, d };
          p = H.cat('Round ', H.L(`(${xs.map((n, i) => (i ? (sg[i] < 0 ? ' - ' : ' + ') : '') + `\\sqrt{${n}}`).join('')})`), ' to the nearest tenth.');
          why = [xs.map(n => `√${n} ≈ ${ROOTS[n]}`).join(', ') + '.', `Together: ${xs.map((n, i) => (i ? (sg[i] < 0 ? ' − ' : ' + ') : '') + ROOTS[n]).join('')} = ${y.toFixed(3)}.`];
        } else {
          let a, b; do { a = r.pick(mem.concat(lv === 'hs' ? [11, 12, 13, 15, 17, 20] : [])); b = r.pick(mem); } while (a === b);
          const minus = kd === 'diff'; if (minus && a < b) [a, b] = [b, a];
          d = 1; y = minus ? Math.sqrt(a) - Math.sqrt(b) : Math.sqrt(a) + Math.sqrt(b); pr = { kd, a, b, d };
          p = H.cat('Round ', H.L(`(\\sqrt{${a}} ${minus ? '-' : '+'} \\sqrt{${b}})`), ' to the nearest tenth.');
          why = [`${approx(a)}; ${approx(b)}.`, `${minus ? 'Difference' : 'Sum'} ≈ ${y.toFixed(3)}.`];
        }
        if (!clear(y, d) || (d > 0 && (Math.abs(y - Math.round(y)) < 0.05 || (Math.round(y * 10 ** d) % 10 === 0)))) continue;
        const v = rnd(y, d);
        return { p, a: A.num(v, d ? 'dec' : 'any'), params: pr, steps: [...why, `To the nearest ${PLACE[d]}: ${hl(v.toDecStr())}`] };
      }
      return { p: H.cat('Round ', H.sqrt(2), ' to the nearest hundredth.'), a: A.num(Q.parseNum('1.41'), 'dec'), params: { kd: 'one', n: 2, d: 2 }, steps: ['√2 ≈ 1.414.', `To the nearest hundredth: ${hl('1.41')}`] };
    },
  });

  /* ---------- modular equations in a range, and big powers mod a prime ---------- */
  const cong = (a, b, c, mod) => `${a === 1 ? '' : a}x${b ? sgn(b) : ''} \\equiv ${c} \\pmod{${mod}}`;
  const modPow = (a, e, mod) => { let res = 1n, B = BigInt(a) % BigInt(mod), E = BigInt(e); const Mo = BigInt(mod); while (E > 0n) { if (E & 1n) res = res * B % Mo; B = B * B % Mo; E >>= 1n; } return Number(res); };
  G({
    id: 'modRange', trick: 'modular', col: { ms: 0, hs: 4 }, w: 1.2,
    gen(r, lv, x = 1) {
      const kd = r.pick(x >= 2 ? ['lin', 'lin', 'plus', 'pow', 'pow'] : ['lin', 'lin', 'lin', 'plus', 'pow']);
      if (kd === 'pow') {
        const p = r.pick([5, 7, 11, 13]); let a; do { a = r.int(2, x >= 2 ? 30 : 12); } while (a % p === 0);
        const e = r.int(x >= 2 ? 50 : 20, x >= 2 ? 999 : 120); const v = modPow(a, e, p); const ar = a % p; const er = e % (p - 1);
        return { p: H.cat(`Find k, 0 ≤ k ≤ ${p - 1}, if `, H.pow(a, e), ` ≡ k (mod ${p}). k =`), a: A.num(v), params: { kd, a, e, p },
          steps: [`${p} is prime, so ${m(`n^{${p - 1}} \\equiv 1 \\pmod{${p}}`)} for any n it doesn't divide (Fermat).${ar !== a ? ` First, ${a} ≡ ${ar}.` : ''} Only the exponent's remainder mod ${p - 1} matters: ${e} ÷ ${p - 1} leaves ${er}.`, `${m(`${ar}^{${er}}`)}${ar ** er <= 2000 ? ` = ${fm(ar ** er)}` : ''} ≡ ${hl(v)} (mod ${p})`] };
      }
      for (let t = 0; t < 200; t++) {
        const mod = r.pick(x >= 2 ? [5, 6, 7, 8, 9, 10, 11, 12] : [5, 6, 7, 8, 9]);
        const a = kd === 'plus' ? 1 : r.int(2, Math.min(5, mod - 1)); const b = kd === 'plus' ? r.int(mod + 1, 40) : r.int(-6, 6); const c = r.int(1, x >= 2 ? 40 : 15);
        const L = r.chance(0.5) ? 0 : r.int(1, x >= 2 ? 15 : 8); const U = L + r.int(4, mod - 1);
        const sols = []; for (let z = L; z <= U; z++) if ((((a * z + b - c) % mod) + mod) % mod === 0) sols.push(z);
        if (sols.length !== 1) continue; const v = sols[0];
        const rhs = (((c - b) % mod) + mod) % mod;
        const pr = kd === 'plus' ? H.L(`${b} + x \\equiv ${c} \\pmod{${mod}}`) : H.L(cong(a, b, c, mod));
        let first = rhs; while (first % a !== 0 || ((a * (first / a) + b - c) % mod + mod) % mod !== 0) first += mod; const base = first / a;
        return { p: H.cat(`Find x, ${L} ≤ x ≤ ${U}, if `, pr, '. x ='), a: A.num(v), params: { kd, a, b, c, mod, L, U },
          steps: [kd === 'plus' ? `Reduce: ${b} ≡ ${((b % mod) + mod) % mod} (mod ${mod}), so x ≡ ${c} − ${((b % mod) + mod) % mod} ≡ ${(((c - b) % mod) + mod) % mod}.` : `Move the constant: ${a}x ≡ ${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} ≡ ${rhs} (mod ${mod}). Add ${mod}s to ${rhs} until ${a} divides it: ${a}x = ${first}, x = ${base}.`,
            `Solutions are ${base} plus multiples of ${mod / M.gcd(a, mod)}. The one from ${L} to ${U} is ${hl(v)}`] };
      }
      return this.gen(r, lv, 0);
    },
  });

  /* ---------- more derivatives: f′ given with f(a), trig, chain rule ---------- */
  const S = { 0: q(0), 30: q(1, 2), 90: q(1), 150: q(1, 2), 180: q(0), 210: q(-1, 2), 270: q(-1), 330: q(-1, 2) };
  const C = { 0: q(1), 60: q(1, 2), 90: q(0), 120: q(-1, 2), 180: q(-1), 240: q(-1, 2), 270: q(0), 300: q(1, 2) };
  NS.TRIG_S = S; NS.TRIG_C = C;
  G({
    id: 'derivMore', trick: 'derivatives', col: { ms: 0, hs: 4 }, w: 0.6,
    gen(r, lv, x = 1) {
      const kd = r.pick(['init', 'init', 'init', 'chain', 'chain', 'trig']);
      if (kd === 'init') {
        const form = r.pick(['k', 'k', 'kx', 'kx2']); const k = form === 'k' ? r.int(-6, 6) || 3 : form === 'kx' ? 2 * r.int(1, 4) * r.sign() : 3 * r.int(1, 2);
        const a = r.int(-3, 3), b = r.int(-9, 9); let c; do { c = r.int(-4, 5); } while (c === a);
        const e = form === 'k' ? 1 : form === 'kx' ? 2 : 3; // f = (k/e) x^e + C
        const co = q(k, e); const C0 = q(b).sub(co.mul(q(a).pow(e))); const v = co.mul(q(c).pow(e)).add(C0);
        const fp = form === 'k' ? `${k}` : form === 'kx' ? `${k}x` : `${k}x^2`; const F = form === 'k' ? `${k}x` : form === 'kx' ? `${k / 2}x^2` : `${k / 3}x^3`;
        return { p: H.cat('If ', H.L(`f'(x) = ${fp}`), ` and f(${a}) = ${fm(b)}, then f(${c}) =`), a: A.num(v), params: { kd, form, k, a, b, c },
          steps: [`Undo the derivative: f(x) = ${m(F.replace(/^1x/, 'x').replace(/^-1x/, '-x'))} + C.`, `f(${a}) = ${fm(b)} gives C = ${Qs(C0)}.`, `f(${c}) = ${hl(Qs(v))}`] };
      }
      if (kd === 'trig') {
        const f = r.pick(['sin', 'cos']); const k = r.pick([1, 1, 2, 3, 4, 6]); const second = r.chance(0.5);
        // f = k sin: f' = k cos, f'' = -k sin. f = k cos: f' = -k sin, f'' = -k cos
        const tbl = f === 'sin' ? (second ? S : C) : (second ? C : S); const sign = f === 'sin' ? (second ? -1 : 1) : -1;
        const ang = r.pick(Object.keys(tbl).map(Number).filter(z => z > 0)); const v = tbl[ang].mul(sign * k);
        const dname = second ? "f''" : "f'"; const d1 = f === 'sin' ? (second ? `-${k === 1 ? '' : k}\\sin x` : `${k === 1 ? '' : k}\\cos x`) : (second ? `-${k === 1 ? '' : k}\\cos x` : `-${k === 1 ? '' : k}\\sin x`);
        return { p: H.cat('If ', H.L(`f(x) = ${k === 1 ? '' : k}\\${f} x`), ', then ', H.L(`${dname}(${ang}^\\circ)`), ' ='), a: A.num(v), params: { kd, f, k, second, ang },
          steps: [`(sin x)′ = cos x and (cos x)′ = −sin x, so ${m(`${dname}(x) = ${d1}`)}.`, `At ${ang}°: ${hl(Qs(v))}`] };
      }
      // chain rule
      if (r.chance(0.55)) {
        const a = r.int(1, x >= 2 ? 4 : 3) * (r.chance(0.2) ? -1 : 1), b = r.int(-4, 4) || 1, n = r.int(2, x >= 2 ? 5 : 4); let x0; let inner;
        do { x0 = r.int(-2, 2); inner = a * x0 + b; } while (Math.abs(inner) > 4 || inner === 0);
        const v = n * a * inner ** (n - 1);
        return { p: H.cat('If ', H.L(`f(x) = (${lin(a, b)})^{${n}}`), ', then ', H.L(`f'(${x0})`), ' ='), a: A.num(v), params: { kd, form: 'lin', a, b, n, x0 },
          steps: [`Chain rule: bring down the power, lower it by one, then multiply by the inside's derivative: ${m(`f'(x) = ${n}(${lin(a, b)})^{${n - 1}} \\cdot ${a < 0 ? `(${a})` : a}`)}.`, `Inside at x = ${x0}: ${inner}. ${m(`${n} \\cdot (${inner})^{${n - 1}} \\cdot (${a})`)} = ${hl(fm(v))}`] };
      }
      const c = r.int(-3, 3), n = r.int(2, 3); let x0; do { x0 = r.int(-2, 2); } while (!x0 || Math.abs(x0 * x0 + c) > 6 || x0 * x0 + c === 0);
      const inner = x0 * x0 + c; const v = n * inner ** (n - 1) * 2 * x0;
      return { p: H.cat('If ', H.L(`f(x) = (x^2${c ? sgn(c) : ''})^{${n}}`), ', then ', H.L(`f'(${x0})`), ' ='), a: A.num(v), params: { kd, form: 'sq', c, n, x0 },
        steps: [`Chain rule: ${m(`f'(x) = ${n}(x^2${c ? sgn(c) : ''})^{${n - 1}} \\cdot 2x`)}.`, `At x = ${x0} the inside is ${inner}: ${m(`${n} \\cdot (${inner})^{${n - 1}} \\cdot (${2 * x0})`)} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- perfect, abundant and deficient numbers ---------- */
  const sigma = n => M.divisors(n).reduce((s, d) => s + d, 0) - n; // proper divisors
  const PERF = [6, 28, 496, 8128];
  const kind = n => (sigma(n) > n ? 'abundant' : sigma(n) < n ? 'deficient' : 'perfect');
  NS.properSum = sigma;
  G({
    id: 'perfectNum', trick: 'perfectNumbers', col: { ms: 0, hs: 4 }, w: 0.25,
    gen(r, lv, x = 1) {
      const kd = r.pick(['sum', 'sum', 'nth', 'proper', 'proper', 'proper']);
      if (kd === 'sum') { const k = r.pick([2, 3, 4]); const v = PERF.slice(0, k).reduce((s, n) => s + n, 0);
        return { p: H.cat(`The sum of the first ${['', '', 'two', 'three', 'four'][k]} perfect numbers is`), a: A.num(v), params: { kd, k }, steps: [`The perfect numbers start 6, 28, 496, 8128.`, `${PERF.slice(0, k).join(' + ')} = ${hl(fm(v))}`] }; }
      if (kd === 'nth') { const k = r.int(2, 4); const v = PERF[k - 1];
        return { p: H.cat(`The ${['', 'first', 'second', 'third', 'fourth'][k]} perfect number is`), a: A.num(v), params: { kd, k }, steps: [`Perfect numbers are ${m('2^{p-1}(2^p - 1)')} with ${m('2^p - 1')} prime: ${m('p')} = 2, 3, 5, 7 give 6, 28, 496, 8128.`, `Number ${k}: ${hl(fm(v))}`] }; }
      if (kd === 'next') { const k = r.int(12, x >= 2 ? 90 : 50); let n = k + 1; while (sigma(n) <= n) n++;
        return { p: H.cat(`The smallest abundant number greater than ${k} is`), a: A.num(n), params: { kd, k }, steps: [`Abundant: the proper divisors add to more than the number. Every multiple of 6 past 6 is abundant, and so are 20, 70, 88, …`, `${n}: its proper divisors add to ${sigma(n)}, more than ${n}. Answer: ${hl(n)}`] }; }
      let n; do { n = r.int(10, x >= 2 ? 120 : 60); } while (kd === 'classify' && r.chance(kind(n) === 'deficient' ? 0.6 : 0));
      if (kd === 'classify' && r.chance(0.12)) n = r.pick([6, 28]);
      const f = M.factor(n); const fs = f.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : `${p}`)).join(' \\cdot ');
      const tot = sigma(n) + n; const how = `${n} = ${m(fs)}. All divisors: ${f.map(([p, e]) => `(${Array.from({ length: e + 1 }, (_, i) => p ** i).join(' + ')})`).join('')} = ${tot}; take away ${n} itself: ${sigma(n)}.`;
      if (kd === 'proper') return { p: H.cat(`The sum of the proper divisors of ${n} is`), a: A.num(sigma(n)), params: { kd, n }, steps: [how, `Sum of proper divisors: ${hl(sigma(n))}`] };
      const kk = kind(n);
      return { p: H.cat(`Is ${n} abundant, deficient, or perfect?`), a: A.text(kk, 'word'), params: { kd, n }, steps: [how, `${sigma(n)} is ${sigma(n) > n ? 'more than' : sigma(n) < n ? 'less than' : 'equal to'} ${n}, so ${n} is ${hl(kk)}`] };
    },
  });

  /* ---------- scale changes: perimeter → area, edge → volume ---------- */
  G({
    id: 'scaleArea', trick: 'scaleChange', col: { ms: 4, hs: 3 }, w: { ms: 0.25, hs: 0.35 },
    gen(r, lv, x = 1) {
      const kd = r.pick(['pct', 'pct', 'fromTo', 'fromTo', 'circle', 'cube']);
      if (kd === 'pct' || kd === 'cube') {
        const up = r.chance(0.7); const p = kd === 'cube' ? r.pick(up ? [10, 20, 50, 100] : [10, 20, 50]) : r.pick(up ? [10, 20, 25, 30, 40, 50, 60, 100] : [10, 20, 30, 40, 50]); const f = q(100 + (up ? p : -p), 100);
        const e = kd === 'cube' ? 3 : 2; const v = f.pow(e).sub(1).mul(100).abs(); const fig = kd === 'cube' ? 'each edge of a cube' : r.pick(['the perimeter of a square', 'the side of a square', 'the radius of a circle', 'the circumference of a circle']);
        const what = kd === 'cube' ? 'volume' : 'area'; const word = up ? 'increases' : 'decreases';
        return { p: H.cat(`If ${fig} ${up ? 'increases' : 'decreases'} by ${p}%, the ${what} ${word} by`), suffix: '%', a: A.num(v, 'dec'), params: { kd, p, up, e },
          steps: [`Lengths scale by ${Q.from(f).toDecStr()}, so the ${what} scales by ${Q.from(f).toDecStr()}${e === 3 ? '³' : '²'} = ${f.pow(e).toDecStr()}.`, `That's ${/^(8|1[18](?!\d))/.test(v.toDecStr()) ? 'an' : 'a'} ${hl(v.toDecStr())}% ${up ? 'increase' : 'decrease'}`] };
      }
      if (kd === 'circle') {
        let c1, c2; do { c1 = 2 * r.int(2, 12); c2 = 2 * r.int(2, 12); } while (c1 === c2);
        const up = c2 > c1; const v = Math.abs((c2 / 2) ** 2 - (c1 / 2) ** 2);
        return { p: H.cat(`The circumference of a circle ${up ? 'increases' : 'decreases'} from ${c1}π to ${c2}π. The area ${up ? 'increases' : 'decreases'} by kπ. k =`), a: A.num(v), params: { kd, c1, c2 },
          steps: [`Radii: ${c1 / 2} and ${c2 / 2}.`, `Change in area: (${Math.max(c1, c2) / 2}² − ${Math.min(c1, c2) / 2}²)π = (${Math.max(c1, c2) / 2} − ${Math.min(c1, c2) / 2})(${Math.max(c1, c2) / 2} + ${Math.min(c1, c2) / 2})π, so k = ${hl(v)}`] };
      }
      const half = r.chance(x >= 2 ? 0.4 : 0.15) ? 2 : 0; let p1, p2; do { p1 = 4 * r.int(2, x >= 2 ? 25 : 12) + half; p2 = 4 * r.int(2, x >= 2 ? 25 : 12) + half; } while (p1 === p2 || Math.abs(p1 - p2) > (x >= 2 ? 60 : 32));
      const up = p2 > p1; const s1 = q(p1, 4), s2 = q(p2, 4); const v = s2.mul(s2).sub(s1.mul(s1)).abs();
      const hi = up ? s2 : s1, lo = up ? s1 : s2;
      return { p: H.cat(`When the perimeter of a square ${up ? 'increases' : 'decreases'} from ${p1} to ${p2}, the ${up ? 'increase' : 'decrease'} in area is`), a: A.num(v, 'any'), params: { kd, p1, p2 },
        steps: [`Sides: ${p1} ÷ 4 = ${Q.from(s1).toDecStr()} and ${p2} ÷ 4 = ${Q.from(s2).toDecStr()}.`, `Difference of squares: (${hi.toDecStr()} − ${lo.toDecStr()})(${hi.toDecStr()} + ${lo.toDecStr()}) = ${hl(v.toDecStr())}`] };
    },
  });

  /* ---------- fourth roots and other root estimates (starred) ---------- */
  const ap = x => Q.parseNum(x.toFixed(6));
  G({
    id: 'estRoot', trick: 'estimate', est: true, col: { ms: 0, hs: 4 }, w: 0.4,
    gen(r, lv, x = 1) {
      const kd = r.pick(['fourth', 'fourth', 'sqrtsum', 'fifth']);
      if (kd === 'fourth') { const n = r.int(x >= 2 ? 5000 : 200, x >= 2 ? 99999 : 9999); const k = r.int(11, 99); const v = ap(Math.pow(n, 0.25) * k); const s = Math.floor(Math.pow(n, 0.25) + 1e-9);
        return { p: H.cat(H.L(`\\sqrt[4]{${n}}`), ' × ', H.n(k), ' ='), a: A.est(v), params: { kd, n, k }, steps: [`Fourth powers: ${s}⁴ = ${fm(s ** 4)} and ${s + 1}⁴ = ${fm((s + 1) ** 4)}, so the root is a bit over ${s}: about ${Math.pow(n, 0.25).toFixed(2)}.`, `× ${k} ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'fifth') { const n = r.int(1000, 99999); const k = r.int(11, 99); const v = ap(Math.pow(n, 0.2) * k); const s = Math.floor(Math.pow(n, 0.2) + 1e-9);
        return { p: H.cat(H.L(`\\sqrt[5]{${n}}`), ' × ', H.n(k), ' ='), a: A.est(v), params: { kd, n, k }, steps: [`Fifth powers: ${s}⁵ = ${fm(s ** 5)} and ${s + 1}⁵ = ${fm((s + 1) ** 5)}, so the root is about ${Math.pow(n, 0.2).toFixed(2)}.`, `× ${k} ≈ ${fm(Math.round(v.num()))}`] }; }
      let a, b; do { a = r.int(20, 999); b = r.int(20, 999); } while (isSq(a) || isSq(b)); const k = r.int(11, 49); const v = ap((Math.sqrt(a) + Math.sqrt(b)) * k);
      return { p: H.cat('(', H.sqrt(a), ' + ', H.sqrt(b), ') × ', H.n(k), ' ='), a: A.est(v), params: { kd, a, b, k }, steps: [`√${a} ≈ ${Math.sqrt(a).toFixed(1)} and √${b} ≈ ${Math.sqrt(b).toFixed(1)}; sum ≈ ${(Math.sqrt(a) + Math.sqrt(b)).toFixed(1)}.`, `× ${k} ≈ ${fm(Math.round(v.num()))}`] };
    },
  });
})();
