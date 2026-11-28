/* ===== generator registry + multiplication shortcuts ===== */
NS.GENS = [];
NS.fixMinus = s => String(s).replace(/(^|[\s(=:,×+·\/≈\[|])-(?=[\d.(i]|x\b)/g, '$1−');
NS.G = function (def) {
  const raw = def.gen;
  def.gen = function (r, lv, x) {
    const o = raw.call(this, r, lv, x); o.steps = o.steps.map(NS.fixMinus);
    // money answers end in dollars and cents in the steps too (33.60, not 33 3/5), as the key writes them
    if (o.a && o.a.form === 'money' && o.steps.length) { const k = o.steps.length - 1; const i = o.steps[k].lastIndexOf('<mark>');
      if (i >= 0) o.steps[k] = o.steps[k].slice(0, i) + `<mark>${NS.money(o.a.v)}</mark>` + o.steps[k].slice(o.steps[k].indexOf('</mark>', i) + 7); }
    return o;
  };
  NS.GENS.push(def);
};
const { H: _H, M: _M, ans: _A, q: _q, Q: _Q } = NS;
NS.hl = x => `<mark>${x}</mark>`;
NS.fmtn = x => _M.fmt(x).replace(/^-/, '−');
const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions', 'ten-millions'];

/* column-by-column helper: generic digit convolution, used for ×11, ×111 and FOIL */
NS.convSteps = function (A, B, opts = {}) {
  // A, B: numbers. returns {steps, result}
  const a = String(A).split('').reverse().map(Number), b = String(B).split('').reverse().map(Number);
  const L = a.length + b.length - 1; let carry = 0; const out = []; const steps = [];
  for (let j = 0; j < L; j++) {
    const terms = []; let s = 0;
    for (let i = 0; i < a.length; i++) { const k = j - i; if (k >= 0 && k < b.length && b[k] !== 0) { s += a[i] * b[k]; terms.push(opts.plus ? `${a[i]}` : `${a[i]}×${b[k]}`); } }
    const tot = s + carry; const d = tot % 10; const nc = Math.floor(tot / 10);
    let txt = `<b>${PLACES[j] || '10^' + j}:</b> ${terms.length ? terms.join(' + ') : '0'}`;
    if (carry) txt += ` + ${carry} carried`;
    if (terms.length > 1 || carry) txt += ` = ${tot}`;
    txt += ` → write ${NS.hl(d)}`; if (nc) txt += `, carry ${nc}`;
    steps.push(txt); out.push(d); carry = nc;
  }
  if (carry) { steps.push(`Bring down the last carry: ${NS.hl(carry)}`); }
  return { steps, result: A * B };
};

/* ---------- ×11 and ×111 ---------- */
NS.G({
  id: 'm11', trick: 'times11', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    let n, k = 11;
    if (lv === 'ms') n = r.chance(0.55) ? r.int(23, 98) : r.int(102, 989);
    else if (r.chance(0.35)) { k = 111; n = r.chance(0.5) ? r.int(23, 98) : r.int(102, 899); }
    else n = r.chance(0.5) ? r.int(102, 989) : r.int(1203, 9876);
    const front = r.chance(0.5);
    const p = front ? _H.cat(_H.n(k), ' × ', _H.n(n), ' =') : _H.cat(_H.n(n), ' × ', _H.n(k), ' =');
    const cs = NS.convSteps(n, k, { plus: true });
    const intro = k === 11 ? 'Write the ones digit, then add each pair of neighbors, moving left.' : 'Same idea as ×11, but add digits three at a time.';
    return { p, a: _A.num(n * k), steps: [intro, ...cs.steps, `Answer: ${NS.hl(NS.fmtn(n * k))}`], params: { n, k } };
  },
});

/* ---------- ×25, ×125, ×75, ÷25 (fractions of 100 and 1000) ---------- */
NS.G({
  id: 'm25', trick: 'friendly', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const kinds = lv === 'ms' ? ['25', '25', '125', '75', '50', 'd25'] : ['25', '125', '75', 'd25', '375', '625', '875'];
    const kd = r.pick(kinds);
    let n, m, p, a, steps;
    if (kd === 'd25') {
      n = r.int(13, 499); if (n % 25 === 0) n++;
      p = _H.cat(_H.n(n), ' ÷ 25 ='); a = _A.num(_q(n, 25));
      steps = ['Dividing by 25 is the same as multiplying by 4 and dividing by 100.', `${n} × 4 = ${n * 4}`, `${n * 4} ÷ 100 = ${NS.hl(_H.dec(_q(n, 25)).h)}`];
      return { p, a, steps, params: { kd, n } };
    }
    const spec = { '25': [25, 100, 4, 1], '50': [50, 100, 2, 1], '125': [125, 1000, 8, 1], '75': [75, 100, 4, 3], '375': [375, 1000, 8, 3], '625': [625, 1000, 8, 5], '875': [875, 1000, 8, 7] }[kd];
    const [mul, big, den, top] = spec; m = mul;
    if (den === 8) n = r.chance(0.8) ? 8 * r.int(3, 60) : 4 * r.int(5, 60);
    else n = r.chance(0.75) ? den * r.int(4, 99) : r.int(14, 250);
    if (n % 10 === 0) n += den;
    p = r.chance(0.5) ? _H.cat(_H.n(n), ' × ', _H.n(m), ' =') : _H.cat(_H.n(m), ' × ', _H.n(n), ' =');
    const qv = _q(n * top, den);
    steps = [`${m} = ${top === 1 ? '' : top}${_H.frac(top === 1 ? 1 : '', den).h.replace('<span class="nu"></span>', '<span class="nu">1</span>')} of ${big}`.replace(/^(\d+) = ([^o]*)/, '$1 = $2'),
      `${top === 1 ? `${n} ÷ ${den}` : `${n} × ${top} ÷ ${den}`} = ${_H.dec(qv).h}`,
      `${_H.dec(qv).h} × ${big} = ${NS.hl(NS.fmtn(n * m))}`];
    steps[0] = `${m} is ${top === 1 ? `1/${den}` : `${top}/${den}`} of ${big}, so divide by ${den}${top === 1 ? '' : `, times ${top},`} then tack on ${big === 100 ? 'two' : 'three'} zeros.`;
    return { p, a: _A.num(n * m), steps, params: { kd, n } };
  },
});

/* ---------- numbers near 100 (and 1000) ---------- */
NS.G({
  id: 'near100', trick: 'near100', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const kinds = lv === 'ms' ? ['under', 'under', 'over'] : ['under', 'over', 'mixed', 'k'];
    const kd = r.pick(kinds);
    let B = 100, x, y;
    if (kd === 'under') { x = r.int(86, 98); y = r.int(86, 98); }
    else if (kd === 'over') { x = r.int(101, 114); y = r.int(101, 112); }
    else if (kd === 'mixed') { x = r.int(101, 109); y = r.int(89, 98); }
    else { B = 1000; x = r.int(986, 998); y = r.int(985, 999); if (r.chance(0.4)) { x = r.int(1002, 1013); y = r.int(1002, 1015); } }
    const p = _H.cat(_H.n(x), ' × ', _H.n(y), ' =');
    const dx = x - B, dy = y - B, prod = dx * dy, res = x * y;
    const w = B === 100 ? 2 : 3;
    const sg = d => d < 0 ? `${-d} under` : `${d} over`;
    let steps;
    if (kd === 'mixed') {
      steps = [`${x} is ${sg(dx)} ${B}, ${y} is ${sg(dy)}.`,
        `Cross: ${x} − ${-dy} = ${x + dy}, so start from ${x + dy} × ${B} = ${NS.fmtn((x + dy) * B)}.`,
        `Multiply the gaps: ${dx} × ${-dy} = ${-prod}. Subtract it: ${NS.fmtn((x + dy) * B)} − ${-prod} = ${NS.hl(NS.fmtn(res))}`];
    } else {
      const left = x + dy; const gp = Math.abs(prod);
      steps = [`${x} is ${sg(dx)} ${B}, ${y} is ${sg(dy)}.`,
        `Cross: ${x} ${dy < 0 ? '−' : '+'} ${Math.abs(dy)} = ${left}. That's the front.`,
        `Gaps multiplied: ${Math.abs(dx)} × ${Math.abs(dy)} = ${gp}. Write it with ${w} digits: ${String(gp).padStart(w, '0')}${String(gp).length > w ? ' (carry the extra into the front)' : ''}.`,
        `Answer: ${NS.hl(NS.fmtn(res))}`];
    }
    return { p, a: _A.num(res), steps, params: { x, y } };
  },
});

