/* ===== memorize: fact tables and flashcard items (no DOM) =====
   Every value here is computed, never typed in by hand. test/memo.js checks them independently. */
(function () {
  const { H, ans: A, q } = NS; const fm = NS.fmtn;
  const R = String.raw;

  // decimal expansion of k/n (0 < k/n < 1): non-repeating digits and repeating block
  function decParts(k, n) {
    let pre = '', rem = k % n; const seen = new Map(); const digits = [];
    while (rem !== 0 && !seen.has(rem)) { seen.set(rem, digits.length); rem *= 10; digits.push(Math.floor(rem / n)); rem %= n; }
    if (rem === 0) return { pre: digits.join(''), rep: '' };
    const at = seen.get(rem); pre = digits.slice(0, at).join('');
    return { pre, rep: digits.slice(at).join('') };
  }
  NS.decParts = decParts;
  const decLatex = (k, n) => { const { pre, rep } = decParts(k, n); return rep ? `0.${pre}\\overline{${rep}}` : `0.${pre}`; };
  const pctLatex = v => { // v is a Q (percent value)
    if (v.isInt()) return `${v.n}\\%`;
    const d = Number(v.d); let t = d; while (t % 2 === 0) t /= 2; while (t % 5 === 0) t /= 5;
    if (t === 1) return `${Number(v.n) / d}\\%`; // terminating: 12.5%
    return `${H.Qf(v).l}\\%`;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const isPrime = n => { if (n < 2) return false; for (let p = 2; p * p <= n; p++) if (n % p === 0) return false; return true; };
  const spf = n => { for (let p = 2; p * p <= n; p++) if (n % p === 0) return p; return n; };

  const SETS = [];
  const def = s => SETS.push(s);

  /* ---------- squares ---------- */
  def({
    id: 'squares', title: 'Squares', blurb: { ms: R`$1^2$ to $30^2$, and square roots back.`, hs: R`$1^2$ to $50^2$, and square roots back.` },
    note: R`Squares from 41 to 59 also come fast from the near-50 trick: $(50 + d)^2 = 2500 + 100d + d^2$.`,
    build(lv) {
      const N = lv === 'ms' ? 30 : 50; const groups = [];
      for (let g = 0; g < N / 10; g++) {
        const cells = []; for (let n = g * 10 + 1; n <= g * 10 + 10; n++) cells.push({ k: `sq${n}`, t: H.pow(n, 2).h, b: fm(n * n), n });
        groups.push({ name: `${g * 10 + 1} to ${g * 10 + 10}`, cells });
      }
      const items = groups.flatMap(g => g.cells).filter(c => c.n > 10 && c.n % 10).map(c => ({ k: c.k, ask: r => r.chance(0.3)
        ? { q: H.cat(H.sqrt(c.n * c.n), ' =').h, a: A.num(c.n), show: H.cat(H.sqrt(c.n * c.n), ' = ', H.n(c.n)).h }
        : { q: H.cat(H.pow(c.n, 2), ' =').h, a: A.num(c.n * c.n), show: H.cat(H.pow(c.n, 2), ' = ', H.n(c.n * c.n)).h } }));
      return { groups, items };
    },
  });

  /* ---------- cubes ---------- */
  def({
    id: 'cubes', title: 'Cubes', blurb: { ms: R`$1^3$ to $12^3$, and cube roots back.`, hs: R`$1^3$ to $20^3$, and cube roots back.` },
    note: R`Every last digit 0 to 9 shows up exactly once among the cubes, so the last digit of a perfect cube tells you the last digit of its cube root. $\sqrt[3]{13824}$ ends in 4, and $13$ (thousands) sits between $2^3$ and $3^3$, so the root is 24.`,
    build(lv) {
      const N = lv === 'ms' ? 12 : 20; const cells = [];
      for (let n = 1; n <= N; n++) cells.push({ k: `cu${n}`, t: H.pow(n, 3).h, b: fm(n ** 3), n });
      const groups = N === 12 ? [{ name: '1 to 12', cells }] : [{ name: '1 to 10', cells: cells.slice(0, 10) }, { name: '11 to 20', cells: cells.slice(10) }];
      const items = cells.filter(c => c.n > 1 && c.n !== 10).map(c => ({ k: c.k, ask: r => r.chance(0.3)
        ? { q: H.cat(H.cbrt(c.n ** 3), ' =').h, a: A.num(c.n), show: H.cat(H.cbrt(c.n ** 3), ' = ', H.n(c.n)).h }
        : { q: H.cat(H.pow(c.n, 3), ' =').h, a: A.num(c.n ** 3), show: H.cat(H.pow(c.n, 3), ' = ', H.n(c.n ** 3)).h } }));
      return { groups, items };
    },
  });

  /* ---------- powers ---------- */
  def({
    id: 'powers', title: 'Powers', blurb: { ms: R`Powers of 2, 3 and 5.`, hs: R`Powers of 2, 3, 5 and 11.` },
    note: R`Anchor on $2^{10} = 1024$. Everything near it is a double or a half: $2^{11} = 2048$, $2^9 = 512$.`,
    build(lv) {
      const top = lv === 'ms' ? { 2: 12, 3: 6, 5: 5 } : { 2: 16, 3: 8, 5: 6, 11: 4 }; const groups = [];
      for (const b of Object.keys(top).map(Number)) {
        const cells = []; for (let e = 1; e <= top[b]; e++) cells.push({ k: `pw${b}_${e}`, t: H.pow(b, e).h, b: fm(b ** e), base: b, e });
        groups.push({ name: `Powers of ${b}`, cells });
      }
      const items = groups.flatMap(g => g.cells).filter(c => c.e > 1).map(c => ({ k: c.k, ask: () => ({ q: H.cat(H.pow(c.base, c.e), ' =').h, a: A.num(c.base ** c.e), show: H.cat(H.pow(c.base, c.e), ' = ', H.n(c.base ** c.e)).h }) }));
      return { groups, items };
    },
  });

  /* ---------- fractions, decimals, percents ---------- */
  const DEN_NAME = { 2: 'Halves', 3: 'Thirds', 4: 'Fourths', 5: 'Fifths', 6: 'Sixths', 7: 'Sevenths', 8: 'Eighths', 9: 'Ninths', 11: 'Elevenths', 12: 'Twelfths', 16: 'Sixteenths' };
  def({
    id: 'fractions', title: 'Fractions as decimals and percents', short: 'Fractions', fast: 5000,
    blurb: { ms: R`Halves through twelfths.`, hs: R`Halves through twelfths, plus sixteenths.` },
    note: R`Learn $\frac17 = 0.\overline{142857}$ and the rest of the sevenths come free: they use the same six digits in the same circle, just starting somewhere else. $\frac27 = 0.\overline{285714}$. Ninths repeat their numerator ($\frac49 = 0.\overline{4}$), and elevenths repeat $9 \times$ the numerator ($\frac{3}{11} = 0.\overline{27}$).`,
    build(lv) {
      const dens = lv === 'ms' ? [2, 3, 4, 5, 6, 7, 8, 9, 11, 12] : [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 16]; const groups = [];
      for (const n of dens) {
        const cells = []; for (let k = 1; k < n; k++) if (gcd(k, n) === 1) {
          const pct = q(100 * k, n);
          cells.push({ k: `fr${k}_${n}`, t: H.frac(k, n).h, b: NS.m(decLatex(k, n)), b2: NS.m(pctLatex(pct)), num: k, den: n, pct });
        }
        groups.push({ name: DEN_NAME[n], cells });
      }
      const items = groups.flatMap(g => g.cells).map(c => ({ k: c.k, ask: r => r.chance(0.5)
        ? { q: H.cat(H.frac(c.num, c.den), ' =').h, suffix: '%', a: A.num(c.pct), show: `${H.frac(c.num, c.den).h} = ${NS.m(pctLatex(c.pct))}` }
        : { q: `${NS.m(pctLatex(c.pct))} =`, form: '(fraction)', a: A.num(q(c.num, c.den), 'frac'), show: `${NS.m(pctLatex(c.pct))} = ${H.frac(c.num, c.den).h}` } }));
      return { groups, items };
    },
  });

  /* ---------- factorials ---------- */
  def({
    id: 'factorials', title: 'Factorials', blurb: { ms: R`$0!$ to $8!$.`, hs: R`$0!$ to $10!$.` },
    note: R`$0! = 1$. Each one is the last times the next number, so $\frac{n!}{(n-1)!} = n$, which is why factorial fractions cancel so quickly.`,
    build(lv) {
      const N = lv === 'ms' ? 8 : 10; const cells = []; let f = 1;
      for (let n = 0; n <= N; n++) { if (n) f *= n; cells.push({ k: `fa${n}`, t: NS.m(`${n}!`), b: fm(f), n, f }); }
      const items = cells.filter(c => c.n >= 3).map(c => ({ k: c.k, ask: () => ({ q: `${NS.m(`${c.n}!`)} =`, a: A.num(c.f), show: `${NS.m(`${c.n}!`)} = ${fm(c.f)}` }) }));
      return { groups: [{ name: '', cells }], items };
    },
  });

  /* ---------- Pythagorean triples ---------- */
  NS.primitiveTriples = function (maxC) {
    const out = [];
    for (let m = 2; m * m < maxC; m++) for (let n = 1; n < m; n++) {
      if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
      let a = m * m - n * n, b = 2 * m * n; const c = m * m + n * n; if (c > maxC) continue; if (a > b) [a, b] = [b, a];
      out.push([a, b, c]);
    }
    return out.sort((x, y) => x[2] - y[2] || x[0] - y[0]);
  };
  def({
    id: 'triples', title: 'Pythagorean triples', short: 'Triples', fast: 6000,
    blurb: { ms: R`Every whole-number right triangle with hypotenuse up to 41.`, hs: R`Every whole-number right triangle with hypotenuse up to 85.` },
    note: R`Multiples count too: 6, 8, 10 and 15, 20, 25 are the same triangle as 3, 4, 5. When you see two sides, divide out the common factor first and look for a triple you know.`,
    build(lv) {
      const T = NS.primitiveTriples(lv === 'ms' ? 41 : 85);
      const cells = T.map(([a, b, c]) => ({ k: `tr${a}_${b}_${c}`, t: `${a}, ${b}`, b: String(c), abc: [a, b, c] }));
      const items = cells.map(cell => ({ k: cell.k, ask: r => {
        const s = r.pick([1, 1, 1, 2, 3]); const [a, b, c] = cell.abc.map(x => x * s);
        const kind = r.pick(['hyp', 'hyp', 'leg']);
        if (kind === 'hyp') return { q: `Legs ${a} and ${b}. Hypotenuse =`, a: A.num(c), show: `${a}, ${b}, <b>${c}</b>` };
        const [g, w] = r.chance(0.5) ? [a, b] : [b, a];
        return { q: `One leg ${g}, hypotenuse ${c}. Other leg =`, a: A.num(w), show: `${Math.min(g, w)}, ${Math.max(g, w)}, ${c}` };
      } }));
      return { groups: [{ name: '', cells }], items };
    },
  });

  /* ---------- primes ---------- */
  def({
    id: 'primes', title: 'Primes', fast: 6000,
    blurb: { ms: R`Primes under 100, and spotting the ones that only look prime.`, hs: R`Primes under 200, and spotting the ones that only look prime.` },
    note: R`To check a number, divide by primes up to its square root. For 221 that means up to 13, since $15^2 = 225$ is already too big: $221 = 13 \times 17$. The usual impostors: $91 = 7 \times 13$, $119 = 7 \times 17$, $133 = 7 \times 19$, $143 = 11 \times 13$, $187 = 11 \times 17$, $209 = 11 \times 19$.`,
    build(lv) {
      const N = lv === 'ms' ? 100 : 200; const cells = [];
      for (let n = 2; n < N; n++) if (isPrime(n)) cells.push({ t: String(n), b: '', n });
      const groups = []; for (let lo = 0; lo < N; lo += 50) groups.push({ name: lo ? `${lo} to ${lo + 49}` : 'Under 50', cells: cells.filter(c => c.n >= lo && c.n < lo + 50) });
      const top = lv === 'ms' ? 150 : 400; const items = [];
      for (let n = 7; n <= top; n += 2) if (n % 3 && n % 5) items.push({ k: `pr${n}`, ask: () => ({ q: `Smallest prime factor of ${n} =`, form: '(the number itself if it’s prime)', a: A.num(spf(n)), show: isPrime(n) ? `${n} is prime` : `${n} = ${spf(n)} × ${n / spf(n)}` }) });
      return { groups, items, plain: true };
    },
  });

  /* ---------- handy decimals ---------- */
  def({
    id: 'constants', title: 'Handy decimals', short: 'Decimals', fast: 5000,
    blurb: { ms: R`$\sqrt2$, $\sqrt3$ and $\pi$ to three places.`, hs: R`Square roots, $\pi$ and $e$ to three places.` },
    note: R`These are what make starred estimation problems quick. $\pi \approx 3.142$ gets you well inside 5%, and so does $\sqrt{2} \approx 1.414$.`,
    build(lv) {
      const list = [['sqrt2', R`\sqrt{2}`, Math.SQRT2], ['sqrt3', R`\sqrt{3}`, Math.sqrt(3)], ['pi', R`\pi`, Math.PI]];
      if (lv === 'hs') list.push(['sqrt5', R`\sqrt{5}`, Math.sqrt(5)], ['sqrt6', R`\sqrt{6}`, Math.sqrt(6)], ['sqrt7', R`\sqrt{7}`, Math.sqrt(7)], ['sqrt10', R`\sqrt{10}`, Math.sqrt(10)], ['e', 'e', Math.E]);
      const cells = list.map(([k, l, v]) => ({ k: `co${k}`, t: NS.m(l), b: v.toFixed(3), l, v3: v.toFixed(3) }));
      const items = cells.map(c => ({ k: c.k, ask: () => ({ q: `${NS.m(c.l + ' \\approx')}`, form: '(three decimal places)', a: A.num(c.v3), show: `${NS.m(c.l)} ≈ ${c.v3}` }) }));
      return { groups: [{ name: '', cells }], items };
    },
  });

  /* ---------- measures ---------- */
  // [group, count, singular unit, factor, plural unit]  (1 unit = factor of the other)
  const MEASURES = [
    ['Length', 'mile', 5280, 'feet'], ['Length', 'mile', 1760, 'yards'], ['Length', 'yard', 3, 'feet'], ['Length', 'yard', 36, 'inches'], ['Length', 'foot', 12, 'inches'],
    ['Length', 'rod', 16.5, 'feet'], ['Length', 'furlong', 660, 'feet'], ['Length', 'fathom', 6, 'feet'], ['Length', 'league', 3, 'miles'],
    ['Liquid', 'gallon', 4, 'quarts'], ['Liquid', 'gallon', 128, 'fluid ounces'], ['Liquid', 'quart', 2, 'pints'], ['Liquid', 'quart', 32, 'fluid ounces'], ['Liquid', 'pint', 2, 'cups'], ['Liquid', 'cup', 8, 'fluid ounces'], ['Liquid', 'gallon', 231, 'cubic inches'],
    ['Dry', 'peck', 8, 'quarts'], ['Dry', 'bushel', 4, 'pecks'],
    ['Weight', 'pound', 16, 'ounces'], ['Weight', 'ton', 2000, 'pounds'],
    ['Area and volume', 'square foot', 144, 'square inches'], ['Area and volume', 'square yard', 9, 'square feet'], ['Area and volume', 'acre', 43560, 'square feet'], ['Area and volume', 'square mile', 640, 'acres'], ['Area and volume', 'cubic yard', 27, 'cubic feet'], ['Area and volume', 'cubic foot', 1728, 'cubic inches'],
    ['Time', 'hour', 3600, 'seconds'], ['Time', 'day', 1440, 'minutes'], ['Time', 'week', 168, 'hours'],
    ['Metric', 'inch', 2.54, 'centimeters'], ['Metric', 'kilometer', 1000, 'meters'], ['Metric', 'liter', 1000, 'milliliters'], ['Metric', 'kilogram', 1000, 'grams'],
    ['Counting', 'dozen', 12, ''], ['Counting', 'gross', 144, ''], ['Counting', 'score', 20, ''], ['Counting', 'ream', 500, 'sheets'],
    ['Speed', 'miles per hour', 88, 'feet per second', { n: 60 }],
    // high school only: these appear on starred problems in recent UIL tests
    ['Texas land and the cubit', 'vara (Texas)', '100/3', 'inches', { hs: true }], ['Texas land and the cubit', 'league of land (Texas)', 25, 'labors', { hs: true }],
    ['Texas land and the cubit', 'league of land (Texas)', 4428, 'acres', { hs: true, approx: true }], ['Texas land and the cubit', 'labor of land (Texas)', 177, 'acres', { hs: true, approx: true }],
    ['Texas land and the cubit', 'Egyptian cubit', 17.72, 'inches', { hs: true, about: true }],
  ];
  const toQ = f => (typeof f === 'string' && f.includes('/') ? q(+f.split('/')[0], +f.split('/')[1]) : Q.from(f));
  NS.MEASURES = MEASURES;
  def({
    id: 'measures', title: 'Measures', blurb: { ms: R`Feet, quarts, acres, furlongs and the rest.`, hs: R`Feet, quarts, acres, furlongs, plus Texas varas and leagues and the Egyptian cubit.` },
    note: R`The liquid chain is all doubling: 1 gallon = 4 quarts = 8 pints = 16 cups = 128 fluid ounces. A furlong is $\frac18$ of a mile, a rod is $16\frac12$ feet, and 60 miles per hour is 88 feet per second.`,
    build(lv) {
      const groups = [];
      MEASURES.forEach(([g, one, f, many, o = {}], i) => {
        if (o.hs && lv !== 'hs') return;
        let grp = groups.find(x => x.name === g); if (!grp) groups.push(grp = { name: g, cells: [] });
        const v = toQ(f), n = o.n || 1, sh = v.isInt() ? fm(Number(v.n)) : v.terminates() ? v.toDecStr() : H.Qf(v).h;
        grp.cells.push({ k: `me${i}`, t: `${n} ${one}`, b: `${o.approx || o.about ? '≈ ' : ''}${sh} ${many}`.trim(), one, f, many, n, approx: !!o.approx, about: !!o.about, v, sh });
      });
      const items = groups.flatMap(g => g.cells).map(c => ({ k: c.k, ask: () => ({ q: `${c.n} ${c.one} ${c.approx || c.about ? '≈' : '='}`, suffix: c.many || undefined, form: c.approx ? '(within 5%)' : c.about ? '(to the hundredth)' : undefined, a: c.approx ? A.est(c.v) : A.num(c.v), show: `${c.n} ${c.one} ${c.approx || c.about ? '≈' : '='} ${c.sh} ${c.many}`.trim() }) }));
      return { groups, items, plain: true };
    },
  });

  NS.MEMO = SETS;
  const cache = {};
  NS.memoBuild = (id, lv) => cache[id + lv] || (cache[id + lv] = SETS.find(s => s.id === id).build(lv));
  NS.memoFast = id => SETS.find(s => s.id === id).fast || 4000;

  /* ---------- memory per item: last few [ok, ms] ---------- */
  const rec = (lv, k) => { const L = NS.store.data.levels[lv]; L.memo = L.memo || {}; return L.memo[k]; };
  NS.memoStatus = function (lv, setId, k) {
    const a = rec(lv, k); if (!a || !a.length) return 'new';
    const last = a[a.length - 1]; if (!last[0]) return 'missed';
    const prev = a[a.length - 2];
    return prev && prev[0] && last[1] <= NS.memoFast(setId) ? 'known' : 'seen';
  };
  NS.memoRecord = function (lv, k, ok, ms) {
    const L = NS.store.data.levels[lv]; L.memo = L.memo || {}; const a = L.memo[k] || (L.memo[k] = []);
    a.push([ok ? 1 : 0, Math.round(ms)]); if (a.length > 6) a.shift();
    const day = NS.today(); L.days[day] = (L.days[day] || 0) + 1; NS.store.save();
  };
  NS.memoCount = function (lv, setId) {
    const b = NS.memoBuild(setId, lv); const st = b.items.map(it => NS.memoStatus(lv, setId, it.k));
    return { known: st.filter(x => x === 'known').length, total: st.length, missed: st.filter(x => x === 'missed').length, seen: st.filter(x => x !== 'new').length };
  };
  // weight toward missed, then new, then shaky; known facts still come back now and then
  NS.memoPick = function (pool, lv, r, lastK) {
    const w = pool.map(({ set, item }) => { const s = NS.memoStatus(lv, set, item.k); let x = s === 'missed' ? 3 : s === 'new' ? 1.6 : s === 'seen' ? 1.3 : 0.35; if (item.k === lastK) x *= 0.05; return x; });
    const tot = w.reduce((a, b) => a + b, 0); let t = r.f() * tot;
    for (let i = 0; i < pool.length; i++) { t -= w[i]; if (t <= 0) return pool[i]; }
    return pool[pool.length - 1];
  };
})();
