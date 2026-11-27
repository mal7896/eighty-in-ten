/* ===== geometry ===== */
(function () {
  const { H, M, ans: A, q, Q, G } = NS; const hl = NS.hl, fm = NS.fmtn;
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61]];
  const NAMES = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon', 15: '15-gon', 18: '18-gon', 20: '20-gon', 24: '24-gon', 30: '30-gon', 36: '36-gon' };

  /* ---------- polygons ---------- */
  G({
    id: 'polygon', trick: 'polygons', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = r.pick(['interior', 'sum', 'diag', 'sides', 'exterior']);
      const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
      if (kd === 'interior') { const v = q(180 * (n - 2), n); return { p: H.cat(`Each interior angle of a regular ${NAMES[n]} measures`), suffix: '°', a: A.num(v), params: { kd, n }, steps: [`Exterior angle = 360 ÷ ${n} = ${H.Qf(q(360, n)).h}°.`, `Interior = 180 − ${H.Qf(q(360, n)).h} = ${hl(H.Qf(v).h)}°`] }; }
      if (kd === 'exterior') { const v = q(360, n); return { p: H.cat(`Each exterior angle of a regular ${NAMES[n]} measures`), suffix: '°', a: A.num(v), params: { kd, n }, steps: [`Exterior angles always total 360°.`, `360 ÷ ${n} = ${hl(H.Qf(v).h)}°`] }; }
      if (kd === 'sum') { const m = r.int(5, 20); return { p: H.cat(`The sum of the interior angles of ${NS.an(m)} ${m}-sided polygon is`), suffix: '°', a: A.num(180 * (m - 2)), params: { kd, m }, steps: [`(n − 2) × 180 = ${m - 2} × 180.`, `= ${hl(fm(180 * (m - 2)))}°`] }; }
      if (kd === 'diag') { const m = r.int(5, lv === 'ms' ? 15 : 25); const v = m * (m - 3) / 2; return { p: H.cat(`A convex polygon with ${m} sides has how many diagonals?`), a: A.num(v), params: { kd, m }, steps: [`n(n − 3)/2 = ${m} × ${m - 3} / 2.`, `= ${hl(v)}`] }; }
      const ang = 180 - 360 / n; return { p: H.cat(`Each interior angle of a regular polygon is ${ang}°. How many sides does it have?`), a: A.num(n), params: { kd, n }, steps: [`Exterior angle = 180 − ${ang} = ${360 / n}°.`, `Sides = 360 ÷ ${360 / n} = ${hl(n)}`] };
    },
  });

  /* ---------- right triangles ---------- */
  G({
    id: 'rightTri', trick: 'rightTri', col: { ms: 2, hs: 3 },
    gen(r, lv) {
      const t = r.pick(lv === 'ms' ? TRIPLES.slice(0, 4) : TRIPLES); const k = r.pick([1, 1, 2, 3, 4]); const [a, b, c] = t.map(x => x * k);
      const kd = lv === 'ms' ? r.pick(['hyp', 'leg', 'area']) : r.pick(['hyp', 'leg', 'alt', 'area']);
      if (kd === 'hyp') return { p: H.cat(`A right triangle has legs ${a} and ${b}. Its hypotenuse is`), a: A.num(c), params: { kd, a, b }, steps: [`Spot the triple: ${t.join('–')}${k > 1 ? ` scaled by ${k}` : ''}.`, `Hypotenuse ${hl(c)}`] };
      if (kd === 'leg') return { p: H.cat(`A right triangle has hypotenuse ${c} and one leg ${a}. The other leg is`), a: A.num(b), params: { kd, a, c }, steps: [`Spot the triple: ${t.join('–')}${k > 1 ? ` × ${k}` : ''}.`, `Other leg ${hl(b)}`] };
      if (kd === 'area') return { p: H.cat(`A right triangle has hypotenuse ${c} and one leg ${b}. Its area is`), a: A.num(q(a * b, 2)), params: { kd, b, c }, steps: [`Other leg: ${a} (triple ${t.join('–')}).`, `Area = ${a} × ${b} / 2 = ${hl(H.Qf(q(a * b, 2)).h)}`] };
      const v = q(a * b, c);
      return { p: H.cat(`The altitude to the hypotenuse of a right triangle with legs ${a} and ${b} is`), a: A.num(v), params: { kd, a, b }, steps: [`Hypotenuse ${c}. Area two ways: leg × leg = hyp × altitude.`, `Altitude = ${a} × ${b} / ${c} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- area and perimeter ---------- */
  G({
    id: 'area', trick: 'area', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['rectP', 'trap', 'rhombus', 'circle', 'circum', 'triangle', 'sqdiag', 'sqdiag'] : ['trap', 'rhombus', 'circle', 'equi', 'sqdiag', 'circum', 'sector']);
      if (kd === 'rectP') { const w = r.int(3, 20), P = 2 * (w + r.int(w + 1, 30)); const l = P / 2 - w; return { p: H.cat(`A rectangle has perimeter ${P} and width ${w}. Its area is`), a: A.num(l * w), params: { kd, P, w }, steps: [`Length = ${P}/2 − ${w} = ${l}.`, `Area = ${l} × ${w} = ${hl(l * w)}`] }; }
      if (kd === 'triangle') { const b = r.int(4, 30), h = r.int(3, 25); return { p: H.cat(`A triangle has base ${b} and height ${h}. Its area is`), a: A.num(q(b * h, 2)), params: { kd, b, h }, steps: [`½ × ${b} × ${h}.`, `= ${hl(H.Qf(q(b * h, 2)).h)}`] }; }
      if (kd === 'trap') { const b1 = r.int(4, 20), b2 = r.int(5, 26), h = r.int(3, 16); const v = q((b1 + b2) * h, 2); return { p: H.cat(`A trapezoid has bases ${b1} and ${b2} and height ${h}. Its area is`), a: A.num(v), params: { kd, b1, b2, h }, steps: [`Average base × height = (${b1} + ${b2})/2 × ${h}.`, `= ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'rhombus') { const d1 = 2 * r.int(2, 12); let d2 = 2 * r.int(2, 15); if (d2 === d1) d2 += 4; if (r.chance(0.5)) return { p: H.cat(`A rhombus has diagonals ${d1} and ${d2}. Its area is`), a: A.num(d1 * d2 / 2), params: { kd, d1, d2 }, steps: [`Area of a rhombus: ${NS.m('\\frac{d_1 d_2}{2}')}.`, `${d1} × ${d2} / 2 = ${hl(d1 * d2 / 2)}`] };
        const t = r.pick(TRIPLES.slice(0, 3)); const [a, b, c] = t; return { p: H.cat(`A rhombus has diagonals ${2 * a} and ${2 * b}. Its perimeter is`), a: A.num(4 * c), params: { kd, a, b }, steps: [`Half-diagonals ${a} and ${b} make a right triangle with the side: ${c}.`, `Perimeter = 4 × ${c} = ${hl(4 * c)}`] }; }
      if (kd === 'circle') { const d = 2 * r.int(2, 15); return { p: H.cat(`The area of a circle with diameter ${d} is kπ. k =`), a: A.num((d / 2) ** 2), params: { kd, d }, steps: [`Radius ${d / 2}. Area = πr².`, `k = ${d / 2}² = ${hl((d / 2) ** 2)}`] }; }
      if (kd === 'circum') { const A0 = r.int(2, 15) ** 2; const rr = Math.sqrt(A0); return { p: H.cat(`A circle has area ${A0}π. Its circumference is kπ. k =`), a: A.num(2 * rr), params: { kd, A0 }, steps: [`r² = ${A0}, so r = ${rr}.`, `C = 2πr, so k = ${hl(2 * rr)}`] }; }
      if (kd === 'equi') { const s = 2 * r.int(2, 10); const v = q(s * s, 4); return { p: H.cat(`An equilateral triangle has side ${s}. Its area is k√3. k =`), a: A.num(v), params: { kd, s }, steps: [`Area of an equilateral triangle: ${NS.m('\\frac{\\sqrt3}{4}s^2')}.`, `k = ${s}²/4 = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'sqdiag') { const d = r.int(3, 20); const v = q(d * d, 2); return { p: H.cat(`A square has a diagonal of ${d}. Its area is`), a: A.num(v), params: { kd, d }, steps: [`Area of a square from its diagonal: ${NS.m('\\frac{d^2}{2}')}.`, `${d * d}/2 = ${hl(H.Qf(v).h)}`] }; }
      const rr = r.int(2, 12), ang = r.pick([30, 45, 60, 72, 90, 120, 135, 150]); const v = q(rr * rr * ang, 360);
      return { p: H.cat(`A sector of a circle with radius ${rr} has a central angle of ${ang}°. Its area is kπ. k =`), a: A.num(v), params: { kd, rr, ang }, steps: [`Sector = (angle/360) × πr² = ${ang}/360 × ${rr * rr}π.`, `k = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- volume and surface area ---------- */
  G({
    id: 'volume', trick: 'volume', col: { ms: 3, hs: 4 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['box', 'boxSA', 'cubeSA', 'cyl', 'sphere', 'sphSA', 'sphSA', 'cone', 'boxDiag'] : ['cubeSA', 'cyl', 'sphere', 'cone', 'sphSA', 'boxDiag']);
      if (kd === 'box') { const a = r.int(2, 12), b = r.int(2, 12), c = r.int(2, 9); return { p: H.cat(`A rectangular box is ${a} by ${b} by ${c}. Its volume is`), a: A.num(a * b * c), params: { kd, a, b, c }, steps: [`${NS.m('V = lwh')}.`, `${a} × ${b} × ${c} = ${hl(a * b * c)}`] }; }
      if (kd === 'boxSA') { const a = r.int(2, 10), b = r.int(2, 10), c = r.int(2, 9); const v = 2 * (a * b + b * c + a * c); return { p: H.cat(`The surface area of ${NS.an(a)} ${a} by ${b} by ${c} box is`), a: A.num(v), params: { kd, a, b, c }, steps: [`${NS.m('2(lw + wh + lh)')} = 2(${a * b} + ${b * c} + ${a * c}).`, `= ${hl(v)}`] }; }
      if (kd === 'cubeSA') { const s = r.int(2, 12); return { p: H.cat(`A cube has volume ${s ** 3}. Its total surface area is`), a: A.num(6 * s * s), params: { kd, s }, steps: [`Edge = ∛${s ** 3} = ${s}.`, `6 × ${s}² = ${hl(6 * s * s)}`] }; }
      if (kd === 'cyl') { const rr = r.int(2, 9), h = r.int(2, 12); return { p: H.cat(`A cylinder has radius ${rr} and height ${h}. Its volume is kπ. k =`), a: A.num(rr * rr * h), params: { kd, rr, h }, steps: [`${NS.m('V = \\pi r^2 h')}.`, `k = ${rr * rr} × ${h} = ${hl(rr * rr * h)}`] }; }
      if (kd === 'sphere') { const rr = 3 * r.int(1, 4); const v = q(4 * rr ** 3, 3); return { p: H.cat(`A sphere has radius ${rr}. Its volume is kπ. k =`), a: A.num(v), params: { kd, rr }, steps: [`${NS.m('V = \\tfrac43 \\pi r^3')}.`, `k = 4/3 × ${rr ** 3} = ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'sphSA') { const rr = r.int(2, 12); return { p: H.cat(`A sphere has radius ${rr}. Its surface area is kπ. k =`), a: A.num(4 * rr * rr), params: { kd, rr }, steps: [`Surface area: ${NS.m('4\\pi r^2')}.`, `k = 4 × ${rr * rr} = ${hl(4 * rr * rr)}`] }; }
      if (kd === 'cone') { const rr = r.int(2, 9), h = 3 * r.int(1, 5); return { p: H.cat(`A cone has radius ${rr} and height ${h}. Its volume is kπ. k =`), a: A.num(rr * rr * h / 3), params: { kd, rr, h }, steps: [`${NS.m('V = \\tfrac13 \\pi r^2 h')}.`, `k = ${rr * rr} × ${h}/3 = ${hl(rr * rr * h / 3)}`] }; }
      const [a, b, c, d] = r.pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 10, 11, 15]]);
      return { p: H.cat(`The longest diagonal of ${NS.an(a)} ${a} by ${b} by ${c} box is`), a: A.num(d), params: { kd, a, b, c }, steps: [`√(${a}² + ${b}² + ${c}²) = √${a * a + b * b + c * c}.`, `= ${hl(d)}`] };
    },
  });

  /* ---------- Platonic solids & Euler ---------- */
  const SOLIDS = [['tetrahedron', 4, 4, 6], ['cube', 6, 8, 12], ['octahedron', 8, 6, 12], ['dodecahedron', 12, 20, 30], ['icosahedron', 20, 12, 30]];
  G({
    id: 'platonic', trick: 'platonic', col: { ms: 3, hs: 3 },
    gen(r) {
      if (r.chance(0.3)) { const F = r.int(5, 20), V = r.int(5, 20); const E = F + V - 2; return { p: H.cat(`A convex polyhedron has ${F} faces and ${V} vertices. How many edges does it have?`), a: A.num(E), params: { F, V }, steps: [`Euler: F + V − E = 2.`, `E = ${F} + ${V} − 2 = ${hl(E)}`] }; }
      const [name, F, V, E] = r.pick(SOLIDS); const kd = r.pick(['faces', 'vertices', 'edges']);
      const v = { faces: F, vertices: V, edges: E }[kd];
      return { p: H.cat(`How many ${kd} does ${name === 'cube' ? 'a cube' : `a regular ${name}`} have?`), a: A.num(v), params: { name, kd }, steps: [`${name[0].toUpperCase() + name.slice(1)}: ${F} faces, ${V} vertices, ${E} edges.`, `Answer: ${hl(v)}`] };
    },
  });

  /* ---------- coordinate geometry ---------- */
  G({
    id: 'coord', trick: 'coordinate', col: { ms: 3, hs: 3 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['dist', 'slope', 'mid', 'lineSlope', 'lineSlope', 'yint'] : ['dist', 'slope', 'lineSlope', 'ptLine', 'yint']);
      if (kd === 'dist') { const [a, b, c] = r.pick(TRIPLES.slice(0, 4)); const x1 = r.int(-5, 6), y1 = r.int(-5, 6); const sx = r.sign(), sy = r.sign();
        return { p: H.cat(`The distance between (${x1}, ${y1}) and (${x1 + sx * a}, ${y1 + sy * b}) is`), a: A.num(c), params: { kd, x1, y1, a, b }, steps: [`Changes: ${a} and ${b}. That's ${/^(8|1[18](?!\d))/.test(String(a)) ? 'an' : 'a'} ${a}–${b}–${c} triangle.`, `Distance ${hl(c)}`] }; }
      if (kd === 'mid') { const x1 = r.int(-9, 12), x2 = r.int(-9, 12), y1 = r.int(-9, 9), y2 = r.int(-9, 9); const v = q(x1 + x2, 2);
        return { p: H.cat(`The x-coordinate of the midpoint of (${x1}, ${y1}) and (${x2}, ${y2}) is`), a: A.num(v), params: { kd, x1, x2 }, steps: [`Average the x's: (${x1} + ${x2})/2.`, `= ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'slope') { const x1 = r.int(-6, 6), y1 = r.int(-6, 6); let x2 = r.int(-6, 8); if (x2 === x1) x2 = x1 + 3; const y2 = r.int(-6, 9); const v = q(y2 - y1, x2 - x1);
        return { p: H.cat(`The slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}) is`), a: A.num(v), params: { kd, x1, y1, x2, y2 }, steps: [`Rise over run: (${y2} − ${y1 < 0 ? `(${y1})` : y1})/(${x2} − ${x1 < 0 ? `(${x1})` : x1}) = ${y2 - y1}/${x2 - x1}.`, `= ${hl(H.Qf(v).h)}`] }; }
      const a = r.int(1, 9) * r.sign(), b = r.int(1, 9) * r.sign(), c = r.int(-20, 20);
      const lineEq = `${a === 1 ? '' : a === -1 ? '−' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${c}`;
      if (kd === 'lineSlope') { const v = q(-a, b); return { p: H.cat(`The slope of the line ${lineEq} is`), a: A.num(v), params: { kd, a, b, c }, steps: [`For ${NS.m('Ax + By = C')}, the slope is ${NS.m('-\\frac AB')} = ${-a}/${b}.`, `= ${hl(H.Qf(v).h)}`] }; }
      if (kd === 'yint') { const v = q(c, b); return { p: H.cat(`The y-intercept of the line ${lineEq} is`), a: A.num(v), params: { kd, a, b, c }, steps: [`Set x = 0: ${b}y = ${c}.`, `y = ${hl(H.Qf(v).h)}`] }; }
      const [A0, B0, C0] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 15, 17]]); const sA = r.sign(), sB = r.sign(); const cc = r.int(-15, 15); const x0 = r.int(-4, 6), y0 = r.int(-4, 6);
      const v = q(Math.abs(sA * A0 * x0 + sB * B0 * y0 + cc), C0); if (v.sign() === 0) return this.gen(r, lv);
      return { p: H.cat(`The distance from (${x0}, ${y0}) to the line ${sA * A0}x ${sB < 0 ? '−' : '+'} ${B0}y${cc ? ` ${cc < 0 ? '−' : '+'} ${Math.abs(cc)}` : ''} = 0 is`), a: A.num(v), params: { kd, A0, B0, sA, sB, cc, x0, y0 }, steps: [`Distance: ${NS.m('\\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}')}.`, `|${sA * A0 * x0} ${sB * B0 * y0 < 0 ? '−' : '+'} ${Math.abs(sB * B0 * y0)} ${cc < 0 ? '−' : '+'} ${Math.abs(cc)}| / ${C0} = ${hl(H.Qf(v).h)}`] };
    },
  });

  /* ---------- conics ---------- */
  G({
    id: 'conics', trick: 'conics', col: { ms: 0, hs: 3 },
    gen(r) {
      const kd = r.pick(['ellipseArea', 'circleR', 'ellipseStd']);
      if (kd === 'ellipseArea' || kd === 'ellipseStd') { const a = r.int(2, 9), b = r.int(2, 8); if (a === b) return this.gen(r);
        if (kd === 'ellipseStd') { const A2 = b * b, B2 = a * a, Cc = a * a * b * b; return { p: H.cat('The area of the ellipse ', H.L(`${A2}x^2 + ${B2}y^2 = ${Cc}`), ' is ', H.L('k\\pi'), '. Find ', H.L('k.')), a: A.num(a * b), params: { a, b }, steps: [`Divide by ${Cc}: x²/${a * a} + y²/${b * b} = 1, so the semi-axes are ${a} and ${b}.`, `Area = πab, k = ${hl(a * b)}`] }; }
        return { p: H.cat('The area of the ellipse ', H.L(`\\frac{x^2}{${a * a}} + \\frac{y^2}{${b * b}} = 1`), ' is ', H.L('k\\pi'), '. Find ', H.L('k.')), a: A.num(a * b), params: { a, b }, steps: [`Semi-axes √${a * a} = ${a} and √${b * b} = ${b}.`, `Area = πab, k = ${hl(a * b)}`] }; }
      const [x, y, rr] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [1, 2, 0], [2, 3, 0], [4, 1, 0]]);
      const h = x * r.sign(), k = y * r.sign(); const R = rr || r.int(2, 8); const c = h * h + k * k - R * R;
      return { p: H.cat('The radius of the circle ', H.L(`x^2 + y^2 ${-2 * h < 0 ? '-' : '+'} ${Math.abs(2 * h)}x ${-2 * k < 0 ? '-' : '+'} ${Math.abs(2 * k)}y ${c === 0 ? '' : (c < 0 ? '- ' : '+ ') + Math.abs(c)} = 0`), ' is'), a: A.num(R), params: { h, k, R }, steps: [`Center (${-(-h)}, ${k}): the opposites of half the x and y coefficients. r² = ${h * h} + ${k * k} ${c < 0 ? '+' : '−'} ${Math.abs(c)} = ${R * R}.`, `r = ${hl(R)}`] };
    },
  });
})();

/* ---------- geometry facts ---------- */
(function () {
  const { H, M, ans: A, q, G } = NS; const hl = NS.hl;
  G({
    id: 'geofacts', trick: 'geoFacts', col: { ms: 3, hs: 2 },
    gen(r, lv) {
      const kd = r.pick(lv === 'ms' ? ['third', 'ext', 'comp', 'similar', 'isos'] : ['third', 'ext', 'inscribed', 'similar', 'isos', 'comp']);
      if (kd === 'third') { const a = r.int(25, 95), b = r.int(20, 150 - a); return { p: H.cat(`Two angles of a triangle measure ${a}° and ${b}°. The third angle measures`), suffix: '°', a: A.num(180 - a - b), params: { kd, a, b }, steps: [`Angles in a triangle add to 180°.`, `180 − ${a} − ${b} = ${hl(180 - a - b)}°`] }; }
      if (kd === 'ext') { const a = r.int(25, 80), b = r.int(25, 80); return { p: H.cat(`Two interior angles of a triangle are ${a}° and ${b}°. The exterior angle at the third vertex measures`), suffix: '°', a: A.num(a + b), params: { kd, a, b }, steps: [`An exterior angle equals the sum of the two remote interior angles.`, `${a} + ${b} = ${hl(a + b)}°`] }; }
      if (kd === 'comp') { const a = r.int(12, 78); const sup = r.chance(0.5); const v = (sup ? 180 : 90) - a; return { p: H.cat(`The ${sup ? 'supplement' : 'complement'} of ${NS.an(a)} ${a}° angle measures`), suffix: '°', a: A.num(v), params: { kd, a, sup }, steps: [`${sup ? 'Supplementary angles add to 180°' : 'Complementary angles add to 90°'}.`, `${sup ? 180 : 90} − ${a} = ${hl(v)}°`] }; }
      if (kd === 'isos') { const v = 2 * r.int(10, 60) + (r.chance(0.5) ? 1 : 0); const base = q(180 - v, 2); return { p: H.cat(`The vertex angle of an isosceles triangle is ${v}°. Each base angle measures`), suffix: '°', a: A.num(base), params: { kd, v }, steps: [`The two base angles are equal and share 180 − ${v} = ${180 - v}°.`, `${180 - v} ÷ 2 = ${hl(H.Qf(base).h)}°`] }; }
      if (kd === 'inscribed') { const arc = 2 * r.int(15, 85); return { p: H.cat(`An inscribed angle intercepts an arc of ${arc}°. The angle measures`), suffix: '°', a: A.num(arc / 2), params: { kd, arc }, steps: [`An inscribed angle is half its intercepted arc.`, `${arc} ÷ 2 = ${hl(arc / 2)}°`] }; }
      const s1 = r.int(3, 9); let s2 = r.int(4, 15); if (s2 === s1) s2++; const t = r.int(2, 12); const v = q(t * s2, s1);
      return { p: H.cat(`Triangle ABC is similar to triangle DEF, with AB = ${s1} and DE = ${s2}. If BC = ${t}, then EF =`), a: A.num(v), params: { kd, s1, s2, t }, steps: [`Scale factor: ${s2}/${s1}.`, `${t} × ${s2}/${s1} = ${hl(H.Qf(v).h)}`] };
    },
  });
})();