/* ---------- squares ending in 5 ---------- */
NS.G({
  id: 'sq5', trick: 'square5', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const kd = lv === 'ms' ? r.pick(['2', '2', '2', 'dec']) : r.pick(['2', '3', '3', 'dec']);
    let t, p, val, front, steps;
    if (kd === 'dec') {
      t = r.int(1, lv === 'ms' ? 9 : 14); const s = `${t}.5`; val = _Q.parseNum(s).pow(2);
      p = _H.cat(_H.pow(s, 2), ' ='); front = t * (t + 1);
      steps = [`Ignore the decimal: ${t}5² → ${t} × ${t + 1} = ${front}, tack on 25 → ${front}25.`, `One decimal place squared is two places: ${NS.hl(_H.dec(val).h)}`];
      return { p, a: _A.num(val), steps, params: { kd, t } };
    }
    t = kd === '2' ? r.int(1, 9) : r.int(10, lv === 'hs' ? 19 : 12);
    const n = 10 * t + 5; val = n * n; front = t * (t + 1);
    p = r.chance(0.8) ? _H.cat(_H.pow(n, 2), ' =') : _H.cat(_H.n(n), ' × ', _H.n(n), ' =');
    steps = [`Take the front, ${t}, times one more: ${t} × ${t + 1} = ${front}.`, `Tack on 25: ${NS.hl(NS.fmtn(val))}`];
    return { p, a: _A.num(val), steps, params: { n } };
  },
});

