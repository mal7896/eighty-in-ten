/* ===== problem types drawn from recent UIL and TMSCA high school tests, columns 3 and 4, and estimates ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn, m = NS.m;
  const toB = (n, b) => n.toString(b).toUpperCase();
  const Cn2 = n => (n >= 2 ? n * (n - 1) / 2 : 0);
  const fracL = v => { v = Q.from(v); if (v.isInt()) return String(v.n); const neg = v.n < 0n; return `${neg ? '-' : ''}\\tfrac{${neg ? -v.n : v.n}}{${v.d}}`; };

  /* ---------- cubes of numbers just past a hundred ---------- */
  G({
    id: 'cubeNear', trick: 'cubeBinomial', col: { ms: 4, hs: 4 }, w: 0.5, eval: true,
    gen(r) {
      const a = r.int(1, 5), b = r.int(1, a >= 4 ? 3 : 5) * (r.chance(0.15) ? -1 : 1); const n = 100 * a + b;
      const parts = [a ** 3, 3 * a * a * b, 3 * a * b * b, b ** 3]; const v = n ** 3;
      return { p: H.cat(H.pow(n, 3), ' ='), a: A.num(v), params: { n },
        steps: [`${m(`(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3`)} with ${m(`a = ${a}00`)} and ${m(`b = ${b}`)}.`, `Each piece fills two places: ${parts.join(' | ')}.`, `${a ** 3}·10⁶ ${b < 0 ? '−' : '+'} ${Math.abs(parts[1])}·10⁴ + ${parts[2]}·10² ${b < 0 ? '−' : '+'} ${Math.abs(parts[3])} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- bⁿ − k written in base b ---------- */
  G({
    id: 'baseNear', trick: 'bases', col: { ms: 0, hs: 3 },
    gen(r) {
      const b = r.int(3, 9), n = r.int(2, 4); const k = r.int(1, Math.min(b * b - 1, 40)); const v = b ** n - k; const s = toB(v, b), ks = toB(k, b);
      return { p: H.cat(H.pow(b, n), ' − ', H.n(k), ' ='), suffix: `(base ${b})`, a: A.text(s, 'base'), params: { b, n, k },
        steps: [`${b}^${n} in base ${b} is 1 followed by ${n} zeros: ${'1' + '0'.repeat(n)}. And ${k} in base ${b} is ${ks}.`, `${'1' + '0'.repeat(n)} − ${ks} in base ${b}: borrowing turns zeros into ${b - 1}s. Answer: ${hl(s)}`] };
    },
  });

  /* ---------- how many 3-digit numbers have digit sum s ---------- */
  NS.digitSumCount = s => { const N = t => (t < 1 || t > 27 ? 0 : t <= 9 ? t * (t + 1) / 2 : t <= 18 ? Cn2(t + 1) - Cn2(t - 8) - 2 * Cn2(t - 9) : N(28 - t)); return N(s); };
  G({
    id: 'digitSum', trick: 'digitSumCount', col: { ms: 0, hs: 3 },
    gen(r) {
      const s = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22]); const v = NS.digitSumCount(s);
      const steps = s <= 9 ? [`Up to 9 there's no carrying to worry about: the count is ${m('\\tfrac{s(s+1)}{2}')}.`, `${s} × ${s + 1} ÷ 2 = ${hl(v)}`]
        : s <= 18 ? [`Start with ${m('\\tfrac{s(s+1)}{2}')} = ${Cn2(s + 1)}, then remove the ways a digit would have to be 10 or more: ${Cn2(s - 8)} for the first digit and ${Cn2(s - 9)} each for the other two.`, `${Cn2(s + 1)} − ${Cn2(s - 8)} − ${2 * Cn2(s - 9)} = ${hl(v)}`]
          : [`Swap each of the last two digits for 9 minus itself, and the first digit for 10 minus itself. The digit sum becomes 28 − ${s} = ${28 - s}, so the count is the same as for sum ${28 - s}.`, `${28 - s} × ${29 - s} ÷ 2 = ${hl(v)}`];
      return { p: H.cat(`The sum of the digits of a 3-digit number is ${s}. How many such numbers exist?`), a: A.num(v), params: { s }, steps };
    },
  });

  /* ---------- reflecting a point ---------- */
  G({
    id: 'reflect', trick: 'reflections', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const x = r.int(-9, 9), y = r.int(-9, 9); const c = r.int(1, 26) * r.sign();
      const kinds = lv === 'ms' ? ['yx', 'xaxis', 'yaxis', 'origin', 'yk'] : ['yx', 'ynx', 'yk', 'xk', 'yxc', 'yxc', 'ynxc', 'ynxc', 'origin'];
      const kd = r.pick(kinds); let h, k, line, rule;
      if (kd === 'yx') { [h, k] = [y, x]; line = 'the line y = x'; rule = 'Swap the coordinates.'; }
      else if (kd === 'ynx') { [h, k] = [-y, -x]; line = 'the line y = −x'; rule = 'Swap the coordinates and change both signs.'; }
      else if (kd === 'xaxis') { [h, k] = [x, -y]; line = 'the x-axis'; rule = 'Change the sign of y.'; }
      else if (kd === 'yaxis') { [h, k] = [-x, y]; line = 'the y-axis'; rule = 'Change the sign of x.'; }
      else if (kd === 'origin') { [h, k] = [-x, -y]; line = 'the origin'; rule = 'Change both signs.'; }
      else if (kd === 'yk') { const kk = r.int(-8, 8); [h, k] = [x, 2 * kk - y]; line = `the line y = ${kk}`; rule = `x stays. y goes the same distance past ${kk}: 2(${kk}) − (${y}) = ${2 * kk - y}.`; }
      else if (kd === 'xk') { const kk = r.int(-8, 8); [h, k] = [2 * kk - x, y]; line = `the line x = ${kk}`; rule = `y stays. x goes the same distance past ${kk}: 2(${kk}) − (${x}) = ${2 * kk - x}.`; }
      else if (kd === 'yxc') { [h, k] = [y - c, x + c]; line = `the line y = x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`; rule = `Across ${m('y = x + c')}, the point ${m('(a, b)')} goes to ${m('(b - c,\ a + c)')}: (${y} − (${c}), ${x} + (${c})).`; }
      else { [h, k] = [c - y, c - x]; line = `the line y = −x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`; rule = `Across ${m('y = -x + c')}, the point ${m('(a, b)')} goes to ${m('(c - b,\ c - a)')}: (${c} − (${y}), ${c} − (${x})).`; }
      const ask = r.pick(['h + k', 'h − k', 'k − h']); const v = ask === 'h + k' ? h + k : ask === 'h − k' ? h - k : k - h;
      return { p: H.cat(`The point (${x}, ${y}) is reflected across ${line} to the point `, H.L('(h, k)'), '. Find ', H.L(ask.replace('−', '-')), '.'), a: A.num(v), params: { kd, x, y, c, line, ask, h, k }, steps: [rule, `${m('(h, k)')} = (${h}, ${k}), so ${m(ask.replace('−', '-'))} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- sums of Fibonacci-like sequences ---------- */
  const fibSeq = (a, b, n) => { const t = [a, b]; while (t.length < n) t.push(t[t.length - 1] + t[t.length - 2]); return t; };
  G({
    id: 'fibSum', trick: 'fibonacciSums', col: { ms: 4, hs: 3 }, w: 1.4, series: true,
    gen(r, lv, x = 1) {
      const a = r.int(1, x >= 2 ? 25 : 9), b = r.int(1, x >= 2 ? 25 : 9); const kd = r.pick(['ten', 'ten', 'n', 'find7']);
      if (kd === 'ten') { const t = fibSeq(a, b, 10); const v = t.reduce((x, y) => x + y);
        return { p: H.cat(t.join(' + '), ' ='), a: A.num(v), params: { kd, a, b }, steps: [`Each term is the sum of the two before it, and there are 10 terms. The sum of 10 such terms is 11 times the 7th term.`, `11 × ${t[6]} = ${hl(fm(v))}`] }; }
      if (kd === 'n') { const n = r.int(7, 12); const t = fibSeq(a, b, n + 2); const v = t.slice(0, n).reduce((x, y) => x + y);
        return { p: H.cat(`${t.slice(0, 5).join(' + ')} + … + ${t[n - 1]} =`), a: A.num(v), params: { kd, a, b, n }, steps: [`In a Fibonacci-like sequence, the sum of the first n terms is the term two places later minus the 2nd term.`, `The terms continue ${t.slice(n - 2, n + 2).join(', ')}. The term after ${t[n - 1]} is ${t[n]}, then ${t[n + 1]}. ${t[n + 1]} − ${b} = ${hl(fm(v))}`] }; }
      const t = fibSeq(a, b, 10); const S = t.reduce((x, y) => x + y);
      return { p: H.cat(`The first ten terms of a sequence where each term is the sum of the two before it add up to ${fm(S)}. The 7th term is`), a: A.num(t[6]), params: { kd, a, b }, steps: [`The sum of the first ten terms is always 11 times the 7th term.`, `${fm(S)} ÷ 11 = ${hl(t[6])}`] };
    },
  });

  /* ---------- simplifying radicals ---------- */
  const SQF = [2, 3, 5, 6, 7, 10, 11];
  G({
    id: 'radicals', trick: 'radicals', col: { ms: 4, hs: 3 }, w: 0.5,
    gen(r) {
      const kd = r.pick(['sum', 'sum', 'simpA', 'simpB', 'pow']); const s = r.pick(SQF);
      if (kd === 'sum') { const k1 = r.int(2, 12), k2 = r.int(1, 9); const minus = r.chance(0.5) && k1 !== k2; const kk = minus ? k1 - k2 : k1 + k2; const v = kk * kk * s;
        return { p: H.cat('If ', H.sqrt(k1 * k1 * s), minus ? ' − ' : ' + ', H.sqrt(k2 * k2 * s), ' = ', H.sqrt('x'), ', then x ='), a: A.num(v), params: { kd, k1, k2, s, minus },
          steps: [`Simplify each: √${k1 * k1 * s} = ${k1}√${s} and √${k2 * k2 * s} = ${k2}√${s}.`, `${k1}√${s} ${minus ? '−' : '+'} ${k2}√${s} = ${kk}√${s} = √(${kk}² × ${s}), so x = ${hl(fm(v))}`] }; }
      const a = r.int(2, 9); const n = a * a * s;
      if (kd === 'pow') return { p: H.cat(H.L(`(${n})^{0.5} = a\\sqrt{b}`), ' in simplest form. ', H.L('b'), ' ='), a: A.num(s), params: { kd, n }, steps: [`The 0.5 power is a square root: √${n} = √(${a * a} × ${s}).`, `= ${a}√${s}, so ${m('b')} = ${hl(s)}`] };
      return { p: H.cat(H.L(`\\sqrt{${n}} = a\\sqrt{b}`), ' in simplest form. ', H.L(kd === 'simpA' ? 'a' : 'b'), ' ='), a: A.num(kd === 'simpA' ? a : s), params: { kd, n }, steps: [`Pull out the biggest square factor: ${n} = ${a * a} × ${s}.`, `√${n} = ${a}√${s}, so ${m(kd === 'simpA' ? 'a' : 'b')} = ${hl(kd === 'simpA' ? a : s)}`] };
    },
  });

  /* ---------- counting numbers made from given digits ---------- */
  G({
    id: 'countDigits', trick: 'counting', col: { ms: 3, hs: 3 },
    gen(r) {
      const k = r.pick([4, 4, 5]); const zero = r.chance(0.35); const digs = r.shuffle([...(zero ? [0] : []), ...r.distinct(zero ? k - 1 : k, 1, 9)]).slice(0, k);
      const L = r.pick(k === 4 ? [3, 3, 4] : [3, 4]); const sorted = digs.slice().sort((a, b) => a - b);
      const kind = zero ? r.pick(['none', 'gt']) : r.pick(['none', 'gt', 'lt', 'odd']);
      const P = (n, kk) => M.P(n, kk);
      let v, how, cond = '';
      if (kind === 'none') { v = zero ? (k - 1) * P(k - 1, L - 1) : P(k, L); how = zero ? `The first digit can't be 0: ${k - 1} choices, then ${P(k - 1, L - 1)} ways to fill the rest.` : `${k} choices, then ${k - 1}, … for ${L} places.`; }
      else if (kind === 'gt' || kind === 'lt') { const nz = sorted.filter(d => d > 0); const d = kind === 'gt' ? r.pick(nz.slice(0, -1)) : r.pick(nz.slice(1)); const first = kind === 'gt' ? sorted.filter(x => x >= d).length : sorted.filter(x => x > 0 && x < d).length;
        v = first * P(k - 1, L - 1); cond = kind === 'gt' ? ` greater than ${d}${'0'.repeat(L - 1)}` : ` less than ${d}${'0'.repeat(L - 1)}`;
        how = kind === 'gt' ? `The first digit has to be ${d} or more: ${first} choices. With no repeats, the rest can never all be 0, so every one of those works.` : `The first digit has to be less than ${d} (and not 0): ${first} choices.`; }
      else { const odd = sorted.filter(x => x % 2).length; v = odd * P(k - 1, L - 1); cond = ''; how = `Fill the last digit first: ${odd} odd choices. Then fill the other ${L - 1} places from the ${k - 1} digits left.`; }
      return { p: H.cat(`How many ${kind === 'odd' ? 'odd ' : ''}${L}-digit numbers${cond} can be made from the digits ${digs.join(', ')} with no digit repeated?`), a: A.num(v), params: { digs, L, kind, cond },
        steps: [how, `Answer: ${hl(v)}`] };
    },
  });

  /* ---------- nPr and nCr relations ---------- */
  const Pl = (n, k) => H.L(`{}_{${n}}P_{${k}}`), Cl = (n, k) => H.L(`{}_{${n}}C_{${k}}`);
  G({
    id: 'permComb', trick: 'counting', col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['pascal', 'ratioPC', 'ratioCP', 'diff', 'kTimes', 'sumK']);
      if (kd === 'pascal') { const n = r.int(5, 11), k = r.int(2, n - 2); return { p: H.cat('If ', Cl(n, k), ' + ', Cl(n, k + 1), ' = ', H.L(`{}_{n}C_{${k + 1}}`), ', then n ='), a: A.num(n + 1), params: { kd, n, k }, steps: [`Pascal's rule: ${m(`\\binom{n}{k} + \\binom{n}{k+1} = \\binom{n+1}{k+1}`)}.`, `n = ${n} + 1 = ${hl(n + 1)}`] }; }
      if (kd === 'kTimes') { const n = r.int(5, 9), k = r.int(2, 4), k2 = r.pick([k, n - k]); const v = q(M.P(n, k), M.C(n, k2));
        return { p: H.cat('If ', Pl(n, k), ' = k × ', Cl(n, k2), ', then k ='), a: A.num(v), params: { kd, n, k, k2 }, steps: [`${m(`{}_{${n}}C_{${k2}} = {}_{${n}}C_{${k}}`)}, and P is C times ${k}!.`, `${M.P(n, k)} ÷ ${M.C(n, k2)} = ${hl(H.Qf(v).h)}`] }; }
      const n = r.int(5, 8), k = r.int(2, 3);
      if (kd === 'ratioPC') { const v = q(M.P(n, k), M.C(n - 1, k)); return { p: H.cat(Pl(n, k), ' ÷ ', Cl(n - 1, k), ' ='), a: A.num(v), params: { kd, n, k }, steps: [`${m(`{}_{${n}}P_{${k}}`)} = ${M.P(n, k)}, ${m(`{}_{${n - 1}}C_{${k}}`)} = ${M.C(n - 1, k)}.`, `${M.P(n, k)} ÷ ${M.C(n - 1, k)} = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'ratioCP') { const v = q(M.C(n, k + 1), M.P(n, k)); return { p: H.cat(Cl(n, k + 1), ' ÷ ', Pl(n, k), ' ='), a: A.num(v), params: { kd, n, k }, steps: [`${m(`{}_{${n}}C_{${k + 1}}`)} = ${M.C(n, k + 1)}, ${m(`{}_{${n}}P_{${k}}`)} = ${M.P(n, k)}.`, `${M.C(n, k + 1)} ÷ ${M.P(n, k)} = ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'diff') { const v = M.C(n + 1, 2) - M.P(n, 2); return { p: H.cat(Cl(n + 1, 2), ' − ', Pl(n, 2), ' ='), a: A.num(v), params: { kd, n }, steps: [`${m(`{}_{${n + 1}}C_{2}`)} = ${M.C(n + 1, 2)} and ${m(`{}_{${n}}P_{2}`)} = ${M.P(n, 2)}.`, `${M.C(n + 1, 2)} − ${M.P(n, 2)} = ${hl(fm(v))}`] }; }
      const v = q(M.C(n, 2) + M.C(n, 3), M.P(n, 4));
      return { p: H.cat(Cl(n, 2), ' + ', Cl(n, 3), ' = ', Pl(n, 4), ' × k. k ='), a: A.num(v), params: { kd, n }, steps: [`The left side is ${m(`{}_{${n + 1}}C_{3}`)} = ${M.C(n, 2) + M.C(n, 3)}, and ${m(`{}_{${n}}P_{4}`)} = ${M.P(n, 4)}.`, `k = ${M.C(n, 2) + M.C(n, 3)} ÷ ${M.P(n, 4)} = ${hl(H.Qi(v).h)}`] };
    },
  });

  /* ---------- reciprocals of triangular numbers ---------- */
  G({
    id: 'triRecip', trick: 'telescope', col: { ms: 0, hs: 3 },
    gen(r) {
      const n = r.int(5, 30); const v = q(2 * n, n + 1);
      return { p: H.cat(`The sum of the reciprocals of the first ${n} triangular numbers is`), a: A.num(v), params: { n },
        steps: [`${m('\\tfrac{1}{T_k} = \\tfrac{2}{k(k+1)} = 2\\left(\\tfrac1k - \\tfrac1{k+1}\\right)')}, so the sum telescopes to ${m(`2\\left(1 - \\tfrac{1}{${n + 1}}\\right)`)}.`, `= ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- finite geometric sums ---------- */
  G({
    id: 'geoFinite', trick: 'geoSeries', col: { ms: 4, hs: 3 }, series: true,
    gen(r, lv, x = 1) {
      // growing sums (5 + 25 + 125 + …) are the middle school favorite; shrinking ones are more high school
      if (r.chance(lv === 'ms' ? 0.6 : 0.3)) { const R0 = r.pick([2, 3, 4, 5]); const a0 = r.pick([1, 2, 3, 4, 5, 6, 8, 9, 12, 16]); let k = r.int(4, x >= 2 ? 8 : 6); while (k > 4 && a0 * R0 ** (k - 1) > (x >= 2 ? 40000 : 3000)) k--;
        const t = Array.from({ length: k }, (_, i) => a0 * R0 ** i); const v = t.reduce((s, y) => s + y, 0); const last = t[k - 1];
        return { p: H.cat(`${t.slice(0, Math.min(4, k - 1)).map(y => fm(y)).join(' + ')} + ${k > 5 ? '… + ' : ''}${fm(last)} =`), a: A.num(v), params: { a: String(a0), rat: String(R0), k },
          steps: [`Each term is ${R0} times the one before. For a growing geometric sum, ${m('S = \\tfrac{r\\ell - a}{r - 1}')}.`, `(${R0} × ${fm(last)} − ${a0}) ÷ ${R0 - 1} = ${hl(fm(v))}`] }; }
      const rat = r.pick([q(1, 2), q(1, 2), q(1, 3), q(-1, 2)]); const k = r.int(5, 8); const a = Q.from(r.pick([2, 3, 5, 7, 13, 26, 11]) * Number(rat.d) ** (r.int(1, 3)));
      const t = [a]; for (let i = 1; i < k; i++) t.push(t[i - 1].mul(rat)); const last = t[k - 1]; let v = Q.from(0); t.forEach(x => { v = v.add(x); });
      const shw = x => x.terminates() ? H.dec(x).h : H.Qf(x).h;
      return { p: H.cat(`${t.slice(0, 4).map(shw).join(' + ').replace(/\+ −/g, '− ')} + … + ${shw(last)} =`.replace(/\+ −/g, '− ')), a: A.num(v), params: { a: a.toFracStr(), rat: rat.toFracStr(), k },
        steps: [`For a finite geometric sum, ${m('S = \\tfrac{a - r\\ell}{1 - r}')}, with first term a, ratio r and last term ℓ.`, `(${shw(a)} − (${H.Qi(rat).h})(${shw(last)})) ÷ (1 − ${H.Qi(rat).h}) = ${hl(v.terminates() ? H.dec(v).h : H.Qf(v).h)}`] };
    },
  });

  /* ---------- coordinate odds and ends ---------- */
  G({
    id: 'coordMore', trick: 'coordinate', col: { ms: 3, hs: 3 },
    gen(r) {
      const kd = r.pick(['circle', 'endpoint', 'xint', 'yint2', 'perp']);
      if (kd === 'circle') { const [hx, hy, px, py] = [r.int(-5, 5), r.int(-5, 5), r.int(-6, 6), r.int(-6, 6)]; const v = (px - hx) ** 2 + (py - hy) ** 2; if (!v) return this.gen(r);
        return { p: H.cat(`The point (${px}, ${py}) lies on a circle with center (${hx}, ${hy}). The area of the circle is kπ. k =`), a: A.num(v), params: { kd, hx, hy, px, py }, steps: [`The area is π r², and r² is the squared distance: (${px - hx})² + (${py - hy})².`, `k = ${hl(v)}`] }; }
      if (kd === 'endpoint') { const [mx, my, ax, ay] = [r.int(-6, 6), r.int(-6, 6), r.int(-8, 8), r.int(-8, 8)]; const x = 2 * mx - ax, y = 2 * my - ay; const ask = r.pick(['x + y', 'x − y']); const v = ask === 'x + y' ? x + y : x - y;
        return { p: H.cat(`(${mx}, ${my}) is the midpoint of the segment from (${ax}, ${ay}) to (x, y). Find ${ask}.`), a: A.num(v), params: { kd, mx, my, ax, ay, ask }, steps: [`Each coordinate of the far end is twice the midpoint minus the near end: x = 2(${mx}) − (${ax}) = ${x}, y = 2(${my}) − (${ay}) = ${y}.`, `${ask} = ${hl(fm(v))}`] }; }
      if (kd === 'xint') { const num = r.int(1, 5) * r.sign(), den = r.int(2, 5); const b = r.int(1, 8) * den * r.sign(); const v = q(-b * den, num);
        return { p: H.cat(`A line with slope `, H.Qi(q(num, den)), ` passes through (0, ${b}) and (x, 0). x =`), a: A.num(v), params: { kd, num, den, b }, steps: [`Going down from y = ${b} to 0 is a rise of ${-b}, so the run is ${-b} ÷ ${H.Qi(q(num, den)).h}.`, `x = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'yint2') { const x1 = r.int(-5, 5), y1 = r.int(-9, 15), dx = r.int(1, 4), dy = r.int(-6, 6); const x2 = x1 + dx, y2 = y1 + dy; const sl = q(dy, dx); const v = Q.from(y1).sub(sl.mul(x1));
        return { p: H.cat(`The y-intercept of the line through (${x1}, ${y1}) and (${x2}, ${y2}) is`), a: A.num(v), params: { kd, x1, y1, x2, y2 }, steps: [`Slope = ${dy} ÷ ${dx} = ${H.Qf(sl).h}. Walk back to x = 0 from (${x1}, ${y1}): y = ${y1} − (${H.Qf(sl).h})(${x1}).`, `= ${hl(H.Qf(v).h)}`] }; }
      const x1 = r.int(-5, 5), y1 = r.int(-5, 5), dx = r.int(1, 5) * r.sign(), dy = r.int(1, 5) * r.sign(); const v = q(-dx, dy);
      return { p: H.cat(`The slope of a line perpendicular to the segment from (${x1}, ${y1}) to (${x1 + dx}, ${y1 + dy}) is`), a: A.num(v), params: { kd, dx, dy }, steps: [`The segment's slope is ${H.Qf(q(dy, dx)).h}. A perpendicular slope is the negative reciprocal.`, `${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- x³ ± y³ from a sum or difference and a product ---------- */
  G({
    id: 'symCubes', trick: 'symmetricSums', col: { ms: 0, hs: 4 },
    gen(r) {
      const minus = r.chance(0.5); const P = r.int(-5, 6) || 2; const D = r.int(2, 14);
      if (!minus && D * D < 4 * P) return this.gen(r);
      if (minus && D * D + 4 * P < 0) return this.gen(r);
      const v = minus ? D ** 3 + 3 * P * D : D ** 3 - 3 * P * D;
      return { p: H.cat(`If xy = ${fm(P)} and x ${minus ? '−' : '+'} y = ${D}, then x³ ${minus ? '−' : '+'} y³ =`), a: A.num(v), params: { minus, P, D },
        steps: [minus ? `${m('x^3 - y^3 = (x-y)^3 + 3xy(x-y)')}.` : `${m('x^3 + y^3 = (x+y)^3 - 3xy(x+y)')}.`, `${D}³ ${minus ? '+' : '−'} 3(${P})(${D}) = ${D ** 3} ${minus ? '+' : '−'} ${3 * P * D < 0 ? `(${3 * P * D})` : 3 * P * D} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- cubic Vieta combinations ---------- */
  G({
    id: 'vieta3', trick: 'roots', col: { ms: 4, hs: 4 }, w: 0.6,
    gen(r) {
      const rs = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)]; const a = r.pick([1, 1, 2, 3]);
      const s1 = rs[0] + rs[1] + rs[2], s2 = rs[0] * rs[1] + rs[1] * rs[2] + rs[0] * rs[2], s3 = rs[0] * rs[1] * rs[2];
      const cs = [a, -a * s1, a * s2, -a * s3]; if (cs.every((c, i) => i === 0 || c === 0)) return this.gen(r);
      const kd = r.pick(['prodMinusPairs', 'sumPlusPairs', 'pairProd', 'sumPlusProd', 'harmonic']);
      const S1 = q(-cs[1], a), S2 = q(cs[2], a), S3 = q(-cs[3], a);
      const T = { prodMinusPairs: ['PQR − (PQ + QR + PR)', S3.sub(S2)], sumPlusPairs: ['(P + Q + R) + (PQ + QR + PR)', S1.add(S2)], pairProd: ['(P + Q)(Q + R)(R + P)', S1.mul(S2).sub(S3)], sumPlusProd: ['(P + Q + R) + PQR', S1.add(S3)], harmonic: ['the harmonic mean of the roots', S2.eq(0) || S3.eq(0) ? null : S3.mul(3).div(S2)] }[kd];
      if (T[1] === null) return this.gen(r);
      return { p: H.cat('P, Q and R are the roots of ', NS.poly(cs), ` = 0. Find ${T[0]}.`), a: A.num(T[1]), params: { kd, rs, a },
        steps: [`Vieta: P + Q + R = ${H.Qf(S1).h}, PQ + QR + PR = ${H.Qf(S2).h}, PQR = ${H.Qf(S3).h}.`, kd === 'pairProd' ? `(P + Q)(Q + R)(R + P) = (sum)(pairs) − product = ${hl(H.Qf(T[1]).h)}` : kd === 'harmonic' ? `Harmonic mean = 3 ÷ (1/P + 1/Q + 1/R) = 3 · PQR ÷ (PQ + QR + PR) = ${hl(H.Qf(T[1]).h)}` : `Combine them: ${hl(H.Qf(T[1]).h)}`] };
    },
  });

  /* ---------- remainder when dividing by ax + b ---------- */
  G({
    id: 'remLinear', trick: 'remainderThm', col: { ms: 0, hs: 4 },
    gen(r) {
      const deg = r.pick([3, 4]); const cs = Array.from({ length: deg + 1 }, (_, i) => i === 0 ? r.int(1, 4) : r.int(-5, 5)); const a = r.pick([2, 3]), b = r.int(1, a + 2) * r.sign(); if (M.gcd(a, Math.abs(b)) !== 1) return this.gen(r);
      const x0 = q(-b, a); let v = Q.from(0); cs.forEach(c => { v = v.mul(x0).add(c); });
      return { p: H.cat('The remainder when ', NS.poly(cs), ` is divided by ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} is`), a: A.num(v), params: { cs, a, b },
        steps: [`The remainder is f at the root of the divisor: x = ${H.Qi(x0).h}.`, `f(${H.Qi(x0).h}) = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- inverse trig ---------- */
  const ARC = [
    ['Arcsin', '\\tfrac12', 1 / 2, q(1, 6)], ['Arcsin', '-\\tfrac12', -1 / 2, q(-1, 6)], ['Arcsin', '\\tfrac{\\sqrt3}{2}', Math.sqrt(3) / 2, q(1, 3)], ['Arcsin', '-1', -1, q(-1, 2)],
    ['Arccos', '-\\tfrac12', -1 / 2, q(2, 3)], ['Arccos', '\\tfrac{\\sqrt2}{2}', Math.SQRT1_2, q(1, 4)], ['Arccos', '-\\tfrac{\\sqrt3}{2}', -Math.sqrt(3) / 2, q(5, 6)], ['Arccos', '0', 0, q(1, 2)],
    ['Arctan', '-1', -1, q(-1, 4)], ['Arctan', '\\sqrt3', Math.sqrt(3), q(1, 3)], ['Arctan', '-\\tfrac{\\sqrt3}{3}', -Math.sqrt(3) / 3, q(-1, 6)],
    ['Arccsc', '-2', -2, q(-1, 6)], ['Arcsec', '2', 2, q(1, 3)], ['Arcsec', '-2', -2, q(2, 3)],
  ];
  const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  G({
    id: 'inverseTrig', trick: 'trig', col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['arc', 'arc', 'comp', 'quad']);
      if (kd === 'arc') { const [f, l, x, v] = r.pick(ARC);
        return { p: H.cat(H.L(`\\operatorname{${f}}\\left(${l}\\right) = k\\pi`), '. k ='), a: A.num(v), params: { kd, f, x }, steps: [`${f} gives the angle in its principal range whose ${f.slice(3).toLowerCase()} is ${m(l)}.`, `That angle is ${m(`${fracL(v)}\\pi`)}, so k = ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'comp') { const [o, a, h] = r.pick(TRI); const inner = r.pick(['sin', 'cos', 'tan']); const outer = r.pick(['sin', 'cos', 'tan', 'sec', 'csc', 'cot'].filter(t => t !== inner));
        const arg = inner === 'sin' ? q(o, h) : inner === 'cos' ? q(a, h) : q(o, a); const val = { sin: q(o, h), cos: q(a, h), tan: q(o, a), sec: q(h, a), csc: q(h, o), cot: q(a, o) }[outer];
        const shown = arg.terminates() ? H.dec(arg).l : fracL(arg);
        return { p: H.cat(H.L(`\\${outer}\\left(\\${inner}^{-1} ${shown}\\right)`), ' ='), a: A.num(val), params: { kd, inner, outer, arg: arg.num() }, steps: [`Draw the ${o}-${a}-${h} right triangle: ${inner} of the angle is ${H.Qi(arg).h}.`, `${outer} of that angle = ${hl(H.Qi(val).h)}`] }; }
      const opts = [['cos', '-\\tfrac12', 3, 240], ['sin', '-\\tfrac{\\sqrt3}{2}', 4, 300], ['tan', '-1', 2, 135], ['sin', '\\tfrac12', 2, 150], ['cos', '\\tfrac{\\sqrt2}{2}', 4, 315], ['tan', '\\sqrt3', 3, 240], ['cos', '-\\tfrac{\\sqrt3}{2}', 2, 150], ['sin', '-\\tfrac{\\sqrt2}{2}', 3, 225]];
      const [f, l, qd, deg] = r.pick(opts);
      return { p: H.cat(H.L(`\\${f}\\theta = ${l}`), ` and θ is in quadrant ${['I', 'II', 'III', 'IV'][qd - 1]}, 0° ≤ θ < 360°. θ =`), suffix: '°', a: A.num(deg), params: { kd, f, deg, qd }, steps: [`The reference angle for ${m(l.replace('-', ''))} is ${deg % 90 === 0 ? 90 : [30, 45, 60].find(t => [180 - t, 180 + t, 360 - t].includes(deg) || t === deg)}°.`, `In quadrant ${['I', 'II', 'III', 'IV'][qd - 1]}: θ = ${hl(deg)}°`] };
    },
  });

  /* ---------- double integrals over rectangles ---------- */
  G({
    id: 'dblInt', trick: 'integrals', col: { ms: 0, hs: 4 },
    gen(r) {
      const a = r.int(0, 2), b = r.int(a + 1, 4), c = r.int(0, 2), d = r.int(c + 1, 4); const kd = r.pick(['xy', 'xplusy', 'xminusy', 'lin']);
      const X1 = q(b * b - a * a, 2), Y1 = q(d * d - c * c, 2); let v, f;
      if (kd === 'xy') { v = X1.mul(Y1); f = 'xy'; }
      else if (kd === 'xplusy') { v = X1.mul(d - c).add(Y1.mul(b - a)); f = '(x + y)'; }
      else if (kd === 'xminusy') { v = X1.mul(d - c).sub(Y1.mul(b - a)); f = '(x - y)'; }
      else { const p = r.int(2, 6), k = r.int(-4, 4) || 1; v = X1.mul(p).add(k * (b - a)).mul(d - c); f = `(${p}x ${k < 0 ? '-' : '+'} ${Math.abs(k)})`; }
      return { p: H.cat(H.L(`\\int_{${a}}^{${b}}\\!\\int_{${c}}^{${d}} ${f}\\,dy\\,dx`), ' ='), a: A.num(v), params: { a, b, c, d, kd, f },
        steps: [`Over a rectangle you can do one variable at a time. ${kd === 'xy' ? `It splits into ${m(`\\int_{${a}}^{${b}} x\\,dx \\cdot \\int_{${c}}^{${d}} y\\,dy`)} = ${H.Qf(X1).h} × ${H.Qf(Y1).h}.` : `Integrate in y from ${c} to ${d} first, then in x from ${a} to ${b}.`}`, `= ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- floor and ceiling of radicals ---------- */
  G({
    id: 'ginRad', trick: 'greatestInt', col: { ms: 0, hs: 4 },
    gen(r) {
      const safe = x => Math.abs(x - Math.round(x)) > 1e-3;
      const kd = r.pick(['sum', 'sum', 'mult', 'four']);
      if (kd === 'four') { const v = Math.floor(Math.SQRT2 + Math.sqrt(3) + Math.sqrt(5) + Math.sqrt(7));
        return { p: H.cat(H.L('\\left\\lfloor \\sqrt2 + \\sqrt3 + \\sqrt5 + \\sqrt7 \\right\\rfloor'), ' ='), a: A.num(v), params: { kd, xs: [2, 3, 5, 7] }, steps: [`√2 ≈ 1.41, √3 ≈ 1.73, √5 ≈ 2.24, √7 ≈ 2.65. The total is about 8.03.`, `Round down: ${hl(v)}`] }; }
      if (kd === 'sum') { let a, b; do { a = r.int(2, 60); b = r.int(2, 60); } while (Number.isInteger(Math.sqrt(a)) || Number.isInteger(Math.sqrt(b)) || !safe(Math.sqrt(a) + Math.sqrt(b))); const x = Math.sqrt(a) + Math.sqrt(b); const minus = r.chance(0.3) && a > b; const y = minus ? Math.sqrt(a) - Math.sqrt(b) : x; if (!safe(y)) return this.gen(r);
        const fl = r.chance(0.6); const v = fl ? Math.floor(y) : Math.ceil(y);
        return { p: H.cat(H.L(fl ? `\\left\\lfloor \\sqrt{${a}} ${minus ? '-' : '+'} \\sqrt{${b}} \\right\\rfloor` : `\\left\\lceil \\sqrt{${a}} ${minus ? '-' : '+'} \\sqrt{${b}} \\right\\rceil`), ' ='), a: A.num(v), params: { kd, a, b, minus, fl },
          steps: [`√${a} ≈ ${Math.sqrt(a).toFixed(2)} and √${b} ≈ ${Math.sqrt(b).toFixed(2)}, so the value is about ${y.toFixed(2)}.`, `${fl ? 'Round down' : 'Round up'}: ${hl(v)}`] }; }
      let p, a, qq, b; do { p = r.int(2, 4); a = r.pick([2, 3, 5, 6, 7]); qq = r.int(2, 4); b = r.pick([2, 3, 5, 6, 7]); } while (!safe(p * Math.sqrt(a)) || !safe(qq * Math.sqrt(b)));
      const f1 = Math.floor(p * Math.sqrt(a)), c1 = Math.ceil(qq * Math.sqrt(b)); const op = r.pick(['×', '−']); const v = op === '×' ? f1 * c1 : f1 - c1;
      return { p: H.cat(H.L(`\\left\\lfloor ${p}\\sqrt{${a}} \\right\\rfloor ${op === '×' ? '\\times' : '-'} \\left\\lceil ${qq}\\sqrt{${b}} \\right\\rceil`), ' ='), a: A.num(v), params: { kd, p, a, qq, b, op },
        steps: [`${p}√${a} = √${p * p * a} ≈ ${(p * Math.sqrt(a)).toFixed(2)}, which rounds down to ${f1}. ${qq}√${b} = √${qq * qq * b} ≈ ${(qq * Math.sqrt(b)).toFixed(2)}, which rounds up to ${c1}.`, `${f1} ${op} ${c1} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- directrix and focus of a parabola ---------- */
  G({
    id: 'directrix', trick: 'conics', col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['xy2', 'yx2', 'focus']);
      if (kd === 'xy2' || kd === 'focus') { const a = r.pick([q(1), q(1, 4), q(2), q(1, 8), q(-1), q(1, 2)]); const c = r.int(-4, 4); const p = Q.from(1).div(a.mul(4));
        const eq = `x = ${a.eq(1) ? '' : a.eq(-1) ? '-' : fracL(a)}y^2 ${c ? (c < 0 ? `- ${-c}` : `+ ${c}`) : ''}`;
        if (kd === 'focus') { const v = p.add(c); return { p: H.cat('The focus of ', H.L(eq), ' is (h, k). h ='), a: A.num(v), params: { kd, a: a.toFracStr(), c }, steps: [`The vertex is (${c}, 0) and the focal distance is ${m('p = \\tfrac{1}{4a}')} = ${H.Qi(p).h}.`, `h = ${c} + (${H.Qi(p).h}) = ${hl(H.Qf(v).h)}`] }; }
        const v = Q.from(c).sub(p); return { p: H.cat('The directrix of ', H.L(eq), ' is x ='), a: A.num(v), params: { kd, a: a.toFracStr(), c }, steps: [`Vertex (${c}, 0). The focus and directrix are ${m('p = \\tfrac{1}{4a}')} = ${H.Qi(p).h} on either side.`, `x = ${c} − (${H.Qi(p).h}) = ${hl(H.Qf(v).h)}`] }; }
      const a = r.pick([q(1, 4), q(1, 8), q(1, 2), q(1), q(-1, 4)]); const h = r.int(-4, 4), k = r.int(-5, 5); const p = Q.from(1).div(a.mul(4));
      const B = a.mul(-2 * h), Cc = a.mul(h * h).add(k); const v = Q.from(k).sub(p);
      const term = (co, x) => co.eq(0) ? '' : `${co.sign() < 0 ? ' - ' : ' + '}${co.abs().eq(1) && x ? '' : fracL(co.abs())}${x}`;
      const eq = `y = ${a.eq(1) ? '' : a.eq(-1) ? '-' : fracL(a)}x^2${term(B, 'x')}${term(Cc, '')}`;
      return { p: H.cat('The directrix of ', H.L(eq), ' is y ='), a: A.num(v), params: { kd, a: a.toFracStr(), h, k }, steps: [`Vertex: ${m('x = -\\tfrac{b}{2a}')} = ${h}, and y there is ${k}. Focal distance ${m('p = \\tfrac{1}{4a}')} = ${H.Qi(p).h}.`, `The directrix is ${m('p')} below the vertex: y = ${k} − (${H.Qi(p).h}) = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- fraction to a base-b decimal ---------- */
  G({
    id: 'baseFracTo', trick: 'bases', col: { ms: 0, hs: 4 },
    gen(r) {
      const b = r.int(3, 9); const d1 = r.int(0, b - 1), d2 = r.int(1, b - 1); if (!d1 && r.chance(0.7)) return this.gen(r); const v = q(d1 * b + d2, b * b);
      return { p: H.cat('Change ', H.Qi(v), ` to a base ${b} decimal.`), suffix: `(base ${b})`, a: A.text(`.${d1}${d2}`, 'base', [`0.${d1}${d2}`]), params: { b, v: v.toFracStr() },
        steps: [`Write it over ${b}² = ${b * b}: ${H.Qi(v).h} = ${m(`\\tfrac{${d1 * b + d2}}{${b * b}}`)}.`, `${d1 * b + d2} = ${d1} × ${b} + ${d2}, so the digits after the point are ${d1}, ${d2}: ${hl(`.${d1}${d2}`)}`] };
    },
  });

  /* ---------- more probability ---------- */
  const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  NS.DECK = SUITS.flatMap(s => RANKS.map(rk => ({ s, rk, red: s === 'hearts' || s === 'diamonds', face: 'JQK'.includes(rk) })));
  const EVENTS = [
    ['a black king or an ace', c => (!c.red && c.rk === 'K') || c.rk === 'A'], ['a heart or a face card', c => c.s === 'hearts' || c.face], ['a red card or a king', c => c.red || c.rk === 'K'],
    ['a queen or a spade', c => c.rk === 'Q' || c.s === 'spades'], ['a red face card', c => c.red && c.face], ['an ace or a club', c => c.rk === 'A' || c.s === 'clubs'], ['a black card or a jack', c => !c.red || c.rk === 'J'],
  ];
  G({
    id: 'prob2', trick: 'probability', col: { ms: 4, hs: 3 },
    gen(r) {
      const kd = r.pick(['cond', 'cards', 'dice', 'coins']);
      if (kd === 'cond') { const a = r.int(3, 10), b = r.int(3, 10); const [ca, cb] = r.pick([['white', 'brown'], ['blue', 'red'], ['black', 'gray']]); const same = r.chance(0.6); const v = same ? q(b - 1, a + b - 1) : q(a, a + b - 1);
        return { p: H.cat(`A drawer has ${a} ${ca} and ${b} ${cb} socks. The first sock drawn is ${cb}. The probability the second is ${same ? cb : ca} is`), a: A.num(v), params: { kd, a, b, same }, steps: [`One ${cb} sock is gone, so ${a + b - 1} socks are left: ${a} ${ca}, ${b - 1} ${cb}.`, `${same ? b - 1 : a} out of ${a + b - 1} = ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'cards') { const [txt, f] = r.pick(EVENTS); const n = NS.DECK.filter(f).length; const v = q(n, 52);
        return { p: H.cat(`One card is drawn from a standard deck. The probability that it is ${txt} is`), a: A.num(v), params: { kd, txt }, steps: [`Count the cards, and don't count the overlap twice: ${n} cards.`, `${n}/52 = ${hl(H.Qi(v).h)}`] }; }
      if (kd === 'dice') { const t = r.int(4, 11); const rel = r.pick(['less than', 'greater than', 'at least']); let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) { const s = i + j; if (rel === 'less than' ? s < t : rel === 'greater than' ? s > t : s >= t) c++; } const v = q(c, 36);
        return { p: H.cat(`Two dice are rolled. The probability that the sum is ${rel} ${t} is`), a: A.num(v), params: { kd, t, rel }, steps: [`Sums of 2 to 12 come up 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 ways out of 36. Count the ones that fit (or the ones that don't and subtract): ${c}.`, `${c}/36 = ${hl(H.Qi(v).h)}`] }; }
      const n = r.int(3, 6), k = r.int(1, n - 1); const v = q(M.C(n, k), 2 ** n);
      return { p: H.cat(`A coin is tossed ${n} times. The probability of exactly ${k} head${k > 1 ? 's' : ''} is`), a: A.num(v), params: { kd, n, k }, steps: [`${m(`\\binom{${n}}{${k}}`)} = ${M.C(n, k)} arrangements out of 2^${n} = ${2 ** n}.`, `${hl(H.Qi(v).h)}`] };
    },
  });

  /* ===== starred estimates ===== */
  const PI = Q.parseNum('3.14159265358979');
  const VARA_IN = q(100, 3), ACRE_IN2 = Q.from(43560 * 144), SQVARA_ACRE = VARA_IN.mul(VARA_IN).div(ACRE_IN2);
  const LABOR = SQVARA_ACRE.mul(1000000), LEAGUE = SQVARA_ACRE.mul(25000000), CUBIT = Q.parseNum('17.72');
  NS.TEXAS = { VARA_IN, LABOR, LEAGUE, CUBIT, SQVARA_ACRE };
  const r3 = x => Number(Q.from(x).num().toFixed(1));

  G({
    id: 'estConv', trick: 'oddUnits', est: true, col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['vara', 'land', 'land', 'cubit', 'cubit', 'cm']);
      if (kd === 'vara') { const toYd = r.chance(0.5); const n = r.int(1200, 52000); const v = toYd ? VARA_IN.mul(n).div(36) : Q.from(n).mul(36).div(VARA_IN);
        return { p: H.cat(toYd ? `${fm(n)} varas (Texas) =` : `${fm(n)} yards =`), suffix: toYd ? 'yards' : 'varas (Texas)', a: A.est(v), params: { kd, n, toYd }, steps: [`A Texas vara is ${m('33\\tfrac13')} inches, so 27 varas = 25 yards. ${toYd ? `Multiply by 25/27 (a bit less than 1): ${fm(n)} × .926 ≈ ${fm(Math.round(v.num()))}.` : `Multiply by 27/25 = 1.08: ${fm(n)} × 1.08 ≈ ${fm(Math.round(v.num()))}.`}`, `Anything within 5% counts.`] }; }
      if (kd === 'land') { const f = r.pick(['league', 'minus', 'plus']);
        if (f === 'league') { const L = r.pick([q(r.int(2, 30)), q(r.int(5, 39), 4), q(r.int(3, 19), 2)]); const v = LEAGUE.mul(L);
          return { p: H.cat(L.isInt() ? H.n(L.n.toString()) : H.Qf(L), ' leagues of land in Texas is'), suffix: 'acres', a: A.est(v), params: { kd, f, L: L.toFracStr() }, steps: [`A league of land is about 4428 acres.`, `${H.Qf(L).h} × 4428 ≈ ${fm(Math.round(v.num()))}`] }; }
        const Lg = r.int(2, 30), Lb = r.int(2, 30); const sq = f === 'plus' ? r.int(500, 9000) : 0; const v = f === 'minus' ? LEAGUE.mul(Lg).sub(LABOR.mul(Lb)) : LEAGUE.mul(Lg).add(LABOR.mul(Lb)).add(SQVARA_ACRE.mul(sq));
        return { p: H.cat(f === 'minus' ? `${Lg} leagues of land in Texas minus ${Lb} labors of land in Texas is` : `${Lg} leagues of land plus ${Lb} labors of land plus ${fm(sq)} square varas of land in Texas is`), suffix: 'acres', a: A.est(v), params: { kd, f, Lg, Lb, sq },
          steps: [`A league of land is about 4428 acres and a labor is about 177 acres (a league is 25 labors). A square vara is tiny, about 1/5600 of an acre.`, `${Lg} × 4428 ${f === 'minus' ? '−' : '+'} ${Lb} × 177${sq ? ` + ${fm(sq)} ÷ 5645` : ''} ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'cubit') { const f = r.pick(['in2c', 'c2in', 'c2ft', 'phi']);
        if (f === 'in2c') { const n = r.int(2000, 90000); const v = Q.from(n).div(CUBIT); return { p: H.cat(`${fm(n)} inches =`), suffix: 'Egyptian cubits', a: A.est(v), params: { kd, f, n }, steps: [`An Egyptian cubit is about 17.72 inches, a little under 18.`, `${fm(n)} ÷ 17.72 ≈ ${fm(Math.round(v.num()))}`] }; }
        if (f === 'c2in') { const n = r.int(40, 3000); const v = CUBIT.mul(n); return { p: H.cat(`${fm(n)} Egyptian cubits =`), suffix: 'inches', a: A.est(v), params: { kd, f, n }, steps: [`An Egyptian cubit is about 17.72 inches.`, `${fm(n)} × 17.72 ≈ ${fm(Math.round(v.num()))}`] }; }
        if (f === 'c2ft') { const n = r.int(40, 3000); const v = CUBIT.mul(n).div(12); return { p: H.cat(`${fm(n)} Egyptian cubits =`), suffix: 'feet', a: A.est(v), params: { kd, f, n }, steps: [`An Egyptian cubit is about 17.72 inches, just under 1.5 feet.`, `${fm(n)} × 1.477 ≈ ${fm(Math.round(v.num()))}`] }; }
        const k = r.pick([10, 100, 50, 20]); const x = k * (1 + Math.sqrt(5)) / 2 * 17.72; const v = Q.parseNum(x.toFixed(6));
        return { p: H.cat(H.L(`${k}\\left(\\tfrac{\\sqrt5 + 1}{2}\\right)`), ' Egyptian cubits ='), suffix: 'inches', a: A.est(v), params: { kd, f, k }, steps: [`${m('\\tfrac{\\sqrt5+1}{2}')} is the golden ratio, about 1.618. An Egyptian cubit is about 17.72 inches.`, `${k} × 1.618 × 17.72 ≈ ${fm(Math.round(x))}`] }; }
      const f = r.pick(['ydftin', 'mile', 'inch']);
      if (f === 'ydftin') { const y = r.int(2, 9), ft = r.int(1, 2), inch = r.int(1, 11); const sg = r.pick([[1, 1], [1, -1], [-1, 1]]); const tot = y * 36 + sg[0] * ft * 12 + sg[1] * inch; const v = Q.from(tot).mul(Q.parseNum('2.54'));
        return { p: H.cat(`${y} yards ${sg[0] > 0 ? '+' : '−'} ${ft} ${ft > 1 ? 'feet' : 'foot'} ${sg[1] > 0 ? '+' : '−'} ${inch} ${inch > 1 ? 'inches' : 'inch'} =`), suffix: 'centimeters', a: A.est(v), params: { kd, f, tot }, steps: [`In inches: ${y} × 36 ${sg[0] > 0 ? '+' : '−'} ${ft * 12} ${sg[1] > 0 ? '+' : '−'} ${inch} = ${tot}.`, `${tot} × 2.54 ≈ ${fm(Math.round(v.num()))}`] }; }
      if (f === 'mile') { const fr = r.pick([q(1, 2), q(1, 4), q(3, 4), q(1, 8), q(3, 8)]); const v = fr.mul(63360).mul(Q.parseNum('2.54')); return { p: H.cat(H.Qi(fr), ' of a mile ='), suffix: 'centimeters', a: A.est(v), params: { kd, f, fr: fr.toFracStr() }, steps: [`A mile is 63,360 inches.`, `${H.Qi(fr).h} × 63,360 × 2.54 ≈ ${fm(Math.round(v.num()))}`] }; }
      const n = r.int(105, 990); const v = Q.from(n).mul(Q.parseNum('2.54')); return { p: H.cat(`${n} inches =`), suffix: 'centimeters', a: A.est(v), params: { kd, f, n }, steps: [`1 inch = 2.54 cm.`, `${n} × 2.54 ≈ ${fm(Math.round(v.num()))}`] };
    },
  });

  G({
    id: 'estGeo', trick: 'estimate', est: true, col: { ms: 0, hs: 4 },
    gen(r) {
      const kd = r.pick(['cylSA', 'cylLat', 'cylVolCm', 'hemi', 'pipe', 'pyramid', 'circ', 'lot']); let v, p, why; const pr = { kd };
      if (kd === 'cylSA') { const h = r.int(10, 40), d = r.pick([2, 4, 6, 8, 10]); const rr = d / 2; Object.assign(pr, { h, d }); v = PI.mul(2 * rr * (rr + h)); p = `A right cylinder is ${h}" high with a ${d}" diameter. Its total surface area is`; why = `Total area = 2πr² + 2πrh = 2πr(r + h) = 2π × ${rr} × ${rr + h}.`; }
      else if (kd === 'cylLat') { const hf = r.int(1, 4), d = r.int(5, 12); Object.assign(pr, { hf, d }); v = PI.mul(d * hf * 12); p = `A right cylinder is ${hf}' high with a ${d}" diameter. Its lateral surface area is`; why = `Lateral area = π × diameter × height, all in inches: π × ${d} × ${hf * 12}.`; }
      else if (kd === 'cylVolCm') { const h = r.int(10, 30), d = r.pick([2, 4, 6, 8]); Object.assign(pr, { h, d }); v = PI.mul((d / 2) ** 2 * h).mul(Q.parseNum('16.387064')); p = `A right cylinder is ${h}" high with a ${d}" diameter. Its volume in cubic centimeters is`; why = `π r² h = π × ${(d / 2) ** 2} × ${h} cubic inches, and 1 in³ ≈ 16.39 cm³.`; }
      else if (kd === 'hemi') { const rr = Q.parseNum(r.pick(['5.2', '4', '6.5', '3.5', '7', '8.4'])); const closed = r.chance(0.6); Object.assign(pr, { rr: rr.num(), closed }); v = PI.mul(rr.mul(rr)).mul(closed ? 3 : 2); p = `The ${closed ? 'total' : 'curved'} surface area of a hemisphere with a radius of ${H.dec(rr).h} cm is`; why = closed ? `Curved part 2πr² plus the flat circle πr²: 3πr² = 3π × ${H.dec(rr.mul(rr)).h}.` : `Half a sphere: 2πr² = 2π × ${H.dec(rr.mul(rr)).h}.`; }
      else if (kd === 'pipe') { const d = r.int(2, 12), L = r.int(20, 99); Object.assign(pr, { d, L }); v = PI.mul(q(d * d, 4)).mul(L); p = `A pipe with a diameter of ${d} feet is ${L} feet long. Its volume is`; why = `π r² × length = π × ${H.Qf(q(d * d, 4)).h} × ${L}.`; }
      else if (kd === 'pyramid') { const a = r.int(9, 30), b = r.int(9, 30), h = r.int(9, 30); Object.assign(pr, { a, b, h }); v = q(a * b * h, 3); p = `A right rectangular pyramid has a ${a} by ${b} base and a height of ${h}. Its volume is`; why = `Volume = one third of base × height = ${a} × ${b} × ${h} ÷ 3.`; }
      else if (kd === 'circ') { const C = r.int(100, 600); Object.assign(pr, { C }); v = Q.from(C * C).div(PI.mul(4)); p = `The circumference of a circle is ${C} cm. Its area in square cm is`; why = `r = C ÷ 2π, so area = C² ÷ 4π = ${C}² ÷ 12.57.`; }
      else { const f1 = r.pick([q(3, 8), q(1, 4), q(1, 2), q(5, 8)]), f2 = r.pick([q(1, 6), q(1, 3), q(1, 8), q(1, 5)]); Object.assign(pr, { f1: f1.num(), f2: f2.num() }); v = f1.mul(f2).mul(5280 * 5280); p = `A rectangular lot is ${H.Qi(f1).h} of a mile by ${H.Qi(f2).h} of a mile. Its area in square feet is`; why = `A square mile is 5280² = 27,878,400 square feet. Multiply by ${H.Qi(f1).h} × ${H.Qi(f2).h}.`; }
      return { p: H.cat(p), a: A.est(v), params: pr, steps: [why, `≈ ${fm(Math.round(v.num()))}`] };
    },
  });

  G({
    id: 'estRep', trick: 'estimate', est: true, col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['repSq', 'fracSq', 'pctDiv', 'fx']);
      if (kd === 'repSq') { const ab = r.int(10, 98); if (ab % 11 === 0) return this.gen(r); const n = r.int(1100, 4999); const f = q(ab, 99); const v = f.mul(n).pow(2);
        return { p: H.cat(`(.${String(ab).padStart(2, '0')}${String(ab).padStart(2, '0')}${String(ab).padStart(2, '0')}… × ${fm(n)})² =`), a: A.est(v), params: { kd, ab, n }, steps: [`.${String(ab).padStart(2, '0')} repeating is ${ab}/99. So the inside is about ${fm(Math.round(f.mul(n).num()))}.`, `Square it: ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'fracSq') { const [d, f] = r.pick([['.875', q(7, 8)], ['.625', q(5, 8)], ['.375', q(3, 8)], ['.75', q(3, 4)], ['1.25', q(5, 4)]]); const n = r.int(400, 3999); const v = f.mul(n).pow(2);
        return { p: H.cat(`(${fm(n)} × ${d})² =`), a: A.est(v), params: { kd, n, f: f.toFracStr() }, steps: [`${d} = ${H.Qi(f).h}, so the inside is ${fm(n)} × ${H.Qi(f).h} ≈ ${fm(Math.round(f.mul(n).num()))}.`, `Square it: ≈ ${fm(Math.round(v.num()))}`] }; }
      if (kd === 'pctDiv') { const a = r.int(300, 9999), p = r.pick([20, 25, 40, 50, 75]), b = r.int(12, 99); const v = Q.from(a).div(q(p * b, 100));
        return { p: H.cat(`${fm(a)} ÷ (${p}% of ${b}) =`), a: A.est(v), params: { kd, a, p, b }, steps: [`${p}% of ${b} = ${H.Qf(q(p * b, 100)).h}.`, `${fm(a)} ÷ ${H.Qf(q(p * b, 100)).h} ≈ ${fm(Math.round(v.num()))}`] }; }
      const [cur, rate] = r.pick([['yen', '1564.69'], ['pesos', '207.98'], ['euros', '9.23'], ['rupees', '831.45']]); const n = r.int(100, 3000); const v = Q.parseNum(rate).mul(n).div(10);
      return { p: H.cat(`If $10.00 can buy ${rate} ${cur}, then $${fm(n)}.00 can buy`), suffix: cur, a: A.est(v), params: { kd, rate, n }, steps: [`$${fm(n)} is ${H.dec(q(n, 10)).h} times $10.`, `${rate} × ${H.dec(q(n, 10)).h} ≈ ${fm(Math.round(v.num()))}`] };
    },
  });
})();
