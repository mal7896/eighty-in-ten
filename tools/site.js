// Builds the pages search engines can read: a page for every trick, the trick index,
// the practice-test page and the sitemap. Run by build.py: node tools/site.js <site url>
const fs = require('fs'), path = require('path');
const NS = require('../test/load')({ katex: require('../vendor/node_modules/katex') });
const BASE = process.argv[2] || 'https://mal7896.github.io/eighty-in-ten/';
const DOCS = path.join(__dirname, '..', 'docs');
const TESTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'tests.json'), 'utf8'));
const esc = NS.esc;
const LV = { ms: 'Middle school', hs: 'High school' };
const COLR = { 1: '1–20', 2: '21–40', 3: '41–60', 4: '61–80' };
const R = s => NS.render(s, { display: true });
const plain = s => String(s).replace(/\$([^$]+)\$/g, (m0, l) => NS.latexText(l)).replace(/\s+/g, ' ').trim();
const slugOf = s => plain(s).toLowerCase().replace(/[′'’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// tricks whose titles are formulas get worded addresses
const SLUG = { squareMultiples: 'a-squared-plus-ka-squared', aab: 'a-times-a-over-b', aOverB: 'a-over-b-plus-b-over-a', twoAB: 'a-squared-plus-b-squared-minus-a-minus-b-squared', fractionChain: 'one-over-a-plus-one-over-ab-chains', factorialTrick: 'factorial-fractions' };
const today = new Date().toISOString().slice(0, 10);

/* ---------- the tricks, both levels ---------- */
const order = [...new Set([...NS.tricksFor('ms'), ...NS.tricksFor('hs')])];
const T = order.map(id => {
  const t = NS.TRICKS[id]; const lvs = ['ms', 'hs'].filter(l => NS.tricksFor(l).includes(id));
  return { id, t, lvs, slug: SLUG[id] || slugOf(t.title), cols: Object.fromEntries(lvs.map(l => [l, NS.trickCol(id, l)])) };
});
{ const seen = new Map(); T.forEach(x => { if (seen.has(x.slug)) x.slug += '-' + x.id.toLowerCase(); seen.set(x.slug, 1); }); }
const BY = Object.fromEntries(T.map(x => [x.id, x]));
const where = x => x.lvs.map(l => `${LV[l]}: problems ${COLR[x.cols[l]]}`);

/* ---------- page frame ---------- */
function page({ rel, file, title, desc, canon, body, ld, cur }) {
  const root = '../'.repeat(rel);
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}${canon}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Eighty in Ten"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${canon}"><meta property="og:image" content="${BASE}icon-512.png">
<link rel="icon" href="${root}favicon.ico" sizes="48x48"><link rel="icon" href="${root}favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#1b1a17" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
<link rel="stylesheet" href="${root}site.css">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head><body>
<header class="top"><div class="wrap"><a class="brand" href="${root}">eighty<i>in</i>ten</a>
<nav aria-label="Main"><a href="${root}tricks/"${cur === 'tricks' ? ' aria-current="page"' : ''}>Tricks</a><a href="${root}practice-tests/"${cur === 'tests' ? ' aria-current="page"' : ''}>Practice tests</a><a class="btn" href="${root}">Open the app</a></nav></div></header>
<main class="wrap">
${body}
</main>
<footer class="foot"><div class="wrap">Eighty in Ten is a free study site for UIL and TMSCA Number Sense. It isn’t affiliated with UIL or TMSCA. Tricks are drawn from <a href="https://bryantheath.com/files/2018/04/Heath_NSTricks_revA.pdf">Bryant Heath’s Number Sense Tricks</a> and <a href="https://www.math-magic.org">Math Magic</a>; problem order follows the <a href="https://www.uiltexas.org/academics/stem/number-sense">UIL sequence chart</a>. For real past tests, see <a href="https://www.uiltexas.org/academics/page/high-school-academic-study-materials">UIL’s study materials</a>.</div></footer>
</body></html>
`;
  const out = path.join(DOCS, file); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
}

/* ---------- a problem, its blank and its answer ---------- */
const LB = '\u0001\\underline{\\phantom{0000}}\u0002';
function probHtml(p, showAns) {
  // a blank inside the problem is the answer blank, as in the print view; one at the very end is just the usual blank
  let h = p.p.h; let blank = true;
  if (h.includes(LB)) { const t = h.trimEnd(); if (t.endsWith(LB)) h = t.slice(0, -LB.length); else { blank = false; h = h.split(LB).join('\u0001\\underline{\\phantom{00000000}}\u0002'); } }
  const tail = `${p.pre ? esc(p.pre) : ''}${blank ? '<span class="blank"></span>' : ''}${p.suffix ? ' ' + esc(p.suffix) : ''}`;
  return `<div class="prob">${p.est ? '* ' : ''}${R(h)} ${tail}</div>${showAns ? `<p class="small" style="margin:6px 0 0">Answer: <span class="ans">${R(NS.keyHtml(p.a))}</span>${p.est ? ' <span class="faint">(within 5% counts)</span>' : ''}</p>` : ''}`;
}
const answerDetails = p => `<details><summary>Show the answer</summary><p class="small" style="margin:6px 0 0"><span class="ans">${R(NS.keyHtml(p.a))}</span>${p.est ? ' <span class="faint">(within 5% counts)</span>' : ''}</p>${p.steps && p.steps.length ? `<ol class="steps">${p.steps.map(s => `<li>${R(s)}</li>`).join('')}</ol>` : ''}</details>`;

/* ---------- one page per trick ---------- */
const urls = [{ loc: '', pri: '1.0' }];
T.forEach((x, i) => {
  const { id, t, lvs } = x; const lvl = lvs[0];
  const ex = NS.problemForTrick(id, lvl, 9101);
  const tries = [0, 1, 2, 3].map(k => NS.problemForTrick(id, lvs[k % lvs.length], 5003 + k * 7919, null, k < 2 ? 'warmup' : 'contest'));
  const unit = NS.UNITS.find(u => u.id === t.unit);
  const sameUnit = T.filter(y => y.t.unit === t.unit && y.id !== id);
  const prev = T[i - 1], next = T[i + 1];
  const tTitle = plain(t.title), tS = plain(t.s);
  const title = `${tTitle}: Number Sense trick | Eighty in Ten`;
  const desc = `How to do it, why it works and practice problems with answers. Use it when: ${tS}`.slice(0, 300);
  const body = `<div class="narrow">
<p class="crumbs"><a href="../">Tricks</a> › ${esc(unit ? unit.name : 'Tricks')}</p>
<h1>${NS.rich(t.title)}</h1>
<ul class="tags">${where(x).map(w => `<li>${w}</li>`).join('')}</ul>
<p class="spot" style="margin-top:16px"><b>Use it when:</b> ${NS.rich(t.s)}</p>
<h2>How to do it</h2>
<ol class="how">${t.how.map(s => `<li>${NS.rich(s)}</li>`).join('')}</ol>
<h2>Worked example</h2>
<div class="card">${probHtml(ex, false)}<ol class="steps">${ex.steps.map(s => `<li>${R(s)}</li>`).join('')}</ol>${ex.steps.some(st => /<mark/.test(st)) ? '' : `<p style="margin:10px 0 0">Answer: <span class="ans">${R(NS.keyHtml(ex.a))}</span></p>`}</div>
<div class="grid2" style="margin-top:22px"><div class="note"><b>Why it works</b>${NS.rich(t.why)}</div><div class="note watch"><b>Watch out</b>${NS.rich(t.watch)}</div></div>
<h2>Try these</h2>
<ol class="try">${tries.map(p => `<li>${probHtml(p, false)}${answerDetails(p)}</li>`).join('')}</ol>
<h2>Practice it with a timer</h2>
<p class="muted">The app gives you new problems of this kind as long as you like, checks each answer and shows the shortcut when you miss.</p>
<div class="row">${lvs.map(l => `<a class="btn${lvs.length > 1 && l === 'hs' ? ' ghost' : ''}" href="../../?level=${l}#t-${id}">Practice this trick${lvs.length > 1 ? ` (${LV[l].toLowerCase()})` : ''}</a>`).join('')}</div>
${sameUnit.length ? `<h2>More ${esc((unit ? unit.name : 'tricks').toLowerCase())}</h2><p>${sameUnit.map(y => `<a href="../${y.slug}/">${NS.rich(y.t.title, true)}</a>`).join(' · ')}</p>` : ''}
<p class="small faint" style="margin-top:28px">${prev ? `← <a href="../${prev.slug}/">${NS.rich(prev.t.title, true)}</a>` : ''}${prev && next ? ' &nbsp;·&nbsp; ' : ''}${next ? `<a href="../${next.slug}/">${NS.rich(next.t.title, true)}</a> →` : ''}</p>
</div>`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'LearningResource', name: tTitle, description: tS, learningResourceType: 'Lesson', educationalLevel: lvs.map(l => LV[l]), teaches: `Number Sense: ${tTitle}`, isAccessibleForFree: true, inLanguage: 'en', url: `${BASE}tricks/${x.slug}/`, isPartOf: { '@type': 'WebSite', name: 'Eighty in Ten', url: BASE } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Tricks', item: `${BASE}tricks/` }, { '@type': 'ListItem', position: 2, name: tTitle, item: `${BASE}tricks/${x.slug}/` }] },
  ];
  page({ rel: 2, file: `tricks/${x.slug}/index.html`, title, desc, canon: `tricks/${x.slug}/`, body, ld, cur: 'tricks' });
  urls.push({ loc: `tricks/${x.slug}/`, pri: '0.6' });
});

/* ---------- the trick index ---------- */
{
  const units = NS.UNITS.map(u => [u, T.filter(x => x.t.unit === u.id)]).filter(([, a]) => a.length);
  const body = `<p class="eyebrow">${T.length} lessons</p>
<h1>Number Sense tricks</h1>
<p class="lede">Every shortcut on the UIL and TMSCA Number Sense tests, for middle school and high school. Each lesson shows when to use the trick, the steps, a worked example and problems to try, with answers.</p>
<p class="small muted">Jump to: ${units.map(([u]) => `<a href="#${u.id}">${esc(u.name)}</a>`).join(' · ')}</p>
${units.map(([u, arr]) => `<h2 id="${u.id}">${esc(u.name)}</h2>
<ul class="tlist">${arr.map(x => `<li><a class="t" href="${x.slug}/">${NS.rich(x.t.title, true)}</a><p>${NS.rich(x.t.s, true)}</p><ul class="tags">${where(x).map(w => `<li>${w}</li>`).join('')}</ul></li>`).join('')}</ul>`).join('\n')}`;
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Number Sense tricks', itemListElement: T.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}tricks/${x.slug}/`, name: plain(x.t.title) })) };
  page({ rel: 1, file: 'tricks/index.html', title: 'Every Number Sense Trick, with Practice Problems | Eighty in Ten', desc: `All ${T.length} UIL and TMSCA Number Sense tricks for middle school and high school: when to use each one, the steps, a worked example and practice problems with answers.`, canon: 'tricks/', body, ld, cur: 'tricks' });
  urls.push({ loc: 'tricks/', pri: '0.9' });
}