/* ---------- same front, backs add to 10 (and the flip) ---------- */
NS.G({
  id: 'sameFront', trick: 'sameFront', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const flip = r.chance(lv === 'ms' ? 0.25 : 0.4);
    if (!flip) {
      const t = lv === 'hs' && r.chance(0.3) ? r.int(10, 15) : r.int(1, 9);
      let b = r.int(1, 9); if (b === 5) b = r.pick([1, 2, 3, 4, 6, 7, 8, 9]);
      const x = 10 * t + b, y = 10 * t + (10 - b);
      const p = _H.cat(_H.n(x), ' × ', _H.n(y), ' =');
      const f = t * (t + 1), bk = b * (10 - b);
      return { p, a: _A.num(x * y), params: { x, y }, steps: [`Fronts match (${t}) and the backs add to 10 (${b} + ${10 - b}).`, `Front × next number: ${t} × ${t + 1} = ${f}.`, `Backs multiplied, always two digits: ${b} × ${10 - b} = ${String(bk).padStart(2, '0')}.`, `Answer: ${NS.hl(NS.fmtn(x * y))}`] };
    }
    let a = r.int(1, 9), c = 10 - a, b = r.int(1, 9); if (a === c) { a = 3; c = 7; }
    const x = 10 * a + b, y = 10 * c + b;
    const p = _H.cat(_H.n(x), ' × ', _H.n(y), ' =');
    return { p, a: _A.num(x * y), params: { x, y }, steps: [`Backs match (${b}) and the fronts add to 10 (${a} + ${c}).`, `Fronts multiplied plus the back: ${a} × ${c} + ${b} = ${a * c + b}.`, `Back squared, two digits: ${b}² = ${String(b * b).padStart(2, '0')}.`, `Answer: ${NS.hl(NS.fmtn(x * y))}`] };
  },
});

