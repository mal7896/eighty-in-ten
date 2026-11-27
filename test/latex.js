// Renders every prompt, step and key through KaTeX and reports parse failures
// and places where variables were left as plain text. Run: node test/latex.js [samples]
const load = require('./load');
const NS = load({ katex: require('../vendor/node_modules/katex') });
const N = +(process.argv[2] || 40);
const kw = new Set(); const _w = console.warn; console.warn = (...a) => { kw.add(a.join(' ')); };
let fails = 0, warns = 0; const seen = new Set();
const report = (kind, id, msg, src) => { const k = kind + id + msg; if (seen.has(k)) return; seen.add(k); console.log(`${kind} ${id}: ${msg}\n    ${String(src).replace(/\u0001/g, '⟪').replace(/\u0002/g, '⟫').slice(0, 220)}`); };
function check(id, src, opts) {
  const html = NS.render(src, opts);
  if (html.includes('class="fb"')) { fails++; report('PARSE', id, 'KaTeX could not parse', src); }
  // text left outside math that looks like a variable or LaTeX command
  const textOnly = html.replace(/<span class="katex">[\s\S]*?<\/span><\/span><\/span>(<\/span>)*/g, ' ').replace(/<[^>]+>/g, ' ');
  const bad = textOnly.match(/(^|[\s(])([abcdpqmuvw]|frac|sqrt|cdot)(?=[\s),.:;]|$)|\\[a-z]+/);
  if (bad && !/\b(a|A)\s+[a-z]/.test(textOnly.slice(Math.max(0, bad.index - 1), bad.index + 12))) { warns++; report('TEXT', id, `stray "${bad[0].trim()}" in text`, src); }
}
for (const g of NS.GENS) for (const lv of ['ms', 'hs']) {
  if (!g.col[lv]) continue;
  for (let i = 0; i < N; i++) {
    const p = NS.makeProblem(g.id, lv, 5000 + i * 77);
    check(g.id + '/prompt', p.p.h, { display: true });
    p.steps.forEach(s => check(g.id + '/step', s));
    check(g.id + '/key', NS.keyHtml(p.a));
  }
}
for (const [id, t] of Object.entries(NS.TRICKS)) {
  [t.title, t.s, ...t.how, t.why, t.watch].forEach(x => { const h = NS.rich(x); if (h.includes('class="fb"')) { fails++; report('PARSE', 'lesson ' + id, 'KaTeX could not parse', x); } });
}
console.warn = _w; if (kw.size) console.log('KaTeX warnings:\n  ' + [...kw].join('\n  '));
console.log(`\nKaTeX parse failures: ${fails}, KaTeX warnings: ${kw.size}, stray-text warnings: ${warns}`);
process.exit(fails ? 1 : 0);