/* ---------- the practice-test page ---------- */
{
  const specs = TESTS.map(t => ({ ...t, spec: NS.readTestCode(t.code) }));
  const dname = d => NS.DIFFS[NS.diffIdx(d)].name;
  const rows = specs.map(t => `<tr><td>${LV[t.spec.lv]}</td><td>${dname(t.spec.diff)}</td><td><a href="${t.file}">Download PDF</a></td><td><code>${t.code}</code></td></tr>`).join('');
  const sample = lv => { const t = specs.find(s => s.spec.lv === lv); const probs = NS.buildTest(t.spec.lv, t.spec.seed, t.spec.cols, t.spec.diff).slice(0, 20);
    return `<ol class="sample">${probs.map(p => `<li${p.est ? ' class="star"' : ''}>${probHtml({ ...p, est: false }, false)}${answerDetails(p)}</li>`).join('')}</ol>
<p class="small muted">These are problems 1–20 of the ${LV[lv].toLowerCase()} test with code <code>${t.code}</code>. The full test and its answer key are in the PDF above.</p>`; };
  const colList = lv => `<ul class="cols">${[1, 2, 3, 4].map(c => `<li><b>Problems ${COLR[c]}</b>${T.filter(x => x.cols[lv] === c).map(x => `<a href="../tricks/${x.slug}/">${NS.rich(x.t.title, true)}</a>`).join(' · ')}</li>`).join('')}</ul>`;
  const body = `<div class="narrow">
<p class="eyebrow">Free · online or printed</p>
<h1>UIL Number Sense practice tests</h1>
<p class="lede">Full 80-problem, 10-minute practice tests for UIL and TMSCA Number Sense, for middle school and high school. Take one online with a timer and instant scoring, or print one on letter paper in the UIL layout, with an answer key.</p>
<div class="row" style="margin-bottom:8px"><a class="btn" href="../?level=hs#test">High school test online</a><a class="btn ghost" href="../?level=ms#test">Middle school test online</a></div>
<p class="small faint">Online tests are new every time, at four difficulty levels from Warm-up to Super-hard. A team code lets a whole team take the same test.</p>

<h2>Printable practice tests (PDF)</h2>
<p>Each PDF is a complete test: problems 1–80 on two pages, laid out like a UIL test, then the answer key. To take the same test online, enter its code on the app’s Tests page.</p>
<div class="tablewrap"><table class="tests"><thead><tr><th>Level</th><th>Difficulty</th><th>PDF</th><th>Code</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="small faint">Contest matches a typical TMSCA or UIL invitational. Hard matches Regional and State tests. More printable tests, at any level, come from the app: start a test, then choose Print it.</p>

<h2>How the test works</h2>
<div class="directions"><b>Directions:</b> Do not turn this page until the person conducting this test gives the signal to begin. This is a ten-minute test. There are 80 problems. Solve accurately and quickly as many as you can in the order in which they appear. ALL PROBLEMS ARE TO BE SOLVED MENTALLY. Make no calculations with paper and pencil. Write only the answer in the space provided at the end of each problem. Problems marked with a ( * ) require approximate integral answers; any answer to a starred problem that is within five percent of the exact answer will be scored correct; all other problems require exact answers.</div>
<p>Scoring runs through the last problem you attempt: +5 for each right answer and −4 for each wrong or skipped one, so a skip is never free. Every tenth problem (10, 20, … 80) is a starred estimation problem.</p>

<h2>Sample problems: high school</h2>
${sample('hs')}
<h2>Sample problems: middle school</h2>
${sample('ms')}

<h2>What’s on the test</h2>
<p>Problems get harder as the test goes on, and each part of the test has its own kinds of problems. Every link below is a lesson with practice problems.</p>
<div class="grid2"><div><h3>High school</h3>${colList('hs')}</div><div><h3>Middle school</h3>${colList('ms')}</div></div>
</div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'LearningResource', name: 'UIL Number Sense practice tests', description: 'Free 80-problem UIL and TMSCA Number Sense practice tests for middle school and high school, online or as printable PDFs with answer keys.', learningResourceType: 'Practice test', educationalLevel: ['Middle school', 'High school'], isAccessibleForFree: true, inLanguage: 'en', url: `${BASE}practice-tests/`,
    hasPart: specs.map(t => ({ '@type': 'DigitalDocument', name: `${LV[t.spec.lv]} Number Sense practice test (${dname(t.spec.diff)}), code ${t.code}`, encodingFormat: 'application/pdf', url: `${BASE}practice-tests/${t.file}` })) };
  page({ rel: 1, file: 'practice-tests/index.html', title: 'Free UIL Number Sense Practice Tests (PDF and Online) | Eighty in Ten', desc: 'Free UIL and TMSCA Number Sense practice tests for middle school and high school: printable PDFs with answer keys in the UIL layout, or take one online with a timer and instant scoring.', canon: 'practice-tests/', body, ld, cur: 'tests' });
  urls.push({ loc: 'practice-tests/', pri: '0.9' });
  specs.forEach(t => { if (fs.existsSync(path.join(DOCS, 'practice-tests', t.file))) urls.push({ loc: `practice-tests/${t.file}`, pri: '0.5' }); });
}

/* ---------- shared stylesheet and sitemap ---------- */
fs.copyFileSync(path.join(__dirname, 'site.css'), path.join(DOCS, 'site.css'));
fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${BASE}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`);
console.log(`${T.length} trick pages, ${urls.length} URLs in the sitemap`);