/* ---------- two numbers ending in 5 ---------- */
NS.G({
  id: 'end5', trick: 'end5', col: { ms: 2, hs: 1 }, eval: true,
  gen(r, lv) {
    let a = r.int(1, 9), b = r.int(1, 9); if (a === b) b = a === 9 ? 2 : a + 1 + r.int(0, 8 - a);
    if (lv === 'hs' && r.chance(0.3)) a = r.int(10, 13);
    const x = 10 * a + 5, y = 10 * b + 5;
    const even = (a + b) % 2 === 0; const front = a * b + Math.floor((a + b) / 2);
    return {
      p: _H.cat(_H.n(x), ' × ', _H.n(y), ' ='), a: _A.num(x * y), params: { x, y },
      steps: [`Fronts: ${a} and ${b}. Their sum ${a + b} is ${even ? 'even, so the answer ends in 25' : 'odd, so the answer ends in 75'}.`,
        `Front part: ${a} × ${b} + half of ${a + b}${even ? '' : ' (round down)'} = ${a * b} + ${Math.floor((a + b) / 2)} = ${front}.`,
        `Answer: ${NS.hl(NS.fmtn(x * y))}`],
    };
  },
});

/* ---------- squares near 50 and near 100 ---------- */
NS.G({
  id: 'sq50', trick: 'squares50', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const near100 = r.chance(lv === 'ms' ? 0.35 : 0.45);
    if (!near100) {
      let k = r.int(1, 9) * r.sign(); const n = 50 + k;
      const p = r.chance(0.8) ? _H.cat(_H.pow(n, 2), ' =') : _H.cat(_H.n(n), ' × ', _H.n(n), ' =');
      return { p, a: _A.num(n * n), params: { n }, steps: [`${n} is ${Math.abs(k)} ${k > 0 ? 'above' : 'below'} 50.`, `Front: 25 ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${25 + k}.`, `Back: ${Math.abs(k)}² = ${String(k * k).padStart(2, '0')}.`, `Answer: ${NS.hl(NS.fmtn(n * n))}`] };
    }
    let k = r.int(1, 9) * r.sign(); if (lv === 'hs' && r.chance(0.3)) k = r.int(10, 13) * r.sign();
    const n = 100 + k;
    const p = _H.cat(_H.pow(n, 2), ' =');
    const b2 = k * k;
    return { p, a: _A.num(n * n), params: { n }, steps: [`${n} is ${Math.abs(k)} ${k > 0 ? 'above' : 'below'} 100.`, `Front: ${n} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${n + k}.`, `Back: ${Math.abs(k)}² = ${b2}, written as two digits${b2 >= 100 ? ' (carry the 1)' : `: ${String(b2).padStart(2, '0')}`}.`, `Answer: ${NS.hl(NS.fmtn(n * n))}`] };
  },
});

/* ---------- equally spaced around a middle ---------- */
NS.G({
  id: 'equi', trick: 'equidistant', col: { ms: 2, hs: 1 }, eval: true,
  gen(r, lv) {
    if (lv === 'hs' && r.chance(0.2)) { // decimals
      const m = r.int(3, 9), d = r.int(1, 4);
      const x = `${m - 1}.${10 - d}`, y = `${m}.${d}`;
      const val = _Q.parseNum(x).mul(_Q.parseNum(y));
      return { p: _H.cat(_H.dec(x), ' × ', _H.dec(y), ' ='), a: _A.num(val), params: { x, y }, steps: [`Both are 0.${d} from ${m}.`, `${m}² − 0.${d}² = ${m * m} − ${_H.dec(_q(d * d, 100)).h} = ${NS.hl(_H.dec(val).h)}`] };
    }
    const m = r.pick(lv === 'ms' ? [20, 30, 40, 50, 60, 70, 80, 25, 35, 45, 55, 65, 75, 85] : [25, 35, 45, 55, 65, 75, 85, 95, 30, 40, 60, 70, 80, 90, 105, 115]);
    let d = r.int(1, 9); if (m % 10 === 0 && d === 10) d = 9;
    const x = m - d, y = m + d;
    const p = r.chance(0.5) ? _H.cat(_H.n(x), ' × ', _H.n(y), ' =') : _H.cat(_H.n(y), ' × ', _H.n(x), ' =');
    return { p, a: _A.num(x * y), params: { x, y }, steps: [`${x} and ${y} are both ${d} away from ${m}.`, `So the product is ${m}² − ${d}² = ${NS.fmtn(m * m)} − ${d * d}.`, `Answer: ${NS.hl(NS.fmtn(x * y))}`] };
  },
});

