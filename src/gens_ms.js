/* ===== problem types from 88 official TMSCA middle school tests (2015–16 through 2022–23) =====
   Each generator is placed in the column where the type actually shows up on those tests. */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn, m = NS.m;
  const Qs = x => H.Qf(x).h;                       // a value as a mixed number (markup)
  const Qp = x => (Q.from(x).cmp(0) < 0 ? `(${Qs(x)})` : Qs(x)); // same, in parentheses when negative
  const Qi = x => H.Qi(x).h;                       // a value as an improper fraction (slopes)
  const fr = (w, n) => { const v = q(w, n); return Number(v.d) === n || v.isInt() ? (v.isInt() ? `${w}/${n} = ${hl(Qs(v))}` : hl(Qs(v))) : `${w}/${n} = ${hl(Qs(v))}`; };
  const nways = n => `${n} way${n === 1 ? '' : 's'}`;
  const dec = x => Q.from(x).toDecStr();            // a terminating value as a decimal
  const lin = (a, b) => NS.poly([a, b]).l;          // LaTeX for ax + b
  const term = (c, v, first) => { if (!c) return ''; const s = c < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + '); const a = Math.abs(c); return s + (a === 1 ? '' : a) + v; };
  const lineL = (a, b, c) => `${term(a, 'x', true)}${term(b, 'y', !a)} = ${c}`;
  const PN = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 11: 'undecagon', 12: 'dodecagon' };
  const pname = n => PN[n] || `${n}-sided polygon`;
  const art = s => (/^[aeiou]/.test(s) ? 'an ' : 'a ') + s;
  const setL = xs => `\\{${xs.join(', ')}\\}`;
  const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const ways = s => 6 - Math.abs(7 - s);            // ways two dice make sum s
  const ap = x => Q.parseNum(x.toFixed(6));        // a float as an exact decimal, for estimates
  const isSq = n => n >= 0 && Number.isInteger(Math.sqrt(n));
  const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [6, 8, 10], [12, 16, 20]];

  /* ---------- first four digits of a decimal ---------- */
  function expand(n, d) { const seen = new Map(); let rem = n % d, s = ''; while (rem && !seen.has(rem)) { seen.set(rem, s.length); rem *= 10; s += Math.floor(rem / d); rem %= d; } if (!rem) return { pre: s, rep: '' }; const i = seen.get(rem); return { pre: s.slice(0, i), rep: s.slice(i) }; }
  NS.decExpand = expand;
  G({
    id: 'decDigits', trick: 'decimalDigits', col: { ms: 4, hs: 0 }, w: 1.6,
    gen(r) {
      const d = r.pick([7, 11, 12, 13, 15, 18, 22, 27, 33, 36, 37, 44, 45, 55, 66, 74, 90, 99, 111, 135, 165, 198]);
      let a, rd; do { a = r.int(1, d - 1); rd = d / M.gcd(a, d); let t = rd; while (t % 2 === 0) t /= 2; while (t % 5 === 0) t /= 5; if (t > 1) break; } while (true);
      const g = M.gcd(a, d), rn = a / g; const digits = String(Math.floor(a * 10000 / d)).padStart(4, '0');
      const { pre, rep } = expand(rn, rd); let shown = pre; while (shown.length < 7) shown += rep;
      const s1 = g > 1 ? `Reduce first: ${m(`\\tfrac{${a}}{${d}} = \\tfrac{${rn}}{${rd}}`)}. ` : '';
      const how = 99 % rd === 0 ? `Over 99 the two digits repeat: ${m(`\\tfrac{${rn}}{${rd}} = \\tfrac{${rn * 99 / rd}}{99}`)}.` : 999 % rd === 0 ? `Over 999 the three digits repeat: ${m(`\\tfrac{${rn}}{${rd}} = \\tfrac{${rn * 999 / rd}}{999}`)}.` : rd % 9 === 0 || rd % 11 === 0 ? `Split off what goes over 10, 100, …, then use the 9s or 11ths pattern.` : `Divide ${rn} by ${rd}.`;
      return { p: H.cat('The first four digits after the decimal point of ', H.frac(a, d), ' are'), pre: '0.', a: A.text(digits, 'word'), params: { a, d },
        steps: [s1 + how, `${m(`\\tfrac{${rn}}{${rd}}`)} = 0.${shown}…, so the first four digits are ${hl(digits)}`] };
    },
  });

  /* ---------- clock hands ---------- */
  G({
    id: 'clock', trick: 'clockAngles', col: { ms: 4, hs: 0 },
    gen(r) {
      let h, mm; do { h = r.int(1, 12); mm = r.chance(0.65) ? 5 * r.int(0, 11) : r.int(1, 59); } while (h === 12 && mm === 0);
      const H2 = 60 * (h % 12) + mm, M2 = 12 * mm; const raw = Math.abs(H2 - M2); const big = raw > 360; const d = big ? 720 - raw : raw; const v = q(d, 2);
      const tm = `${h}:${String(mm).padStart(2, '0')}`;
      return { p: H.cat(`The smaller angle between the hands of a clock at ${tm} is`), suffix: '°', a: A.num(v), params: { h, mm },
        steps: [`Hour hand: 30 × ${h % 12} + ${mm} ÷ 2 = ${dec(q(H2, 2))}° past 12. Minute hand: 6 × ${mm} = ${6 * mm}°.`, big ? `They are ${dec(q(raw, 2))}° apart, more than 180°, so the smaller angle is 360° − ${dec(q(raw, 2))}° = ${hl(dec(v))}°` : `The difference is ${hl(dec(v))}°`] };
    },
  });

  /* ---------- counting multiples ---------- */
  G({
    id: 'countMult', trick: 'countMultiples', col: { ms: 2, hs: 0 },
    gen(r) {
      const kd = r.pick(['between', 'between', 'or', 'neither', 'terms']);
      if (kd === 'between') { const k = r.int(3, 13), a = r.int(5, 60), b = a + r.int(30, 150); const hi = Math.floor((b - 1) / k), lo = Math.floor(a / k); const v = hi - lo;
        return { p: H.cat(`How many integers between ${a} and ${b} are divisible by ${k}?`), a: A.num(v), params: { kd, k, a, b },
          steps: [`Multiples of ${k} below ${b}: ${b - 1} ÷ ${k} → ${hi} (drop the remainder). Multiples up to ${a}: ${a} ÷ ${k} → ${lo}.`, `${hi} − ${lo} = ${hl(v)}`] }; }
      if (kd === 'terms') { const a0 = r.int(50, 200), d = r.int(3, 12); const v = Math.ceil(a0 / d);
        return { p: H.cat(`How many positive terms does the sequence ${a0}, ${a0 - d}, ${a0 - 2 * d}, … have?`), a: A.num(v), params: { kd, a0, d },
          steps: [`The terms are ${a0} − ${d}k for k = 0, 1, 2, …, and stay positive while ${d}k < ${a0}.`, `k can be 0 through ${v - 1}: ${hl(v)} terms`] }; }
      let a, b; do { a = r.int(2, 9); b = r.int(2, 11); } while (a >= b || b % a === 0);
      const L = a * b / M.gcd(a, b); const n = r.int(40, 300); const N = kd === 'or' ? n - 1 : n;
      const fa = Math.floor(N / a), fb = Math.floor(N / b), fl = Math.floor(N / L); const either = fa + fb - fl; const v = kd === 'or' ? either : n - either;
      return { p: kd === 'or' ? H.cat(`How many positive integers less than ${n} are divisible by ${a} or ${b}?`) : H.cat(`How many integers from 1 to ${n} are divisible by neither ${a} nor ${b}?`), a: A.num(v), params: { kd, a, b, n },
        steps: [`Up to ${N}: multiples of ${a}: ${fa}; of ${b}: ${fb}; of both (multiples of ${L}): ${fl}.`, kd === 'or' ? `${fa} + ${fb} − ${fl} = ${hl(v)}` : `Divisible by one or the other: ${fa} + ${fb} − ${fl} = ${either}. Neither: ${n} − ${either} = ${hl(v)}`] };
    },
  });

  /* ---------- absolute value equations ---------- */
  G({
    id: 'absEq', trick: 'absSolutions', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['sum', 'sum', 'larger', 'smaller', 'dist', 'gap', 'findC', 'findD']);
      if (kd === 'findC' || kd === 'findD') { const c = r.int(-15, 15), d = r.int(2, 25); const s1 = c - d, s2 = c + d;
        return { p: H.cat('The two solutions of ', H.L('|x - c| = d'), ` are ${fm(s1)} and ${fm(s2)}. `, H.L(kd === 'findC' ? 'c' : 'd'), ' ='), a: A.num(kd === 'findC' ? c : d), params: { kd, s1, s2 },
          steps: [`The solutions sit ${m('d')} on either side of ${m('c')}, so ${m('c')} is their midpoint and ${m('d')} is half the distance between them.`, kd === 'findC' ? `${m('c')} = (${fm(s1)} + ${fm(s2)}) ÷ 2 = ${hl(fm(c))}` : `${m('d')} = (${fm(s2)} − ${s1 < 0 ? `(${fm(s1)})` : fm(s1)}) ÷ 2 = ${hl(d)}`] }; }
      const a = r.pick([1, 1, 2, 2, 3, 4, 5]); let b; do { b = r.int(-15, 15); } while (!b);
      let c = kd === 'gap' ? Math.abs(b) + r.int(1, 15) : r.int(2, 30);
      const cS = kd === 'sum' && a === 1 && r.chance(0.4) ? String(c + r.pick([0.2, 0.5, 0.25, 0.4])) : String(c);
      const C = Q.parseNum(cS); const x1 = C.sub(b).div(a), x2 = C.neg().sub(b).div(a);
      const eq = H.L(`\\left|${lin(a, b)}\\right| = ${cS}`);
      const pre = { sum: 'The sum of the solutions of ', larger: 'The larger solution of ', smaller: 'The smaller solution of ', dist: 'The distance between the two solutions of ' }[kd];
      const p = kd === 'gap' ? H.cat('How much greater is the positive solution of ', eq, ' than the negative solution?') : H.cat(pre, eq, ' is');
      const both = `${m(`${lin(a, b)} = ${cS}`)} gives x = ${Qs(x1)}; ${m(`${lin(a, b)} = -${cS}`)} gives x = ${Qs(x2)}.`;
      let v, s2;
      if (kd === 'sum') { v = q(-2 * b, a); return { p, a: A.num(v), params: { kd, a, b, c: cS }, steps: [`The two solutions are mirror images around where ${m(lin(a, b))} = 0, which is x = ${Qs(q(-b, a))}. The right side doesn't matter.`, `Sum = 2 × ${Qs(q(-b, a))} = ${hl(Qs(v))}`] }; }
      if (kd === 'larger') { v = x1; s2 = `The larger one: ${hl(Qs(v))}`; }
      else if (kd === 'smaller') { v = x2; s2 = `The smaller one: ${hl(Qs(v))}`; }
      else { v = q(2 * c, a); s2 = `${Qs(x1)} − (${Qs(x2)}) = ${hl(Qs(v))}`; }
      return { p, a: A.num(v), params: { kd, a, b, c: cS }, steps: [both, s2] };
    },
  });

  /* ---------- absolute value inequalities ---------- */
  G({
    id: 'absIneq', trick: 'absSolutions', col: { ms: 4, hs: 0 }, w: 1.4,
    gen(r) {
      const kd = r.pick(['sumH', 'sumH', 'sumGen', 'count', 'chain']); const strict = r.chance(0.3); const rel = strict ? '<' : '\\le';
      let a, b, c, lo, hi, p, setup;
      if (kd === 'chain') {
        a = r.int(2, 7); b = r.int(-9, 9); const L = r.int(-20, 30), U = L + r.int(15, 60); const xs = []; for (let x = -100; x <= 100; x++) { const y = a * x + b; if (strict ? (L < y && y < U) : (L <= y && y <= U)) xs.push(x); }
        if (xs.length < 2) return this.gen(r); lo = xs[0]; hi = xs[xs.length - 1];
        p = H.cat('If ', H.L(`${L} ${rel} ${lin(a, b)} ${rel} ${U}`), ', how many integers x make it true?');
        return { p, a: A.num(xs.length), params: { kd, a, b, L, U, strict }, steps: [`Take ${fm(b)} from each part and divide by ${a}: x runs from ${Qs(q(L - b, a))} to ${Qs(q(U - b, a))}${strict ? ', ends not included' : ''}.`, `Integers ${fm(lo)} through ${fm(hi)}: ${hl(xs.length)}`] };
      }
      if (kd === 'sumH') { a = 1; b = -r.int(-12, 15) || 7; c = r.int(2, 12); }
      else { a = r.int(2, 5); do { b = r.int(-12, 12); } while (!b || b % a === 0); c = r.int(a + 1, 30); }
      const xs = []; for (let x = -100; x <= 100; x++) { const y = Math.abs(a * x + b); if (strict ? y < c : y <= c) xs.push(x); }
      lo = xs[0]; hi = xs[xs.length - 1]; const n = xs.length, sum = xs.reduce((s, x) => s + x, 0);
      const ineq = H.L(`\\left|${lin(a, b)}\\right| ${rel} ${c}`);
      setup = `${m(`-${c} ${rel} ${lin(a, b)} ${rel} ${c}`)}, so x runs from ${Qs(q(-c - b, a))} to ${Qs(q(c - b, a))}${strict ? ', ends not included' : ''}: integers ${fm(lo)} through ${fm(hi)}.`;
      if (kd === 'count') return { p: H.cat('How many integers are solutions of ', ineq, '?'), a: A.num(n), params: { kd, a, b, c, strict }, steps: [setup, `${fm(hi)} − (${fm(lo)}) + 1 = ${hl(n)}`] };
      return { p: H.cat('The sum of the integral solutions of ', ineq, ' is'), a: A.num(sum), params: { kd, a, b, c, strict },
        steps: [setup, `${n} integers centered on ${Qs(q(lo + hi, 2))}: sum = ${n} × ${Qp(q(lo + hi, 2))} = ${hl(fm(sum))}`] };
    },
  });

  /* ---------- geometric and harmonic means ---------- */
  G({
    id: 'means', trick: 'means', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['harm2', 'harm2', 'geo2', 'geo3', 'geoRad', 'geoPow']);
      if (kd === 'harm2') { let a, b; do { a = r.int(2, 24); b = r.int(2, 24); } while (a >= b); const v = q(2 * a * b, a + b);
        return { p: H.cat(`The harmonic mean of ${a} and ${b} is`), a: A.num(v), params: { kd, a, b }, steps: [`Harmonic mean of two numbers: ${m('\\frac{2ab}{a + b}')}.`, `${m(`\\frac{2 \\cdot ${a} \\cdot ${b}}{${a + b}}`)} = ${hl(Qs(v))}`] }; }
      if (kd === 'geo2') { let k, x, y, a, b; do { k = r.int(1, 7); x = r.int(1, 6); y = r.int(1, 6); a = k * x * x; b = k * y * y; } while (x >= y || b > 160 || a < 2);
        const v = k * x * y; return { p: H.cat(`The positive geometric mean of ${a} and ${b} is`), a: A.num(v), params: { kd, xs: [a, b] }, steps: [`Geometric mean: ${m(`\\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}}`)}.`, `= ${hl(v)}`] }; }
      if (kd === 'geo3') { let g, a, b, c; for (;;) { g = r.int(2, 12); const G3 = g ** 3; const ds = M.divisors(G3).filter(x => x <= 99 && x > 1); a = r.pick(ds); const rest = G3 / a; const ds2 = M.divisors(rest).filter(x => x <= 99 && x > 1); b = r.pick(ds2); c = rest / b; if (c > 1 && c <= 99 && a < b && b < c) break; }
        return { p: H.cat(`The geometric mean of ${a}, ${b} and ${c} is`), a: A.num(g), params: { kd, xs: [a, b, c] }, steps: [`Geometric mean of three numbers: the cube root of their product.`, `${m(`\\sqrt[3]{${a} \\cdot ${b} \\cdot ${c}} = \\sqrt[3]{${a * b * c}}`)} = ${hl(g)}`] }; }
      if (kd === 'geoRad') { let a, b, s, t; for (;;) { a = r.int(2, 30); b = r.int(2, 30); if (a === b) continue; const n = a * b; s = 1; for (let i = 2; i * i <= n; i++) if (n % (i * i) === 0) s = i; t = n / (s * s); if (s > 1 && t > 1) break; }
        return { p: H.cat(`The geometric mean of ${a} and ${b} is `, H.L('a\\sqrt{b}'), `, where ${m('b')} has no square factor other than 1. `, H.L('a + b'), ' ='), a: A.num(s + t), params: { kd, a, b },
          steps: [`${m(`\\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}} = \\sqrt{${s * s} \\cdot ${t}} = ${s}\\sqrt{${t}}`)}.`, `a + b = ${s} + ${t} = ${hl(s + t)}`] }; }
      // geoPow
      const pb = r.pick([2, 3, 5]);
      if (r.chance(0.5)) { const e = r.int(2, 12); const v = 2 * e;
        return { p: H.cat('The geometric mean of ', H.pow(pb, e), ', ', H.pow(pb * pb, e), ' and ', H.pow(pb ** 3, e), ' is ', H.pow(pb, 'x'), '. ', H.L('x'), ' ='), a: A.num(v), params: { kd, mode: 'stack', pb, e },
          steps: [`Write each as a power of ${pb}: ${m(`${pb}^{${e}}, ${pb}^{${2 * e}}, ${pb}^{${3 * e}}`)}.`, `Multiplying adds the exponents and the cube root divides by 3: (${e} + ${2 * e} + ${3 * e}) ÷ 3 = ${hl(v)}`] }; }
      const k = r.pick([3, 4]); const es = Array.from({ length: k }, () => r.int(3, 16)); const sum = es.reduce((s, x) => s + x, 0); es[k - 1] += (k - sum % k) % k;
      const v = q(es.reduce((s, x) => s + x, 0), k); const parts = []; es.forEach((e, i) => { if (i) parts.push(i === k - 1 ? ' and ' : ', '); parts.push(H.pow(pb, e)); });
      return { p: H.cat('The geometric mean of ', ...parts, ' is ', H.pow(pb, 'x'), '. ', H.L('x'), ' ='), a: A.num(v), params: { kd, mode: 'list', pb, es },
        steps: [`The product is ${pb} to the ${es.join(' + ')} = ${es.reduce((s, x) => s + x, 0)}; the ${k === 3 ? 'cube' : 'fourth'} root divides that by ${k}.`, `x = the average exponent = ${hl(Qs(v))}`] };
    },
  });

  /* ---------- equilateral triangles and regular hexagons ---------- */
  G({
    id: 'equiTri', trick: 'equilateral', col: { ms: 3, hs: 0 }, w: 1.5,
    gen(r) {
      const kd = r.pick(['sideA', 'sideA', 'sideA', 'heightA', 'sideH', 'heightP', 'perimA', 'hexA', 'areaS']);
      const K = H.L('k\\sqrt{3}'), k = H.L('k');
      if (kd === 'sideA') { const s = r.int(3, 40); const v = q(s * s, 4);
        return { p: H.cat(`The area of an equilateral triangle with side ${s} is `, K, '. ', k, ' ='), a: A.num(v), params: { kd, s }, steps: [`Area = ${m('\\frac{s^2}{4}\\sqrt3')}.`, `k = ${s * s} ÷ 4 = ${hl(Qs(v))}`] }; }
      if (kd === 'sideH') { const s = r.int(3, 40); const v = q(s, 2);
        return { p: H.cat(`The height of an equilateral triangle with side ${s} is `, K, '. ', k, ' ='), a: A.num(v), params: { kd, s }, steps: [`Height = ${m('\\frac{s}{2}\\sqrt3')}.`, `k = ${s} ÷ 2 = ${hl(Qs(v))}`] }; }
      if (kd === 'heightA' || kd === 'heightP') { const t = r.int(2, 15); const hL = H.L(`${t}\\sqrt{3}`);
        if (kd === 'heightA') return { p: H.cat('The area of an equilateral triangle with height ', hL, ' is ', K, '. ', k, ' ='), a: A.num(t * t), params: { kd, t }, steps: [`Height ${t}√3 means side ${2 * t} (the height is ${m('\\frac{s}{2}\\sqrt3')}). Area = ${m('\\frac{s^2}{4}\\sqrt3')}.`, `k = ${2 * t}² ÷ 4 = ${t}² = ${hl(t * t)}`] };
        return { p: H.cat('The perimeter of an equilateral triangle with height ', hL, ' is'), a: A.num(6 * t), params: { kd, t }, steps: [`Height ${t}√3 means side ${2 * t}.`, `Perimeter = 3 × ${2 * t} = ${hl(6 * t)}`] }; }
      if (kd === 'perimA') { const s = r.int(2, 20) * (r.chance(0.5) ? 2 : 1); const v = q(s * s, 4);
        return { p: H.cat(`If the perimeter of an equilateral triangle is ${3 * s}, its area is `, K, '. ', k, ' ='), a: A.num(v), params: { kd, s }, steps: [`Side = ${3 * s} ÷ 3 = ${s}.`, `k = ${s}² ÷ 4 = ${hl(Qs(v))}`] }; }
      if (kd === 'hexA') { const s = r.int(2, 20); const v = q(3 * s * s, 2);
        return { p: H.cat(`The area of a regular hexagon with side ${s} is `, K, '. ', k, ' ='), a: A.num(v), params: { kd, s }, steps: [`A regular hexagon is six equilateral triangles: ${m('6 \\cdot \\frac{s^2}{4}\\sqrt3 = \\frac{3s^2}{2}\\sqrt3')}.`, `k = 3 × ${s * s} ÷ 2 = ${hl(Qs(v))}`] }; }
      const s = 2 * r.int(2, 15); const kk = s * s / 4;
      return { p: H.cat('An equilateral triangle has area ', H.L(`${kk}\\sqrt{3}`), '. Its side is'), a: A.num(s), params: { kd, kk }, steps: [`${m('\\frac{s^2}{4}')} = ${kk}, so ${m('s^2')} = ${4 * kk}.`, `s = ${hl(s)}`] };
    },
  });

  /* ---------- squares, circles, trapezoids and rhombuses ---------- */
  G({
    id: 'flatMore', trick: 'area', col: { ms: 3, hs: 0 },
    gen(r) {
      const kd = r.pick(['sqAreaDiag', 'sqPerimA', 'sqAreaP', 'trapMedian', 'rhombSide', 'circCA', 'circAD', 'rectDiag', 'isoTrap']);
      if (kd === 'sqAreaDiag') { const s = r.chance(0.5) ? r.int(3, 30) : 10 * r.int(2, 90); return { p: H.cat(`The diagonal of a square with area ${fm(s * s)} is `, H.L('k\\sqrt{2}'), '. ', H.L('k'), ' ='), a: A.num(s), params: { kd, s }, steps: [`Side = √${fm(s * s)} = ${s}.`, `Diagonal = side × √2, so k = ${hl(s)}`] }; }
      if (kd === 'sqPerimA') { const s = r.int(3, 40); return { p: H.cat(`If the perimeter of a square is ${4 * s}, its area is`), a: A.num(s * s), params: { kd, s }, steps: [`Side = ${4 * s} ÷ 4 = ${s}.`, `Area = ${s}² = ${hl(s * s)}`] }; }
      if (kd === 'sqAreaP') { const s = r.int(3, 40); return { p: H.cat(`If the area of a square is ${s * s}, its perimeter is`), a: A.num(4 * s), params: { kd, s }, steps: [`Side = √${s * s} = ${s}.`, `Perimeter = 4 × ${s} = ${hl(4 * s)}`] }; }
      if (kd === 'trapMedian') { const md = r.int(4, 40), h = r.int(2, 16); return { p: H.cat(`A trapezoid has area ${md * h} and height ${h}. Its median is`), a: A.num(md), params: { kd, A0: md * h, h }, steps: [`Area = median × height (the median is the average of the bases).`, `${md * h} ÷ ${h} = ${hl(md)}`] }; }
      if (kd === 'rhombSide') { const [a, b, c] = r.pick(TRI.slice(0, 6)); const t = r.pick([1, 1, 2]); return { p: H.cat(`The diagonals of a rhombus are ${2 * a * t} and ${2 * b * t}. Its side is`), a: A.num(c * t), params: { kd, d1: 2 * a * t, d2: 2 * b * t }, steps: [`The diagonals cut each other in half at right angles: legs ${a * t} and ${b * t}.`, `Side = √(${a * t}² + ${b * t}²) = ${hl(c * t)}`] }; }
      if (kd === 'circCA') { const rr = r.int(2, 25); return { p: H.cat(`A circle has circumference ${2 * rr}π. Its area is kπ. `, H.L('k'), ' ='), a: A.num(rr * rr), params: { kd, rr }, steps: [`2πr = ${2 * rr}π, so r = ${rr}.`, `Area = πr², so k = ${hl(rr * rr)}`] }; }
      if (kd === 'circAD') { const rr = r.int(2, 30); return { p: H.cat(`If the area of a circle is ${rr * rr}π, then its diameter is`), a: A.num(2 * rr), params: { kd, rr }, steps: [`r² = ${rr * rr}, so r = ${rr}.`, `Diameter = ${hl(2 * rr)}`] }; }
      if (kd === 'rectDiag') { const [a, b, c] = r.pick(TRI.slice(0, 6)); const t = r.pick([1, 2, 3]); const [w, l] = r.chance(0.5) ? [a, b] : [b, a]; return { p: H.cat(`A rectangle has a diagonal of ${c * t} and a width of ${w * t}. Its length is`), a: A.num(l * t), params: { kd, c: c * t, w: w * t }, steps: [`The diagonal is the hypotenuse: ${m(`${c * t}^2 - ${w * t}^2 = ${(c * t) ** 2 - (w * t) ** 2}`)}.`, `Length = ${hl(l * t)}`] }; }
      const x = r.int(40, 85); return { p: H.cat(`One base angle of an isosceles trapezoid is ${x}°. The sum of its two largest angles is`), suffix: '°', a: A.num(2 * (180 - x)), params: { kd, x }, steps: [`The angles are ${x}°, ${x}°, ${180 - x}° and ${180 - x}° (angles along a leg add to 180°).`, `2 × ${180 - x}° = ${hl(2 * (180 - x))}°`] };
    },
  });

  /* ---------- spheres, tetrahedrons, pyramids, inner diagonals ---------- */
  G({
    id: 'solids', trick: 'volume', col: { ms: 4, hs: 0 },
    gen(r) {
      const kd = r.pick(['sphSAtoV', 'sphSAtoR', 'cubeDiag', 'tetraSA', 'tetraV', 'hexaSA', 'pyramid', 'prismDiag2']); const k = H.L('k');
      if (kd === 'sphSAtoV' || kd === 'sphSAtoR') { const rr = kd === 'sphSAtoV' ? 3 * r.int(1, 5) : r.int(2, 15);
        if (kd === 'sphSAtoR') return { p: H.cat(`If the surface area of a sphere is ${4 * rr * rr}π, then its radius is`), a: A.num(rr), params: { kd, rr }, steps: [`4πr² = ${4 * rr * rr}π, so r² = ${rr * rr}.`, `r = ${hl(rr)}`] };
        const v = q(4 * rr ** 3, 3); return { p: H.cat(`A sphere has surface area ${4 * rr * rr}π. Its volume is kπ. `, k, ' ='), a: A.num(v), params: { kd, rr }, steps: [`4πr² = ${4 * rr * rr}π, so r = ${rr}.`, `${m('V = \\tfrac43 \\pi r^3')}: k = 4 × ${rr ** 3} ÷ 3 = ${hl(Qs(v))}`] }; }
      if (kd === 'cubeDiag') { const e = r.chance(0.5) ? r.int(2, 30) : 10 * r.int(3, 50); return { p: H.cat(`The inner diagonal of a cube with edge ${e} is `, H.L('k\\sqrt{3}'), '. ', k, ' ='), a: A.num(e), params: { kd, e }, steps: [`Inner diagonal = ${m('\\sqrt{e^2 + e^2 + e^2} = e\\sqrt3')}.`, `k = ${hl(e)}`] }; }
      if (kd === 'tetraSA') { const s = r.int(2, 30); return { p: H.cat(`The surface area of a regular tetrahedron with edge ${s} is `, H.L('k\\sqrt{3}'), '. ', k, ' ='), a: A.num(s * s), params: { kd, s }, steps: [`Four equilateral triangles: ${m('4 \\cdot \\frac{s^2}{4}\\sqrt3 = s^2\\sqrt3')}.`, `k = ${s}² = ${hl(s * s)}`] }; }
      if (kd === 'tetraV') { const s = r.pick([3, 6, 6, 9, 12, 12, 15, 18]); const v = q(s ** 3, 12); return { p: H.cat(`The volume of a regular tetrahedron with edge ${s} is `, H.L('k\\sqrt{2}'), '. ', k, ' ='), a: A.num(v), params: { kd, s }, steps: [`${m('V = \\frac{s^3}{12}\\sqrt2')}.`, `k = ${s ** 3} ÷ 12 = ${hl(Qs(v))}`] }; }
      if (kd === 'hexaSA') { const s = r.int(2, 25); return { p: H.cat(`The surface area of a regular hexahedron with edge ${s} is`), a: A.num(6 * s * s), params: { kd, s }, steps: [`A regular hexahedron is a cube: six ${s} × ${s} faces.`, `6 × ${s * s} = ${hl(6 * s * s)}`] }; }
      if (kd === 'pyramid') { const s = r.int(3, 20), h = 3 * r.int(1, 8); const v = s * s * h / 3; return { p: H.cat(`A square pyramid has a base edge of ${s} and a height of ${h}. Its volume is`), a: A.num(v), params: { kd, s, h }, steps: [`${m('V = \\tfrac13 \\cdot \\text{base} \\cdot h')} = ${s * s} × ${h} ÷ 3.`, `= ${hl(v)}`] }; }
      const [a, b, c] = r.pick(TRI.slice(0, 6)); const t = r.pick([1, 1, 2, 3]);
      return { p: H.cat(`The inner diagonal of a ${c * t} by ${a * t} by ${b * t} box is `, H.L('k\\sqrt{2}'), '. ', k, ' ='), a: A.num(c * t), params: { kd, dims: [c * t, a * t, b * t] }, steps: [`${a * t}² + ${b * t}² = ${c * t}², so the diagonal is ${m(`\\sqrt{${c * t}^2 + ${c * t}^2} = ${c * t}\\sqrt2`)}.`, `k = ${hl(c * t)}`] };
    },
  });

  /* ---------- polygons: diagonals, triangles, perimeters ---------- */
  G({
    id: 'polyMore', trick: 'polygons', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['diagSides', 'triVertex', 'tri3', 'perimExt', 'sumExceeds', 'sidesFromSum', 'sidesFromInt', 'central']);
      const divs = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36];
      if (kd === 'diagSides') { const n = r.int(5, 30); const D = n * (n - 3) / 2; return { p: H.cat(`A polygon with ${D} diagonals has how many sides?`), a: A.num(n), params: { kd, D }, steps: [`${m('\\frac{n(n - 3)}{2}')} = ${D}, so ${m('n(n - 3)')} = ${2 * D}.`, `Two numbers 3 apart with product ${2 * D}: ${n} × ${n - 3}. n = ${hl(n)}`] }; }
      if (kd === 'triVertex') { const n = r.int(5, 24); return { p: H.cat(`How many triangles are formed by drawing every diagonal from one vertex of ${art(pname(n))}?`), a: A.num(n - 2), params: { kd, n }, steps: [`The diagonals from one vertex cut an n-gon into n − 2 triangles.`, `${n} − 2 = ${hl(n - 2)}`] }; }
      if (kd === 'tri3') { const n = r.int(5, 15); const v = M.C(n, 3); return { p: H.cat(`How many triangles can be drawn using any three vertices of ${art(pname(n))}?`), a: A.num(v), params: { kd, n }, steps: [`Any 3 of the ${n} vertices make a triangle: ${m(`\\binom{${n}}{3}`)}.`, `${n} × ${n - 1} × ${n - 2} ÷ 6 = ${hl(v)}`] }; }
      if (kd === 'perimExt') { const n = r.pick(divs.filter(x => x <= 24)); const s = r.int(3, 30); return { p: H.cat(`A regular polygon with an exterior angle of ${360 / n}° and a side of ${s} has a perimeter of`), a: A.num(n * s), params: { kd, e: 360 / n, s }, steps: [`Number of sides = 360 ÷ ${360 / n} = ${n}.`, `${n} × ${s} = ${hl(n * s)}`] }; }
      if (kd === 'sumExceeds') { const a = r.int(7, 12), b = r.int(3, a - 1); return { p: H.cat(`The sum of the interior angles of ${art(pname(a))} exceeds the sum for ${art(pname(b))} by`), suffix: '°', a: A.num(180 * (a - b)), params: { kd, a, b }, steps: [`Each extra side adds 180°. ${a} − ${b} = ${a - b} more sides.`, `${a - b} × 180° = ${hl(180 * (a - b))}°`] }; }
      if (kd === 'sidesFromSum') { const n = r.int(5, 30); return { p: H.cat(`If the interior angles of a polygon add to ${fm(180 * (n - 2))}°, the polygon has how many sides?`), a: A.num(n), params: { kd, S: 180 * (n - 2) }, steps: [`${fm(180 * (n - 2))} ÷ 180 = ${n - 2} triangles.`, `n = ${n - 2} + 2 = ${hl(n)}`] }; }
      if (kd === 'sidesFromInt') { const n = r.pick(divs.filter(x => x >= 5)); const ia = 180 - 360 / n; return { p: H.cat(`A regular polygon with an interior angle of ${ia}° has how many sides?`), a: A.num(n), params: { kd, ia }, steps: [`Exterior angle = 180° − ${ia}° = ${360 / n}°.`, `360 ÷ ${360 / n} = ${hl(n)}`] }; }
      const n = r.pick(divs.filter(x => x >= 5 && x <= 12)); return { p: H.cat(`Each central angle of a regular ${pname(n)} measures`), suffix: '°', a: A.num(360 / n), params: { kd, n }, steps: [`The ${n} central angles fill 360°.`, `360 ÷ ${n} = ${hl(360 / n)}°`] };
    },
  });

  /* ---------- sets ---------- */
  const SETW = ['texas', 'planet', 'hornets', 'numbers', 'triangle', 'square', 'prism', 'compute', 'factor', 'median', 'graphic', 'fourth', 'dolphin', 'monkey', 'climb', 'throws', 'blacksmith'];
  G({
    id: 'setsMore', trick: 'sets', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['kSub', 'kSub', 'nFromSub', 'even', 'twoOr', 'unionInter', 'moreSub']);
      if (kd === 'kSub') { const w = r.pick(SETW.filter(x => x.length <= 9)); const n = w.length, k = r.int(1, Math.min(4, n - 1)); const v = M.C(n, k);
        return { p: H.cat(`How many ${k}-element subsets does `, H.L(setL(w.split(''))), ' have?'), a: A.num(v), params: { kd, n, k }, steps: [`Choose ${k} of the ${n} elements: ${m(`\\binom{${n}}{${k}}`)}.`, `= ${hl(v)}`] }; }
      if (kd === 'nFromSub') { const n = r.int(3, 11); return { p: H.cat(`A set with ${fm(2 ** n)} subsets has how many elements?`), a: A.num(n), params: { kd, N: 2 ** n }, steps: [`A set with n elements has ${m('2^n')} subsets.`, `${fm(2 ** n)} = ${m(`2^{${n}}`)}, so n = ${hl(n)}`] }; }
      if (kd === 'even') { const n = r.int(3, 10); return { p: H.cat(`A set with ${n} elements has how many subsets with an even number of elements?`), a: A.num(2 ** (n - 1)), params: { kd, n }, steps: [`Exactly half of the ${m(`2^{${n}}`)} subsets have an even count (the empty set counts as even).`, `${m(`2^{${n - 1}}`)} = ${hl(2 ** (n - 1))}`] }; }
      if (kd === 'moreSub') { const n = r.int(4, 8), k = r.int(2, n - 1); const L = 'abcdefgh'.split(''); const v = 2 ** n - 2 ** k;
        return { p: H.cat('How many more subsets does ', H.L(setL(L.slice(0, n))), ' have than ', H.L(setL(L.slice(0, k))), '?'), a: A.num(v), params: { kd, n, k }, steps: [`${m(`2^{${n}} - 2^{${k}}`)} = ${2 ** n} − ${2 ** k}.`, `= ${hl(v)}`] }; }
      if (kd === 'twoOr') { const w = r.pick(SETW.filter(x => x.length >= 6 && x.length <= 9)); const n = w.length; const k1 = r.int(1, 3), k2 = r.int(k1 + 1, n - 1); const v = M.C(n, k1) + M.C(n, k2);
        return { p: H.cat(`How many subsets of `, H.L(setL(w.split(''))), ` have either ${k1} or ${k2} elements?`), a: A.num(v), params: { kd, n, k1, k2 }, steps: [`${m(`\\binom{${n}}{${k1}} + \\binom{${n}}{${k2}}`)} = ${M.C(n, k1)} + ${M.C(n, k2)}.`, `= ${hl(v)}`] }; }
      // union / intersection of the letters of two words
      let w1, w2, A1, B1, I; do { w1 = r.pick(SETW); w2 = r.pick(SETW); A1 = w1.split('').slice(0, 6); B1 = w2.split('').slice(0, 6); I = A1.filter(x => B1.includes(x)); } while (w1 === w2 || I.length < 1);
      const U = A1.length + B1.length - I.length; const ask = r.pick(['union', 'inter', 'both']); const v = ask === 'union' ? U : ask === 'inter' ? I.length : U + I.length;
      const q2 = ask === 'union' ? H.cat(H.L('A \\cup B'), ' has how many elements?') : ask === 'inter' ? H.cat(H.L('A \\cap B'), ' has how many elements?') : H.cat('what is the total number of elements in ', H.L('A \\cup B'), ' and ', H.L('A \\cap B'), '?');
      return { p: H.cat('If ', H.L(`A = ${setL(A1)}`), ' and ', H.L(`B = ${setL(B1)}`), ', then ', q2), a: A.num(v), params: { kd, A1, B1, ask },
        steps: [`Shared letters: ${m(I.join(', '))} (${I.length}). Union: ${A1.length} + ${B1.length} − ${I.length} = ${U}.`, ask === 'union' ? `${hl(U)}` : ask === 'inter' ? `${hl(I.length)}` : `${U} + ${I.length} = ${hl(v)}`] };
    },
  });

  /* ---------- dice, odds and probability ---------- */
  G({
    id: 'diceMore', trick: 'probability', col: { ms: 4, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['sumOr', 'sumOr', 'less', 'between', 'odds', 'd4', 'divisor', 'oddsToP', 'repeat', 'marbles']);
      const tbl = 'Ways for sums 2 to 12 with two dice: 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 (out of 36).';
      if (kd === 'sumOr') { let s, t; do { s = r.int(2, 12); t = r.int(2, 12); } while (s >= t); const w = ways(s) + ways(t); const v = q(w, 36);
        return { p: H.cat(`Two dice are rolled. The probability of a sum of ${s} or ${t} is`), a: A.num(v), params: { kd, s, t }, steps: [`${s}: ${nways(ways(s))}; ${t}: ${nways(ways(t))}.`, `${w} out of 36: ${fr(w, 36)}`] }; }
      if (kd === 'less' || kd === 'between') { let lo, hi; if (kd === 'less') { lo = 2; hi = r.int(3, 9) - 1; } else { lo = r.int(3, 8); hi = lo + r.int(1, 3); } let w = 0; for (let s = lo; s <= hi; s++) w += ways(s); const v = q(w, 36);
        const p = kd === 'less' ? H.cat(`Two dice are rolled. The probability the sum is less than ${hi + 1} is`) : H.cat(`Two dice are rolled. The probability the sum is between ${lo} and ${hi}, inclusive, is`);
        return { p, a: A.num(v), params: { kd, lo, hi }, steps: [tbl, `Sums ${lo} to ${hi}: ${w} ways out of 36. ${fr(w, 36)}`] }; }
      if (kd === 'odds') { const s = r.int(2, 12); const w = ways(s); const g = M.gcd(w, 36 - w); const ans = `${w / g}:${(36 - w) / g}`;
        return { p: H.cat(`Two dice are rolled. What are the odds that the sum is ${s}?`), a: A.text(ans, 'ratio'), params: { kd, s }, steps: [`Odds compare ways for to ways against: ${w} to ${36 - w}.`, `In lowest terms: ${hl(ans)}`] }; }
      if (kd === 'd4') { const s = r.int(2, 8); const w = 4 - Math.abs(5 - s); const v = q(w, 16);
        return { p: H.cat(`Two 4-sided dice are rolled. The probability their sum is ${s} is`), a: A.num(v), params: { kd, s }, steps: [`16 outcomes. Sums 2 to 8 happen 1, 2, 3, 4, 3, 2, 1 ways.`, `${fr(w, 16)}`] }; }
      if (kd === 'divisor') { const n = r.pick([6, 8, 10, 12, 15, 16, 18, 20, 24, 30, 36]); const d = M.divisors(n).length; const v = q(d, n);
        return { p: H.cat(`A number is chosen at random from the first ${n} counting numbers. The probability it is a divisor of ${n} is`), a: A.num(v), params: { kd, n }, steps: [`Divisors of ${n}: ${M.divisors(n).join(', ')} (${d} of them).`, `${fr(d, n)}`] }; }
      if (kd === 'oddsToP') { let a, b; do { a = r.int(1, 12); b = r.int(1, 12); } while (M.gcd(a, b) !== 1 || a === b); const v = q(b, a + b);
        return { p: H.cat(`If the odds of losing a game are ${a} : ${b}, the probability of winning is`), a: A.num(v), params: { kd, a, b }, steps: [`Odds of losing ${a} : ${b} means ${a} losing for every ${b} winning, ${a + b} in all.`, `P(win) = ${hl(Qs(v))}`] }; }
      if (kd === 'repeat') { const n = r.int(2, 3), f = r.int(1, 6); const v = q(1, 6 ** n);
        return { p: H.cat(`A die is rolled ${n === 2 ? 'twice' : 'three times'}. The probability of getting a ${f} every time is`), a: A.num(v), params: { kd, n }, steps: [`Each roll is a ${f} with probability 1/6, and the rolls are independent.`, `${m(`\\left(\\tfrac16\\right)^{${n}}`)} = ${hl(Qs(v))}`] }; }
      const red = r.int(2, 9), blue = r.int(2, 9); const k = r.int(1, 15); const v = q(red, red + blue + k);
      return { p: H.cat(`A bag has ${red} red, ${blue} blue and k green marbles. If the probability of drawing a red marble is `, H.Qi(v), ', then ', H.L('k'), ' ='), a: A.num(k), params: { kd, red, blue, P: [Number(v.n), Number(v.d)] },
        steps: [`${red} red out of the total: total = ${red} ÷ ${Qs(v)} = ${red + blue + k}.`, `k = ${red + blue + k} − ${red} − ${blue} = ${hl(k)}`] };
    },
  });

  /* ---------- arrangements and committees ---------- */
  const WORDS = ['summer', 'letter', 'coffee', 'banana', 'pepper', 'pizza', 'cookie', 'google', 'puppy', 'tomato', 'llama', 'balloon', 'racecar', 'dallas', 'texas', 'abilene', 'amarillo', 'tennessee', 'mississippi', 'number'];
  G({
    id: 'arrange', trick: 'counting', col: { ms: 4, hs: 0 }, w: 1.2,
    gen(r) {
      const kd = r.pick(['word', 'word', 'word', 'line', 'committee', 'outfits']);
      if (kd === 'word') { const w = r.pick(WORDS); const cnt = {}; for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1; const reps = Object.entries(cnt).filter(([, c]) => c > 1);
        let v = fact(w.length); reps.forEach(([, c]) => { v /= fact(c); });
        return { p: H.cat(`How many distinct arrangements can be made from all the letters of the word ${w.toUpperCase()}?`), a: A.num(v), params: { kd, w },
          steps: [reps.length ? `${w.length} letters with repeats ${reps.map(([ch, c]) => `${ch.toUpperCase()} × ${c}`).join(', ')}: ${m(`\\frac{${w.length}!}{${reps.map(([, c]) => c + '!').join('\\,')}}`)}.` : `${w.length} different letters: ${w.length}!.`, `= ${hl(fm(v))}`] }; }
      if (kd === 'line') { const n = r.int(4, 9); return { p: H.cat(`In how many ways can ${n} people stand in a straight line?`), a: A.num(fact(n)), params: { kd, n }, steps: [`${n} choices for first place, ${n - 1} for second, and so on: ${n}!.`, `= ${hl(fm(fact(n)))}`] }; }
      if (kd === 'committee') { const n = r.int(6, 15), k = r.int(2, 4); const v = M.C(n, k); return { p: H.cat(`How many ways can a committee of ${k} be chosen from ${n} people?`), a: A.num(v), params: { kd, n, k }, steps: [`Order doesn't matter: ${m(`\\binom{${n}}{${k}}`)}.`, `= ${hl(v)}`] }; }
      const a = r.int(2, 8), b = r.int(2, 6), c = r.int(2, 7); return { p: H.cat(`Joe has ${a} ties, ${b} pairs of pants and ${c} shirts. How many outfits of one tie, one pair of pants and one shirt can he make?`), a: A.num(a * b * c), params: { kd, xs: [a, b, c] }, steps: [`Multiply the choices.`, `${a} × ${b} × ${c} = ${hl(a * b * c)}`] };
    },
  });

  /* ---------- polygonal numbers: sums and reverses ---------- */
  G({
    id: 'polyNum', trick: 'polygonal', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['triPair', 'triPair', 'pentTri', 'pentInv', 'triInv', 'triRecip', 'hex', 'pentBig']);
      const T = n => n * (n + 1) / 2, P = n => n * (3 * n - 1) / 2;
      if (kd === 'triPair') { const k = r.int(4, 30); const v = (k + 1) ** 2; return { p: H.cat(`The sum of the ${NS.ord(k)} and ${NS.ord(k + 1)} triangular numbers is`), a: A.num(v), params: { kd, k }, steps: [`Two triangular numbers in a row always make a square: the ${NS.ord(k)} plus the ${NS.ord(k + 1)} is ${k + 1}².`, `${T(k)} + ${T(k + 1)} = ${hl(v)}`] }; }
      if (kd === 'pentTri') { const n = r.int(4, 25); const v = 2 * n * n; return { p: H.cat(`The sum of the ${NS.ord(n)} pentagonal number and the ${NS.ord(n)} triangular number is`), a: A.num(v), params: { kd, n }, steps: [`${m('\\frac{n(3n - 1)}{2} + \\frac{n(n + 1)}{2} = 2n^2')}.`, `2 × ${n}² = ${hl(v)}`] }; }
      if (kd === 'pentInv' || kd === 'triInv') { const n = r.int(5, 30); const val = kd === 'pentInv' ? P(n) : T(n);
        return { p: H.cat(`If ${fm(val)} is the ${m('n')}th ${kd === 'pentInv' ? 'pentagonal' : 'triangular'} number, then `, H.L('n'), ' ='), a: A.num(n), params: { kd, val }, steps: [kd === 'pentInv' ? `${m('n(3n - 1)')} = ${2 * val}. Try n near ${m(`\\sqrt{${2 * val}/3}`)}.` : `${m('n(n + 1)')} = ${2 * val}: two consecutive numbers near ${m(`\\sqrt{${2 * val}}`)}.`, `n = ${hl(n)}`] }; }
      if (kd === 'triRecip') { const n = r.int(3, 12); const v = q(2 * n, n + 1); return { p: H.cat(`The sum of the reciprocals of the first ${n} triangular numbers is`), a: A.num(v), params: { kd, n }, steps: [`${m('\\frac{2}{n(n + 1)} = 2\\left(\\frac1n - \\frac1{n + 1}\\right)')}, so the sum telescopes to ${m('2\\left(1 - \\frac1{n + 1}\\right) = \\frac{2n}{n + 1}')}.`, `${m(`\\frac{${2 * n}}{${n + 1}}`)} = ${hl(Qs(v))}`] }; }
      if (kd === 'hex') { const n = r.int(4, 30); const v = n * (2 * n - 1); return { p: H.cat(`The ${NS.ord(n)} hexagonal number is`), a: A.num(v), params: { kd, n }, steps: [`Hexagonal: ${m('n(2n - 1)')}.`, `${n} × ${2 * n - 1} = ${hl(v)}`] }; }
      const n = r.int(20, 60); return { p: H.cat(`The ${NS.ord(n)} pentagonal number is`), a: A.num(P(n)), params: { kd, n }, steps: [`Pentagonal: ${m('\\frac{n(3n - 1)}{2}')}.`, `${n} × ${3 * n - 1} ÷ 2 = ${hl(fm(P(n)))}`] };
    },
  });

  /* ---------- lines: slopes, intercepts, parallel and perpendicular ---------- */
  G({
    id: 'lineMore', trick: 'coordinate', col: { ms: 3, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['slopeInt', 'perpStd', 'parA', 'perpA', 'intSum', 'perpBis', 'throughC', 'ptXint', 'midSum']);
      const nz = (lo, hi) => { let x; do { x = r.int(lo, hi); } while (!x); return x; };
      if (kd === 'slopeInt') { const a = nz(-9, 9), b = nz(-9, 9); const v = q(-b, a); return { p: H.cat(`The slope of a line with x-intercept ${fm(a)} and y-intercept ${fm(b)} is`), a: A.num(v), params: { kd, a, b }, steps: [`It passes through (${fm(a)}, 0) and (0, ${fm(b)}). Slope = −(y-intercept) ÷ (x-intercept).`, `${m(`-\\frac{${b}}{${a}}`)} = ${hl(Qi(v))}`] }; }
      if (kd === 'perpStd') { const a = nz(-9, 9), b = nz(-9, 9), c = r.int(-20, 20); const v = q(b, a); return { p: H.cat('The slope of a line perpendicular to ', H.L(lineL(a, b, c)), ' is'), a: A.num(v), params: { kd, a, b }, steps: [`The line's slope is ${m('-\\frac{A}{B}')} = ${Qi(q(-a, b))}. Perpendicular: flip it and change the sign, ${m('\\frac{B}{A}')}.`, `${hl(Qi(v))}`] }; }
      if (kd === 'parA' || kd === 'perpA') { const a1 = nz(-9, 9), b1 = nz(-9, 9); const t = r.int(2, 4) * r.sign(); const b2 = b1 * t;
        // parallel: A/b2 = a1/b1 → A = a1·t. perpendicular: (a1/b1)(A/b2) = −1 → A = −b1·b2/a1
        let A0 = kd === 'parA' ? a1 * t : -b1 * b2 / a1; if (!Number.isInteger(A0) || !A0) return this.gen(r);
        return { p: H.cat(H.L(lineL(a1, b1, r.int(1, 20))), ' and ', H.L(`Ax${b2 < 0 ? ' - ' : ' + '}${Math.abs(b2)}y = ${r.int(1, 30)}`), ` are ${kd === 'parA' ? 'parallel' : 'perpendicular'}. `, H.L('A'), ' ='), a: A.num(A0), params: { kd, a1, b1, b2 },
          steps: [`Slopes: ${Qi(q(-a1, b1))} and ${m(`-\\frac{A}{${b2}}`)}.`, kd === 'parA' ? `Equal slopes: A = ${a1} × ${b2} ÷ ${b1} = ${hl(fm(A0))}` : `Product of slopes −1: A = −${b1 < 0 ? `(${b1})` : b1} × ${b2 < 0 ? `(${b2})` : b2} ÷ ${a1 < 0 ? `(${a1})` : a1} = ${hl(fm(A0))}`] }; }
      if (kd === 'intSum') { const a = nz(-6, 6), b = nz(-6, 6); const c = a * b * r.int(-5, 5) || a * b; const v = c / a + c / b; return { p: H.cat('The sum of the x-intercept and the y-intercept of ', H.L(lineL(a, b, c)), ' is'), a: A.num(v), params: { kd, a, b, c }, steps: [`x-intercept: ${fm(c)} ÷ ${a < 0 ? `(${fm(a)})` : a} = ${fm(c / a)}. y-intercept: ${fm(c)} ÷ ${b < 0 ? `(${fm(b)})` : b} = ${fm(c / b)}.`, `Sum: ${hl(fm(v))}`] }; }
      if (kd === 'perpBis') { const x1 = r.int(-9, 9), y1 = r.int(-9, 9); let x2, y2; do { x2 = r.int(-9, 9); y2 = r.int(-9, 9); } while (y2 === y1); const v = q(-(x2 - x1), y2 - y1);
        return { p: H.cat(`The slope of the perpendicular bisector of the segment from (${fm(x1)}, ${fm(y1)}) to (${fm(x2)}, ${fm(y2)}) is`), a: A.num(v), params: { kd, x1, y1, x2, y2 }, steps: [`Segment slope: ${x2 === x1 ? 'vertical, so the bisector is horizontal' : Qi(q(y2 - y1, x2 - x1)) + '. The bisector is perpendicular: negative reciprocal'}.`, `${hl(Qi(v))}`] }; }
      if (kd === 'throughC') { const a = nz(-9, 9), b = nz(-9, 9), x = r.int(-12, 12), y = r.int(-12, 12); const v = a * x + b * y; return { p: H.cat('If ', H.L(lineL(a, b, 'C')), ` passes through (${fm(x)}, ${fm(y)}), then `, H.L('C'), ' ='), a: A.num(v), params: { kd, a, b, x, y }, steps: [`Substitute the point.`, `${a}(${fm(x)}) + ${b < 0 ? `(${b})` : b}(${fm(y)}) = ${hl(fm(v))}`] }; }
      if (kd === 'ptXint') { const xi = r.int(-10, 12); let x0, y0; do { x0 = r.int(-9, 12); y0 = r.int(-9, 12); } while (x0 === xi || !y0); const v = q(y0, x0 - xi);
        return { p: H.cat(`The slope of the line through (${fm(x0)}, ${fm(y0)}) with an x-intercept of ${fm(xi)} is`), a: A.num(v), params: { kd, xi, x0, y0 }, steps: [`Two points: (${fm(xi)}, 0) and (${fm(x0)}, ${fm(y0)}).`, `${fm(y0)} ÷ ${x0 - xi < 0 ? `(${fm(x0 - xi)})` : fm(x0 - xi)} = ${hl(Qi(v))}`] }; }
      const x1 = r.int(-9, 12), y1 = r.int(-9, 12), x2 = r.int(-9, 12), y2 = r.int(-9, 12); const v = q(x1 + x2 + y1 + y2, 2);
      return { p: H.cat(`The midpoint of (${fm(x1)}, ${fm(y1)}) and (${fm(x2)}, ${fm(y2)}) is ${m('(a, b)')}. `, H.L('a + b'), ' ='), a: A.num(v), params: { kd, x1, y1, x2, y2 }, steps: [`${m('a')} = (${fm(x1)} + ${fm(x2)}) ÷ 2, ${m('b')} = (${fm(y1)} + ${fm(y2)}) ÷ 2. Add all four and halve.`, `${fm(x1 + x2 + y1 + y2)} ÷ 2 = ${hl(Qs(v))}`] };
    },
  });

  /* ---------- parabolas: shifted vertices, axis of symmetry, number of real roots ---------- */
  G({
    id: 'vertexMore', trick: 'vertex', col: { ms: 4, hs: 0 }, w: 1.3,
    gen(r) {
      const kd = r.pick(['trans', 'trans', 'findQ', 'axisFact', 'axisShift', 'hk', 'realRoots', 'realRoots', 'oneRoot']);
      const nz = (lo, hi) => { let x; do { x = r.int(lo, hi); } while (!x); return x; };
      if (kd === 'trans' || kd === 'findQ') { const h0 = r.int(-8, 8), k0 = nz(-8, 8), a = nz(-5, 5), p = nz(-6, 6), b = r.int(-9, 9);
        const g = `${a === 1 ? '' : a === -1 ? '-' : a}f(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})${b ? (b < 0 ? ' - ' : ' + ') + Math.abs(b) : ''}`; const h = h0 + p, k = a * k0 + b;
        if (kd === 'findQ') { const gq = `Q\\,f(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})${b ? (b < 0 ? ' - ' : ' + ') + Math.abs(b) : ''}`;
          return { p: H.cat(`If f(x) is a parabola with vertex (${fm(h0)}, ${fm(k0)}), and `, H.L(gq), ` has vertex (${fm(h)}, ${fm(k)}), then `, H.L('Q'), ' ='), a: A.num(a), params: { kd, k0, b, k }, steps: [`Stretching by ${m('Q')} and adding ${fm(b)} moves the vertex's height from ${fm(k0)} to ${fm(k0)}Q ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`, `${fm(k0)}Q ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fm(k)}, so Q = ${hl(fm(a))}`] }; }
        const ask = r.pick(['h', 'k', 'h + k']); const v = ask === 'h' ? h : ask === 'k' ? k : h + k;
        return { p: H.cat(`If f(x) is a parabola with vertex (${fm(h0)}, ${fm(k0)}), and `, H.L(`g(x) = ${g}`), ` has vertex ${m('(h, k)')}, then `, H.L(ask), ' ='), a: A.num(v), params: { kd, h0, k0, a, p, b, ask },
          steps: [`x − ${p < 0 ? `(${p})` : p} slides the vertex ${p > 0 ? 'right' : 'left'} ${Math.abs(p)}: h = ${fm(h)}. Multiply the height by ${fm(a)}, then add ${fm(b)}: k = ${fm(a)} × ${k0 < 0 ? `(${fm(k0)})` : k0} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fm(k)}.`, `${ask} = ${hl(fm(v))}`] }; }
      if (kd === 'axisFact') { const a = r.int(1, 5), c = r.int(1, 5), b = nz(-9, 9), d = nz(-9, 9); const v = q(b, a).add(q(d, c)).div(2);
        const f = (x, y) => `(${x === 1 ? '' : x}x ${y < 0 ? '+' : '-'} ${Math.abs(y)})`;
        return { p: H.cat('The axis of symmetry of ', H.L(`f(x) = ${f(a, b)}${f(c, d)}`), ' is x ='), a: A.num(v), params: { kd, a, b, c, d }, steps: [`The roots are ${Qs(q(b, a))} and ${Qs(q(d, c))}; the axis is halfway between them.`, `(${Qs(q(b, a))} + ${Qp(q(d, c))}) ÷ 2 = ${hl(Qs(v))}`] }; }
      if (kd === 'axisShift') { const b = nz(-12, 12), c = r.int(-9, 9), p = nz(-6, 6); const v = q(-b, 2).sub(p);
        return { p: H.cat('If ', H.L(`f(x) = ${NS.poly([1, b, c]).l}`), ', then ', H.L(`f(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})`), ' has an axis of symmetry of x ='), a: A.num(v), params: { kd, b, p }, steps: [`f has its axis at ${m('x = -\\frac{b}{2}')} = ${Qs(q(-b, 2))}. Replacing ${m('x')} with ${m(`x ${p < 0 ? '-' : '+'} ${Math.abs(p)}`)} slides the graph ${p > 0 ? 'left' : 'right'} ${Math.abs(p)}.`, `${Qs(q(-b, 2))} ${p > 0 ? '−' : '+'} ${Math.abs(p)} = ${hl(Qs(v))}`] }; }
      if (kd === 'hk') { const a = nz(-5, 5), h = r.int(-9, 9), k = r.int(-12, 12); return { p: H.cat('If ', H.L(`f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}`), ` has vertex ${m('(h, k)')}, then `, H.L('h + k'), ' ='), a: A.num(h + k), params: { kd, h, k }, steps: [`Vertex form: the vertex is (${fm(h)}, ${fm(k)}).`, `${fm(h)} + ${k < 0 ? `(${k})` : k} = ${hl(fm(h + k))}`] }; }
      if (kd === 'oneRoot') { const a = r.int(1, 6), b = nz(-12, 12); const v = q(b * b, 4 * a); return { p: H.cat('If ', H.L(`${a === 1 ? '' : a}x^2${term(b, 'x')} + c = 0`), ' has exactly one real root, then ', H.L('c'), ' ='), a: A.num(v), params: { kd, a, b }, steps: [`One root means the discriminant is 0: ${m(`${b * b} - ${4 * a}c = 0`)}.`, `${m('c')} = ${b * b} ÷ ${4 * a} = ${hl(Qs(v))}`] }; }
      // realRoots
      if (r.chance(0.5)) { const a = nz(-5, 5), h = r.int(-9, 9); const k = r.pick([0, r.int(1, 12), -r.int(1, 12)]); const v = k === 0 ? 1 : (a > 0) === (k < 0) ? 2 : 0;
        return { p: H.cat('How many real roots does ', H.L(`f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2${k ? (k < 0 ? ' - ' : ' + ') + Math.abs(k) : ''}`), ' have?'), a: A.num(v), params: { kd, a, k, form: 'vertex' },
          steps: [`The vertex is at height ${fm(k)} and the parabola opens ${a > 0 ? 'up' : 'down'}.`, k === 0 ? `It touches the x-axis once: ${hl(1)}` : v ? `It crosses the x-axis: ${hl(2)}` : `It never reaches the x-axis: ${hl(0)}`] }; }
      const a = nz(-6, 6), b = r.int(-12, 12), c = nz(-15, 15); const D = b * b - 4 * a * c; const v = D > 0 ? 2 : D === 0 ? 1 : 0;
      return { p: H.cat(H.L(`${NS.poly([a, b, c]).l} = 0`), ' has how many real roots?'), a: A.num(v), params: { kd, a, b, c, form: 'std' }, steps: [`Discriminant ${m('b^2 - 4ac')} = ${b * b} − (${4 * a * c}) = ${D}.`, `${D > 0 ? 'Positive' : D === 0 ? 'Zero' : 'Negative'}: ${hl(v)}`] };
    },
  });

  /* ---------- sum and product of roots, more ways ---------- */
  G({
    id: 'rootsMore', trick: 'roots', col: { ms: 4, hs: 0 }, w: 1.5,
    gen(r) {
      const kd = r.pick(['sum', 'prod', 'sumsq', 'plus1', 'pqpq', 'mean', 'mix', 'harm', 'findB', 'findA', 'cubicSum', 'cubicCombo', 'sqRoot', 'pq', 'shiftProd']);
      const nz = (lo, hi) => { let x; do { x = r.int(lo, hi); } while (!x); return x; };
      if (kd === 'cubicSum' || kd === 'cubicCombo') { const a = r.int(1, 9), b = nz(-20, 20), c = r.int(-20, 20), d = nz(-20, 20); const S = q(-b, a), Pr = q(-d, a); const v = kd === 'cubicSum' ? S : S.add(Pr);
        return { p: H.cat('If P, Q and R are the roots of ', H.L(`${NS.poly([a, b, c, d]).l} = 0`), ', then ', H.L(kd === 'cubicSum' ? 'P + Q + R' : 'PQR + P + Q + R'), ' ='), a: A.num(v), params: { kd, a, b, d },
          steps: [`For ${m('ax^3 + bx^2 + cx + d')}: ${m('P + Q + R = -\\frac ba')} = ${Qs(S)}${kd === 'cubicCombo' ? `, ${m('PQR = -\\frac da')} = ${Qs(Pr)}` : ''}.`, kd === 'cubicSum' ? `${hl(Qs(v))}` : `${Qs(Pr)} + ${Qp(S)} = ${hl(Qs(v))}`] }; }
      if (kd === 'sqRoot') { const a = r.pick([1, 4, 9, 2, 3]), s = r.int(1, 9), b = r.int(1, 6); let c; do { c = r.int(-9, 9); } while (!c); const d = a * s * s; const big = r.chance(0.5);
        const x1 = q(c + s, b), x2 = q(c - s, b); const v = big ? x1 : x2;
        return { p: H.cat(`The ${big ? 'larger' : 'smaller'} root of `, H.L(`${a === 1 ? '' : a}(${lin(b, -c)})^2 = ${d}`), ' is'), a: A.num(v), params: { kd, a, b, c, d, big },
          steps: [`Divide by ${a} and take square roots: ${m(`${lin(b, -c)} = \\pm ${s}`)}.`, `x = (${c} ± ${s}) ÷ ${b}: ${Qs(x1)} or ${Qs(x2)}. ${big ? 'Larger' : 'Smaller'}: ${hl(Qs(v))}`] }; }
      if (kd === 'pq') { const p = nz(-12, 12); let qq; do { qq = r.int(-12, 12); } while (!qq || qq === p); const S = p + qq, Pr = p * qq; const v = Math.max(p, qq);
        return { p: H.cat('If ', H.L(`${NS.poly([1, S, Pr]).l} = (x + p)(x + q)`), `, then the greater of ${m('p')} and ${m('q')} is`), a: A.num(v), params: { kd, S, Pr }, steps: [`${m(`p + q = ${S}`)} and ${m(`pq = ${Pr}`)}.`, `${m('p')} and ${m('q')} are ${fm(p)} and ${fm(qq)}: ${hl(fm(v))}`] }; }
      if (kd === 'shiftProd') { const m1 = r.int(-9, 12), m2 = r.int(-9, 12), t = nz(-6, 6); const v = (m1 + t) * (m2 + t);
        const f = x => `(x ${x < 0 ? '+' : '-'} ${Math.abs(x)})`;
        return { p: H.cat('If ', H.L(`f(x) = ${f(m1)}${f(m2)}`), ', the product of the roots of ', H.L(`f(x ${t < 0 ? '+' : '-'} ${Math.abs(t)})`), ' is'), a: A.num(v), params: { kd, m1, m2, t }, steps: [`f has roots ${m1} and ${m2}. Replacing x with x ${t < 0 ? '+' : '−'} ${Math.abs(t)} moves each root ${t > 0 ? 'up' : 'down'} by ${Math.abs(t)}: ${m1 + t} and ${m2 + t}.`, `${m1 + t} × ${m2 + t} = ${hl(fm(v))}`] }; }
      if (kd === 'findB') { const a = r.int(1, 6), s = nz(-9, 9), c = nz(-20, 20); const v = -a * s;
        return { p: H.cat('If P and Q are the roots of ', H.L(`${a === 1 ? '' : a}x^2 + bx ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`), ' and ', H.L(`P + Q = ${s}`), ', then ', H.L('b'), ' ='), a: A.num(v), params: { kd, a, s }, steps: [`${m('P + Q = -\\frac ba')}, so b = −${a} × ${s < 0 ? `(${s})` : s}.`, `b = ${hl(fm(v))}`] }; }
      if (kd === 'findA') { let a0, c, Pr; do { a0 = nz(-9, 9); Pr = nz(-9, 9); c = a0 * Pr; } while (Math.abs(c) < 4 || Math.abs(c) > 60); const b = nz(-15, 15);
        return { p: H.cat('If the product of the roots of ', H.L(`ax^2${term(b, 'x')} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`), ` is ${fm(Pr)}, then `, H.L('a'), ' ='), a: A.num(a0), params: { kd, c, Pr }, steps: [`Product of roots = ${m('\\frac ca')}, so ${m(`\\frac{${c}}{a} = ${Pr}`)}.`, `a = ${c} ÷ ${Pr < 0 ? `(${Pr})` : Pr} = ${hl(fm(a0))}`] }; }
      const a = r.int(1, 9), b = nz(-20, 20), c = nz(-20, 20); const S = q(-b, a), Pr = q(c, a); const eq = H.L(`${NS.poly([a, b, c]).l} = 0`);
      const base = `${m('P + Q = -\\frac ba')} = ${Qs(S)} and ${m('PQ = \\frac ca')} = ${Qs(Pr)}.`;
      if (kd === 'mix') { const k = r.pick([2, 3, 4, 5, 7]); const v = S.mul(S).add(Pr.mul(k - 2));
        return { p: H.cat('If P and Q are the roots of ', eq, ', then ', H.L(`P^2 + ${k}PQ + Q^2`), ' ='), a: A.num(v), params: { kd, a, b, c, k }, steps: [base, `${m(`P^2 + ${k}PQ + Q^2 = (P + Q)^2 + ${k - 2 === 1 ? '' : k - 2}PQ`)} = ${Qs(S.mul(S))} + ${k - 2} × ${Qp(Pr)} = ${hl(Qs(v))}`] }; }
      const T = { sum: ['P + Q', S, `${hl(Qs(S))}`], prod: ['PQ', Pr, `${hl(Qs(Pr))}`], sumsq: ['P^2 + Q^2', S.mul(S).sub(Pr.mul(2)), null], plus1: ['(P + 1)(Q + 1)', Pr.add(S).add(1), null], pqpq: ['PQ + P + Q', Pr.add(S), null], mean: ['\\text{the arithmetic mean of P and Q}', S.div(2), null], harm: ['\\text{the harmonic mean of P and Q}', Pr.mul(2).div(S), null] };
      const [lab, v] = T[kd]; const how = { sumsq: `(P + Q)² − 2PQ`, plus1: `PQ + (P + Q) + 1`, pqpq: `PQ + (P + Q)`, mean: `(P + Q) ÷ 2`, harm: `2PQ ÷ (P + Q)` }[kd];
      return { p: kd === 'mean' || kd === 'harm' ? H.cat('If P and Q are the roots of ', eq, `, then the ${kd === 'mean' ? 'arithmetic' : 'harmonic'} mean of P and Q is`) : H.cat('If P and Q are the roots of ', eq, ', then ', H.L(lab), ' ='), a: A.num(v), params: { kd, a, b, c },
        steps: [base, T[kd][2] || `${how} = ${hl(Qs(v))}`] };
    },
  });

  /* ---------- x(x − k) < N ---------- */
  G({
    id: 'quadIneq', trick: 'inequalities', col: { ms: 4, hs: 0 },
    gen(r) {
      const kd = r.pick(['largest', 'largest', 'smallest', 'countPos']); const k = r.int(-6, 6), N = r.int(30, 220); const f = x => x * (x - k);
      const expr = k === 0 ? 'x^2' : `x(x ${k > 0 ? '-' : '+'} ${Math.abs(k)})`; const rt = Math.sqrt(N);
      if (kd === 'smallest') { let x = 1; while (f(x) <= N) x++; return { p: H.cat('The smallest positive integer x with ', H.L(`${expr} > ${N}`), ' is'), a: A.num(x), params: { kd, k, N }, steps: [`${k ? `${m(expr)} is about ${m('x^2')}, so start` : 'Start'} near √${N} ≈ ${rt.toFixed(1)}.`, `${x - 1}: ${f(x - 1)} (not more than ${N}); ${x}: ${f(x)}. Answer ${hl(x)}`] }; }
      let x = 300; while (f(x) >= N) x--;
      if (kd === 'countPos') { const cnt = []; for (let y = 1; y <= x; y++) if (f(y) < N) cnt.push(y); if (!cnt.length) return this.gen(r);
        return { p: H.cat('How many positive integers x make ', H.L(`${expr} < ${N}`), ' true?'), a: A.num(cnt.length), params: { kd, k, N }, steps: [`Try near √${N} ≈ ${rt.toFixed(1)}: ${x} gives ${f(x)}, under ${N}, but ${x + 1} gives ${f(x + 1)}.`, `x = ${cnt[0]} through ${x}: ${hl(cnt.length)}`] }; }
      return { p: H.cat('The largest integer x with ', H.L(`${expr} < ${N}`), ' is'), a: A.num(x), params: { kd, k, N }, steps: [`${k ? `${m(expr)} is about ${m('x^2')}, so start` : 'Start'} near √${N} ≈ ${rt.toFixed(1)}.`, `${x}: ${f(x)} is under ${N}; ${x + 1}: ${f(x + 1)} is too big. Answer ${hl(x)}`] };
    },
  });

  /* ---------- whole-number solutions ---------- */
  G({
    id: 'intPairs', trick: 'integerPairs', col: { ms: 4, hs: 0 },
    gen(r) {
      if (r.chance(0.5)) { // x² + y² = N with a single answer
        for (;;) { const x = r.int(3, 14), y = r.int(1, x - 1); const N = x * x + y * y; const reps = []; for (let a = 1; a * a < N; a++) { const b2 = N - a * a; const b = Math.round(Math.sqrt(b2)); if (b * b === b2 && a > b) reps.push([a, b]); } if (reps.length !== 1) continue;
          return { p: H.cat(`If ${m('x')} and ${m('y')} are positive integers with `, H.L(`x^2 + y^2 = ${N}`), ' and ', H.L('x > y'), ', then ', H.L('x + y'), ' ='), a: A.num(x + y), params: { kd: 'sq', N },
            steps: [`Take squares below ${N} and look for a partner square: ${N} − ${x * x} = ${y * y}.`, `${m(`x = ${x}`)}, ${m(`y = ${y}`)}: ${hl(x + y)}`] }; } }
      let a, b; do { a = r.int(2, 9); b = r.int(2, 11); } while (M.gcd(a, b) !== 1 || a >= b); const N = a * b * r.int(1, 5) + r.int(0, a * b - 1);
      let cnt = 0, first = null, last = null; for (let y = 0; b * y <= N; y++) if ((N - b * y) % a === 0) { cnt++; if (first === null) first = y; last = y; }
      if (cnt < 2) return this.gen(r);
      return { p: H.cat('How many ordered pairs of nonnegative integers (x, y) solve ', H.L(`${a}x + ${b}y = ${N}`), '?'), a: A.num(cnt), params: { kd: 'lin', a, b, N },
        steps: [`${m('y')} has to make ${m(`${N} - ${b}y`)} a multiple of ${a}. The first is ${m(`y = ${first}`)}, then every ${a} after that.`, `${m(`y = ${first}, ${first + a}, \\ldots, ${last}`)}: ${hl(cnt)}`] };
    },
  });

  /* ---------- functions: f(m) − f(n) and friends ---------- */
  G({
    id: 'funcDiff', trick: 'substitution', col: { ms: 3, hs: 0 },
    gen(r) {
      const kd = r.pick(['lin', 'lin', 'quad', 'comp', 'ints', 'zero']);
      const nz = (lo, hi) => { let x; do { x = r.int(lo, hi); } while (!x); return x; };
      if (kd === 'lin' || kd === 'quad') { const a = nz(-9, 15), b = r.int(-20, 20); let mm, n; do { mm = r.int(-5, 120); n = r.int(-5, 30); } while (mm === n);
        const f = kd === 'lin' ? NS.poly([a, b]).l : NS.poly([a, 0, b]).l; const v = kd === 'lin' ? a * (mm - n) : a * (mm * mm - n * n);
        return { p: H.cat('If ', H.L(`f(x) = ${f}`), ', then ', H.L(`f(${mm}) - f(${n})`), ' ='), a: A.num(v), params: { kd, a, b, mm, n },
          steps: [kd === 'lin' ? `The ${fm(b)} cancels: f(${mm}) − f(${n}) = ${a} × (${mm} − ${n < 0 ? `(${n})` : n}).` : `The ${fm(b)} cancels: ${a}(${mm}² − ${n < 0 ? `(${n})` : n}²) = ${a} × (${mm - n}) × (${mm + n}).`, `= ${hl(fm(v))}`] }; }
      if (kd === 'comp') { const c = r.int(1, 9), s = r.int(2, 9), a = nz(-9, 9), b = r.int(-15, 15); const t = s * s + c;
        return { p: H.cat('If ', H.L(`f(x^2 + ${c}) = ${NS.poly([a, b]).l}`), ', the sum of the possible values of ', H.L(`f(${t})`), ' is'), a: A.num(2 * b), params: { kd, c, s, a, b }, steps: [`${m(`x^2 + ${c} = ${t}`)} means x = ${s} or −${s}.`, `(${a * s + b}) + (${-a * s + b}) = ${hl(fm(2 * b))}`] }; }
      if (kd === 'ints') { const a = nz(-9, 9), b = nz(-20, 20); const v = q(-b, a).add(b); return { p: H.cat('If ', H.L(`f(x) = ${NS.poly([a, b]).l}`), ` has x-intercept ${m('(a, 0)')} and y-intercept ${m('(0, b)')}, then `, H.L('a + b'), ' ='), a: A.num(v), params: { kd, a, b }, steps: [`${m('a')} = ${Qs(q(-b, a))} (where f(x) = 0); ${m('b')} = f(0) = ${fm(b)}.`, `${hl(Qs(v))}`] }; }
      let a, c; do { a = r.int(2, 9); c = r.int(5, 60); } while (c % a === 0); const z = Math.floor(c / a); const v = 2 * z + 1;
      return { p: H.cat('The zero of ', H.L(`f(x) = ${c} - ${a}x`), ` lies between consecutive integers ${m('p')} and ${m('q')}. `, H.L('p + q'), ' ='), a: A.num(v), params: { kd, a, c }, steps: [`f(x) = 0 at x = ${c}/${a} = ${Qs(q(c, a))}, between ${z} and ${z + 1}.`, `${z} + ${z + 1} = ${hl(v)}`] };
    },
  });

  /* ---------- money: interest, coins, cost per mile ---------- */
  G({
    id: 'moneyMore', trick: 'consumer', col: { ms: 2, hs: 0 },
    gen(r) {
      const kd = r.pick(['interest', 'interest', 'coins', 'coinMix', 'mileage']);
      const cents = c => (c / 100).toFixed(2);
      if (kd === 'interest') { const P = r.pick([400, 500, 600, 800, 1000, 1200, 1400, 1500, 2000, 2500, 5000]), rate = r.int(2, 9); const months = r.chance(0.3); const t = months ? r.pick([6, 18, 30, 9]) : r.int(2, 6);
        const v = q(P * rate * t, months ? 1200 : 100);
        return { p: H.cat(`The simple interest on $${fm(P)} at ${rate}% a year for ${t} ${months ? 'months' : 'years'} is`), pre: '$', a: A.num(v, 'money'), params: { kd, P, rate, t, months },
          steps: [`Interest = principal × rate × time${months ? ` (in years: ${t}/12)` : ''}.`, `${fm(P)} × ${rate}/100 × ${months ? `${t}/12` : t} = $${hl(v.num().toFixed(2))}`] }; }
      if (kd === 'coins') { const [name, c] = r.pick([['nickels', 5], ['dimes', 10], ['quarters', 25]]); const n = r.int(8, 90); return { p: H.cat(`How many ${name} are in $${cents(n * c)}?`), a: A.num(n), params: { kd, c, total: n * c }, steps: [`$${cents(n * c)} = ${n * c} cents.`, `${n * c} ÷ ${c} = ${hl(n)}`] }; }
      if (kd === 'coinMix') { const d = r.int(2, 30), qn = r.int(2, 20); const v = (10 * d + 25 * qn) / 5; return { p: H.cat(`${d} dimes + ${qn} quarters = how many nickels?`), a: A.num(v), params: { kd, d, qn }, steps: [`A dime is 2 nickels and a quarter is 5.`, `${d} × 2 + ${qn} × 5 = ${hl(v)}`] }; }
      const mi = r.int(12, 250), c = r.pick([15, 20, 25, 30, 35, 40, 45, 50]); const v = q(mi * c, 100);
      return { p: H.cat(`The cost of driving ${mi} miles at ${c} cents per mile is`), pre: '$', a: A.num(v, 'money'), params: { kd, mi, c }, steps: [`${mi} × ${c} = ${mi * c} cents.`, `$${hl(cents(mi * c))}`] };
    },
  });

  /* ---------- angles in arithmetic progression, parallelograms ---------- */
  G({
    id: 'angleAP', trick: 'geoFacts', col: { ms: 3, hs: 0 },
    gen(r) {
      const kd = r.pick(['triAP', 'triDiff', 'quadAP', 'quadSmall', 'para']);
      if (kd === 'triAP' || kd === 'triDiff') { const a = r.int(15, 59); const v = kd === 'triAP' ? 120 - a : 60 - a;
        return { p: H.cat(`The angles of a triangle are in arithmetic progression and the smallest is ${a}°. ${kd === 'triAP' ? 'The largest angle is' : 'The common difference is'}`), suffix: '°', a: A.num(v), params: { kd, a }, steps: [`Angles in AP average to the middle one: 180 ÷ 3 = 60°.`, kd === 'triAP' ? `The largest is as far above 60 as ${a} is below: 120 − ${a} = ${hl(v)}°` : `60 − ${a} = ${hl(v)}°`] }; }
      if (kd === 'quadAP' || kd === 'quadSmall') { const L = 3 * r.int(31, 59); const a = 180 - L, d = (2 * L - 180) / 3; const v = kd === 'quadAP' ? a + 2 * d : a;
        return { p: H.cat(`The angles of a quadrilateral are in arithmetic progression and the largest is ${L}°. ${kd === 'quadAP' ? 'The second largest angle is' : 'The smallest angle is'}`), suffix: '°', a: A.num(v), params: { kd, L }, steps: [`The smallest and largest add to 360 ÷ 2 = 180, so the smallest is ${a}°. Three gaps cover ${L} − ${a} = ${L - a}, so each gap is ${d}°.`, kd === 'quadAP' ? `${L} − ${d} = ${hl(v)}°` : `${hl(v)}°`] }; }
      const [x, y] = r.pick([[1, 2], [2, 3], [1, 4], [1, 5], [3, 7], [4, 5], [1, 3], [2, 7], [7, 11]]); const v = 180 * y / (x + y);
      if (!Number.isInteger(v)) return this.gen(r);
      return { p: H.cat(`Two consecutive angles of a parallelogram are in the ratio ${x} : ${y}. The larger angle is`), suffix: '°', a: A.num(v), params: { kd, x, y }, steps: [`Consecutive angles add to 180°: ${x + y} parts, ${180 / (x + y)}° each.`, `${y} × ${180 / (x + y)} = ${hl(v)}°`] };
    },
  });

  /* ---------- squares near 500 and 1000, and a0b squares ---------- */
  G({
    id: 'bigSquares', trick: 'squares50', col: { ms: 2, hs: 0 }, eval: true,
    gen(r) {
      const kd = r.pick(['near1000', 'near1000', 'near500', 'a0b']);
      if (kd === 'a0b') { const a = r.int(1, 9), b = r.int(1, 9); const n = 100 * a + b; const v = n * n;
        return { p: H.cat(H.pow(n, 2), ' ='), a: A.num(v), params: { kd, n }, steps: [`(${100 * a} + ${b})² = ${fm(10000 * a * a)} + 2 × ${100 * a} × ${b} + ${b * b} = ${fm(10000 * a * a)} + ${fm(200 * a * b)} + ${b * b}.`, `= ${hl(fm(v))}`] }; }
      const base = kd === 'near1000' ? 1000 : 500; const d = r.int(1, 19) * r.sign(); const n = base + d; const v = n * n;
      const front = kd === 'near1000' ? n + d : 250 + d;
      return { p: H.cat(H.pow(n, 2), ' ='), a: A.num(v), params: { kd, n },
        steps: [kd === 'near1000' ? `${n} is ${Math.abs(d)} ${d > 0 ? 'over' : 'under'} 1000. Front: ${n} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${front} thousand.` : `${n} is ${Math.abs(d)} ${d > 0 ? 'over' : 'under'} 500. Front: 250 ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${front} thousand.`, `Back three digits: ${d * d} → ${String(d * d).padStart(3, '0')}. ${fm(front * 1000)} + ${d * d} = ${hl(fm(v))}`] };
    },
  });

  /* ---------- alternating sums of squares ---------- */
  G({
    id: 'altSq', trick: 'diffsq', col: { ms: 2, hs: 0 }, eval: true,
    gen(r) {
      const half = r.chance(0.35); const d = half ? 1 : r.int(1, 4); const a0 = r.int(Math.max(8, 3 * d + 2), 30) + (half ? 0.5 : 0); const xs = [0, 1, 2, 3].map(i => a0 - i * d);
      const pieces = []; xs.forEach((x, i) => { if (i) pieces.push(i % 2 ? ' − ' : ' + '); pieces.push(H.pow(String(x), 2)); });
      const v = Q.parseNum(String(xs[0] + xs[1])).add(Q.parseNum(String(xs[2] + xs[3]))).mul(d);
      return { p: H.cat(...pieces, ' ='), a: A.num(v), params: { xs: xs.map(String) },
        steps: [`Pair them as differences of squares: (${xs[0]}² − ${xs[1]}²) + (${xs[2]}² − ${xs[3]}²) = ${d} × (${xs[0]} + ${xs[1]}) + ${d} × (${xs[2]} + ${xs[3]}).`, `${d === 1 ? '' : d + ' × '}(${xs[0] + xs[1]} + ${xs[2] + xs[3]}) = ${hl(dec(v))}`] };
    },
  });

  /* ---------- how many digits in 2^a · 5^b · k ---------- */
  G({
    id: 'digitsCount', trick: 'exponents', col: { ms: 4, hs: 0 },
    gen(r) {
      const four = r.chance(0.35); const b = r.int(3, 12); let a2 = Math.max(2, b + r.int(-3, 4)); if (four && a2 % 2) a2++; const extra = r.pick([1, 1, 3, 7, 9, 3 ** 2, 7 ** 2]);
      const ask = r.pick(['digits', 'digits', 'sum']); const N = 2n ** BigInt(a2) * 5n ** BigInt(b) * BigInt(extra); const s = N.toString(); const v = ask === 'digits' ? s.length : [...s].reduce((t, ch) => t + +ch, 0);
      const parts = [four ? H.pow(4, a2 / 2) : H.pow(2, a2), ' × ', H.pow(5, b)]; if (extra > 1) { const [bb, e] = extra === 9 ? [3, 2] : extra === 49 ? [7, 2] : [extra, 1]; parts.push(' × ', e === 2 ? H.pow(bb, 2) : String(bb)); }
      const t = Math.min(a2, b); const rest = N / 10n ** BigInt(t);
      return { p: ask === 'digits' ? H.cat('How many digits are in ', ...parts, '?') : H.cat('The sum of the digits of ', ...parts, ' is'), a: A.num(v), params: { a2, b, extra, ask },
        steps: [`${four ? `${m(`4^{${a2 / 2}}`)} is ${m(`2^{${a2}}`)}. ` : ''}Pair ${t} twos with ${t} fives to make ${m(`10^{${t}}`)}; what's left is ${rest.toString()}.`, ask === 'digits' ? `${rest.toString()} followed by ${t} zeros: ${hl(v)} digits` : `The zeros add nothing: ${[...rest.toString()].join(' + ')} = ${hl(v)}`] };
    },
  });

  /* ---------- a/b + b/a given, find a and b ---------- */
  G({
    id: 'abRev', trick: 'aOverB', col: { ms: 4, hs: 0 },
    gen(r) {
      let a, b; do { b = r.int(2, 12); a = b + r.int(1, 7); } while (M.gcd(a, b) !== 1 || (a - b) ** 2 >= a * b);
      const ab = a * b, dd = (a - b) ** 2; const ask = r.chance(0.5) ? 'larger' : 'sum'; const v = ask === 'larger' ? a : a + b;
      return { p: H.cat('If ', H.L(`\\frac ab + \\frac ba = 2\\frac{${dd}}{${ab}}`), `, where ${m('a')} and ${m('b')} are relatively prime and `, H.L('a > b'), ', then ', H.L(ask === 'larger' ? 'a' : 'a + b'), ' ='), a: A.num(v), params: { ab, dd, ask },
        steps: [`${m('\\frac ab + \\frac ba = 2 + \\frac{(a - b)^2}{ab}')}, so ${m(`ab = ${ab}`)} and ${m(`(a - b)^2 = ${dd}`)}: ${m(`a - b = ${a - b}`)}.`, `${m(`a = ${a}`)}, ${m(`b = ${b}`)}. ${ask === 'larger' ? `${m('a')} = ${hl(a)}` : `${m('a + b')} = ${hl(a + b)}`}`] };
    },
  });

  /* ---------- consecutive integers from a product ---------- */
  G({
    id: 'consecProd', trick: 'consecutive', col: { ms: 4, hs: 0 },
    gen(r) {
      const n = r.int(12, 80);
      if (r.chance(0.5)) { const P = (n - 1) * n * (n + 1); return { p: H.cat(`Three consecutive integers have a product of ${fm(P)}. The middle integer is`), a: A.num(n), params: { kd: 'three', P }, steps: [`The product is close to the middle number cubed: ${m(`\\sqrt[3]{${P}}`)} is just under ${n}.`, `Check: ${n - 1} × ${n} × ${n + 1} = ${fm(P)}. Middle: ${hl(n)}`] }; }
      const P = n * (n + 1); return { p: H.cat(`Two consecutive positive integers have a product of ${fm(P)}. Their sum is`), a: A.num(2 * n + 1), params: { kd: 'two', P }, steps: [`√${fm(P)} is just over ${n}, so try ${n} × ${n + 1} = ${fm(P)}.`, `${n} + ${n + 1} = ${hl(2 * n + 1)}`] };
    },
  });

  /* ---------- starred estimates in columns 3 and 4 ---------- */
  G({
    id: 'estMs3', trick: 'estimate', est: true, col: { ms: 3, hs: 0 },
    gen(r) {
      const kd = r.pick(['circA', 'circC', 'equiA', 'sqDiag', 'hypIso', 'hyp', 'sqSide', 'pentBig', 'diag']); let v, p, why; const pr = { kd };
      if (kd === 'circA') { const x = r.int(11, 80); pr.x = x; v = Math.PI * x * x; p = `The area of a circle with radius ${x} is`; why = `π × ${x}² = ${x * x}π ≈ ${x * x} × 3.14.`; }
      else if (kd === 'circC') { const x = r.int(11, 99); pr.x = x; v = 2 * Math.PI * x; p = `The circumference of a circle with radius ${x} is`; why = `2π × ${x} ≈ ${2 * x} × 3.14.`; }
      else if (kd === 'equiA') { const x = r.int(12, 90); pr.x = x; v = x * x * Math.sqrt(3) / 4; p = `The area of an equilateral triangle with side ${x} is`; why = `${x}²/4 × √3 = ${x * x / 4} × 1.732.`; }
      else if (kd === 'sqDiag') { const x = r.int(20, 900); pr.x = x; v = x * Math.SQRT2; p = `The diagonal of a square with side ${x} is`; why = `${x}√2 ≈ ${x} × 1.414.`; }
      else if (kd === 'hypIso') { const x = r.int(20, 200); pr.x = x; v = x * Math.SQRT2; p = `The hypotenuse of an isosceles right triangle with legs of ${x} is`; why = `${x}√2 ≈ ${x} × 1.414.`; }
      else if (kd === 'hyp') { const x = r.int(20, 90), y = r.int(20, 90); pr.x = x; pr.y = y; v = Math.hypot(x, y); p = `The hypotenuse of a right triangle with legs ${x} and ${y} is`; why = `√(${x * x} + ${y * y}) = √${x * x + y * y}.`; }
      else if (kd === 'sqSide') { const x = 100 * r.int(30, 900); pr.x = x; v = Math.sqrt(x); p = `The side of a square with area ${fm(x)} is`; why = `√${fm(x)}: find the nearest perfect square.`; }
      else if (kd === 'pentBig') { const x = r.int(40, 150); pr.x = x; v = x * (3 * x - 1) / 2; p = `The ${NS.ord(x)} pentagonal number is`; why = `n(3n − 1)/2 = ${x} × ${3 * x - 1} ÷ 2.`; }
      else { const x = r.int(40, 200); pr.x = x; v = x * (x - 3) / 2; p = `The number of diagonals of a ${x}-sided polygon is`; why = `n(n − 3)/2 = ${x} × ${x - 3} ÷ 2.`; }
      return { p: H.cat(p), a: A.est(ap(v)), params: pr, steps: [why, `≈ ${fm(Math.round(v))}`] };
    },
  });
  G({
    id: 'estMs4', trick: 'estimate', est: true, col: { ms: 4, hs: 0 },
    gen(r) {
      const kd = r.pick(['sphSA', 'sphV', 'cylV', 'tetraV', 'tetraSA', 'cubeV', 'boxV', 'pyrV', 'acres', 'galIn3', 'mph', 'interest', 'light']); let v, p, why; const pr = { kd };
      if (kd === 'sphSA') { const x = r.int(6, 40); pr.x = x; v = 4 * Math.PI * x * x; p = `The surface area of a sphere with radius ${x} is`; why = `4π × ${x}² = ${4 * x * x}π.`; }
      else if (kd === 'sphV') { const x = r.int(5, 25); pr.x = x; v = 4 / 3 * Math.PI * x ** 3; p = `The volume of a sphere with radius ${x} is`; why = `4/3 π × ${x}³ ≈ 4.19 × ${fm(x ** 3)}.`; }
      else if (kd === 'cylV') { const x = r.int(3, 20), y = r.int(5, 50); pr.x = x; pr.y = y; v = Math.PI * x * x * y; p = `The volume of a cylinder with radius ${x} and height ${y} is`; why = `π × ${x * x} × ${y} = ${x * x * y}π.`; }
      else if (kd === 'tetraV') { const x = r.int(6, 40); pr.x = x; v = x ** 3 * Math.SQRT2 / 12; p = `The volume of a regular tetrahedron with edge ${x} is`; why = `s³√2/12 = ${fm(x ** 3)} × 1.414 ÷ 12.`; }
      else if (kd === 'tetraSA') { const x = r.int(8, 60); pr.x = x; v = x * x * Math.sqrt(3); p = `The surface area of a regular tetrahedron with edge ${x} is`; why = `s²√3 = ${x * x} × 1.732.`; }
      else if (kd === 'cubeV') { const x = r.int(21, 99); pr.x = x; v = x ** 3; p = `The volume of a cube with edge ${x} is`; why = `${x}³ = ${x * x} × ${x}.`; }
      else if (kd === 'boxV') { const x = r.int(15, 60), y = r.int(15, 60), z = r.int(15, 60); pr.xs = [x, y, z]; v = x * y * z; p = `The volume of a ${x} by ${y} by ${z} rectangular prism is`; why = `${x} × ${y} = ${x * y}; × ${z}.`; }
      else if (kd === 'pyrV') { const x = r.int(8, 30), y = r.int(8, 40); pr.x = x; pr.y = y; v = x * x * y / 3; p = `The volume of a square pyramid with base edge ${x} and height ${y} is`; why = `${x}² × ${y} ÷ 3.`; }
      else if (kd === 'acres') { const x = r.int(20, 900); pr.x = x; v = 640 * x; p = `${x} square miles =`; pr.suf = 'acres'; why = `640 acres in a square mile: ${x} × 640.`; }
      else if (kd === 'galIn3') { const x = r.int(12, 300); pr.x = x; v = 231 * x; p = `${x} gallons =`; pr.suf = 'cubic inches'; why = `231 cubic inches in a gallon: ${x} × 231.`; }
      else if (kd === 'mph') { const x = r.int(25, 900); pr.x = x; v = x * 22 / 15; p = `${x} mph =`; pr.suf = 'feet per second'; why = `60 mph = 88 ft/s, so multiply by 22/15.`; }
      else if (kd === 'interest') { const x = r.pick([2000, 3000, 5000, 7500, 12000]), y = r.int(3, 9), z = r.int(5, 30); pr.xs = [x, y, z]; v = x * y * z / 100; p = `The simple interest on $${fm(x)} at ${y}% a year for ${z} years is`; why = `${fm(x)} × ${y}% × ${z}.`; }
      else { const x = r.pick([1.5, 2.5, 3.5, 4.5, 6, 7.5]); pr.x = x; v = 186000 * x; p = `Light travels 186,000 miles per second. In ${x} seconds it travels`; pr.suf = 'miles'; why = `186,000 × ${x}.`; }
      return { p: H.cat(p), ...(pr.suf ? { suffix: pr.suf } : {}), ...(kd === 'interest' ? { pre: '$' } : {}), a: A.est(ap(v)), params: pr, steps: [why, `≈ ${fm(Math.round(v))}`] };
    },
  });
})();
