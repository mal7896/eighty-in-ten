/* ===== core: exact rationals, rng, markup, answer parsing/checking ===== */
const NS = (typeof globalThis !== 'undefined' ? globalThis : window).NS = {};

/* ---------- exact rational numbers (BigInt) ---------- */
function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a; }
class Q {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  static of(n, d = 1) { return new Q(BigInt(n), BigInt(d)); }
  static from(x) { return x instanceof Q ? x : (typeof x === 'bigint' ? new Q(x) : Q.parseNum(String(x))); }
  // exact parse of an integer / decimal string like "-12.375"
  static parseNum(s) {
    const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s.trim());
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) throw new Error('bad number ' + s);
    const sign = m[1] === '-' ? -1n : 1n;
    const ip = m[2] || '0', fp = m[3] || '';
    return new Q(sign * BigInt(ip + fp), 10n ** BigInt(fp.length));
  }
  add(o) { o = Q.from(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.from(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.from(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.from(o); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  abs() { return new Q(this.n < 0n ? -this.n : this.n, this.d); }
  pow(k) { let r = Q.of(1); const b = k < 0 ? Q.of(1).div(this) : this; for (let i = 0; i < Math.abs(k); i++) r = r.mul(b); return r; }
  cmp(o) { o = Q.from(o); const x = this.n * o.d - o.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  isInt() { return this.d === 1n; }
  sign() { return this.n < 0n ? -1 : this.n > 0n ? 1 : 0; }
  num() { return Number(this.n) / Number(this.d); }
  terminates() { let d = this.d; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; }
  toFracStr() { return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`; }
  toMixedParts() { // {neg, w, a, b}
    const neg = this.n < 0n, n = neg ? -this.n : this.n;
    return { neg, w: n / this.d, a: n % this.d, b: this.d };
  }
  toMixedStr() {
    if (this.d === 1n) return this.n.toString();
    const { neg, w, a, b } = this.toMixedParts();
    return (neg ? '-' : '') + (w ? `${w} ${a}/${b}` : `${a}/${b}`);
  }
  toDecStr() { // only for terminating
    if (!this.terminates()) return null;
    let k = 0n, d = this.d; let n = this.n;
    while (10n ** k % d !== 0n) k++;
    const scaled = n * (10n ** k / d);
    const neg = scaled < 0n; let s = (neg ? -scaled : scaled).toString();
    if (k === 0n) return (neg ? '-' : '') + s;
    const K = Number(k); s = s.padStart(K + 1, '0');
    let out = s.slice(0, -K) + '.' + s.slice(-K);
    return (neg ? '-' : '') + out;
  }
  toString() { return this.toFracStr(); }
}
NS.Q = Q;
const q = (n, d = 1) => Q.of(n, d);
NS.q = q;

/* ---------- seeded rng ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
class Rng {
  constructor(seed) { this.seed = seed >>> 0; this.r = mulberry32(this.seed); }
  f() { return this.r(); }
  int(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
  chance(p) { return this.r() < p; }
  sign() { return this.r() < 0.5 ? -1 : 1; }
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  distinct(n, a, b) { const s = new Set(); while (s.size < n) s.add(this.int(a, b)); return [...s]; }
}
NS.Rng = Rng;
NS.newSeed = () => (Math.floor(Math.random() * 4294967296) >>> 0);

/* ---------- small math helpers ---------- */
const M = NS.M = {
  gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
  lcm(a, b) { return a / M.gcd(a, b) * b; },
  isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; },
  divisors(n) { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; },
  factor(n) { const f = []; let p = 2; while (n > 1) { if (p * p > n) { f.push([n, 1]); break; } let e = 0; while (n % p === 0) { n /= p; e++; } if (e) f.push([p, e]); p++; } return f; },
  fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  C(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); },
  P(n, k) { let r = 1; for (let i = 0; i < k; i++) r *= (n - i); return r; },
  digits(n) { return String(Math.abs(n)).split('').map(Number); },
  fmt(n) { // thousands separators for display of big integers
    const s = String(n); if (!/^-?\d+$/.test(s)) return s;
    const neg = s[0] === '-'; const d = neg ? s.slice(1) : s;
    return (neg ? '−' : '') + (d.length > 4 ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : d);
  },
};

/* ---------- markup pieces ----------
   Every piece carries h (display string: plain text plus LaTeX between \u0001 and \u0002),
   t (ASCII arithmetic, used by the tests to re-evaluate prompts) and l (pure LaTeX). */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
NS.esc = esc;
NS.ord = n => { const v = Math.abs(n) % 100; const s = (v >= 11 && v <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[v % 10] || 'th'); return n + s; };
const LM = '\u0001', RM = '\u0002';
NS.LM = LM; NS.RM = RM;
const mk = latex => LM + latex + RM;
NS.m = mk;
/* unicode text → LaTeX */
function mathify(s) {
  let t = String(s);
  t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  t = t.replace(/(\d),(?=\d{3}(?!\d))/g, '$1{,}');
  t = t.replace(/(\d) +\(/g, '$1\\ ('); // "10 (6 + 4)" is an aside in prose, not 10 times (6 + 4)
  t = t.replace(/([+\-−×]\s*)…(\s*[+\-−×=])/g, '$1\\cdots $2');
  t = t.replace(/\(mod (\d+)\)/g, '\\;(\\text{mod } $1)');
  t = t.replace(/√(\d+)/g, '\\sqrt{$1}');
  t = t.replace(/∛([−-]?\d[\d{},]*)/g, '\\sqrt[3]{$1}').replace(/½/g, '\\tfrac12 ');
  t = t.replace(/⁻¹/g, '^{-1}').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');
  t = t.replace(/([₀-₉]+)/g, m => '_{' + [...m].map(c => c.charCodeAt(0) - 8320).join('') + '}');
  const map = { '×': '\\times ', '÷': '\\div ', '−': '-', '·': '\\cdot ', '≤': '\\le ', '≥': '\\ge ', '≡': '\\equiv ', '≠': '\\ne ', '≈': '\\approx ', '…': '\\ldots ', '°': '^\\circ ', '%': '\\%', '$': '\\$', 'π': '\\pi ', 'θ': '\\theta ', '∪': '\\cup ', '∩': '\\cap ', '⟨': '\\langle ', '⟩': '\\rangle ', '→': '\\to ', '∞': '\\infty ', '′': "'", '″': "''", '{': '\\{', '}': '\\}', '–': '\\text{–}', '⟦': '[\\![', '⟧': ']\\!]' };
  t = t.replace(/[×÷−·≤≥≡≠≈…°%$πθ∪∩⟨⟩→∞′″–⟦⟧]/g, c => map[c]);
  t = t.replace(/\\\{,\\\}/g, '{,}'); // keep thousands separators
  t = t.replace(/\b(sin|cos|tan|log|ln|lim)\b/g, '\\$1 ');
  t = t.replace(/\bdx\b/g, '\\,dx');
  return t;
}
NS.mathify = mathify;
function piece(x) {
  if (x && typeof x === 'object' && 'h' in x) { if (!('l' in x)) x.l = mathify(x.h.replace(/\u0001|\u0002/g, '')); return x; }
  const s = String(x);
  return { h: esc(s).replace(/-(?=[\d.(])/g, '−'), t: s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'), l: mathify(s) };
}
const H = NS.H = {
  cat(...ps) { const a = ps.map(piece); return { h: a.map(p => p.h).join(''), t: a.map(p => p.t).join(''), l: a.map(p => p.l).join('') }; },
  L(latex, t = '') { return { h: mk(latex), t, l: latex }; },
  raw(h, t = '') { return { h, t, l: mathify(h) }; },
  n(x) { const f = M.fmt(x); return { h: f.replace(/^-/, '−'), t: String(x), l: mathify(f) }; },
  frac(a, b) { const A = piece(a), B = piece(b); const l = `\\frac{${A.l}}{${B.l}}`; return { h: mk(l), t: `((${A.t})/(${B.t}))`, l }; },
  mixed(w, a, b) {
    const neg = w < 0 || (w === 0 && a < 0); const W = Math.abs(w), A = Math.abs(a);
    const l = `${neg ? '-' : ''}${W || ''}\\frac{${A}}{${b}}`;
    return { h: mk(l), t: neg ? `(-(${W}+${A}/${b}))` : `(${W}+${A}/${b})`, l };
  },
  Qf(x) { x = Q.from(x); if (x.isInt()) return H.n(x.n.toString()); const { neg, w, a, b } = x.toMixedParts(); return H.mixed(neg ? -Number(w) : Number(w), neg && !w ? -Number(a) : Number(a), Number(b)); },
  Qi(x) { x = Q.from(x); if (x.isInt()) return H.n(x.n.toString()); const neg = x.n < 0n; const l = `${neg ? '-' : ''}\\frac{${neg ? -x.n : x.n}}{${x.d}}`; return { h: mk(l), t: neg ? `(-(${-x.n}/${x.d}))` : `((${x.n})/(${x.d}))`, l }; },
  pow(b, e) { const B = piece(b), E = piece(e); const l = `{${B.l}}^{${E.l}}`; return { h: mk(l), t: `(${B.t})^(${E.t})`, l }; },
  sqrt(x) { const X = piece(x); const l = `\\sqrt{${X.l}}`; return { h: mk(l), t: `sqrt(${X.t})`, l }; },
  cbrt(x) { const X = piece(x); const l = `\\sqrt[3]{${X.l}}`; return { h: mk(l), t: `cbrt(${X.t})`, l }; },
  base(s, b) { const l = `${s}_{${b}}`; return { h: mk(l), t: '', l }; },
  paren(x) { const X = piece(x); return { h: `(${X.h})`, t: `(${X.t})`, l: `(${X.l})` }; },
  rep(s) { const l = mathify(s) + '\\ldots'; return { h: mk(l), t: '', l }; },
  bar(prefix, rep) { const l = `${prefix}\\overline{${rep}}`; return { h: mk(l), t: '', l }; },
  abs(x) { const X = piece(x); const l = `\\left|${X.l}\\right|`; return { h: mk(l), t: `abs(${X.t})`, l }; },
  floor(x) { const X = piece(x); const l = `[\\![${X.l}]\\!]`; return { h: mk(l), t: `floor(${X.t})`, l }; },
  dec(x) { const s = typeof x === 'string' ? x : Q.from(x).toDecStr(); const d = s.replace(/^(-?)0\./, '$1.'); return { h: d.replace(/^-/, '−'), t: s, l: d }; },
  i(s) { const l = s === 'π' ? '\\pi' : s; return { h: mk(l), t: s, l }; },
};

/* ---------- LaTeX helpers ---------- */
// LaTeX → plain text, for tests and for the no-KaTeX fallback
NS.latexPlain = function (l) {
  let t = l;
  for (let k = 0; k < 4; k++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (m0, a, b) => ` ${a}/${b}`);
  t = t.replace(/\\sqrt\[3\]\{([^{}]*)\}/g, '∛$1').replace(/\\sqrt\{([^{}]*)\}/g, '√$1');
  t = t.replace(/\\(times)/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\pi/g, 'π').replace(/\\le\b/g, '≤').replace(/\\ge\b/g, '≥').replace(/\\ldots/g, '…').replace(/\^\\circ/g, '°');
  t = t.replace(/\{,\}/g, ',').replace(/\\%/g, '%').replace(/\\\$/g, '$').replace(/\\[,!;]/g, '').replace(/\\(left|right)/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
  return t.replace(/\s+/g, ' ').trim();
};
// the article before a number: an 8, an 11, an 18, an 80, a 7
NS.an = v => (/^(8|1[18](?!\d))/.test(String(v)) ? 'an' : 'a');
NS.An = v => (NS.an(v) === 'an' ? 'An' : 'A');
// LaTeX → readable Unicode text, for copying a problem: x², ∛27, (x − 1)/(x + 1), lim(x→2), Σ(k=1 to 7), |a b; c d|
NS.latexText = (function () {
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '−': '⁻', '+': '⁺', n: 'ⁿ', '(': '⁽', ')': '⁾' };
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '−': '₋', '+': '₊' };
  const SYM = { times: '×', div: '÷', cdot: '·', pi: 'π', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', equiv: '≡', to: '→', infty: '∞', theta: 'θ', alpha: 'α', beta: 'β', ldots: '…', cdots: '⋯', dots: '…', circ: '°', degree: '°', cap: '∩', cup: '∪', pm: '±', approx: '≈', prime: '′', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', in: '∈', angle: '∠', triangle: '△', perp: '⊥', cong: '≅', sim: '~', mid: '|', vert: '|', lvert: '|', rvert: '|', quad: ' ', qquad: ' ', bmod: ' mod ', '{': '{', '}': '}', '%': '%', $: '$', '&': '&', '#': '#', ',': ' ', ';': ' ', ':': ' ', ' ': ' ', '!': '', '|': '‖', left: '', right: '', big: '', Big: '', displaystyle: '', textstyle: '', limits: '', nolimits: '' };
  const FN = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan', 'log', 'ln', 'exp', 'det', 'max', 'min'];
  const BIG = { lim: 'lim', sum: 'Σ', prod: 'Π', int: '∫', iint: '∬' };
  const tight = s => /^[\w.!′°π⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻₀₁₂₃₄₅₆₇₈₉]+$/.test(s);
  function convert(s) {
    let out = '', i = 0;
    const group = () => { // the next {…} group, or the next single token
      while (s[i] === ' ') i++;
      if (s[i] === '{') { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '\\') { j++; continue; } if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; } const g = s.slice(i + 1, j); i = j + 1; return g; }
      if (s[i] === '\\') { const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); i += m[0].length; return m[0]; }
      return s[i++] || '';
    };
    const opt = () => { if (s[i] !== '[') return null; const j = s.indexOf(']', i); const g = s.slice(i + 1, j); i = j + 1; return g; };
    const scripts = () => { let lo = null, hi = null; for (;;) { while (s[i] === ' ') i++; if (s[i] === '_' && lo === null) { i++; lo = convert(group()); } else if (s[i] === '^' && hi === null) { i++; hi = convert(group()); } else break; } return [lo, hi]; };
    const par = x => (tight(x) ? x : `(${x})`);
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); const name = m[1]; i += m[0].length;
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') { const a = convert(group()), b = convert(group()); out += `${/\d$/.test(out) ? ' ' : ''}${par(a)}/${par(b)}`; continue; }
        if (name === 'binom') { const a = convert(group()), b = convert(group()); out += `C(${a}, ${b})`; continue; }
        if (name === 'sqrt') { const n = opt(); const x = convert(group()); out += (n === null || n === '2' ? '√' : n === '3' ? '∛' : n === '4' ? '∜' : [...n].map(ch => SUP[ch] || ch).join('') + '√') + par(x); continue; }
        if (name === 'text' || name === 'mathrm' || name === 'textrm' || name === 'operatorname' || name === 'mathit' || name === 'textbf' || name === 'mathbf') { out += name === 'operatorname' ? convert(group()) + ' ' : group(); continue; }
        if (name === 'overline') { out += [...convert(group())].map(ch => ch + '̅').join(''); continue; }
        if (name === 'underline') { group(); out += '____'; continue; }
        if (name === 'hspace' || name === 'vphantom' || name === 'phantom') { group(); out += ' '; continue; }
        if (name === 'pmod') { out += ` (mod ${convert(group())})`; continue; }
        if (name === 'begin') { const env = group(); const end = s.indexOf(`\\end{${env}}`, i); const body = s.slice(i, end); i = end + `\\end{${env}}`.length;
          const rows = body.split(/\\\\/).map(r => r.split('&').map(x => convert(x).trim()).join(' ')).filter(Boolean).join('; ');
          const [l, r] = { vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'], bmatrix: ['[', ']'], pmatrix: ['(', ')'] }[env] || ['', '']; out += l + rows + r; continue; }
        if (BIG[name]) { const [lo, hi] = scripts(); out += BIG[name] + (lo !== null && hi !== null ? `(${lo.trim()} to ${hi.trim()})` : lo !== null ? `(${lo.trim()})` : '') + ' '; continue; }
        if (FN.includes(name)) { out += name; const [lo, hi] = scripts(); if (lo !== null) out += [...lo].every(ch => SUB[ch]) ? [...lo].map(ch => SUB[ch]).join('') : `_${par(lo)}`; if (hi !== null) out += [...hi].every(ch => SUP[ch]) ? [...hi].map(ch => SUP[ch]).join('') : `^${par(hi)}`; if (/^[\w(]/.test(s.slice(i).trimStart()) && !/^\s*\(/.test(s.slice(i))) out += ' '; continue; }
        out += SYM[name] !== undefined ? SYM[name] : name; continue;
      }
      if (c === '{') { out += convert(group()); continue; }
      if (c === '^' || c === '_') { i++; const x = convert(group()).trim(); const map = c === '^' ? SUP : SUB;
        if (c === '^' && (x === '°' || x === '′' || x === '′′')) out += x;
        else if (x && [...x].every(ch => map[ch])) out += [...x].map(ch => map[ch]).join('');
        else out += c + par(x);
        continue; }
      if (c === '~') { out += ' '; i++; continue; }
      if (c === '-') { out += '−'; i++; continue; }
      if (c === '}') { i++; continue; }
      out += c; i++;
    }
    return out;
  }
  return l => convert(String(l)).replace(/\[\[/g, '⟦').replace(/\]\]/g, '⟧').replace(/\s+/g, ' ').trim();
})();
// a lightweight HTML fallback when KaTeX is unavailable
function latexFallback(l) {
  let t = esc(l);
  for (let k = 0; k < 4; k++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="fr"><span class="nu">$1</span><span class="de">$2</span></span>');
  t = t.replace(/\\sqrt\[3\]\{([^{}]*)\}/g, '∛<span class="rad">$1</span>').replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="rad">$1</span>');
  t = t.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^(\w)/g, '<sup>$1</sup>').replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>');
  return '<span class="fb">' + NS.latexPlain(t.replace(/<(\/?)(span|sup|sub)/g, '\u0003$1$2')).replace(/\u0003/g, '<') + '</span>';
}

/* ---------- renderer: text with LaTeX markers → HTML ----------
   Plain text is scanned too: runs that contain an operator or a variable are typeset as math,
   ordinary words and lone numbers stay as text. */
const MATHWORDS = new Set(['x', 'y', 'xy', 'k', 'f', 'g', 'i', 'r', 'n', 'dx', 'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'mod']);
const OPS = /[=+\-−×÷·\/^<>≤≥≡≈²³⁻√π∪∩⟨⟩θ∞|]/;
function runsOf(text, prevMath) {
  const toks = text.match(/\d+-[A-Za-z]+(?:-[A-Za-z]+)*|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d[\d,]*(?:\.\d+)?|\.\d+|\s+|[\s\S]/g) || [];
  const out = []; let seg = []; let segAll = null, firstIdx = -1;
  const isOp = (tks, k) => { // is token k a real (binary) operator?
    const tk = tks[k]; if (!OPS.test(tk)) return false;
    if (tk === '-' || tk === '−') { let p = k - 1; while (p >= 0 && /^\s+$/.test(tks[p])) p--; if ((p < 0 && !(prevMath && tks === segAll && k === firstIdx)) || (p >= 0 && /^[(,\[]$/.test(tks[p]))) return false; }
    return true;
  };
  const flush = () => {
    if (!seg.length) return;
    let a = 0, b = seg.length;
    while (a < b && /^(\s+|[,.;:?!→"“”‘’]|–)$/.test(seg[a])) a++;
    while (b > a && /^(\s+|[,.;:?!→"“”‘’]|–)$/.test(seg[b - 1])) b--;
    const core = seg.slice(a, b);
    segAll = core; firstIdx = (out.length === 0 && a === seg.findIndex(t => !/^\s+$/.test(t))) ? 0 : -1;
    const isMath = core.length && core.some((tk, k) => isOp(core, k) || MATHWORDS.has(tk));
    if (isMath) { out.push({ m: false, s: seg.slice(0, a).join('') }); out.push({ m: true, s: core.join('') }); out.push({ m: false, s: seg.slice(b).join('') }); }
    else out.push({ m: false, s: seg.join('') });
    seg = [];
  };
  toks.forEach((tk, k) => {
    const sentenceEnd = (tk === '.' || tk === '?' || tk === ';') && (k + 1 >= toks.length || /^\s+$/.test(toks[k + 1]));
    if (sentenceEnd) { flush(); out.push({ m: false, s: tk }); }
    else if (/^[A-Za-z\d]/.test(tk) && /[A-Za-z]/.test(tk) && !MATHWORDS.has(tk)) { flush(); out.push({ m: false, s: tk }); }
    else seg.push(tk);
  });
  flush();
  return out.filter(x => x.s !== '');
}
const KCACHE = new Map();
function tex(latex, display) {
  const key = (display ? 'D' : 'T') + latex;
  if (KCACHE.has(key)) return KCACHE.get(key);
  let html;
  const K = (typeof katex !== 'undefined') ? katex : (typeof window !== 'undefined' && window.katex);
  // limits, sums, products and integrals always get display style, so the subscript sits under "lim" or Σ
  // and the fraction beside it stays full size, even in small text such as the answer key or a printed test
  const big = !display && /\\(lim|sum|prod|int|iint)(?![a-z])/.test(latex);
  if (K) { try { html = K.renderToString((display || big ? '\\displaystyle ' : '') + latex, { throwOnError: true, strict: false, output: 'html' }); if (big) html = '<span class="dmath">' + html + '</span>'; } catch (e) { html = latexFallback(latex); } }
  else html = latexFallback(latex);
  if (KCACHE.size > 4000) KCACHE.clear();
  KCACHE.set(key, html); return html;
}
NS.tex = tex;
NS.render = function (str, opts = {}) {
  if (str === undefined || str === null) return '';
  let s = String(str);
  if (opts.dollars) s = s.replace(/\$([^$]+)\$/g, (m0, l) => mk(l));
  const parts = s.split(/(<[^>]*>|\u0001[^\u0002]*\u0002)/);
  let html = '', buf = [], pend = '', mathAt = -1;
  // math followed straight away by punctuation stays on the same line as it, so a "." never starts a line
  const flushMath = () => { mathAt = -1; if (buf.length) { mathAt = html.length; html += tex(buf.join(' '), opts.display); buf = []; } if (pend) { html += pend; pend = ''; mathAt = -1; } };
  // a word joiner (U+2060) forbids only the break between the math and the punctuation; long math can still wrap
  const addText = t => { if (mathAt >= 0 && /^[.,;:!?)\]]/.test(t)) t = '\u2060' + t; mathAt = -1; html += esc(t); };
  for (const part of parts) {
    if (!part) continue;
    if (part[0] === '<') { flushMath(); mathAt = -1; html += part; continue; }
    if (part[0] === LM) { if (pend.trim()) flushMath(); pend = ''; buf.push(part.slice(1, -1)); continue; }
    const plain = part.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    for (const r of runsOf(plain, buf.length > 0)) {
      if (r.m) { if (pend.trim()) flushMath(); pend = ''; buf.push(mathify(r.s)); }
      else if (!r.s.trim() && buf.length) pend += r.s;
      else { flushMath(); addText(r.s); }
    }
  }
  flushMath();
  return html;
};
// trick titles and lesson text use $…$ for LaTeX
NS.rich = (s, small) => NS.render(small ? s : String(s).replace(/\\tfrac/g, '\\frac'), { dollars: true, display: !small });
NS.plain = s => String(s).replace(/\$([^$]+)\$/g, (m0, l) => NS.latexPlain(l));

/* ---------- answer specs ----------
   {type:'num', v:Q, form:'any'|'mixed'|'frac'|'dec'|'int', est:false}
   {type:'text', v:'MCMXC', alts:[...], kind:'roman'|'base'|'complex'|'pair'|'word'}
*/
NS.ans = {
  num(v, form = 'any') { return { type: 'num', v: Q.from(v), form }; },
  est(v) { return { type: 'num', v: Q.from(v), form: 'any', est: true }; },
  text(v, kind = 'word', alts = []) { return { type: 'text', v: String(v), kind, alts }; },
};

/* ---------- parse a student's typed answer ---------- */
NS.parseInput = function (raw) {
  let s = String(raw).trim().replace(/[−–—]/g, '-').replace(/\s+/g, ' ').replace(/,/g, '');
  if (s === '') return { kind: 'empty' };
  s = s.replace(/^\$/, '').replace(/%$/, '').trim();
  // mixed number: "-3 1/4" or "3_1/4"
  let m = /^(-?)(\d+)[ _](\d+)\/(\d+)$/.exec(s);
  if (m) {
    const w = BigInt(m[2]), a = BigInt(m[3]), b = BigInt(m[4]);
    if (b === 0n) return { kind: 'bad' };
    let v = new Q(w * b + a, b); if (m[1]) v = v.neg();
    return { kind: 'num', form: 'mixed', v, proper: a < b && a > 0n, reduced: bgcd(a, b) === 1n };
  }
  m = /^(-?)(\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s);
  if (m) {
    if (m[2].includes('.') || m[3].includes('.')) return { kind: 'bad' };
    const a = BigInt(m[2]), b = BigInt(m[3]);
    if (b === 0n) return { kind: 'bad' };
    let v = new Q(a, b); if (m[1]) v = v.neg();
    return { kind: 'num', form: 'frac', v, reduced: bgcd(a, b) === 1n && b !== 1n };
  }
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) {
    const v = Q.parseNum(s);
    return { kind: 'num', form: s.includes('.') ? 'dec' : 'int', v };
  }
  return { kind: 'text', s };
};

function normText(s, kind) {
  let t = String(s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
  if (kind === 'roman') return t.toUpperCase();
  if (kind === 'base') return t.toUpperCase().replace(/^0+(?=.)/, '');
  if (kind === 'complex') {
    t = t.toLowerCase().replace(/\+-/g, '-').replace(/^\+/, '');
    t = t.replace(/(^|[+-])1i/g, '$1i');
    return t;
  }
  if (kind === 'pair') return t.replace(/[()]/g, '');
  if (kind === 'ratio') { t = t.toLowerCase().replace(/to/g, ':'); const m = /^(\d+)[:/](\d+)$/.exec(t); return m ? `${+m[1]}:${+m[2]}` : t; }
  return t.toLowerCase();
}
NS.normText = normText;

/* ---------- check an answer. returns {ok, note} ---------- */
NS.check = function (spec, raw) {
  const p = NS.parseInput(raw);
  if (p.kind === 'empty') return { ok: false, empty: true };
  if (spec.type === 'text') {
    const want = [spec.v, ...(spec.alts || [])].map(x => normText(x, spec.kind));
    const got = normText(raw, spec.kind);
    if (want.includes(got)) return { ok: true };
    if (spec.kind === 'base' && p.kind === 'num' && want.includes(normText(String(raw), 'base'))) return { ok: true };
    return { ok: false };
  }
  if (p.kind !== 'num') return { ok: false, note: p.kind === 'bad' ? "That isn't a number this site can read." : null };
  const v = spec.v;
  if (spec.est) {
    if (p.form !== 'int') return { ok: false, note: 'Write your estimate as an integer.' };
    let lo = v.mul(q(95, 100)), hi = v.mul(q(105, 100));
    if (lo.cmp(hi) > 0) [lo, hi] = [hi, lo];
    const ok = p.v.cmp(lo) >= 0 && p.v.cmp(hi) <= 0;
    return { ok };
  }
  if (!p.v.eq(v)) return { ok: false };
  // value is right; now the contest form rules (UIL Number Sense handbook, scoring rules b–e)
  const t = String(raw).trim().replace(/^\$/, '').replace(/\s+/g, ' ');
  if (t.includes(',') && !/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return { ok: false, note: 'Right value, but a comma is out of place. Commas are optional; if you use them, they must be in the right places.' };
  if (spec.form === 'money') {
    if (!/^-?(\d{1,3}(,\d{3})*|\d+)?\.\d{2}$/.test(t)) return { ok: false, note: `Right value, but money answers are written to the cent: ${NS.money(v)}.` };
    if (/^-?0\./.test(t)) return { ok: false, note: `Right value, but leave off the leading zero: ${NS.money(v)}.` };
    return { ok: true };
  }
  if (/^-?0(\.\d|\d)/.test(t)) return { ok: false, note: 'Right value, but leave off the leading zero: write .5, not 0.5.' };
  if (/\.\d*0$|\.$/.test(t)) return { ok: false, note: 'Right value, but extra zeros at the end count as wrong: write 16, not 16.0.' };
  if (p.form === 'frac' && !p.reduced) return { ok: false, note: 'Right value, but fractions have to be in lowest terms.' };
  if (p.form === 'mixed' && (!p.proper || !p.reduced)) return { ok: false, note: 'Right value, but the fraction part has to be proper and in lowest terms.' };
  const f = spec.form || 'any';
  if (f === 'mixed' && !v.isInt() && v.abs().cmp(1) > 0 && p.form !== 'mixed') return { ok: false, note: 'Right value, but this one asks for a mixed number.' };
  if (f === 'frac' && !v.isInt() && p.form !== 'frac') return { ok: false, note: 'Right value, but this one asks for a common fraction.' };
  if (f === 'dec' && !v.isInt() && p.form !== 'dec') return { ok: false, note: 'Right value, but this one asks for a decimal.' };
  return { ok: true };
};

// dollars and cents as UIL keys write them: 23.00, .16, 1,234.50
NS.money = function (v) {
  const c = v.mul(q(100, 1)); const n = c.n / c.d; const neg = n < 0n; const a = neg ? -n : n;
  const whole = a / 100n, cents = String(a % 100n).padStart(2, '0');
  return `${neg ? '−' : ''}${whole ? M.fmt(whole.toString()) : ''}.${cents}`;
};
/* ---------- display the key ---------- */
NS.keyHtml = function (spec) {
  if (spec.show) return spec.show;
  if (spec.type === 'text') { const v = spec.kind === 'complex' ? mk(spec.v.replace(/-/g, '-')) : spec.kind === 'ratio' ? mk(spec.v.replace(':', '\\mathbin{:}')) : esc(spec.v); return v; }
  const v = spec.v;
  if (spec.est) {
    const a = v.mul(q(95, 100)), b = v.mul(q(105, 100));
    const lo = a.cmp(b) < 0 ? a : b, hi = a.cmp(b) < 0 ? b : a;
    const ceil = x => { const n = x.n / x.d; return (x.n % x.d === 0n || x.n < 0n) ? n : n + 1n; };
    const floor = x => { const n = x.n / x.d; return (x.n % x.d === 0n || x.n > 0n) ? n : n - 1n; };
    return `${M.fmt(ceil(lo).toString())} to ${M.fmt(floor(hi).toString())}`.replace(/-(?=\d)/g, '−');
  }
  const f = spec.form || 'any';
  if (f === 'money') return NS.money(v);
  if (v.isInt()) return H.n(v.n.toString()).h;
  if (f === 'dec') return H.dec(v).h;
  if (f === 'frac') return H.Qi(v).h;
  const parts = [];
  if (f === 'mixed' || v.abs().cmp(1) > 0) parts.push(H.Qf(v).h);
  if (f !== 'mixed') parts.push(H.Qi(v).h);
  if (f === 'any' && v.terminates()) parts.push(H.dec(v).h);
  return [...new Set(parts)].join('<span class="or"> or </span>');
};
// a problem as plain text, for copying: math in plain form, the blank as a line, units and form after it
NS.plainProblem = function (p) {
  const txt = String(p.p.h).replace(/\u0001([^\u0002]*)\u0002/g, (m0, l) => /\\underline/.test(l) ? '______' : NS.latexText(l)).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return `${txt} ${p.pre || ''}${txt.includes('______') ? '' : '______'}${p.suffix ? ' ' + p.suffix : ''}${p.form ? ' ' + p.form : ''}`.replace(/\s+/g, ' ').trim();
};
NS.keyText = function (spec) { // plain text key (for aria / tests)
  if (spec.type === 'text') return spec.v;
  if (spec.est) return '≈' + spec.v.num();
  return spec.v.toMixedStr();
};