/* ---------- double and half ---------- */
NS.G({
  id: 'dbl', trick: 'doubleHalf', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const f = r.pick([15, 15, 35, 45, 14, 16, 18, 12, 1.5]);
    let n = 2 * r.int(11, lv === 'ms' ? 49 : 249); if (n % 10 === 0) n += 2;
    let p, val;
    if (f === 1.5) {
      p = _H.cat(_H.dec('1.5'), ' × ', _H.n(n), ' ='); val = _q(3 * n, 2);
      return { p, a: _A.num(val), params: { f, n }, steps: [`Double 1.5 to get 3; halve ${n} to get ${n / 2}.`, `3 × ${n / 2} = ${NS.hl(NS.fmtn(3 * n / 2))}`] };
    }
    val = f * n;
    p = r.chance(0.5) ? _H.cat(_H.n(f), ' × ', _H.n(n), ' =') : _H.cat(_H.n(n), ' × ', _H.n(f), ' =');
    if (f % 2 === 1) return { p, a: _A.num(val), params: { f, n }, steps: [`Double ${f} → ${2 * f}. Halve ${n} → ${n / 2}.`, `${2 * f} × ${n / 2} = ${NS.hl(NS.fmtn(val))}`] };
    return { p, a: _A.num(val), params: { f, n }, steps: [`Halve ${f} → ${f / 2}. Double ${n} → ${2 * n}.`, `${f / 2} × ${2 * n} = ${NS.hl(NS.fmtn(val))}`] };
  },
});

/* ---------- general cross-multiplying (LIOF) ---------- */
NS.G({
  id: 'foil', trick: 'foil', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    let x = r.int(21, 98), y = r.int(21, 98);
    if (lv === 'hs' && r.chance(0.45)) x = r.int(112, 789);
    if (lv === 'ms' && r.chance(0.2)) x = r.int(102, 489);
    if (x % 10 === 0) x++; if (y % 10 === 0) y += 3;
    const cs = NS.convSteps(x, y);
    return { p: _H.cat(_H.n(x), ' × ', _H.n(y), ' ='), a: _A.num(x * y), params: { x, y }, steps: ['Work right to left, one column at a time. Each column adds the cross products that land there.', ...cs.steps, `Answer: ${NS.hl(NS.fmtn(x * y))}`] };
  },
});

/* ---------- reverses: ab × ba ---------- */
NS.G({
  id: 'rev', trick: 'reverses', col: { ms: 2, hs: 1 }, eval: true,
  gen(r) {
    let a = r.int(1, 9), b = r.int(1, 9); if (a === b) b = (a % 9) + 1;
    const x = 10 * a + b, y = 10 * b + a; const ab = a * b, sq = a * a + b * b;
    const o = ab % 10, c1 = Math.floor(ab / 10); const t = sq + c1, tw = t % 10, c2 = Math.floor(t / 10); const h = ab + c2;
    return { p: _H.cat(_H.n(x), ' × ', _H.n(y), ' ='), a: _A.num(x * y), params: { x, y }, steps: [
      `Pattern for reverses: ones = ${a}×${b}, tens = ${a}² + ${b}², hundreds = ${a}×${b}.`,
      `<b>ones:</b> ${a}×${b} = ${ab} → write ${NS.hl(o)}${c1 ? `, carry ${c1}` : ''}`,
      `<b>tens:</b> ${a * a} + ${b * b}${c1 ? ` + ${c1} carried` : ''} = ${t} → write ${NS.hl(tw)}${c2 ? `, carry ${c2}` : ''}`,
      `<b>hundreds:</b> ${ab}${c2 ? ` + ${c2} carried` : ''} = ${h} → write ${NS.hl(h)}`,
      `Answer: ${NS.hl(NS.fmtn(x * y))}`] };
  },
});

/* ---------- ×101 and ×1001 ---------- */
NS.G({
  id: 'm101', trick: 'times101', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const kd = r.pick(lv === 'ms' ? ['101a', '101b', '1001'] : ['101b', '1001', '101c', '10101']);
    let n, k;
    if (kd === '101a') { n = r.int(12, 99); k = 101; }
    else if (kd === '101b') { n = r.int(102, 989); k = 101; }
    else if (kd === '101c') { n = r.int(1012, 9876); k = 101; }
    else if (kd === '1001') { n = r.int(102, 989); k = 1001; }
    else { n = r.int(12, 99); k = 10101; }
    const v = n * k;
    const z = String(k).length - 1;
    const steps = k === 101 && n < 100 ? [`A two-digit number times 101 just repeats: ${n}${n}.`, `Answer: ${NS.hl(NS.fmtn(v))}`]
      : k === 10101 ? [`A two-digit number times 10101 repeats three times.`, `Answer: ${NS.hl(NS.fmtn(v))}`]
        : k === 1001 ? [`A three-digit number times 1001 repeats: ${n}${n}.`, `Answer: ${NS.hl(NS.fmtn(v))}`]
          : [`${k} = ${k - 1} + 1, so this is ${n} × ${k - 1} plus ${n}.`, `${NS.fmtn(n * (k - 1))} + ${n} = ${NS.hl(NS.fmtn(v))}`];
    void z;
    return { p: r.chance(0.5) ? _H.cat(_H.n(n), ' × ', _H.n(k), ' =') : _H.cat(_H.n(k), ' × ', _H.n(n), ' ='), a: _A.num(v), params: { n, k }, steps };
  },
});

/* ---------- special numbers 1001 = 7·11·13, 111 = 3·37, 10101 = 3·7·13·37 ---------- */
NS.G({
  id: 'special', trick: 'special', col: { ms: 2, hs: 2 }, eval: true,
  gen(r, lv) {
    const opts = lv === 'ms'
      ? [['143', 143, 7, 1001], ['77', 77, 13, 1001], ['91', 91, 11, 1001], ['37', 37, 3, 111]]
      : [['143', 143, 7, 1001], ['77', 77, 13, 1001], ['91', 91, 11, 1001], ['37', 37, 3, 111], ['3367', 3367, 3, 10101], ['1443', 1443, 7, 10101], ['429', 429, 7, 3003], ['259', 259, 3, 777]];
    const [, n, f, prod] = r.pick(opts);
    const k = r.int(2, 9); const m = f * k; const v = n * m;
    const steps = [`Spot it: ${n} × ${f} = ${NS.fmtn(prod)}.`, `${m} = ${f} × ${k}, so ${n} × ${m} = ${NS.fmtn(prod)} × ${k}.`, `Answer: ${NS.hl(NS.fmtn(v))}`];
    return { p: r.chance(0.5) ? _H.cat(_H.n(n), ' × ', _H.n(m), ' =') : _H.cat(_H.n(m), ' × ', _H.n(n), ' ='), a: _A.num(v), params: { n, m }, steps };
  },
});

/* ---------- distributive: pull out the common factor ---------- */
NS.G({
  id: 'distrib', trick: 'distrib', col: { ms: 1, hs: 1 }, eval: true,
  gen(r, lv) {
    const kd = r.pick(lv === 'ms' ? ['sum100', 'diff', 'nn1', 'sum100'] : ['sum100', 'diff', 'nn1', 'scaled']);
    if (kd === 'sum100') {
      const a = r.int(12, 89); const b = r.int(11, 89); const c = (r.chance(0.7) ? 100 : 10 * r.int(2, 9)) - b;
      if (c <= 0) return this.gen(r, lv);
      const p = r.chance(0.5) ? _H.cat(_H.n(a), ' × ', _H.n(b), ' + ', _H.n(a), ' × ', _H.n(c), ' =') : _H.cat(_H.n(a), ' × ', _H.n(b), ' + ', _H.n(c), ' × ', _H.n(a), ' =');
      return { p, a: _A.num(a * (b + c)), params: { kd, a, b, c }, steps: [`Both terms have ${a}. Pull it out: ${a} × (${b} + ${c}).`, `${a} × ${b + c} = ${NS.hl(NS.fmtn(a * (b + c)))}`] };
    }
    if (kd === 'diff') {
      const a = r.int(12, 79); const c = r.int(11, 69); const b = c + r.pick([10, 20, 100, 50]);
      return { p: _H.cat(_H.n(a), ' × ', _H.n(b), ' − ', _H.n(a), ' × ', _H.n(c), ' ='), a: _A.num(a * (b - c)), params: { kd, a, b, c }, steps: [`Pull out the ${a}: ${a} × (${b} − ${c}) = ${a} × ${b - c}.`, `Answer: ${NS.hl(NS.fmtn(a * (b - c)))}`] };
    }
    if (kd === 'nn1') {
      const n = r.int(13, lv === 'ms' ? 59 : 99);
      return { p: _H.cat(_H.pow(n, 2), ' + ', _H.n(n), ' ='), a: _A.num(n * n + n), params: { kd, n }, steps: [`${n}² + ${n} = ${n} × (${n} + 1) = ${n} × ${n + 1}.`, `Answer: ${NS.hl(NS.fmtn(n * (n + 1)))}`] };
    }
    // scaled: 48 × 11 + 44 × 12  →  11 × (48 + 4×12)
    const g = r.pick([11, 12, 13, 15, 25]); const t = r.pick([2, 3, 4]);
    const a = r.int(12, 49), b = r.int(11, 39);
    // a×(g) + (t·g)×b ... show as a × g + (g·t) × b
    const v = a * g + g * t * b;
    return { p: _H.cat(_H.n(a), ' × ', _H.n(g), ' + ', _H.n(g * t), ' × ', _H.n(b), ' ='), a: _A.num(v), params: { kd, a, g, t, b }, steps: [`${g * t} = ${g} × ${t}, so ${g} is in both terms.`, `${g} × (${a} + ${t} × ${b}) = ${g} × ${a + t * b}`, `Answer: ${NS.hl(NS.fmtn(v))}`] };
  },
});

/* ---------- a × a/b ---------- */
NS.G({
  id: 'aab', trick: 'aab', col: { ms: 3, hs: 2 }, eval: true,
  gen(r, lv) {
    let a, b, d;
    do { a = r.int(7, lv === 'ms' ? 25 : 40); d = r.int(1, 4) * r.sign(); b = a + d; } while (b < 3 || d * d >= b || M_gcdA(a, b) !== 1);
    const v = _q(a * a, b);
    const whole = 2 * a - b;
    return { p: _H.cat(_H.n(a), ' × ', _H.frac(a, b), ' ='), a: _A.num(v, 'mixed'), form: '(mixed number)', params: { a, b },
      steps: [`${b} is ${Math.abs(d)} ${d > 0 ? 'more' : 'less'} than ${a}.`, `Whole part: ${a} ${d > 0 ? '−' : '+'} ${Math.abs(d)} = ${whole}.`, `Fraction: (gap)² over ${b} = ${d * d}/${b}.`, `Answer: ${NS.hl(_H.Qf(v).h)}`] };
  },
});
function M_gcdA(a, b) { return _M.gcd(a, b); }

/* ---------- multiplying mixed numbers ---------- */
NS.G({
  id: 'mixmul', trick: 'mixedMult', col: { ms: 2, hs: 2 }, eval: true,
  gen(r, lv) {
    if (r.chance(0.6)) { // same whole, fractions add to 1
      const n = r.int(2, lv === 'ms' ? 12 : 20); const c = r.pick([3, 4, 5, 7, 8, 9, 6]);
      let a = r.int(1, c - 1); while (_M.gcd(a, c) !== 1 || _M.gcd(c - a, c) !== 1) a = r.int(1, c - 1);
      const v = _q(n * c + a, c).mul(_q(n * c + (c - a), c));
      return { p: _H.cat(_H.mixed(n, a, c), ' × ', _H.mixed(n, c - a, c), ' ='), a: _A.num(v, 'mixed'), form: '(mixed number)', params: { n, a, c },
        steps: [`Same whole number (${n}) and the fractions add to 1.`, `Whole: ${n} × ${n + 1} = ${n * (n + 1)}.`, `Fraction: ${a}/${c} × ${c - a}/${c} = ${_H.Qi(_q(a * (c - a), c * c)).h}.`, `Answer: ${NS.hl(_H.Qf(v).h)}`] };
    }
    // same fraction 1/k, wholes divisible by k
    const k = r.pick([2, 3, 4, 5, 6, 8]); const x = k * r.int(1, 4), y = k * r.int(2, 6);
    const v = _q(x * k + 1, k).mul(_q(y * k + 1, k));
    return { p: _H.cat(_H.mixed(x, 1, k), ' × ', _H.mixed(y, 1, k), ' ='), a: _A.num(v, 'mixed'), form: '(mixed number)', params: { x, y, k },
      steps: [`FOIL it: ${x}×${y} + (${x} + ${y}) × 1/${k} + 1/${k}×1/${k}.`, `${x * y} + ${(x + y) / k} + 1/${k * k}`, `Answer: ${NS.hl(_H.Qf(v).h)}`] };
  },
});

/* ---------- sum of squares special case: 72² + 13² = (7² + 2²)·101 ---------- */
NS.G({
  id: 'sumsq101', trick: 'sumsq101', col: { ms: 3, hs: 2 }, eval: true,
  gen(r) {
    let a, b; do { a = r.int(2, 9); b = r.int(2, 9); } while (a === 10 - a && b - 1 === a);
    const x = 10 * a + b, y = 10 * (b - 1) + (10 - a);
    const v = x * x + y * y;
    const sw = r.chance(0.4);
    return { p: sw ? _H.cat(_H.pow(y, 2), ' + ', _H.pow(x, 2), ' =') : _H.cat(_H.pow(x, 2), ' + ', _H.pow(y, 2), ' ='), a: _A.num(v), params: { x, y },
      steps: [`Check the pattern on ${x} and ${y}: ${b} is one more than ${b - 1}, and ${a} + ${10 - a} = 10.`, `So the answer is (${a}² + ${b}²) × 101 = ${a * a + b * b} × 101.`, `Answer: ${NS.hl(NS.fmtn(v))}`] };
  },
});

/* ---------- difference of squares ---------- */
NS.G({
  id: 'diffsq', trick: 'diffsq', col: { ms: 2, hs: 1 }, eval: true,
  gen(r, lv) {
    let x, y;
    if (r.chance(0.5)) { x = r.int(51, 89); y = (r.chance(0.6) ? 100 : 10 * r.int(8, 15)) - x; if (y <= 1 || y === x) { x = 63; y = 37; } }
    else { x = r.int(25, lv === 'ms' ? 80 : 150); y = x - r.int(1, 6); }
    if (r.chance(0.25)) [x, y] = [y, x];
    const v = x * x - y * y;
    return { p: _H.cat(_H.pow(x, 2), ' − ', _H.pow(y, 2), ' ='), a: _A.num(v), params: { x, y },
      steps: [`Use ${NS.m('a^2 - b^2 = (a-b)(a+b)')}.`, `(${x} − ${y}) × (${x} + ${y}) = ${x - y} × ${x + y}`, `Answer: ${NS.hl(NS.fmtn(v))}`] };
  },
});

/* ---------- consecutive squares ---------- */
NS.G({
  id: 'consq', trick: 'consq', col: { ms: 2, hs: 2 }, eval: true,
  gen(r, lv) {
    const n = r.pick(lv === 'ms' ? [15, 25, 35, 45, 20, 30, 40, 50, 24, 34] : [15, 25, 35, 45, 55, 65, 75, 30, 40, 60, 70, 34, 44, 64]);
    const down = (n % 10 === 4);
    const lo = down ? n : n, hi = n + 1;
    const p = _H.cat(_H.pow(lo, 2), ' + ', _H.pow(hi, 2), ' =');
    const v = lo * lo + hi * hi;
    const anchor = (lo % 5 === 0) ? lo : hi;
    const steps = anchor === lo
      ? [`${hi}² = ${lo}² + 2·${lo} + 1, so the sum is 2·${lo}² + 2·${lo} + 1.`, `2 × ${NS.fmtn(lo * lo)} + ${2 * lo} + 1`, `Answer: ${NS.hl(NS.fmtn(v))}`]
      : [`${lo}² = ${hi}² − 2·${hi} + 1, so the sum is 2·${hi}² − 2·${hi} + 1.`, `2 × ${NS.fmtn(hi * hi)} − ${2 * hi} + 1`, `Answer: ${NS.hl(NS.fmtn(v))}`];
    return { p, a: _A.num(v), params: { lo, hi }, steps };
  },
});
