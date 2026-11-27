/* ===== the app (DOM) ===== */
(function () {
  const S = NS.store; S.load();
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = NS.esc;
  const LV = { ms: 'Middle school', hs: 'High school' };
  const SITE = !!window.EIT_SITE; // the GitHub Pages copy, which also has trick and practice-test pages
  const COLR = { 1: '1–20', 2: '21–40', 3: '41–60', 4: '61–80' };
  const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  if (touch) document.body.classList.add('touch');

  const IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    tricks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h11a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3z"/><path d="M8 9h6M8 13h6"/></svg>',
    practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
    test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4"/></svg>',
    memorize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    aa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19l5-13 5 13M4.8 14.5h6.4"/><path d="M15 12.5a3 3 0 1 1 6 0V19M21 16.5c0 1.6-1.4 2.7-3 2.7s-3-.7-3-2.2c0-1.6 1.5-2.3 3-2.3h3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg>',
  };
  const TABS = [['home', 'Home'], ['tricks', 'Tricks'], ['memorize', 'Memorize'], ['practice', 'Practice'], ['test', 'Tests'], ['progress', 'Progress']];

  /* ---------- shell ---------- */
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="top"><a class="skip-link" href="#main">Skip to content</a><div class="top-in">
      <button class="brand" data-go="home" aria-label="Eighty in Ten, home"><b>eighty<i>in</i>ten</b></button>
      <nav class="nav" aria-label="Main">${TABS.map(([k, l]) => `<button data-go="${k}">${IC[k]}${l}</button>`).join('')}</nav>
      <button class="aa" data-go="display" aria-label="Display and reading settings" title="Display and reading">${IC.aa}</button>
      <button class="lvl" data-act="level" id="lvlbtn" title="Switch level"><span id="lvlname"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    </div></header>
    <main id="main" tabindex="-1"></main>
    <nav class="tabbar" aria-label="Main">${TABS.map(([k, l]) => `<button data-go="${k}">${IC[k]}<span>${l}</span></button>`).join('')}</nav>`);
  const main = $('#main');
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    main.focus();
  });

  const state = { view: null, session: null, test: null, lessonTry: null, pending: null, pickMode: 'practice', pickSet: null, custom: new Set(), sprintLen: 120, testKind: 'full', testCol: 1, exSeed: 1, exShown: 1 };

  /* ---------- helpers ---------- */
  const lv = () => S.data.level;
  const L = () => S.lv();
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); }
  const strip = h => h.replace(/<[^>]+>/g, ' ');
  const R = (x, d) => NS.render(x, { display: !!d });
  const isLong = p => { const t = strip(p.p.h.replace(/\u0001[^\u0002]*\u0002/g, ' 1 ')).replace(/\b(log|sin|cos|tan|lim|mod|dx)\b/g, ''); return /[a-z]{3,}/.test(t) || t.length > 48; };
  function blankHtml(p, attrs = '') {
    const inm = touch ? 'none' : (p.a.type === 'text' ? 'text' : 'text');
    return `<span class="blank">${p.pre ? `<span class="suffix">${esc(p.pre)}</span>` : ''}<input class="ans" ${attrs} autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="${inm}" aria-label="Your answer">${p.suffix ? `<span class="suffix">${esc(p.suffix)}</span>` : ''}${p.form ? `<span class="formhint">${esc(p.form)}</span>` : ''}</span>`;
  }
  function previewOf(v) {
    const t = String(v).trim(); if (!/\//.test(t)) return '';
    const m = /^(-?)(\d+)[ _](\d+)\/(\d+)$/.exec(t); if (m) return NS.tex(`${m[1] ? '-' : ''}${m[2]}\\frac{${m[3]}}{${m[4]}}`);
    const f = /^(-?)(\d+)\/(\d+)$/.exec(t); if (f) return NS.tex(`${f[1] ? '-' : ''}\\frac{${f[2]}}{${f[3]}}`);
    return '';
  }
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const trickName = id => NS.TRICKS[id].title;
  const pillFor = (st, quiet) => (quiet && st.key === 'new' ? '' : `<span class="pill ${st.key}">${st.label}${st.acc !== null && st.key !== 'new' ? ` · ${Math.round(st.acc * 100)}%` : ''}</span>`) + (st.hard ? '<span class="pill hardok" title="80% or better on Hard problems">Hard ✓</span>' : '');
  /* ---------- difficulty ---------- */
  const DIFF_AUTO = { id: 'auto', name: 'Auto', blurb: 'Starts at Contest and adjusts as you go: four quick right answers in a row move you up a level, misses move you down.' };
  const diffOf = id => (id === 'auto' ? DIFF_AUTO : NS.DIFFS[NS.diffIdx(id)]);
  const diffSeg = (act, cur, withAuto) => `<div class="seg diffseg" role="group" aria-label="Difficulty">${(withAuto ? [DIFF_AUTO, ...NS.DIFFS] : NS.DIFFS).map(d => `<button data-act="${act}" data-d="${d.id}" aria-pressed="${cur === d.id}">${d.name}</button>`).join('')}</div><p class="small muted diffnote">${diffOf(cur).blurb}</p>`;
  const diffChip = (id, extra = '') => `<span class="dchip d-${id}">${diffOf(id).name}${extra}</span>`;
  function newSeed() { return NS.newSeed(); }

  /* keypad: extra keys depend on the kind of answer */
  function extraKeys(p) {
    if (!p) return [];
    if (p.a.type === 'text') {
      if (p.a.kind === 'roman') return ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
      if (p.a.kind === 'complex') return ['i', '+', '−'];
      if (p.a.kind === 'ratio') return [':'];
      if (p.a.kind === 'base') return /[A-F]/.test(p.a.v) ? ['A', 'B', 'C', 'D', 'E', 'F'] : [];
    }
    return [];
  }
  function keypadHtml(p, nav) {
    const ex = extraKeys(p);
    return `<div class="keypad" role="group" aria-label="Keypad">
      ${nav ? `<div class="extra"><button type="button" class="fn" data-key="prev">↑ Previous</button>${ex.map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" class="fn" data-key="next">Next ↓</button></div>` : ''}
      ${!nav && ex.length ? `<div class="extra">${ex.map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>` : ''}
      ${['7', '8', '9'].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" class="fn" data-key="back" aria-label="Delete">⌫</button>
      ${['4', '5', '6'].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" data-key="/">/</button>
      ${['1', '2', '3'].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" data-key="-">−</button>
      <button type="button" data-key="0">0</button><button type="button" data-key=".">.</button><button type="button" class="fn" data-key=" " aria-label="Space, for mixed numbers">space</button><button type="button" class="enter" data-key="enter">Enter</button>
    </div>`;
  }
  let activeInput = null;
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('ans')) activeInput = e.target; });
  document.addEventListener('pointerdown', e => { if (e.target.closest('.keypad')) e.preventDefault(); }); // keep focus in the input
  document.addEventListener('click', e => {
    const k = e.target.closest('[data-key]'); if (!k) return;
    const inp = activeInput && document.body.contains(activeInput) ? activeInput : $('.ans:not([disabled])'); if (!inp) return;
    const key = k.dataset.key;
    if (key === 'enter' || key === 'next') { inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return; }
    if (key === 'prev') { inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); return; }
    if (inp.disabled) return;
    if (key === 'back') inp.value = inp.value.slice(0, -1); else inp.value += key === '−' ? '-' : key;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });

  /* ---------- routing ---------- */
  function go(view, arg) { const h = arg ? `${view}-${arg}` : view; if (location.hash.slice(1) === h) route(); else location.hash = h; }
  function guard(fn) {
    if (state.test && !state.test.done) { confirmBar('Leave this test? Your answers will be lost.', 'Leave test', () => { stopTest(); fn(); }); return; }
    if (state.session && !state.session.done) { endSession(true); }
    if (state.session && state.session.done) state.session = null;
    if (state.test && state.test.done) state.test = null;
    fn();
  }
  function confirmBar(msg, yes, onYes) {
    const old = $('#confirmbar'); if (old) old.remove();
    const d = document.createElement('div'); d.id = 'confirmbar'; d.className = 'confirm'; d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 70px);z-index:70;box-shadow:var(--shadow);max-width:calc(100% - 32px)';
    d.innerHTML = `<b>${esc(msg)}</b><button class="btn small" data-c="y">${esc(yes)}</button><button class="btn small ghost" data-c="n">Keep going</button>`;
    d.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (!c) return; d.remove(); if (c.dataset.c === 'y') onYes(); });
    document.body.appendChild(d); $('[data-c="n"]', d).focus();
  }
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); guard(() => go(g.dataset.go, g.dataset.arg)); return; }
    const a = e.target.closest('[data-act]'); if (a) { const fn = ACT[a.dataset.act]; if (fn) { e.preventDefault(); fn(a.dataset, a); } }
  });
  window.addEventListener('hashchange', route);

  function setNav(v) {
    $$('[data-go]').forEach(b => { if (b.closest('.nav,.tabbar')) b.setAttribute('aria-current', b.dataset.go === v ? 'page' : 'false'); });
    $('#lvlname').textContent = lv() ? LV[lv()] : 'Choose level';
    document.body.classList.toggle('in-session', !!(state.session && !state.session.done) || !!(state.test && !state.test.done) || !!(state.memo && !state.memo.done));
    document.body.classList.toggle('nolevel', !lv());
  }
  function route() {
    const h = location.hash.slice(1) || 'home';
    if ((!lv() && h !== 'display' && !h.startsWith('print-')) || h === 'level') { if (h !== 'level' && h !== 'home') state.afterLevel = h; return viewLevel(); }
    const [v, ...rest] = h.split('-'); const arg = rest.join('-');
    if (state.session && !state.session.done && v !== 'practice' && v !== 't') endSession(true);
    state.view = v;
    if (state.memo && v !== 'memorize') state.memo = null;
    const views = { home: viewHome, tricks: viewTricks, t: () => viewLesson(arg), memorize: () => viewMemorize(arg), practice: viewPractice, test: viewTests, progress: viewProgress, print: () => viewPrint(arg), display: viewDisplay };
    (views[v] || viewHome)();
    setNav(v === 't' ? 'tricks' : v === 'print' ? 'test' : v);
    { const aa = $('.aa'); if (aa) aa.setAttribute('aria-current', v === 'display' ? 'page' : 'false'); }
    if (!state.keepScroll) window.scrollTo(0, 0); state.keepScroll = false;
  }

  /* ---------- level picker ---------- */
  function viewLevel() {
    setNav(''); document.body.classList.remove('in-session');
    const ms = NS.makeProblem('sameFront', 'ms', 31), hs = NS.makeProblem('logs', 'hs', 12);
    main.innerHTML = `<section class="welcome">
      <h1>Choose your practice level</h1>
      <p class="lede">Practice UIL and TMSCA Number Sense with lessons, timed drills and full tests.</p>
      <div class="grid2" style="margin-top:22px">
        <button class="pick" data-act="setLevel" data-lv="ms"><span class="lvtag">Grades 6–8</span><h2>Middle school</h2><span class="muted">TMSCA middle school and UIL A+ junior high.</span><span class="sample">${R(ms.p.h, true)} <span class="sample-a">${R(NS.keyHtml(ms.a), true)}</span></span></button>
        <button class="pick" data-act="setLevel" data-lv="hs"><span class="lvtag">Grades 9–12</span><h2>High school</h2><span class="muted">UIL and TMSCA high school, through calculus.</span><span class="sample">${R(hs.p.h, true)} <span class="sample-a">${R(NS.keyHtml(hs.a), true)}</span></span></button>
      </div>
      <p class="faint small" style="margin-top:16px">Switch levels at any time. Your progress is saved in this browser.</p>
      ${SITE ? '<p class="small" style="margin-top:10px"><a href="tricks/">Browse every trick</a> · <a href="practice-tests/">Printable practice tests</a></p>' : ''}
    </section>`;
  }

  /* ---------- home ---------- */
  function viewHome() {
    const l = lv(); const ids = NS.tricksFor(l);
    const st = ids.map(id => NS.trickStatus(id, l).key);
    const cnt = k => st.filter(x => x === k).length;
    const next = NS.nextTrick(l); const nt = NS.TRICKS[next];
    const ex = NS.problemForTrick(next, l, 4242);
    const streak = NS.streak(l); const today = L().days[NS.today()] || 0;
    const weak = NS.weakTricks(l); const fulls = L().tests.filter(t => t.kind === 'full');
    const best = fulls.length ? Math.max(...fulls.map(t => t.score)) : null;
    const nextDone = L().tricks[next] && L().tricks[next].lesson;
    const facts = [today ? `${today} problem${today === 1 ? '' : 's'} today` : 'Nothing yet today', streak > 1 ? `${streak}-day streak` : '', best !== null ? `best full test ${best}` : ''].filter(Boolean).join(' · ');
    const misses = L().misses.filter(m => NS.GBY[m.g]).length;
    main.innerHTML = `
      <div class="hello"><h1>Today</h1><p class="muted">${facts}</p></div>
      <div class="card next">
        <div class="l"><p class="eyebrow">${nextDone ? 'Keep working on' : 'Up next'} · problems ${COLR[NS.trickCol(next, l)]}</p><h2>${NS.rich(nt.title)}</h2><p class="muted">${NS.rich(nt.s)}</p>
          <div class="row" style="margin-top:6px"><button class="btn" data-go="t" data-arg="${next}">${nextDone ? 'Review the lesson' : 'Learn it'}</button><button class="btn ghost" data-act="drillTrick" data-id="${next}">Practice it</button></div></div>
        <div class="r"><p class="faint small">Looks like this</p><div class="ex${isLong(ex) ? ' long' : ''}">${R(ex.p.h, true)}</div></div>
      </div>
      <div class="sect"><div class="sect-h" style="border-bottom:0;padding-bottom:0"><h2>Other ways to practice</h2></div>
        <div class="list">
          <button class="li" data-act="quickSprint"><span><b>Two-minute sprint</b><span class="muted">Problems 1–20 against the clock. Right answers move on by themselves.</span></span><span class="arr">→</span></button>
          <button class="li" data-act="quickArith"><span><b>Arithmetic warm-up</b><span class="muted">Two minutes of addition, subtraction, multiplication and division.</span></span><span class="arr">→</span></button>
          <button class="li" data-act="quickEst"><span><b>Estimation drill</b><span class="muted">Ten starred problems. Enter an integer within 5%.</span></span><span class="arr">→</span></button>
          <button class="li" data-act="quickWeak"><span><b>${weak.length ? 'Weak spots' : misses ? 'Problems you missed' : 'Weak spots'}</b><span class="muted">${weak.length ? `${weak.length} trick${weak.length > 1 ? 's' : ''} under 85%, starting with ${NS.rich(trickName(weak[0]))}.` : misses ? `${misses} problem${misses > 1 ? 's' : ''} waiting to be redone.` : 'Nothing yet. Tricks you miss will be listed here.'}</span></span><span class="arr">→</span></button>
          <button class="li" data-act="memoMix"><span><b>Facts drill</b><span class="muted">Twenty quick cards: squares, cubes, fractions, triples and more.</span></span><span class="arr">→</span></button>
          <button class="li" data-go="test"><span><b>Full practice test</b><span class="muted">80 problems, 10 minutes, scored like a contest.</span></span><span class="arr">→</span></button>
        </div></div>
      <div class="duo">
        <div class="sect"><div class="sect-h"><h2>Your tricks</h2><button class="btn link" data-go="tricks">All ${ids.length} →</button></div>
          <div>${statusBar(cnt, ids.length)}</div></div>
        <div class="sect"><div class="sect-h"><h2>Full tests</h2><button class="btn link" data-go="${fulls.length >= 2 ? 'progress' : 'test'}">${fulls.length >= 2 ? 'Progress' : 'Take one'} →</button></div>
          ${fulls.length >= 2 ? chartSvg(fulls.slice(-12).map(t => t.score), 400) : `<p class="muted">${fulls.length ? `One so far: ${fulls[0].score} out of 400. Your scores show up here as a chart after the second.` : 'No full tests yet. Try one full test a week, with single columns in between.'}</p>`}</div>
      </div>
      ${footer()}`;
  }
  function statusBar(cnt, n) {
    const segs = [['fast', 'var(--ok)', 'Fast'], ['solid', 'var(--blue)', 'Accurate'], ['learning', 'var(--warn)', 'Learning'], ['new', 'var(--line-2)', 'Not started']];
    return `<div class="bar">${segs.map(([k, c]) => cnt(k) ? `<span style="width:${cnt(k) / n * 100}%;background:${c}"></span>` : '').join('')}</div>
      <div class="legend">${segs.map(([k, c, l]) => `<span><i style="background:${c}"></i>${l}: <b class="num">${cnt(k)}</b></span>`).join('')}</div>
      <p class="faint small" style="margin-top:10px">Accurate means 85% or better on your last 12 tries at Contest level. Fast means accurate and quick enough for a real test.</p>`;
  }
  function footer() {
    return `<footer class="foot"><span>Tricks drawn from <a href="https://bryantheath.com/files/2018/04/Heath_NSTricks_revA.pdf" target="_blank" rel="noopener">Bryant Heath’s Number Sense Tricks</a> and <a href="https://www.math-magic.org" target="_blank" rel="noopener">Math Magic</a>. Problem order follows the <a href="https://www.uiltexas.org/academics/stem/number-sense" target="_blank" rel="noopener">UIL sequence chart</a>. Problems here are generated fresh; for real past tests, see <a href="https://www.uiltexas.org/academics/page/high-school-academic-study-materials" target="_blank" rel="noopener">UIL’s study materials</a>.</span>
      <span class="row" style="gap:14px">${SITE ? '<a href="tricks/">Trick library</a><a href="practice-tests/">Printable tests</a>' : ''}<button data-go="display">Display and reading</button><button data-act="level">Switch level</button></span></footer>`;
  }

  /* ---------- tricks list ---------- */
  function viewTricks() {
    const l = lv(); const ids = NS.tricksFor(l); const next = NS.nextTrick(l);
    const f = state.trickFilter || 'all';
    const groups = [1, 2, 3, 4].map(c => [c, ids.filter(id => NS.trickCol(id, l) === c)]).filter(([, a]) => a.length);
    main.innerHTML = `<header class="pagehead" style="margin-bottom:0"><p class="eyebrow">${LV[l]}</p><h1>Tricks</h1>
      <p class="lede">Grouped by where they show up on the test. Each lesson takes a few minutes: the idea, a worked example, then five to try.</p></header>
      <div class="filters">${[['all', 'All'], ['new', 'Not started'], ['learning', 'Learning'], ['solid', 'Accurate'], ['fast', 'Fast']].map(([k, n]) => `<button class="chip" data-act="tfilter" data-f="${k}" aria-pressed="${f === k}">${n}</button>`).join('')}</div>
      ${groups.map(([c, arr]) => { const shown = arr.filter(id => f === 'all' || NS.trickStatus(id, l).key === f); if (!shown.length) return '';
        return `<div class="colhead"><h2>Problems <span class="rng">${COLR[c]}</span></h2><span class="faint small">${shown.length} trick${shown.length > 1 ? 's' : ''}</span></div>
        <div class="tlist">${shown.map(id => { const t = NS.TRICKS[id]; const st = NS.trickStatus(id, l);
          return `<button class="titem${id === next ? ' isnext' : ''}" data-go="t" data-arg="${id}"><h3>${NS.rich(t.title)}</h3><span class="stc">${id === next && st.key === 'new' ? '<span class="pill upnext">Up next</span>' : pillFor(st, true)}</span><p>${NS.rich(t.s)}</p></button>`; }).join('')}</div>`; }).join('')}
      ${footer()}`;
  }

  /* ---------- lesson ---------- */
  function viewLesson(id) {
    const l = lv(); const t = NS.TRICKS[id];
    if (!t || !NS.gensFor(id, l).length) return go('tricks');
    if (state.lessonId !== id) { state.lessonId = id; state.exSeed = 101; state.exShown = 0; state.lessonTry = null; }
    const st = NS.trickStatus(id, l); const c = NS.trickCol(id, l);
    const ids = NS.tricksFor(l); const nextId = ids[ids.indexOf(id) + 1];
    main.innerHTML = `<button class="back" data-go="tricks">${IC.left} All tricks</button>
      <div class="lesson" style="margin-top:12px">
        <article class="stack">
          <div><div class="row" style="gap:14px"><p class="eyebrow">Problems ${COLR[c]}</p>${pillFor(st, true)}</div><h1 style="margin-top:6px">${NS.rich(t.title)}</h1><p class="spot"><b>Use it when:</b> ${NS.rich(t.s)}</p><button class="btn ghost small jump" data-act="jumpTry">Try five now ↓</button></div>
          <section class="lsec"><h3>How</h3><ol class="how">${t.how.map(s => `<li><span>${NS.rich(s)}</span></li>`).join('')}</ol></section>
          <div class="card example" id="example"></div>
          <div class="grid2" style="gap:24px"><div class="note why"><b>Why it works</b>${NS.rich(t.why)}</div><div class="note watch"><b>Watch out</b>${NS.rich(t.watch)}</div></div>
          ${nextId ? `<p class="faint small">Next in the list: <button class="btn link" data-go="t" data-arg="${nextId}">${NS.rich(trickName(nextId))} →</button></p>` : ''}
        </article>
        <aside class="sticky"><div class="card" id="tryit"></div></aside>
      </div>`;
    renderExample(id); renderTry(id);
  }
  function renderExample(id) {
    const l = lv(); const p = NS.problemForTrick(id, l, 9000 + state.exSeed); const box = $('#example'); if (!box) return;
    const n = state.exShown; const all = n >= p.steps.length;
    box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Worked example</h3><button class="btn link" data-act="exNew">Another example</button></div>
      <div class="exq ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)} <span class="faint">${p.pre ? esc(p.pre) : ''}${n && all ? `<b style="color:var(--ink)">${R(NS.keyHtml(p.a), true)}</b>` : '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>'}${p.suffix ? ' ' + esc(p.suffix) : ''}</span></div>
      ${n === 0 ? '<p class="muted small" style="margin-bottom:12px">Work it in your head first, then step through the shortcut.</p>' : ''}
      <ol class="steps">${p.steps.slice(0, n).map(s => `<li>${R(s, true)}</li>`).join('')}</ol>
      <div class="row" style="margin-top:12px">${all ? '' : `<button class="btn small ghost" data-act="exStep">${n === 0 ? 'Show the first step' : 'Next step'}</button>${n > 0 ? '<button class="btn link" data-act="exAll">Show all</button>' : ''}`}</div>`;
  }
  function renderTry(id) {
    const box = $('#tryit'); if (!box) return; const l = lv();
    let T = state.lessonTry;
    if (!T || T.id !== id) T = state.lessonTry = { id, i: 0, right: 0, seed: newSeed(), p: null, wrong: false, hint: false, done: false };
    if (T.done) {
      const t = S.trick(id); t.lesson = true; S.save();
      const ids = NS.tricksFor(l); const nextId = ids[ids.indexOf(id) + 1];
      box.innerHTML = `<p class="eyebrow">Try it</p><h3 style="margin:4px 0 10px">${T.right} of 5 right</h3>
        <p class="muted small">${T.right === 5 ? 'All five right. A round of 20 will help you get faster.' : T.right >= 3 ? 'In a practice round, each miss shows the shortcut for that problem.' : 'Read the steps once more, then try a round. Every miss shows the shortcut for that problem.'}</p>
        <div class="stack" style="margin-top:14px;gap:8px"><button class="btn" data-act="drillTrick" data-id="${id}">Practice 20 of these</button>${nextId ? `<button class="btn ghost" data-go="t" data-arg="${nextId}">Next trick: ${NS.rich(trickName(nextId))}</button>` : ''}<button class="btn link" data-act="tryAgain">Try 5 more</button></div>`;
      return;
    }
    if (!T.p) { T.p = NS.problemForTrick(id, l, T.seed + T.i * 7919, T.lastG, T.i < 2 ? 'warmup' : 'contest'); T.lastG = T.p.gid; T.start = performance.now(); T.wrong = false; T.hint = false; }
    const p = T.p;
    box.innerHTML = `<div class="row" style="justify-content:space-between"><p class="eyebrow">Try it · ${T.i + 1} of 5 · ${T.i < 2 ? 'Warm-up' : 'Contest'}</p><span class="tally"><span class="g">✓ ${T.right}</span></span></div>
      <div class="prob ${isLong(p) ? 'long' : ''}" style="text-align:center;font-size:1.5rem;margin:18px 0 14px">${R(p.p.h, true)}</div>
      <div style="text-align:center;font-size:1.4rem">${blankHtml(p, 'id="tryin"')}</div>
      <div class="preview" id="trypv" style="text-align:center"></div>
      <div class="feedback" id="tryfb" aria-live="polite" style="text-align:center"></div>
      <div id="tryhow"></div>
      ${keypadHtml(p)}
      <div class="under"><button class="btn small" data-act="trySubmit">Check <span class="kbd">Enter</span></button><button class="btn small ghost" data-act="tryHint">Show steps</button></div>`;
    const inp = $('#tryin');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACT.trySubmit(); } });
    inp.addEventListener('input', () => { $('#trypv').innerHTML = previewOf(inp.value); });
    if (!touch || state.view === 't') setTimeout(() => { if (!touch) inp.focus({ preventScroll: true }); }, 30);
  }

  /* ---------- practice setup ---------- */
  function practiceSets(l) {
    const ids = NS.tricksFor(l); const learned = ids.filter(id => { const t = L().tricks[id]; return t && (t.lesson || t.n); });
    const next = NS.nextTrick(l); const weak = NS.weakTricks(l); const sets = [];
    sets.push({ k: 'next', name: `Up next: ${trickName(next)}`, d: 'The trick you’re on right now.', tricks: [next] });
    if (weak.length) sets.push({ k: 'weak', name: 'Weak spots', d: `${weak.slice(0, 3).map(trickName).join(', ')}${weak.length > 3 ? '…' : ''}`, tricks: weak });
    if (L().misses.length) sets.push({ k: 'misses', name: `Redo my misses (${L().misses.length})`, d: 'The exact problems you got wrong, then more like them.', tricks: [...new Set(L().misses.map(m => NS.GBY[m.g] && NS.GBY[m.g].trick).filter(Boolean))], misses: true });
    if (learned.length >= 2) sets.push({ k: 'learned', name: 'Everything I’ve started', d: `${learned.length} tricks, mixed.`, tricks: learned });
    [1, 2, 3, 4].forEach(c => { let arr = ids.filter(id => NS.trickCol(id, l) === c); if (arr.length < 4) arr = ids.filter(id => NS.trickCol(id, l) >= c - 1 && NS.trickCol(id, l) <= c); if (arr.length) sets.push({ k: 'c' + c, name: `Problems ${COLR[c]}`, d: `${arr.length} tricks from this part of the test.`, tricks: arr }); });
    sets.push({ k: 'est', name: 'Starred estimation', d: 'Only the * problems. Enter an integer within 5%.', tricks: ['estimate'] });
    sets.push({ k: 'custom', name: 'Choose tricks…', d: state.custom.size ? `${state.custom.size} selected.` : 'Pick exactly what to drill.', tricks: [...state.custom] });
    return sets;
  }
  const BEH = {
    normal: ['Normal', 'Press Enter to check each answer.'],
    noenter: ['No Enter', 'Right answers move on by themselves. Press Enter only to give up on one.'],
    hardcore: ['Hardcore', 'One miss ends the run. Your longest streak is saved.'],
    test: ['Test', 'No right or wrong until the end, like a real test. Press Enter to move on.'],
  };
  const exCache = new Map();
  function sampleHtml(id, l) {
    const k = l + ':' + id; if (!exCache.has(k)) { const p = NS.problemForTrick(id, l, 4243); exCache.set(k, `${R(p.p.h)}${p.suffix ? ' ' + esc(p.suffix) : ''}`); }
    return exCache.get(k);
  }
  function arithCfg() { return NS.arithClean(S.data.settings.arith) || JSON.parse(JSON.stringify(NS.ARITH_DEF)); }
  function arithBest(a, dur) { const b = L().best; return (b && b.ar && b.ar[NS.arithKey(a, dur)]) || 0; }
  function arithSetup() {
    const a = arithCfg(); const best = arithBest(a, state.sprintLen);
    const on = c => a.ops.includes(c);
    const rngIn = (key, i, lbl) => `<input class="field rin" type="number" inputmode="numeric" min="${key === 'mul' ? 1 : 0}" max="9999" value="${a[key][i]}" data-ar="${key}" data-i="${i}" aria-label="${lbl}">`;
    return `<div class="cfg-row"><span class="cfg-l">Length</span><div class="cfg-v"><div class="seg" role="group" aria-label="Length">${[[60, '1 min'], [120, '2 min'], [300, '5 min']].map(([sec, nm]) => `<button data-act="plen" data-s="${sec}" aria-pressed="${state.sprintLen === sec}">${nm}</button>`).join('')}</div>
        <p class="note-s" id="arbest">${best ? `Your best with these settings: <b>${best}</b>.` : 'Your best score for these settings shows here.'}</p></div></div>
      <div class="cfg-row"><span class="cfg-l">Problems</span><div class="cfg-v arith">
        <div class="arow"><button class="chip" data-act="arop" data-op="+" aria-pressed="${on('+')}">Addition</button><span class="rng"><span class="pair">${rngIn('add', 0, 'Addition: first number from')}<span>to</span>${rngIn('add', 1, 'Addition: first number to')}</span><span class="op">+</span><span class="pair">${rngIn('add', 2, 'Addition: second number from')}<span>to</span>${rngIn('add', 3, 'Addition: second number to')}</span></span></div>
        <div class="arow"><button class="chip" data-act="arop" data-op="-" aria-pressed="${on('-')}">Subtraction</button><span class="muted small">Addition problems in reverse</span></div>
        <div class="arow"><button class="chip" data-act="arop" data-op="x" aria-pressed="${on('x')}">Multiplication</button><span class="rng"><span class="pair">${rngIn('mul', 0, 'Multiplication: first number from')}<span>to</span>${rngIn('mul', 1, 'Multiplication: first number to')}</span><span class="op">×</span><span class="pair">${rngIn('mul', 2, 'Multiplication: second number from')}<span>to</span>${rngIn('mul', 3, 'Multiplication: second number to')}</span></span></div>
        <div class="arow"><button class="chip" data-act="arop" data-op="/" aria-pressed="${on('/')}">Division</button><span class="muted small">Multiplication problems in reverse</span></div>
        <p class="note-s" id="armsg">${a.ops === NS.ARITH_DEF.ops && a.add.join() === NS.ARITH_DEF.add.join() && a.mul.join() === NS.ARITH_DEF.mul.join() ? 'The usual warm-up ranges.' : '<button class="btn link small" data-act="arreset">Back to the usual ranges</button>'}</p></div></div>`;
  }
  function viewPractice() {
    if (state.session && !state.session.done) return renderSession();
    if (state.session && state.session.done && state.session.showSummary) return renderSummary();
    const l = lv(); const sets = practiceSets(l); if (!state.pickDiff) state.pickDiff = S.data.settings.pdiff || 'auto';
    if (!state.pickBeh) state.pickBeh = S.data.settings.pbeh || 'normal'; if (!state.pickLen) state.pickLen = S.data.settings.plen || 20;
    if (!state.pickSet || !sets.find(s => s.k === state.pickSet)) state.pickSet = sets[0].k;
    const cur = sets.find(s => s.k === state.pickSet); const mode = state.pickMode; const arith = mode === 'arith';
    const ids = NS.tricksFor(l);
    const behKeys = mode === 'sprint' ? ['normal', 'hardcore', 'test'] : ['normal', 'noenter', 'hardcore', 'test'];
    const beh = behKeys.includes(state.pickBeh) ? state.pickBeh : 'normal';
    const best = (L().best || {}).hc || 0;
    const modeHint = mode === 'sprint' ? 'As many as you can before time runs out. Right answers move on by themselves.' : arith ? 'Addition, subtraction, multiplication and division against the clock. Right answers move on by themselves.' : `${beh === 'hardcore' ? 'No set length' : `${state.pickLen} problems`}, no clock. Miss one and you see how to do that exact problem fast.`;
    const behNote = mode === 'sprint' && beh === 'normal' ? 'Right answers move on by themselves.' : BEH[beh][1] + (beh === 'hardcore' && best ? ` Your best streak: <b>${best}</b>.` : '');
    main.innerHTML = `<div class="setup"><header class="pagehead"><p class="eyebrow">${LV[l]}</p><h1>Practice</h1></header>
      <div class="cfg">
        <div class="cfg-row"><span class="cfg-l">Mode</span><div class="cfg-v"><div class="row" style="gap:8px"><div class="seg" role="group" aria-label="Mode"><button data-act="pmode" data-m="practice" aria-pressed="${mode === 'practice'}">Practice round</button><button data-act="pmode" data-m="sprint" aria-pressed="${mode === 'sprint'}">Sprint</button><button data-act="pmode" data-m="arith" aria-pressed="${arith}">Arithmetic</button></div>
          ${mode === 'sprint' ? `<div class="seg" role="group" aria-label="Sprint length">${[[60, '1 min'], [120, '2 min'], [300, '5 min']].map(([sec, nm]) => `<button data-act="plen" data-s="${sec}" aria-pressed="${state.sprintLen === sec}">${nm}</button>`).join('')}</div>` : ''}
          ${mode === 'practice' && beh !== 'hardcore' ? `<div class="seg" role="group" aria-label="Round length">${[10, 20, 40, 80].map(n => `<button data-act="prlen" data-n="${n}" aria-pressed="${state.pickLen === n}">${n}</button>`).join('')}</div>` : ''}</div>
          <p class="note-s">${modeHint}</p></div></div>
        ${arith ? arithSetup() : `
        <div class="cfg-row"><span class="cfg-l">Answering</span><div class="cfg-v"><div class="seg" role="group" aria-label="Answering">${behKeys.map(k => `<button data-act="pbeh" data-b="${k}" aria-pressed="${beh === k}">${BEH[k][0]}</button>`).join('')}</div><p class="note-s">${behNote}</p></div></div>
        <div class="cfg-row"><span class="cfg-l">Difficulty</span><div class="cfg-v">${diffSeg('pdiff', state.pickDiff, true)}</div></div>
        ${cur.tricks.length > 1 ? `<div class="cfg-row"><span class="cfg-l">Trick names</span><div class="cfg-v"><button class="switch" role="switch" aria-checked="${!!S.data.settings.names}" data-act="names"><span class="sw" aria-hidden="true"></span><span class="swt"><span>${S.data.settings.names ? 'Shown on each problem.' : 'Hidden, like a real test. You spot the trick; the name shows after you answer.'}</span></span></button></div></div>` : ''}`}
      </div>
      ${arith ? '' : `<h2 class="label">Problems from</h2>
      <div class="opts" role="group" aria-label="Problems from">${sets.map(st => `<button class="opt" data-act="pset" data-k="${st.k}" aria-pressed="${st.k === state.pickSet}"><b>${NS.rich(st.name)}</b><span>${NS.rich(st.d)}</span></button>`).join('')}</div>
      ${state.pickSet === 'custom' ? `<div class="picker" id="picker">${[1, 2, 3, 4].map(c => { const arr = ids.filter(id => NS.trickCol(id, l) === c); return arr.length ? `<h4>Problems ${COLR[c]}</h4>${arr.map(id => `<label><input type="checkbox" data-trick="${id}" ${state.custom.has(id) ? 'checked' : ''}><span class="pk"><span class="pkn">${NS.rich(trickName(id))}</span><span class="pke" aria-hidden="true">${sampleHtml(id, l)}</span></span></label>`).join('')}` : ''; }).join('')}</div>` : ''}`}
      <div class="row startbar"><button class="btn" data-act="startPractice" ${arith || cur.tricks.length ? '' : 'disabled'}>Start ${arith ? 'warm-up' : mode === 'sprint' ? 'sprint' : 'round'} <span class="kbd">Enter</span></button>${arith || cur.tricks.length ? '' : '<span class="faint small">Pick at least one trick.</span>'}</div>
      </div>${footer()}`;
    const pk = $('#picker'); if (pk) pk.addEventListener('change', e => { const id = e.target.dataset.trick; if (!id) return; if (e.target.checked) state.custom.add(id); else state.custom.delete(id); const keep = pk.scrollTop; state.keepScroll = true; viewPractice(); const p2 = $('#picker'); if (p2) p2.scrollTop = keep; });
    $$('input[data-ar]').forEach(inp => inp.addEventListener('change', () => {
      const a = arithCfg(); const v = Math.max(+inp.min, Math.min(9999, Math.round(+inp.value || 0))); a[inp.dataset.ar][+inp.dataset.i] = v;
      const r = a[inp.dataset.ar]; if (r[0] > r[1]) [r[0], r[1]] = [r[1], r[0]]; if (r[2] > r[3]) [r[2], r[3]] = [r[3], r[2]];
      S.data.settings.arith = a; S.save(); $$('input[data-ar]').forEach(x => { x.value = a[x.dataset.ar][+x.dataset.i]; });
      const b = arithBest(a, state.sprintLen); $('#arbest').innerHTML = b ? `Your best with these settings: <b>${b}</b>.` : 'Your best score for these settings shows here.';
      $('#armsg').innerHTML = '<button class="btn link small" data-act="arreset">Back to the usual ranges</button>';
    }));
  }

  /* ---------- practice session ---------- */
  function startSession(opts) {
    const l = lv(); const arith = opts.mode === 'arith';
    const dsel = opts.diff || state.pickDiff || 'auto'; const beh = arith ? 'normal' : opts.beh || 'normal';
    const auto = dsel === 'auto' && !arith && beh !== 'test';
    // Auto starts at Contest, or at Warm-up when every trick in the round is still new
    const startDi = dsel === 'auto' ? (opts.tricks.length && opts.tricks.every(id => NS.trickStatus(id, l).key === 'new') ? 0 : 1) : NS.diffIdx(dsel);
    const total = opts.mode === 'practice' ? (beh === 'hardcore' ? null : opts.len || 20) : null;
    state.session = { mode: opts.mode, beh, tricks: opts.tricks, label: opts.label, lv: l, total, len: opts.len || 20, dur: opts.dur || 120, arith: opts.arith || null, results: [], r: new NS.Rng(newSeed()), queue: opts.queue || [], startAt: performance.now(), done: false, state: 'ask', last: null, auto, autoSel: dsel === 'auto', di: startDi, di0: startDi, diMax: startDi, hist: [], moved: 0, streak: 0 };
    if (location.hash.slice(1) !== 'practice') { state.silent = true; location.hash = 'practice'; }
    setNav('practice'); nextProblem();
  }
  const timed = s => s.mode === 'sprint' || s.mode === 'arith';
  function nextProblem() {
    const s = state.session; if (!s) return;
    if (s.over || (s.total && s.results.length >= s.total)) return finishSession();
    let p;
    if (s.mode === 'arith') p = NS.arithProblem(s.arith, s.r);
    else {
      while (s.queue.length && !NS.GBY[s.queue[0].g]) s.queue.shift();
      const due = (s.retry || []).findIndex(x => s.results.length >= x.due);
      const dname = NS.DIFFS[s.di].id;
      if (!s.queue.length && due >= 0) { const tr = s.retry.splice(due, 1)[0].trick; p = NS.problemForTrick(tr, s.lv, s.r.int(1, 2 ** 31), s.last && s.last.gid, dname); }
      else if (s.queue.length) { const m = s.queue.shift(); p = NS.makeProblem(m.g, s.lv, m.s, m.d || 'contest', m.at); }
      else { const tr = NS.pickTrick(s.tricks, s.lv, s.r, s.last && s.last.trick); p = NS.problemForTrick(tr, s.lv, s.r.int(1, 2 ** 31), s.last && s.last.gid, dname); }
    }
    s.cur = p; s.state = 'ask'; s.t0 = performance.now(); s.last = p;
    renderSession();
  }
  const avgTime = s => (s.results.length ? (s.results.reduce((t, x) => t + x.ms, 0) / s.results.length / 1000).toFixed(1) + 's' : '—');
  function tallyHtml(s) {
    const right = s.results.filter(x => x.ok).length, wrong = s.results.length - right;
    if (s.beh === 'test') return s.total ? '' : `<span class="tally"><span class="num">${s.results.length} answered</span></span>`;
    if (s.beh === 'hardcore') return `<span class="tally"><span class="g">Streak ${right}</span></span>`;
    return `<span class="tally"><span class="g">✓ ${right}</span>${s.mode === 'arith' ? '' : `<span class="r">✗ ${wrong}</span>`}</span>`;
  }
  function renderSession() {
    const s = state.session; const p = s.cur; setNav('practice');
    const pct = s.total ? s.results.length / s.total * 100 : 0;
    const showName = s.mode !== 'arith' && s.tricks.length > 1;
    const autoNext = timed(s) || s.beh === 'noenter';
    const under = s.beh === 'test' ? '<button class="btn" data-act="sSubmit">Next <span class="kbd">Enter</span></button><button class="btn ghost" data-act="sGiveUp">Skip</button>'
      : timed(s) ? '<button class="btn ghost small" data-act="sGiveUp">Skip</button>'
      : `<button class="btn" data-act="sSubmit">Check <span class="kbd">Enter</span></button><button class="btn ghost" data-act="sGiveUp">Show the shortcut</button>`;
    const hcBest = (L().best || {}).hc || 0;
    main.innerHTML = `<div class="session">
      <div class="sbar"><button class="x" data-act="quitSession" aria-label="End session">${IC.x}</button><span class="what">${NS.rich(s.label)}</span>${s.mode === 'arith' ? '' : diffChip(p.diff || 'contest', s.auto ? '<span class="dauto"> · auto</span>' : '')}
        ${tallyHtml(s)}${timed(s) ? `<span class="clock" id="clock">${fmtTime(s.dur)}</span>` : s.total ? `<span class="faint num small">${s.results.length + 1}/${s.total}</span>` : ''}</div>
      <div class="prog"><span id="progbar" style="width:${pct}%"></span></div>
      <div class="lstats" aria-label="Live stats"><span>Average <b id="lavg">${avgTime(s)}</b></span>${timed(s) ? `<span>Pace <b id="lpace">—</b></span>` : `<span>Time <b id="ltime">${fmtTime((performance.now() - s.startAt) / 1000)}</b></span>`}${s.beh === 'hardcore' && hcBest ? `<span>Best streak <b>${hcBest}</b></span>` : ''}</div>
      <div class="stage" id="stage">
        <span class="tk" id="stk">${!showName ? '' : S.data.settings.names ? NS.rich(trickName(p.trick), true) : timed(s) ? '' : 'Which trick fits?'}</span>${p.est ? '<span class="star">* integer within 5%</span>' : ''}
        <div class="prob ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)}</div>
        <div>${blankHtml(p, 'id="sin"')}</div>
        <div class="preview" id="spv"></div>
        <div class="feedback" id="sfb" aria-live="polite"></div>
        <div id="sshort"></div>
        ${keypadHtml(p)}
        <div class="under" id="sunder">${under}</div>
      </div>
      <p class="faint small" style="text-align:center;margin-top:14px">${s.mode === 'arith' ? 'Whole numbers only. Right answers move on by themselves.' : touch ? 'Use space for mixed numbers: 3 1/4.' : 'Type mixed numbers with a space: 3 1/4. Fractions with a slash: 7/8.'}${autoNext && s.mode !== 'arith' && s.beh !== 'test' ? ' Right answers move on by themselves.' : ''}</p></div>`;
    const inp = $('#sin');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (s.state === 'ask') ACT.sSubmit(); else if (s.state === 'shown') nextProblem(); } });
    inp.addEventListener('input', () => { $('#spv').innerHTML = previewOf(inp.value); if (autoNext && s.beh !== 'test' && s.state === 'ask' && NS.check(p.a, inp.value).ok) ACT.sSubmit(); });
    if (!touch) inp.focus({ preventScroll: true }); else activeInput = inp;
    if (s.moved) { const fb = $('#sfb'); fb.className = 'feedback lvl fadeout'; fb.textContent = s.moved > 0 ? `Four quick right answers in a row. Moving up to ${NS.DIFFS[s.di].name}.` : `Two misses in the last three. Moving down to ${NS.DIFFS[s.di].name}.`; s.moved = 0; }
    else if (s.flash != null) {
      // the last answer was right: say so on the new problem, where it stays readable, then fade
      const fb = $('#sfb'); fb.className = 'feedback ok fadeout'; fb.textContent = `✓ Right · ${(s.flash / 1000).toFixed(1)}s`;
      $('#stage').classList.add('pulse'); const g = $('.tally .g'); if (g) g.classList.add('bump'); s.flash = null;
    } else if (s.saved) { const fb = $('#sfb'); fb.className = 'feedback lvl fadeout'; fb.textContent = 'Answer saved.'; s.saved = false; }
    tickLive();
  }
  // one timer for the clock, the elapsed time and the pace
  function tickLive() {
    const s = state.session; clearInterval(state.sprintTimer);
    const upd = () => { if (!state.session || s !== state.session || s.done) return clearInterval(state.sprintTimer);
      const el = (performance.now() - s.startAt) / 1000;
      if (timed(s)) { const left = Math.max(0, s.dur - el); const c = $('#clock'); if (c) { c.textContent = fmtTime(Math.ceil(left)); c.classList.toggle('low', left <= 10); }
        const pc = $('#lpace'); if (pc && el > 5) { const r = s.results.filter(x => x.ok).length / el * 60; pc.textContent = `${r >= 10 ? Math.round(r) : r.toFixed(1)} a minute`; }
        if (left <= 0) { clearInterval(state.sprintTimer); finishSession(); } }
      else { const t = $('#ltime'); if (t) t.textContent = fmtTime(el); } };
    upd(); state.sprintTimer = setInterval(upd, 250);
  }
  function showShortcut(p, container, given, note) {
    container.innerHTML = `<div class="shortcut"><p class="eyebrow">The answer</p><div class="key">${R(NS.keyHtml(p.a), true)}${p.suffix ? ` <span class="suffix">${esc(p.suffix)}</span>` : ''}</div>${note ? `<p class="small" style="color:var(--bad);margin-bottom:8px">${esc(note)}</p>` : ''}<p class="eyebrow" style="margin-bottom:8px">How to get it fast</p><ol class="steps">${p.steps.map(x => `<li>${R(x, true)}</li>`).join('')}</ol></div>`;
  }
  // Auto difficulty: four quick right answers in a row move up a level; two misses in the last three move down
  function autoAdjust(s, ok, ms, p) {
    if (!s.auto) return;
    const tgt = NS.TARGET[p.col] + (p.est ? 6 : 0);
    s.hist.push(ok ? (ms / 1000 <= tgt * 1.25 ? 2 : 1) : 0); if (s.hist.length > 6) s.hist.shift();
    const last4 = s.hist.slice(-4), last3 = s.hist.slice(-3);
    if (last4.length === 4 && last4.every(x => x === 2) && s.di < 3) { s.di++; s.moved = 1; s.hist = []; }
    else if (last3.filter(x => x === 0).length >= 2 && s.di > 0) { s.di--; s.moved = -1; s.hist = []; }
    s.diMax = Math.max(s.diMax, s.di);
  }
  function finishSession() {
    const s = state.session; if (!s || s.done) return; s.done = true; s.showSummary = true; clearInterval(state.sprintTimer);
    if (!s.results.length) { state.session = null; return viewPractice(); }
    const right = s.results.filter(x => x.ok).length; const B = L().best || (L().best = {});
    if (s.beh === 'hardcore') { s.prevBest = B.hc || 0; if (right > s.prevBest) B.hc = right; }
    if (s.mode === 'arith') { const k = NS.arithKey(s.arith, s.dur); B.ar = B.ar || {}; s.prevBest = B.ar[k] || 0; if (right > s.prevBest && s.results.length && (performance.now() - s.startAt) / 1000 >= s.dur - 1) B.ar[k] = right; }
    S.save();
    renderSummary();
  }
  function endSession(silent) { const s = state.session; if (!s) return; clearInterval(state.sprintTimer); s.done = true; s.showSummary = !silent && s.results.length > 0; if (silent) state.session = null; }
  function renderSummary() {
    const s = state.session; setNav('practice'); document.body.classList.remove('in-session');
    const n = s.results.length, right = s.results.filter(x => x.ok).length; const acc = n ? right / n : 0;
    const times = s.results.filter(x => x.ok).map(x => x.ms).sort((a, b) => a - b); const med = times.length ? times[Math.floor(times.length / 2)] / 1000 : null;
    const by = {}; s.results.forEach(x => { const k = x.p.trick; if (!k) return; by[k] = by[k] || { n: 0, ok: 0 }; by[k].n++; if (x.ok) by[k].ok++; });
    const misses = s.results.filter(x => !x.ok); const arith = s.mode === 'arith'; const hc = s.beh === 'hardcore';
    const total = (s.results.reduce((t, x) => t + x.ms, 0) / 1000);
    const headline = hc ? `A streak of ${right}` : timed(s) ? `${right} right in ${fmtTime(s.dur)}` : `${right} of ${n} right`;
    const best = hc || arith ? (right > (s.prevBest || 0) && right > 0 ? (s.prevBest ? `New best. Your previous best was ${s.prevBest}.` : 'This is your first score with these settings.') : s.prevBest ? `Your best is ${s.prevBest}.` : '') : '';
    const opn = arith ? s.arith.ops.split('').map(c => ({ '+': 'addition', '-': 'subtraction', x: 'multiplication', '/': 'division' })[c]).join(', ') : '';
    const dline = arith ? `${opn[0].toUpperCase()}${opn.slice(1)}.` : s.auto ? (s.diMax > s.di0 ? `Auto difficulty: started at ${NS.DIFFS[s.di0].name}, reached ${NS.DIFFS[s.diMax].name}.` : `Auto difficulty: stayed at ${NS.DIFFS[s.di0].name}${s.di < s.di0 ? ` and stepped back to ${NS.DIFFS[s.di].name}` : ''}.`) : `Difficulty: ${NS.DIFFS[s.di].name}.`;
    const msg = hc ? (best || 'The shortcut for the problem that ended the run is below.') : arith ? (best || (misses.length ? 'Your misses are listed below.' : 'No misses.')) : acc === 1 ? 'You got every problem right.' : acc >= 0.85 ? '85% or better. Next round, try to answer faster.' : acc >= 0.6 ? 'Read the shortcuts for the misses below, then try another round.' : 'Go back over the lesson, then try another round.';
    main.innerHTML = `<div class="session stack">
      <div class="card"><p class="eyebrow">${NS.rich(s.label)}</p><div class="res-top" style="margin-top:8px"><div class="big">${hc || arith ? right : Math.round(acc * 100) + '%'}</div>
        <div class="stack" style="gap:8px"><h2>${headline}</h2><p class="muted">${msg}</p><p class="small faint">${dline}</p><div class="kv"><div><b>${right}</b><span>right</span></div><div><b>${n - right}</b><span>missed</span></div><div><b>${med ? med.toFixed(1) + 's' : '—'}</b><span>typical time</span></div><div><b>${(total / n).toFixed(1)}s</b><span>average</span></div>${timed(s) ? '' : `<div><b>${fmtTime(total)}</b><span>total time</span></div>`}</div></div></div>
        <div class="row" style="margin-top:20px"><button class="btn hi" data-act="again">Go again <span class="kbd">Enter</span></button>${misses.length && !arith ? '<button class="btn ghost" data-act="redoMissed">Redo the misses</button>' : ''}<button class="btn ghost" data-act="newSetup">Change settings</button></div></div>
      ${Object.keys(by).length > 1 ? `<div class="card"><h3 style="margin-bottom:6px">By trick</h3><div class="tablewrap"><table class="t"><thead><tr><th>Trick</th><th style="text-align:right">Right</th><th></th></tr></thead><tbody>${Object.entries(by).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([k, v]) => `<tr><td>${NS.rich(trickName(k))}</td><td class="n">${v.ok}/${v.n}</td><td style="text-align:right"><button class="btn link small" data-go="t" data-arg="${k}">Lesson</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${misses.length ? `<div class="card"><h3>${arith ? 'Misses' : 'Misses, with the shortcut'}</h3><div class="stack" style="margin-top:10px;gap:0">${misses.map((x, i) => `<details style="border-top:1px solid var(--line);padding:10px 0" ${i === 0 ? 'open' : ''}><summary style="cursor:pointer"><span>${R(x.p.p.h)}</span> <span class="faint small">you wrote</span> <span class="m" style="color:var(--bad)">${x.given ? esc(x.given) : '—'}</span> <span class="faint small">· answer</span> <span class="m">${R(NS.keyHtml(x.p.a), true)}</span></summary><ol class="steps" style="margin-top:10px">${x.p.steps.map(t => `<li>${R(t, true)}</li>`).join('')}</ol></details>`).join('')}</div></div>` : ''}
    </div>`;
    $('[data-act="again"]').focus();
  }

  /* ---------- memorize ---------- */
  const memoSet = id => NS.MEMO.find(s => s.id === id);
  const memoTitle = id => memoSet(id).short || memoSet(id).title;
  function memoBar(c) { return `<div class="mbar" aria-hidden="true"><span style="width:${c.total ? c.known / c.total * 100 : 0}%"></span></div><span class="faint small">${c.known} of ${c.total} known${c.missed ? ` · ${c.missed} to fix` : ''}</span>`; }
  function viewMemorize(arg) {
    if (state.memo && !state.memo.done) return renderMemo();
    if (state.memo && state.memo.done) return renderMemoSummary();
    const l = lv();
    if (arg && memoSet(arg)) return viewMemoSet(arg);
    state.memoSetId = null;
    const tot = NS.MEMO_CORE.reduce((a, s) => { const c = NS.memoCount(l, s.id); a.k += c.known; a.t += c.total; return a; }, { k: 0, t: 0 });
    main.innerHTML = `<header class="pagehead" style="margin-bottom:0"><p class="eyebrow">${LV[l]}</p><h1>Memorize</h1>
      <p class="lede">Some answers are faster to know by heart than to work out. Study a table, then drill it until you can answer every card right away.</p></header>
      <div class="row" style="margin-top:20px"><button class="btn" data-act="memoMix">Drill a mix</button><span class="faint small">20 cards from every set, mostly ones you don’t know yet. ${tot.k} of ${tot.t} facts known.</span></div>
      <div class="msets">${NS.MEMO_CORE.map(msetCard).join('')}</div>
      <h2 class="label">Harder sets</h2>
      <p class="muted small" style="margin:-4px 0 12px;max-width:62ch">For students who know the tables above. These sets aren’t part of the mixed drill.</p>
      <div class="msets">${NS.MEMO.filter(s => s.extra).map(msetCard).join('')}</div>
      ${footer()}`;
  }
  function msetCard(s) { const l = lv(); const c = NS.memoCount(l, s.id); return `<button class="mset" data-go="memorize" data-arg="${s.id}"><b>${NS.rich(s.title, true)}</b><span class="muted small">${NS.rich(s.blurb[l], true)}</span><span class="mprog">${memoBar(c)}</span></button>`; }
  function viewMemoSet(id) {
    const l = lv(); const set = memoSet(id); const b = NS.memoBuild(id, l); const c = NS.memoCount(l, id);
    state.memoSetId = id;
    const hasKey = !!b.groups[0].cells[0].k, hasAns = !!b.groups[0].cells[0].b; const cover = hasAns && !!state.memoCover;
    const cellHtml = cell => `<button type="button" class="mcell ${cell.k ? NS.memoStatus(l, id, cell.k) : ''}" ${hasAns ? 'data-act="memoPeek"' : 'tabindex="-1"'}><span class="mt">${R(cell.t, true)}</span>${cell.b ? `<span class="mb">${R(cell.b, true)}${cell.b2 ? `<span class="mb2">${R(cell.b2, true)}</span>` : ''}</span>` : ''}</button>`;
    main.innerHTML = `<button class="back" data-go="memorize">${IC.left}Memorize</button>
      <h1 style="margin-top:6px">${NS.rich(set.title, true)}</h1>
      <div class="mhead"><span class="mprog">${memoBar(c)}</span></div>
      <div class="row" style="margin-top:16px;align-items:center"><button class="btn hi" data-act="memoDrill" data-id="${id}">Drill these <span class="kbd">Enter</span></button>${hasAns ? `<button class="switch inline" role="switch" aria-checked="${cover}" data-act="memoCover"><span class="sw" aria-hidden="true"></span><span class="swt"><b>Cover the answers</b></span></button>` : ''}</div>
      <p class="note why" style="margin-top:18px;max-width:72ch">${NS.rich(set.note)}</p>
      ${cover ? '<p class="faint small" style="margin-top:14px">Say each answer to yourself, then tap the card to check.</p>' : ''}
      <div class="mtable${cover ? ' covered' : ''}" id="mtable">${b.groups.map(g => `${g.name ? `<p class="eyebrow mgh">${esc(g.name)}</p>` : ''}<div class="mgrid${hasAns ? '' : ' tight'}${['squares', 'cubes', 'squares2', 'cubes2'].includes(id) ? ' dec' : ''}${id === 'fractions' ? ' wide' : ''}${id === 'measures' ? ' wide words' : ''}">${g.cells.map(cellHtml).join('')}</div>`).join('')}</div>
      ${hasKey ? '<p class="faint small mlegend"><span><i class="dot known"></i>known</span><span><i class="dot seen"></i>getting there</span><span><i class="dot missed"></i>missed last time</span></p>' : `<p class="faint small mlegend">The drill gives you a number and asks for its smallest prime factor, so you learn the numbers that only look prime.</p>`}
      ${footer()}`;
  }
  function startMemo(ids, title) {
    const l = lv(); const pool = ids.flatMap(id => NS.memoBuild(id, l).items.map(item => ({ set: id, item })));
    state.memo = { ids, title, lv: l, pool, total: Math.min(20, Math.max(8, pool.length * 2)), results: [], retry: [], r: new NS.Rng(newSeed()), done: false, last: null, flash: null };
    nextCard(true);
    if (location.hash.slice(1).split('-')[0] !== 'memorize') location.hash = 'memorize';
  }
  function nextCard(quiet) {
    const m = state.memo; if (!m) return; if (m.results.length >= m.total) return finishMemo();
    let pick; const due = m.retry.findIndex(x => m.results.length >= x.due);
    if (due >= 0) pick = m.retry.splice(due, 1)[0].pick;
    else {
      let pool = m.pool;
      if (m.ids.length > 1) { // choose a set first, so a big set doesn't crowd out the small ones
        const w = m.ids.map(id => { const c = NS.memoCount(m.lv, id); return 1 - c.known / c.total + 0.15; });
        let t = m.r.f() * w.reduce((a, b) => a + b, 0), k = 0; for (; k < w.length - 1; k++) { t -= w[k]; if (t <= 0) break; }
        pool = m.pool.filter(x => x.set === m.ids[k]);
      }
      pick = NS.memoPick(pool, m.lv, m.r, m.last && m.last.item.k);
    }
    m.cur = { ...pick, card: pick.item.ask(m.r) }; m.last = pick; m.state = 'ask'; m.t0 = performance.now();
    if (!quiet || location.hash.slice(1).split('-')[0] === 'memorize') renderMemo();
  }
  function renderMemo() {
    const m = state.memo; const c = m.cur; setNav('memorize');
    const right = m.results.filter(x => x.ok).length, wrong = m.results.length - right;
    main.innerHTML = `<div class="session">
      <div class="sbar"><button class="x" data-act="memoQuit" aria-label="End drill">${IC.x}</button><span class="what">${NS.rich(m.title, true)}</span>
        <span class="tally"><span class="g">✓ ${right}</span><span class="r">✗ ${wrong}</span></span><span class="faint num small">${Math.min(m.results.length + 1, m.total)}/${m.total}</span></div>
      <div class="prog"><span style="width:${m.results.length / m.total * 100}%"></span></div>
      <div class="stage" id="stage">
        <span class="tk">${NS.rich(memoTitle(c.set), true)}</span>
        <div class="prob">${R(c.card.q, true)}</div>
        <div>${blankHtml(c.card, 'id="min"')}</div>
        <div class="preview" id="mpv"></div>
        <div class="feedback" id="mfb" aria-live="polite"></div>
        <div id="mshow"></div>
        ${keypadHtml(c.card)}
        <div class="under" id="munder"><button class="btn" data-act="mSubmit">Check <span class="kbd">Enter</span></button><button class="btn ghost" data-act="mGiveUp">I don’t know it</button></div>
      </div>
      <p class="faint small" style="text-align:center;margin-top:14px">Right answers move on by themselves.</p></div>`;
    const inp = $('#min');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (m.state === 'ask') ACT.mSubmit(); else if (m.state === 'shown') nextCard(); } });
    inp.addEventListener('input', () => { $('#mpv').innerHTML = previewOf(inp.value); if (m.state === 'ask' && NS.check(c.card.a, inp.value).ok) ACT.mSubmit(); });
    if (!touch) inp.focus({ preventScroll: true }); else activeInput = inp;
    if (m.flash != null) {
      const fb = $('#mfb'); fb.className = 'feedback ok fadeout'; fb.textContent = `✓ Right · ${(m.flash / 1000).toFixed(1)}s`;
      $('#stage').classList.add('pulse'); $('.tally .g').classList.add('bump'); m.flash = null;
    }
  }
  function memoMiss(c, note) {
    const m = state.memo; m.state = 'shown'; m.retry.push({ pick: { set: c.set, item: c.item }, due: m.results.length + 3 });
    const inp = $('#min'); inp.readOnly = true; if (inp.value.trim()) inp.classList.add('bad', 'shake');
    $('.tally .r').textContent = `✗ ${m.results.filter(x => !x.ok).length}`;
    const fb = $('#mfb'); fb.className = 'feedback bad'; fb.textContent = note || (inp.value.trim() ? 'Not quite.' : '');
    $('#mshow').innerHTML = `<div class="mreveal">${R(c.card.show, true)}</div><p class="faint small">This one comes back in a few cards.</p>`;
    const kp = $('#stage .keypad'); if (kp) kp.remove();
    $('#munder').innerHTML = `<button class="btn" data-act="mNext">Next <span class="kbd">Enter</span></button>`;
    if (!touch) inp.focus({ preventScroll: true }); else $('[data-act="mNext"]').focus({ preventScroll: true });
  }
  function finishMemo() { const m = state.memo; if (!m || m.done) return; m.done = true; if (!m.results.length) { state.memo = null; return viewMemorize(m.ids.length === 1 ? m.ids[0] : ''); } renderMemoSummary(); }
  function renderMemoSummary() {
    const m = state.memo; setNav('memorize'); document.body.classList.remove('in-session');
    const n = m.results.length, right = m.results.filter(x => x.ok).length;
    const seen = new Set(); const missed = m.results.filter(x => !x.ok && !seen.has(x.item.k) && seen.add(x.item.k));
    const slow = m.results.filter(x => x.ok && x.ms > NS.memoFast(x.set) && !seen.has(x.item.k) && seen.add(x.item.k));
    const times = m.results.filter(x => x.ok).map(x => x.ms).sort((a, b) => a - b); const med = times.length ? (times[Math.floor(times.length / 2)] / 1000).toFixed(1) + 's' : '—';
    const msg = right === n ? (slow.length ? 'Every card right. A few were slow.' : 'Every card right.') : right / n >= 0.8 ? '80% or more right. Look over the misses below.' : 'Read the table once more, then go again.';
    main.innerHTML = `<div class="session stack">
      <div class="card"><p class="eyebrow">${NS.rich(m.title, true)}</p><div class="res-top" style="margin-top:8px"><div class="big">${Math.round(right / n * 100)}%</div>
        <div class="stack" style="gap:8px"><h2>${right} of ${n} right</h2><p class="muted">${msg}</p><div class="kv"><div><b>${right}</b><span>right</span></div><div><b>${n - right}</b><span>missed</span></div><div><b>${med}</b><span>typical time</span></div></div></div></div>
        <div class="row" style="margin-top:20px"><button class="btn hi" data-act="memoAgain">Go again <span class="kbd">Enter</span></button><button class="btn ghost" data-act="memoBack">${m.ids.length === 1 ? 'Back to the table' : 'Back to Memorize'}</button></div></div>
      ${missed.length ? `<div class="card"><h3>Look these over</h3><div class="mlist">${missed.map(x => `<div>${R(x.card.show, true)}</div>`).join('')}</div></div>` : ''}
      ${slow.length ? `<div class="card"><h3>Right, but slow</h3><p class="muted small" style="margin-top:4px">They’ll come up more often until you answer them quickly.</p><div class="mlist">${slow.map(x => `<div>${R(x.card.show, true)} <span class="faint small mono">${(x.ms / 1000).toFixed(1)}s</span></div>`).join('')}</div></div>` : ''}
    </div>`;
    $('[data-act="memoAgain"]').focus();
  }

  /* ---------- tests ---------- */
  function viewTests() {
    if (state.test && !state.test.done) return renderTest();
    if (state.test && state.test.done) return renderResults();
    const l = lv(); const hist = L().tests.slice().reverse().slice(0, 8); if (!state.testDiff) state.testDiff = S.data.settings.tdiff || 'contest';
    const codeDiff = c => { const sp = c && NS.readTestCode(c); return sp && sp.diff !== 'contest' ? ` · ${NS.DIFFS[NS.diffIdx(sp.diff)].name}` : ''; };
    main.innerHTML = `<div class="setup"><header class="pagehead"><p class="eyebrow">${LV[l]}</p><h1>Practice tests</h1>
      <p class="lede">Same layout, timing and scoring as a contest test. Your graded sheet shows the shortcut for anything you miss.</p></header>
      <div class="cfg">
        <div class="cfg-row"><span class="cfg-l">Test</span><div class="cfg-v"><div class="row" style="gap:8px"><div class="seg" role="group" aria-label="Test length"><button data-act="tkind" data-k="full" aria-pressed="${state.testKind === 'full'}">Full test</button><button data-act="tkind" data-k="col" aria-pressed="${state.testKind === 'col'}">One column</button></div>
          ${state.testKind === 'col' ? `<div class="seg" role="group" aria-label="Column">${[1, 2, 3, 4].map(c => `<button data-act="tcol" data-c="${c}" aria-pressed="${state.testCol === c}">${COLR[c]}</button>`).join('')}</div>` : ''}</div>
          <p class="note-s">${state.testKind === 'full' ? '80 problems in 10 minutes.' : `Problems ${COLR[state.testCol]}: 20 problems in 2 minutes 30 seconds.`}</p></div></div>
        <div class="cfg-row"><span class="cfg-l">Difficulty</span><div class="cfg-v">${diffSeg('tdiff', state.testDiff, false)}</div></div>
      </div>
      <div class="row startbar"><button class="btn" data-act="startTest">Start the clock</button><button class="btn ghost" data-act="printTest">Print a paper copy</button><span class="faint small">Enter moves to the next blank. If a problem is taking too long, guess and move on: a skip costs the same as a miss.</span></div>
      <div class="codes">
        <div class="codebox"><label for="tcode"><b>Got a test code?</b> <span class="muted">Everyone who enters the same code gets the same test, so a team can take one together and compare.</span></label>
          <div class="row" style="margin-top:10px"><input id="tcode" class="field" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. ${l === 'ms' ? 'MF' : 'HF'}-7K2M" maxlength="10" aria-describedby="tcodemsg"><button class="btn ghost" data-act="codeStart">Start this test</button></div>
          <p class="small" id="tcodemsg" aria-live="polite" style="margin-top:8px"></p></div>
        <div class="codebox" id="teambox">${teamBox()}</div>
      </div>
      <details class="rules"><summary>Scoring and a few reminders</summary>
        <div class="grid2" style="margin-top:14px">
          <ul class="stack small" style="padding-left:18px;margin:0;gap:6px"><li>Work in order. A skipped problem before your last answer counts as wrong.</li><li>No scratch paper, no calculators. Write only the final answer.</li><li>At a real contest, an erased or written-over answer can be marked wrong. Write it once.</li><li>Fractions in lowest terms. Mixed numbers or improper fractions are both fine unless the problem names one.</li><li>A repeating value like 2/3 must be a fraction, not .67.</li><li>Starred (*) problems accept integers within 5% of the exact answer.</li></ul>
          <ul class="stack small" style="padding-left:18px;margin:0;gap:6px"><li>Earn 5 points for a correct answer. Lose 4 for a wrong answer or a blank before your last answer.</li><li>Blanks after your last answer score zero.</li><li>On a star problem, don’t compute exactly. Round and write it down.</li><li>Losing time on a hard problem costs you easy ones later. Give it a few seconds, guess if you must, and move on.</li></ul>
        </div></details>
      <div class="sect"><div class="sect-h"><h2>Recent tests</h2></div>${hist.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>When</th><th>Test</th><th style="text-align:right">Score</th><th style="text-align:right">Right</th><th style="text-align:right">Last tried</th><th>Code</th></tr></thead><tbody>${hist.map(t => `<tr><td>${new Date(t.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td>${t.kind === 'full' ? 'Full' : `Problems ${COLR[t.col]}`}${codeDiff(t.code)}</td><td class="n"><b>${t.score}</b></td><td class="n">${t.correct}</td><td class="n">${t.last}</td><td>${t.code ? `<button class="btn link small mono" data-act="retake" data-code="${t.code}" title="Take this test again">${t.code}</button>` : '<span class="faint">—</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No tests yet. Try one full test a week, with single columns in between.</div>'}</div>
    </div>${footer()}`;
    const tc = $('#tcode'); if (tc) { tc.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACT.codeStart(); } }); tc.addEventListener('input', () => { tc.removeAttribute('aria-invalid'); $('#tcodemsg').textContent = ''; }); }
  }
  // a fresh code for whatever test is selected above, without starting it
  // "a high school full test at Contest level", "a middle school test of problems 41–60 at Hard level"
  function testPhrase(l, cols, diff, withLevel = true) {
    const kind = cols.length === 4 ? 'full test' : `test of problems ${COLR[cols[0]]}`;
    return `a ${withLevel ? LV[l].toLowerCase() + ' ' : ''}${kind} at ${NS.DIFFS[NS.diffIdx(diff)].name} level`;
  }
  function teamBox() {
    const l = lv(); const what = testPhrase(l, state.testKind === 'full' ? [1, 2, 3, 4] : [state.testCol], state.testDiff || 'contest', false);
    const tc = state.teamCode;
    if (!tc) return `<b>Giving your team a test?</b> <span class="muted">Make a code for ${what} without starting it. Share the code, and everyone enters it in the box ${matchMedia('(max-width: 720px)').matches ? 'above' : 'beside this one'}.</span>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="teamCode">Make a team code</button></div>`;
    return `<b>Your team code</b> <span class="muted">for ${tc.what}.</span>
      <div class="teamcode"><span class="mono" id="teamcode">${tc.code}</span><button class="btn small" data-act="copyCode" data-code="${tc.code}">Copy</button></div>
      <p class="small muted">Students open Tests, enter the code under <i>Got a test code?</i>, and start when you say go. Each code always gives the same problems.</p>
      <div class="row" style="margin-top:10px"><button class="btn ghost small" data-act="teamStart">Take it myself</button><button class="btn ghost small" data-act="printCode" data-code="${tc.code}">Print it</button><button class="btn link small" data-act="teamCode">Make a different code</button></div>`;
  }
  function startTest(spec) {
    const l = lv(); const cols = spec ? spec.cols : state.testKind === 'full' ? [1, 2, 3, 4] : [state.testCol];
    const seed = spec ? spec.seed : NS.testSeed(); const diff = spec ? spec.diff : (state.testDiff || S.data.settings.tdiff || 'contest');
    if (spec) { state.testKind = cols.length === 4 ? 'full' : 'col'; if (cols.length === 1) state.testCol = cols[0]; }
    const probs = NS.buildTest(l, seed, cols, diff);
    state.test = { lv: l, cols, diff, kind: state.testKind, col: state.testCol, probs, code: NS.testCode(l, cols, seed, diff), answers: probs.map(() => ''), dur: cols.length === 4 ? 600 : 150, start: Date.now(), done: false, cur: 0 };
    if (location.hash.slice(1) !== 'test') { location.hash = 'test'; } else renderTest();
  }
  function stopTest() { clearInterval(state.testTimer); state.test = null; $('.dock') && $('.dock').remove(); document.body.classList.remove('in-session'); }
  function renderTest() {
    const T = state.test; setNav('test');
    main.innerHTML = `<div class="sheet-top"><button class="x" data-act="leaveTest" aria-label="Leave this test" title="Leave this test">${IC.x}</button><span class="clock" id="tclock">${fmtTime(T.dur)}</span><span class="muted small" id="tdone">0 answered</span><span style="flex:1"></span>${T.diff !== 'contest' ? diffChip(T.diff) : ''}<span class="faint small mono tcode" title="Test code">${T.code}</span><button class="btn small ghost" data-act="finishTest">Finish and grade</button></div>
      <div id="sheet">${pages(T.probs, (p, i) => `<div class="q" data-i="${i}" id="q${i}"><span class="qn">${p.est ? '<span class="s">*</span>' : ''}(${p.n})</span><div class="qb"><span class="t ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)}</span>${blankHtml(p, `data-i="${i}" id="a${i}"`)}</div></div>`)}</div>
      <p class="faint small" style="margin-top:12px">${touch ? '' : 'Enter or ↓ moves to the next blank; ↑ goes back.'}</p>`;
    if (touch) { const d = document.createElement('div'); d.className = 'dock'; d.innerHTML = keypadHtml(T.probs[0], true); document.body.appendChild(d); main.style.paddingBottom = '330px'; }
    const sheet = $('#sheet');
    T.answers.forEach((v, i) => { if (v) $('#a' + i).value = v; });
    sheet.addEventListener('keydown', e => {
      const i = +e.target.dataset.i; if (isNaN(i)) return;
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusQ(i + 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); focusQ(i - 1); }
    });
    sheet.addEventListener('input', e => { const i = +e.target.dataset.i; if (isNaN(i)) return; T.answers[i] = e.target.value; $('#tdone').textContent = `${T.answers.filter(a => a.trim()).length} answered`; });
    sheet.addEventListener('focusin', e => { const i = +e.target.dataset.i; if (isNaN(i)) return; T.cur = i; $$('.q.cur').forEach(x => x.classList.remove('cur')); $('#q' + i).classList.add('cur'); if (touch) { const d = $('.dock'); if (d) d.innerHTML = keypadHtml(T.probs[i], true); } });
    sheet.addEventListener('click', e => { const q = e.target.closest('.q'); if (q && !e.target.classList.contains('ans')) focusQ(+q.dataset.i); });
    focusQ(T.cur || 0, !T.cur);
    $('#tdone').textContent = `${T.answers.filter(a => a.trim()).length} answered`;
    clearInterval(state.testTimer);
    const upd = () => { if (!state.test || state.test !== T || T.done) return clearInterval(state.testTimer); const left = Math.max(0, T.dur - (Date.now() - T.start) / 1000); const c = $('#tclock'); if (c) { c.textContent = fmtTime(Math.ceil(left)); c.classList.toggle('low', left <= 30); } if (left <= 0) { clearInterval(state.testTimer); gradeTest(true); } };
    upd(); state.testTimer = setInterval(upd, 250);
  }
  function pages(probs, cell) { const out = []; for (let k = 0; k < probs.length; k += 20) { const first = probs[k].n; out.push(`<p class="eyebrow pagehead">Problems ${first}–${first + Math.min(20, probs.length - k) - 1}</p><div class="sheet">${probs.slice(k, k + 20).map((p, j) => cell(p, k + j)).join('')}</div>`); } return out.join(''); }
  function focusQ(i, noScroll) {
    const T = state.test; if (!T || i < 0 || i >= T.probs.length) return; const inp = $('#a' + i); if (!inp) return;
    inp.focus({ preventScroll: true }); activeInput = inp;
    if (!noScroll) { const r = inp.closest('.q').getBoundingClientRect(); const topSafe = 140, botSafe = touch ? 340 : 40; if (r.top < topSafe || r.bottom > innerHeight - botSafe) window.scrollBy({ top: r.top - Math.max(topSafe, (innerHeight - botSafe) / 2 - 40), behavior: NS.reduceMotion() ? 'auto' : 'smooth' }); }
  }
  function gradeTest(timeUp) {
    const T = state.test; if (!T || T.done) return; clearInterval(state.testTimer); T.done = true; T.timeUp = timeUp; T.used = Math.min(T.dur, (Date.now() - T.start) / 1000);
    const d = $('.dock'); if (d) d.remove(); main.style.paddingBottom = '';
    T.res = NS.scoreTest(T.probs, T.answers);
    // record per-trick results (untimed) for everything up to the last attempted
    const tdi = NS.diffIdx(T.diff);
    T.probs.forEach((p, i) => { const m = T.res.marks[i]; if (m === 'ok' || m === 'bad') { const t = S.trick(p.trick); t.att.push(tdi === 1 ? [m === 'ok' ? 1 : 0, -1] : [m === 'ok' ? 1 : 0, -1, tdi]); if (t.att.length > 30) t.att.shift(); t.n++; if (m === 'ok') t.ok++; if (m === 'bad') { L().misses.push({ g: p.gid, s: p.seed, t: Date.now(), ...(tdi === 1 ? {} : { d: T.diff }), at: p.at }); if (L().misses.length > 60) L().misses.shift(); } } });
    L().tests.push({ t: Date.now(), kind: T.cols.length === 4 ? 'full' : 'col', col: T.cols[0], code: T.code, score: T.res.score, correct: T.res.correct, wrong: T.res.wrong, skipped: T.res.skipped, last: T.res.last });
    const day = NS.today(); L().days[day] = (L().days[day] || 0) + 1; S.save();
    window.scrollTo(0, 0); renderResults();
  }
  function renderResults() {
    const T = state.test; const r = T.res; setNav('test'); document.body.classList.remove('in-session');
    const max = T.probs.length * 5; const full = T.cols.length === 4;
    const byCol = T.cols.map((c, k) => { const idx = T.probs.map((_, i) => i).filter(i => i >= k * 20 && i < k * 20 + 20); return { c, ok: idx.filter(i => r.marks[i] === 'ok').length, tried: idx.filter(i => r.marks[i] !== 'after').length }; });
    const missTricks = [...new Set(T.probs.filter((p, i) => r.marks[i] === 'bad' || r.marks[i] === 'skip').map(p => p.trick))].slice(0, 6);
    const prev = L().tests.filter(t => t.kind === (full ? 'full' : 'col') && (full || t.col === T.cols[0])); const pb = prev.length > 1 && r.score >= Math.max(...prev.slice(0, -1).map(t => t.score));
    // a nudge to the next level when this one went well (90% right through at least 3/4 of the test), or back when it didn't
    const tdi = NS.diffIdx(T.diff); const reach = r.last / T.probs.length; const acc = r.correct / Math.max(1, r.correct + r.wrong + r.skipped);
    const nextUp = tdi < 3 && reach >= 0.75 && acc >= 0.9 ? `90% or more right through most of the test. Try your next one at ${NS.DIFFS[tdi + 1].name}.` : tdi > 1 && acc < 0.6 ? `Under 60% right. ${NS.DIFFS[1].name} level matches a real test; try your next one there.` : '';
    main.innerHTML = `<div class="stack">
      <div class="card"><p class="eyebrow">${full ? 'Full test' : `Problems ${COLR[T.cols[0]]}`} · ${NS.DIFFS[NS.diffIdx(T.diff)].name} · ${T.timeUp ? 'time' : `finished at ${fmtTime(T.used)}`}</p>
        <div class="res-top" style="margin-top:10px"><div><div class="big">${r.score}</div><p class="faint small">out of ${max}${pb ? ' · <b style="color:var(--ok)">personal best</b>' : ''}</p></div>
          <div class="stack" style="gap:10px"><div class="kv"><div><b>${r.correct}</b><span>right (+${5 * r.correct})</span></div><div><b>${r.wrong}</b><span>wrong (−${4 * r.wrong})</span></div><div><b>${r.skipped}</b><span>skipped (−${4 * r.skipped})</span></div><div><b>${r.last}</b><span>last problem tried</span></div></div>
          ${full ? `<div class="cols4">${byCol.map(b => `<div><span class="faint small">${COLR[b.c]}</span><br><b>${b.ok}</b><span class="faint small">/${b.tried || 0} tried</span></div>`).join('')}</div>` : ''}</div></div>
        ${nextUp ? `<p class="small" style="margin-top:14px"><b>${nextUp}</b></p>` : ''}
        ${r.skipped ? `<p class="small" style="margin-top:14px">Skips cost as much as wrong answers. ${r.skipped} skip${r.skipped > 1 ? 's' : ''} took ${4 * r.skipped} points. If you can’t solve one, a guess is better than a blank.</p>` : ''}
        <p class="small muted" style="margin-top:14px">Test code <b class="mono" style="color:var(--ink)">${T.code}</b>. Share it and teammates get this same test. <button class="btn link small" data-act="copyCode">Copy</button> · <button class="btn link small" data-act="printCode">Print it</button></p>
        <div class="row" style="margin-top:12px"><button class="btn hi" data-act="testAgain">New test</button><button class="btn ghost" data-act="testMenu">Test options</button>${missTricks.length ? `<button class="btn ghost" data-act="drillMissed">Drill what I missed</button>` : ''}</div></div>
      ${missTricks.length ? `<div class="card"><h3 style="margin-bottom:10px">Review these tricks</h3><div class="row">${missTricks.map(id => `<button class="btn small ghost" data-go="t" data-arg="${id}">${NS.rich(trickName(id))}</button>`).join('')}</div></div>` : ''}
      <div><h2 style="margin-bottom:10px">Your sheet</h2><p class="muted small" style="margin-bottom:12px">Tap any problem you missed to see the shortcut.</p>
      <div>${pages(T.probs, (p, i) => { const m = r.marks[i]; const given = T.answers[i];
        return `<div class="q mark-${m}${m === 'after' ? ' after' : ''}"><span class="qn">${p.est ? '<span class="s">*</span>' : ''}(${p.n})</span><div class="qb"><span class="t ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)}</span></div>
          <div class="keyline">${m === 'ok' ? `<span class="m" style="color:var(--ok)">${esc(given)}</span>` : `${given && given.trim() ? `<span class="m" style="color:var(--bad);text-decoration:line-through">${esc(given)}</span>` : m === 'skip' ? '<span style="color:var(--bad)">skipped</span>' : ''}<span>key:</span><span class="m">${R(NS.keyHtml(p.a), true)}</span>`}
          ${m !== 'ok' ? `<button class="btn link small" data-act="showWhy" data-i="${i}">Shortcut</button>` : ''}</div><div class="why" id="why${i}"></div></div>`; })}</div></div>
    </div>`;
  }

  /* ---------- printable test: a contest-style sheet, answer key on its own page ---------- */
  function keyRange(p) {
    if (!p.est) return R(NS.keyHtml(p.a));
    const v = p.a.v.num(); const lo = Math.ceil(Math.min(v * 0.95, v * 1.05) - 1e-9), hi = Math.floor(Math.max(v * 0.95, v * 1.05) + 1e-9);
    return `${NS.fmtn(lo)} — ${NS.fmtn(hi)}`;
  }
  // UIL layout on letter paper, measured from real UIL tests (2019–2026): 11pt Times New Roman Bold, problem numbers
  // right-aligned at 0.63in (left column) and 4.68in (right column), answer lines ending at 4.07in and 8.17in,
  // problems 1–33, 34 or 35 on the front and the rest on the back, and an answer key whose four columns mirror the
  // test's columns. Positions below are in points from the page's top-left corner, as on the real sheet.
  const PG = { top: 36, left: 18, right: 22, bottom: 30 };
  function uilProb(p) {
    const LB = '\u0001\\underline{\\phantom{0000}}\u0002'; let h = p.p.h; let tail = true;
    if (h.includes(LB)) { const t = h.trimEnd(); if (t.endsWith(LB)) h = t.slice(0, -LB.length); else { tail = false; h = h.split(LB).join('\u0001\\underline{\\phantom{00000000}}\u0002'); } }
    const blank = tail ? `<span class="ub">${p.pre ? `<span>${esc(p.pre)}</span>` : ''}<i></i>${p.suffix ? `<span class="sx">${esc(p.suffix)}</span>` : ''}${p.form ? `<span class="sx">${esc(p.form)}</span>` : ''}</span>` : '';
    const plain = esc(`${p.est ? '*' : ''}(${p.n}) ${NS.plainProblem(p)}`);
    return `<div class="uq" data-txt="${plain}"><span class="un">${p.est ? '*' : ''}(${p.n})</span><div class="ut"><span class="up">${R(h)}</span>${blank}</div></div>`;
  }
  // an absolutely placed line of the header: x and y are the real sheet's text positions in points
  const at = (x, y, cls, html, extra = '') => `<div class="ua2 ${cls}" style="left:${(x - PG.left).toFixed(1)}pt;top:${(y - PG.top).toFixed(1)}pt;${extra}">${html}</div>`;
  function viewPrint(code) {
    const spec = NS.readTestCode(code || '');
    // a printed test carries its own level, so any code prints, whatever level this browser is set to
    if (!spec) { main.innerHTML = `<button class="back" data-go="test">${IC.left} Tests</button><div class="empty" style="margin-top:16px">That test code didn’t work. Codes look like HF-7K2M.</div>`; return; }
    const probs = NS.buildTest(spec.lv, spec.seed, spec.cols, spec.diff); const full = spec.cols.length === 4;
    const dn = NS.DIFFS[NS.diffIdx(spec.diff)].name; const tc = NS.testCode(spec.lv, spec.cols, spec.seed, spec.diff);
    const lvShort = spec.lv === 'hs' ? 'HS' : 'MS';
    const what = testPhrase(spec.lv, spec.cols, spec.diff);
    const us = n => '_'.repeat(n);
    const head = `<div class="uhd">
      ${at(70.5, 39.8, 't14 ctr', 'Number Sense Practice Test', 'width:516pt')}
      ${at(70.5, 56.2, 't14 ctr', `${lvShort} • ${full ? '' : `Problems ${COLR[spec.cols[0]]} • `}${dn} • ${tc}`, 'width:516pt')}
      ${at(481, 76.3, 'a10', 'Final')}${at(510.4, 76.3, 'a10', us(6))}${at(553.4, 76.3, 'a10', us(6))}
      ${at(479.5, 94.2, 'a10', '2nd')}${at(511.3, 94.2, 'a10', us(6))}${at(555.1, 94.2, 'a10', us(6))}
      ${at(478.4, 112.2, 'a10', '1st')}${at(509.5, 112.2, 'a10', us(6))}${at(553.2, 112.2, 'a10', us(6))}
      ${at(510.7, 126.6, 'a8b', 'Score')}${at(557.3, 126.6, 'a8b', 'Initials')}
      ${at(45, 94.3, 't10b', `Contestant’s Number ${us(11)}`)}
      ${at(45, 125.5, 't10b', 'Read directions carefully<br>before beginning test')}
      ${at(258.5, 125.5, 't10b ctr', 'DO NOT UNFOLD THIS SHEET<br>UNTIL TOLD TO BEGIN', 'width:146.7pt')}
      ${full ? at(45, 160.5, 'udir', ['<b>Directions:</b>  Do not turn this page until the person conducting this test gives the signal to begin. This is a ten-minute test. There are', '80 problems. Solve accurately and quickly as many as you can in the order in which they appear. ALL PROBLEMS ARE TO BE', 'SOLVED MENTALLY. Make no calculations with paper and pencil. Write only the answer in the space provided at the end of', 'each problem. Problems marked with a ( * ) require approximate integral answers; any answer to a starred problem that is within', 'five percent of the exact answer will be scored correct; all other problems require exact answers.'].map((t, k, a) => `<span class="${k < a.length - 1 ? 'jl' : 'jlast'}">${t}</span>`).join(''), 'width:530.5pt')
        : at(45, 160.5, 'udir', `<b>Directions:</b> Do not turn this page until the person conducting this test gives the signal to begin. This is a two-and-a-half-minute test. There are ${probs.length} problems. Solve accurately and quickly as many as you can in the order in which they appear. ALL PROBLEMS ARE TO BE SOLVED MENTALLY. Make no calculations with paper and pencil. Write only the answer in the space provided at the end of each problem. Problems marked with a ( * ) require approximate integral answers; any answer to a starred problem that is within five percent of the exact answer will be scored correct; all other problems require exact answers.`, 'width:530.5pt')}
      ${at(45, 229.6, 'a9b', 'The person conducting this contest should explain these directions to the contestants.')}
      ${at(70.5, 250.6, 'a9b ctr', 'STOP -- WAIT FOR SIGNAL!', 'width:516pt')}
    </div>`;
    const pages = (full ? [0, 1] : [0]).map(i => `<section class="upage up${i + 1}">${i === 0 ? head : ''}<div class="ucols"><div class="ucl"></div><div class="ucr"></div></div></section>`);
    const key = `<section class="upage ukey"><div class="ukh">
      ${at(36, 39, 't11b', 'DO NOT DISTRIBUTE TO STUDENTS BEFORE OR DURING THE CONTEST')}
      ${at(36, 64.1, 't12b', `Number Sense Answer Key ${lvShort} • ${dn} • ${tc}`)}
      ${at(36, 76.5, 't10b', '*number) x — y means an integer between x and y inclusive')}
      ${at(36, 87.2, 't10b', `NOTE: If an answer is of the type like ${R('\u0001\\tfrac23\u0002')} it cannot be written as a repeating decimal`)}
    </div><div class="ukcols"></div></section>`;
    main.innerHTML = `<div class="noprint"><button class="back" data-go="test">${IC.left} Tests</button>
      <header class="pagehead" style="margin-top:10px"><h1>Print a test</h1><p class="lede">${what[0].toUpperCase() + what.slice(1)}, laid out like a UIL test sheet on letter paper, with the answer key on the last page. Students can also take this test on the site with code <b class="mono">${tc}</b>.</p></header>
      <div class="row" style="margin-bottom:8px"><button class="btn" data-act="doPrint">Print</button><button class="btn ghost" data-act="printNew">A different test</button></div>
      <p class="faint small" id="printmsg">Print double-sided so it matches a real test sheet. The answer key is the last page, so you can keep it back. In the print window, open <b>More settings</b> and check that Margins is <b>Default</b>, Scale is <b>Default</b>, and <b>Headers and footers</b> is off. If the Print button does nothing, use your browser’s Print command (Ctrl+P, or ⌘P on a Mac).</p></div>
      <div class="paper" id="paper">${pages.join('')}${key}</div>`;
    state.printSpec = spec; state.printProbs = probs; state.printFull = full;
    fitPaper();
  }
  // Each word and each piece of math becomes its own box, so the answer blank can take whatever is left of the
  // last line (as on the real sheet) and only drops to a new line when less than about half an inch is left.
  function atomize(up) {
    const atoms = []; let last = null, glue = false;
    // pieces with no space between them stay together, as in normal text ("(" + math, math + ".")
    const push = (node, breakable) => { if (glue && last && !breakable) { last.appendChild(node); } else { const a = document.createElement('span'); a.className = 'ua'; a.appendChild(node); atoms.push(a); last = a; } glue = true; };
    [...up.childNodes].forEach(n => {
      if (n.nodeType === 3) { n.textContent.split(/(\s+)/).forEach(ch => { if (!ch) return; if (/^\s+$/.test(ch)) { if (last) last.appendChild(document.createTextNode(' ')); glue = false; } else push(document.createTextNode(ch)); }); return; }
      if (n.classList && n.classList.contains('katex')) {
        // long math can wrap between its pieces, as KaTeX allows
        const bases = [...n.querySelectorAll(':scope > .katex-html > .base')];
        if (bases.length > 1) { bases.forEach((b, i) => { const k = document.createElement('span'); k.className = 'katex'; const h = document.createElement('span'); h.className = 'katex-html'; h.setAttribute('aria-hidden', 'true'); h.appendChild(b); k.appendChild(h); push(k, i > 0); }); return; }
      }
      push(n);
    });
    up.replaceWith(...atoms);
  }
  // Times draws some symbols KaTeX builds from pieces (≠) or places differently (′); use the plain glyphs
  function printGlyphs(root) {
    $$('.katex .mrel', root).forEach(e => { if (e.querySelector(':scope > .mrel > .vbox .rlap') && /=$/.test(e.textContent)) { e.textContent = '≠'; } });
    $$('.katex .mord', root).forEach(e => { if (/^[′″‴]$/.test(e.textContent)) e.classList.add('kp'); });
  }
  // Fill the columns: the front gets 35, 34 or 33 problems (left column one more when odd, as on the real tests),
  // the back is split where its two columns come out closest in height, and the key's columns follow the same split.
  function fitPaper() {
    const paper = $('#paper'); if (!paper) return;
    const probs = state.printProbs, full = state.printFull;
    const nodes = probs.map(p => { const d = document.createElement('div'); d.innerHTML = uilProb(p); return d.firstElementChild; });
    nodes.forEach(n => { atomize(n.querySelector('.up')); printGlyphs(n); });
    const keyNodes = probs.map(p => { const d = document.createElement('div'); d.className = 'uk'; d.dataset.txt = `${p.est ? '*' : ''}(${p.n}) ${p.est ? keyRange(p) : NS.keyText(p.a)}`; d.innerHTML = `<span class="un">${p.est ? '*' : ''}(${p.n})</span><span class="ukv">${keyRange(p).split('<span class="or"> or </span>').join(', ')}</span>`; printGlyphs(d); return d; });
    const pgs = $$('.upage', paper); const tests = pgs.filter(p => !p.classList.contains('ukey'));
    const cols = tests.map(p => [$('.ucl', p), $('.ucr', p)]);
    let cut = null;
    const place = (front) => {
      if (!full) { cols[0][0].replaceChildren(...nodes.slice(0, 10)); cols[0][1].replaceChildren(...nodes.slice(10)); cut = [10, 20]; return; }
      const l1 = Math.ceil(front / 2);
      cols[0][0].replaceChildren(...nodes.slice(0, l1)); cols[0][1].replaceChildren(...nodes.slice(l1, front));
      // back: try every split and keep the one with the most even columns
      const back = nodes.slice(front); cols[1][0].replaceChildren(...back); const hs = back.map(n => n.getBoundingClientRect().height);
      let best = Math.ceil(back.length / 2), bestD = Infinity;
      for (let k = Math.floor(back.length / 2) - 4; k <= Math.ceil(back.length / 2) + 4; k++) { const a = hs.slice(0, k).reduce((x, y) => x + y, 0), b = hs.slice(k).reduce((x, y) => x + y, 0); const d = Math.max(a, b); if (d < bestD) { bestD = d; best = k; } }
      cols[1][0].replaceChildren(...back.slice(0, best)); cols[1][1].replaceChildren(...back.slice(best));
      cut = [l1, front, front + best, probs.length];
    };
    // copying from the sheet gives each problem as one line of plain text
    if (!paper.dataset.copy) { paper.dataset.copy = 1; paper.addEventListener('copy', e => { const sel = getSelection(); if (!sel.rangeCount) return; const r = sel.getRangeAt(0); const items = [...paper.querySelectorAll('.uq, .uk, .ua2')].filter(el => r.intersectsNode(el)); if (!items.length || !e.clipboardData) return; e.preventDefault(); e.clipboardData.setData('text/plain', items.map(el => el.dataset.txt || el.innerText.replace(/\s+/g, ' ').trim()).join('\n')); }); }
    const fit = () => {
      paper.style.setProperty('--uk', 1);
      const set = (fs, g) => pgs.forEach(pg => { pg.style.setProperty('--ufs', fs + 'pt'); pg.style.setProperty('--ugap', g + 'em'); });
      const tries = [];
      for (let fs = 11; fs >= 10 - 1e-9; fs -= 0.25) for (let g = 0.53; g >= 0.4 - 1e-9; g -= 0.03) tries.push([fs, +g.toFixed(2)]);
      for (let fs = 11; fs >= 9 - 1e-9; fs -= 0.25) for (let g = 0.37; g >= 0.2 - 1e-9; g -= 0.03) tries.push([fs, +g.toFixed(2)]);
      let done = false;
      for (const [fs, g] of tries) { set(fs, g); for (const front of full ? [35, 34, 33] : [20]) { place(front); if (tests.every(pageFits)) { done = true; break; } } if (done) break; }
      if (!done) { set(9, 0.2); place(33); }
      // the key mirrors the test's columns
      const bounds = full ? [0, ...cut] : [0, 10, 20]; const kc = $('.ukcols', paper);
      kc.className = 'ukcols k' + (bounds.length - 1);
      kc.replaceChildren(...bounds.slice(0, -1).map((a, i) => { const c = document.createElement('div'); c.append(...keyNodes.slice(a, bounds[i + 1])); return c; }));
      paper.dataset.fit = `${pgs[0].style.getPropertyValue('--ufs')}/${pgs[0].style.getPropertyValue('--ugap')}/${cut.join(',')}`; scalePaper();
    };
    const want = ['700 11pt "Times New Roman"', '700 11pt Tinos', '400 11pt Tinos', '700 10pt Arial'];
    const ready = document.fonts ? Promise.all(want.map(f => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready) : Promise.resolve();
    ready.then(fit, fit);
  }
  // the problems end above the bottom margin, with a few pixels to spare for print rounding
  function pageFits(pg) {
    const c = pg.querySelector('.ucols, .ukcols'); if (!c) return true; const r = pg.getBoundingClientRect(); const k = r.height / pg.offsetHeight;
    return c.getBoundingClientRect().bottom <= r.bottom - (parseFloat(getComputedStyle(pg).paddingBottom) + 8) * k;
  }
  NS._pageFits = pageFits;
  // on screen, letter-size pages scale down to fit narrow windows
  function scalePaper() {
    const paper = $('#paper'); if (!paper) return; const avail = paper.clientWidth; const k = Math.min(1, (avail - 2) / 818);
    paper.style.setProperty('--uk', k);
  }
  window.addEventListener('resize', () => { if ($('#paper')) scalePaper(); });

  /* ---------- display and reading settings ---------- */
  const DISPLAY = [
    ['theme', 'Theme', [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']], { system: 'Follows your device’s light or dark setting.', light: 'Dark text on a light background.', dark: 'Light text on a dark background. Easier on the eyes at night.' }],
    ['tsize', 'Text size', [['m', 'Standard'], ['l', 'Large'], ['xl', 'Extra large']], { m: 'The usual size.', l: 'About 15% larger: text, problems and answer boxes.', xl: 'About 30% larger. On a narrow screen the menu moves to the bottom bar.' }],
    ['contrast', 'Contrast', [['std', 'Standard'], ['high', 'High']], { std: 'Soft grey for secondary text and lines.', high: 'Black and white with darker lines, underlined links and a thicker focus outline.' }],
    ['font', 'Font', [['std', 'Standard'], ['hyper', 'Atkinson Hyperlegible']], { std: 'Source Sans for text and Source Serif for headings.', hyper: 'A typeface made for readers with low vision. Letters and numbers that look alike, such as 1, l and I or 0 and O, have clearly different shapes.' }],
    ['motion', 'Motion', [['auto', 'Match device'], ['reduce', 'Reduce']], { auto: 'Small animations play unless your device asks for less motion.', reduce: 'No shaking, fading or sliding, and no smooth scrolling.' }],
    ['pad', 'Number pad', [['auto', 'Touch screens only'], ['always', 'Always show']], { auto: 'The on-screen keypad shows on phones and tablets.', always: 'Shows the keypad in practice, lessons and Memorize on every device, for anyone who would rather click than type.' }],
  ];
  const DISPLAY_DEF = { theme: 'system', tsize: 'm', contrast: 'std', font: 'std', motion: 'auto', pad: 'auto' };
  const dset = k => S.data.settings[k] || DISPLAY_DEF[k];
  function viewDisplay() {
    const ex = NS.makeProblem('sameFront', lv() || 'ms', 31); const back = lv() ? '' : `<button class="back" data-go="level">${IC.left} Choose your level</button>`; const changed = DISPLAY.some(([k]) => dset(k) !== DISPLAY_DEF[k]);
    main.innerHTML = `<div class="setup">${back}<header class="pagehead"${back ? ' style="margin-top:10px"' : ''}><h1>Display and reading</h1>
      <p class="lede">Make the site easier to read and use. These settings are saved in this browser and move with your progress code.</p></header>
      <div class="cfg">${DISPLAY.map(([k, label, opts, notes]) => `<div class="cfg-row"><span class="cfg-l" id="dl-${k}">${label}</span><div class="cfg-v"><div class="seg" role="group" aria-labelledby="dl-${k}">${opts.map(([v, n]) => `<button data-act="dset" data-k="${k}" data-v="${v}" aria-pressed="${dset(k) === v}">${n}</button>`).join('')}</div><p class="note-s">${notes[dset(k)]}</p></div></div>`).join('')}</div>
      <h2 class="label">Preview</h2>
      <div class="card dprev" aria-label="Preview">
        <p class="eyebrow">Problems 1–20 · Contest</p>
        <div class="prob" style="margin:10px 0 6px">${R(ex.p.h, true)}</div>
        <div class="row" style="gap:12px;align-items:baseline"><span class="ans ok dprev-a" aria-hidden="true">${esc(NS.keyText(ex.a))}</span><span class="feedback ok" style="margin:0">Right · 3.1s</span></div>
        <ol class="steps" style="margin-top:14px">${ex.steps.slice(-2).map(x => `<li>${R(x, true)}</li>`).join('')}</ol>
        <p class="faint small" style="margin-top:10px">Secondary text looks like this. <a href="#display" onclick="return false">Links look like this.</a></p>
        ${dset('pad') === 'always' || touch ? keypadHtml(ex).replace('class="keypad"', 'class="keypad" aria-hidden="true" inert') : ''}
      </div>
      ${changed ? '<p style="margin-top:18px"><button class="btn ghost" data-act="dreset">Back to the standard settings</button></p>' : ''}
    </div>${footer()}`;
  }

  /* ---------- progress ---------- */
  function chartSvg(vals, max) {
    const W = 640, Hh = 180, pl = 36, pr = 12, pt = 12, pb = 24; const n = vals.length;
    const x = i => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)); const lo = Math.min(0, ...vals);
    const y = v => pt + (1 - (v - lo) / (max - lo)) * (Hh - pt - pb);
    const ticks = [lo, Math.round((max + lo) / 2), max];
    const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const area = `${line}L${x(n - 1).toFixed(1)},${y(lo)}L${x(0).toFixed(1)},${y(lo)}Z`;
    return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Test scores over time">${ticks.map(t => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
      <path class="area" d="${area}"/><path class="ln" d="${line}"/>${vals.map((v, i) => `<circle class="pt${i === n - 1 ? ' last' : ''}" cx="${x(i)}" cy="${y(v)}" r="${i === n - 1 ? 5 : 3.5}"/>`).join('')}
      <text x="${x(n - 1)}" y="${Math.max(12, y(vals[n - 1]) - 10)}" text-anchor="end" style="fill:var(--ink);font-weight:700">${vals[n - 1]}</text></svg>`;
  }
  function viewProgress() {
    const l = lv(); const ids = NS.tricksFor(l); const tricks = L().tricks;
    const total = Object.values(tricks).reduce((s, t) => s + t.n, 0); const ok = Object.values(tricks).reduce((s, t) => s + t.ok, 0);
    const fulls = L().tests.filter(t => t.kind === 'full'); const st = ids.map(id => NS.trickStatus(id, l).key); const cnt = k => st.filter(x => x === k).length;
    const rows = ids.filter(id => tricks[id] && tricks[id].n).map(id => ({ id, st: NS.trickStatus(id, l), t: tricks[id] }));
    main.innerHTML = `<header class="pagehead"><p class="eyebrow">${LV[l]}</p><h1>Progress</h1></header>
      <div class="stats4"><div><b>${total}</b><span>problems answered</span></div><div><b>${total ? Math.round(ok / total * 100) + '%' : '—'}</b><span>accuracy</span></div><div><b>${NS.streak(l)}</b><span>day streak</span></div><div><b>${L().tests.length}</b><span>tests taken</span></div></div>
      <div class="sect"><div class="sect-h"><h2>Full test scores</h2></div>${fulls.length ? `${chartSvg(fulls.slice(-20).map(t => t.score), 400)}<p class="faint small">Out of 400. Your last ${Math.min(20, fulls.length)} full test${fulls.length > 1 ? 's' : ''}.</p>` : '<div class="empty">Take a full test to start a score history.</div>'}</div>
      <div class="sect"><div class="sect-h"><h2>Tricks</h2></div><div>${statusBar(cnt, ids.length)}</div>
        ${cnt('new') === ids.length ? `<div class="empty">You haven’t started any tricks yet. <button class="btn link" data-go="t" data-arg="${NS.nextTrick(l)}">Start with the first one →</button></div>` : [1, 2, 3, 4].map(c => { const arr = ids.filter(id => NS.trickCol(id, l) === c); return arr.length ? `<div><p class="eyebrow" style="margin:6px 0 8px">Problems ${COLR[c]}</p><div class="heat">${arr.map(id => { const s = NS.trickStatus(id, l); return `<button class="cell ${s.key}" data-go="t" data-arg="${id}" title="${esc(s.label)}">${NS.rich(trickName(id))}</button>`; }).join('')}</div></div>` : ''; }).join('')}</div>
      ${rows.length ? `<div class="sect"><div class="sect-h"><h2>Detail</h2><span class="faint small">Weakest first</span></div><div class="tablewrap"><table class="t"><thead><tr><th>Trick</th><th>Status</th><th style="text-align:right">Last 12</th><th style="text-align:right">Typical time</th><th style="text-align:right">Target</th></tr></thead><tbody>${rows.sort((a, b) => (a.st.acc ?? 0) - (b.st.acc ?? 0)).map(x => `<tr><td><button class="btn link" data-go="t" data-arg="${x.id}" style="padding:0">${NS.rich(trickName(x.id))}</button></td><td>${pillFor(x.st)}</td><td class="n">${x.st.acc !== null ? Math.round(x.st.acc * 100) + '%' : '—'}</td><td class="n">${x.st.med ? x.st.med.toFixed(1) + 's' : '—'}</td><td class="n">${x.st.target}s</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="sect"><div class="sect-h"><h2>Facts</h2><button class="btn link" data-go="memorize">Memorize →</button></div><div class="mfacts">${NS.MEMO.map(s => `<button class="mf" data-go="memorize" data-arg="${s.id}"><b>${NS.rich(s.short || s.title, true)}</b><span class="mprog">${memoBar(NS.memoCount(l, s.id))}</span></button>`).join('')}</div></div>
      <div class="sect"><div class="sect-h"><h2>Use another device</h2></div><div>
        <p class="muted" style="max-width:62ch">Progress is saved in this browser only. To move it, copy your progress code, send it to yourself (an email or a note works), then paste it on the other device. One code carries both levels.</p>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="exportCode">Copy my progress code</button><button class="btn ghost" data-act="importOpen">Paste a code</button></div>
        <div id="moveout"></div></div></div>
      <div class="sect"><div class="sect-h"><h2>Reset</h2></div><div id="resetbox"><button class="btn ghost" data-act="resetAsk">Erase ${LV[l].toLowerCase()} progress</button></div></div>
      ${footer()}`;
  }

  // a miss in a round: show the shortcut (or just the answer in a timed round), queue a retry, end a Hardcore run
  function missShown(s, p, given, note, gaveUp) {
    s.state = 'shown'; if (s.beh === 'hardcore') s.over = true;
    if (s.mode === 'practice' && s.beh !== 'hardcore') (s.retry = s.retry || []).push({ trick: p.trick, due: s.results.length + 3 });
    if (timed(s) && !gaveUp) $('#sshort').innerHTML = `<p class="muted" style="margin-top:6px">Answer: <b class="m" style="color:var(--ink)">${R(NS.keyHtml(p.a), true)}</b>.${s.mode === 'arith' ? '' : ' The shortcut is in your summary.'}</p>`;
    else showShortcut(p, $('#sshort'), given, null);
    const kp = $('#stage .keypad'); if (kp) kp.remove();
    const r = $('.tally .r'); if (r) r.textContent = `✗ ${s.results.filter(x => !x.ok).length}`;
    $('#sunder').innerHTML = s.over ? `<button class="btn" data-act="sNext">See how you did <span class="kbd">Enter</span></button>` : `<button class="btn" data-act="sNext">Next <span class="kbd">Enter</span></button>`;
    void note;
  }
  // tricks keep their own record; arithmetic warm-ups only count toward the day
  function logAttempt(p, ok, ms) { if (p.trick) return S.record(p, ok, ms); const l = L(); const day = NS.today(); l.days[day] = (l.days[day] || 0) + 1; S.save(); }

  /* ---------- actions ---------- */
  const ACT = {
    setLevel(d) { S.data.level = d.lv; S.save(); state.session = null; state.test = null; state.teamCode = null; state.lessonTry = null; state.pickSet = null; state.custom = new Set(); const to = state.afterLevel || 'home'; state.afterLevel = null; location.hash = to; route(); },
    level() { guard(() => { state.session = null; location.hash = 'level'; }); },
    dset(d) { S.data.settings[d.k] = d.v; if (d.v === DISPLAY_DEF[d.k]) delete S.data.settings[d.k]; S.save(); applyTheme(); state.keepScroll = true; viewDisplay(); const b = $(`[data-act="dset"][data-k="${d.k}"][data-v="${d.v}"]`); if (b) b.focus({ preventScroll: true }); },
    dreset() { Object.keys(DISPLAY_DEF).forEach(k => delete S.data.settings[k]); S.save(); applyTheme(); state.keepScroll = true; viewDisplay(); toast('Standard settings restored'); },
    tfilter(d) { state.trickFilter = d.f; state.keepScroll = true; viewTricks(); },
    jumpTry() { const b = $('#tryit'); if (b) { b.scrollIntoView({ behavior: NS.reduceMotion() ? 'auto' : 'smooth', block: 'start' }); const i = $('#tryin'); if (i && !touch) setTimeout(() => i.focus({ preventScroll: true }), 300); } },
    exStep() { state.exShown++; renderExample(state.lessonId); },
    exAll() { state.exShown = 99; renderExample(state.lessonId); },
    exNew() { state.exSeed++; state.exShown = 0; renderExample(state.lessonId); },
    trySubmit() {
      const T = state.lessonTry; const inp = $('#tryin'); if (!T || !inp) return;
      if (T.wrong || T.hint) { T.i++; T.p = null; if (T.i >= 5) T.done = true; return renderTry(T.id); }
      if (!inp.value.trim()) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return; }
      const res = NS.check(T.p.a, inp.value); const ms = performance.now() - T.start;
      S.record(T.p, res.ok, ms); inp.disabled = true;
      if (res.ok) { T.right++; inp.classList.add('ok'); $('#tryfb').className = 'feedback ok'; $('#tryfb').textContent = `Right · ${(ms / 1000).toFixed(1)}s`; setTimeout(() => { T.i++; T.p = null; if (T.i >= 5) T.done = true; renderTry(T.id); }, 650); }
      else { T.wrong = true; const kp = $('#tryit .keypad'); if (kp) kp.remove(); inp.classList.add('bad', 'shake'); $('#tryfb').className = 'feedback bad'; $('#tryfb').textContent = 'Not quite.'; showShortcut(T.p, $('#tryhow'), inp.value, res.note); const b = $('[data-act="trySubmit"]'); b.innerHTML = 'Next <span class="kbd">Enter</span>'; $('[data-act="tryHint"]').remove(); b.focus(); }
    },
    tryHint() { const T = state.lessonTry; if (!T || T.wrong || T.hint) return; T.hint = true; S.record(T.p, false, performance.now() - T.start); const inp = $('#tryin'); inp.disabled = true; showShortcut(T.p, $('#tryhow')); $('#tryfb').textContent = ''; const kp = $('#tryit .keypad'); if (kp) kp.remove(); const b = $('[data-act="trySubmit"]'); b.innerHTML = 'Next <span class="kbd">Enter</span>'; $('[data-act="tryHint"]').remove(); b.focus(); },
    tryAgain() { state.lessonTry = null; renderTry(state.lessonId); },
    drillTrick(d) { guard(() => startSession({ mode: 'practice', tricks: [d.id], label: trickName(d.id) })); },
    quickSprint() { const l = lv(); const ids = NS.tricksFor(l).filter(id => NS.trickCol(id, l) === 1); startSession({ mode: 'sprint', dur: 120, tricks: ids, label: 'Sprint · Problems 1–20' }); },
    quickWeak() { const l = lv(); const weak = NS.weakTricks(l); const ms = L().misses.filter(m => NS.GBY[m.g]).slice(-10);
      if (weak.length) return startSession({ mode: 'practice', tricks: weak, label: 'Weak spots', queue: ms.filter(m => NS.GBY[m.g] && weak.includes(NS.GBY[m.g].trick)) });
      if (ms.length) return startSession({ mode: 'practice', tricks: [...new Set(ms.map(m => NS.GBY[m.g].trick))], label: 'Redo my misses', queue: ms.slice() });
      go('t', NS.nextTrick(l)); },
    pmode(d) { state.pickMode = d.m; state.keepScroll = true; viewPractice(); },
    plen(d) { state.sprintLen = +d.s; state.keepScroll = true; viewPractice(); },
    pset(d) { state.pickSet = d.k; state.keepScroll = true; viewPractice(); },
    startPractice() {
      if (state.pickMode === 'arith') return startSession({ mode: 'arith', dur: state.sprintLen, tricks: [], arith: arithCfg(), label: 'Arithmetic warm-up' });
      const sets = practiceSets(lv()); const cur = sets.find(s => s.k === state.pickSet); if (!cur || !cur.tricks.length) return;
      const beh = state.pickMode === 'sprint' && state.pickBeh === 'noenter' ? 'normal' : state.pickBeh || 'normal';
      startSession({ mode: state.pickMode, beh, len: state.pickLen || 20, dur: state.sprintLen, tricks: cur.tricks, label: (state.pickMode === 'sprint' ? 'Sprint · ' : '') + cur.name.replace(/\s*\(\d+\)$/, '').replace(/^Up next: /, ''), queue: cur.misses ? L().misses.slice(-20) : [] }); },
    pbeh(d) { state.pickBeh = d.b; S.data.settings.pbeh = d.b; S.save(); state.keepScroll = true; viewPractice(); },
    prlen(d) { state.pickLen = +d.n; S.data.settings.plen = +d.n; S.save(); state.keepScroll = true; viewPractice(); },
    arop(d) { const a = arithCfg(); const has = a.ops.includes(d.op); if (has && a.ops.length === 1) { toast('Keep at least one kind of problem'); return; } a.ops = has ? a.ops.replace(d.op, '') : a.ops + d.op; S.data.settings.arith = NS.arithClean(a); S.save(); state.keepScroll = true; viewPractice(); },
    arreset() { delete S.data.settings.arith; S.save(); state.keepScroll = true; viewPractice(); },
    quickArith() { guard(() => { state.pickMode = 'arith'; startSession({ mode: 'arith', dur: 120, tricks: [], arith: arithCfg(), label: 'Arithmetic warm-up' }); }); },
    quickEst() { guard(() => startSession({ mode: 'practice', beh: S.data.settings.pbeh || 'normal', len: 10, tricks: ['estimate'], label: 'Starred estimation' })); },
    pdiff(d) { state.pickDiff = d.d; S.data.settings.pdiff = d.d; S.save(); state.keepScroll = true; viewPractice(); },
    tdiff(d) { state.testDiff = d.d; S.data.settings.tdiff = d.d; S.save(); state.teamCode = null; state.keepScroll = true; viewTests(); },
    sSubmit() {
      const s = state.session; if (!s || s.state !== 'ask') return; const inp = $('#sin'); const p = s.cur;
      if (!inp.value.trim()) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return; }
      const res = NS.check(p.a, inp.value); const ms = performance.now() - s.t0;
      s.results.push({ p, ok: res.ok, ms, given: inp.value }); logAttempt(p, res.ok, ms); if (s.beh !== 'test') autoAdjust(s, res.ok, ms, p);
      if (s.beh === 'test') { s.saved = true; return nextProblem(); }
      const fb = $('#sfb'); inp.disabled = true; const stk = $('#stk'); if (stk && p.trick && s.tricks.length > 1) stk.innerHTML = NS.rich(trickName(p.trick), true);
      if (res.ok && (timed(s) || s.beh === 'noenter')) { s.flash = ms; return nextProblem(); }
      if (res.ok) {
        inp.classList.add('ok'); fb.className = 'feedback ok'; const tgt = NS.TARGET[p.col] + (p.est ? 6 : 0); fb.textContent = `Right · ${(ms / 1000).toFixed(1)}s${s.mode === 'practice' && ms / 1000 > tgt ? ` · test pace is about ${tgt}s` : ''}`; s.state = 'flash';
        const g = $('.tally .g'); if (g) g.textContent = s.beh === 'hardcore' ? `Streak ${s.results.filter(x => x.ok).length}` : `✓ ${s.results.filter(x => x.ok).length}`;
        setTimeout(() => { if (state.session === s && !s.done) nextProblem(); }, ms / 1000 > NS.TARGET[p.col] + (p.est ? 6 : 0) ? 1100 : 480);
      } else {
        inp.classList.add('bad', 'shake'); fb.className = 'feedback bad'; fb.textContent = res.note || (s.beh === 'hardcore' ? 'That ends the run.' : 'Not quite.');
        missShown(s, p, inp.value, res.note);
        inp.disabled = false; inp.readOnly = true; if (!touch) inp.focus({ preventScroll: true });
      }
    },
    sGiveUp() { const s = state.session; if (!s || s.state !== 'ask') return; const p = s.cur; const ms = performance.now() - s.t0; s.results.push({ p, ok: false, ms, given: '' }); logAttempt(p, false, ms); if (s.beh !== 'test') autoAdjust(s, false, ms, p);
      if (s.beh === 'test') { s.saved = true; return nextProblem(); }
      { const stk = $('#stk'); if (stk && p.trick && s.tricks.length > 1) stk.innerHTML = NS.rich(trickName(p.trick), true); } $('#sfb').className = s.beh === 'hardcore' ? 'feedback bad' : 'feedback'; $('#sfb').textContent = s.beh === 'hardcore' ? 'That ends the run.' : '';
      missShown(s, p, '', null, true); const inp = $('#sin'); inp.readOnly = true; if (!touch) inp.focus({ preventScroll: true }); },
    sNext() { nextProblem(); },
    quitSession() { const s = state.session; if (!s) return; if (s.results.length) finishSession(); else { endSession(true); viewPractice(); setNav('practice'); } },
    again() { const s = state.session; state.session = null; startSession({ mode: s.mode, beh: s.beh, len: s.len, dur: s.dur, arith: s.arith, tricks: s.tricks, label: s.label, diff: s.autoSel ? 'auto' : NS.DIFFS[s.di0].id }); },
    redoMissed() { const s = state.session; const q = s.results.filter(x => !x.ok).map(x => ({ g: x.p.gid, s: x.p.seed, d: x.p.diff, at: x.p.at })); state.session = null; startSession({ mode: 'practice', beh: 'normal', len: q.length + Math.min(10, q.length), tricks: s.tricks, label: s.label.replace(/^Sprint · /, ''), queue: q, diff: s.autoSel ? 'auto' : NS.DIFFS[s.di0].id }); },
    newSetup() { state.session = null; viewPractice(); },
    tkind(d) { state.testKind = d.k; state.teamCode = null; state.keepScroll = true; viewTests(); },
    tcol(d) { state.testCol = +d.c; state.teamCode = null; state.keepScroll = true; viewTests(); },
    teamCode() {
      const l = lv(); const cols = state.testKind === 'full' ? [1, 2, 3, 4] : [state.testCol];
      const diff = state.testDiff || 'contest'; const dn = NS.DIFFS[NS.diffIdx(diff)].name;
      let code; do { code = NS.testCode(l, cols, NS.testSeed(), diff); } while (state.teamCode && code === state.teamCode.code);
      state.teamCode = { code, lv: l, what: testPhrase(l, cols, diff) };
      $('#teambox').innerHTML = teamBox(); $('#teambox [data-act="copyCode"]').focus({ preventScroll: true });
    },
    teamStart() { const tc = state.teamCode; const spec = tc && NS.readTestCode(tc.code); if (spec && spec.lv === lv()) startTest(spec); },
    startTest() { startTest(); },
    printTest() { const l = lv(); const cols = state.testKind === 'full' ? [1, 2, 3, 4] : [state.testCol]; go('print', NS.testCode(l, cols, NS.testSeed(), state.testDiff || 'contest')); },
    printCode(d) { const code = d.code || (state.test && state.test.code) || (state.teamCode && state.teamCode.code); if (code) guard(() => go('print', code)); },
    printNew() { const sp = state.printSpec; if (sp) go('print', NS.testCode(sp.lv, sp.cols, NS.testSeed(), sp.diff)); },
    doPrint() { try { window.print(); } catch (e) { /* blocked: the note below the button covers it */ } },
    finishTest() { const T = state.test; if (!T) return; const blank = T.answers.filter(a => !a.trim()).length; confirmBar(`Grade now? ${fmtTime(Math.max(0, T.dur - (Date.now() - T.start) / 1000))} is left on the clock.`, 'Grade it', () => gradeTest(false)); void blank; },
    leaveTest() { guard(() => go('test')); },
    testAgain() { state.test = null; startTest(); },
    memoDrill(d) { startMemo([d.id], memoSet(d.id).title); },
    memoMix() { guard(() => startMemo(NS.MEMO_CORE.map(s => s.id), 'Mixed facts')); },
    memoCover() { state.memoCover = !state.memoCover; state.keepScroll = true; viewMemoSet(state.memoSetId); },
    memoPeek(d, el) { const t = $('#mtable'); if (t && t.classList.contains('covered')) el.classList.toggle('open'); },
    mSubmit() {
      const m = state.memo; if (!m || m.state !== 'ask') return; const inp = $('#min'); const c = m.cur;
      if (!inp.value.trim()) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return; }
      const res = NS.check(c.card.a, inp.value); const ms = performance.now() - m.t0;
      m.results.push({ ...c, ok: res.ok, ms, given: inp.value }); NS.memoRecord(m.lv, c.item.k, res.ok, ms);
      if (res.ok) { m.flash = ms; return nextCard(); }
      memoMiss(c, res.note);
    },
    mGiveUp() { const m = state.memo; if (!m || m.state !== 'ask') return; const c = m.cur; const ms = performance.now() - m.t0; m.results.push({ ...c, ok: false, ms, given: '' }); NS.memoRecord(m.lv, c.item.k, false, ms); memoMiss(c, null); },
    mNext() { nextCard(); },
    memoQuit() { const m = state.memo; if (!m) return; if (m.results.length) finishMemo(); else { state.memo = null; viewMemorize(m.ids.length === 1 ? m.ids[0] : ''); setNav('memorize'); } },
    memoAgain() { const m = state.memo; startMemo(m.ids, m.title); },
    memoBack() { const m = state.memo; state.memo = null; if (m.ids.length === 1) go('memorize', m.ids[0]); else go('memorize'); },
    exportCode(d, el) {
      const out = $('#moveout'); const label = el.textContent; el.setAttribute('aria-busy', 'true'); el.textContent = 'Making your code…';
      const made = NS.exportProgress(S.data);
      // start the copy inside the click, so browsers that are strict about clipboard access still allow it
      let copied;
      try { copied = window.ClipboardItem && navigator.clipboard && navigator.clipboard.write ? navigator.clipboard.write([new ClipboardItem({ 'text/plain': made.then(c => new Blob([c], { type: 'text/plain' })) })]) : made.then(c => navigator.clipboard.writeText(c)); } catch (e) { copied = Promise.reject(e); }
      made.then(code => {
        el.removeAttribute('aria-busy'); el.textContent = label;
        out.innerHTML = `<textarea class="codearea" id="pcode" readonly rows="4" spellcheck="false" aria-label="Your progress code">${esc(code)}</textarea><p class="small muted" id="pmsg" style="margin-top:8px"></p>`;
        const kb = Math.max(1, Math.round(code.length / 1000));
        copied.then(() => { $('#pmsg').innerHTML = `<b style="color:var(--ok)">Copied.</b> ${code.length > 2000 ? `It’s long (about ${kb}k characters), so an email or a note to yourself is the safest way to send it.` : 'Paste it on your other device.'}`; },
          () => { const ta = $('#pcode'); ta.focus(); ta.select(); $('#pmsg').textContent = 'Your browser didn’t let the page copy it. The code is selected above: copy it yourself (Ctrl+C, or ⌘C on a Mac).'; });
      }, () => { el.removeAttribute('aria-busy'); el.textContent = label; out.innerHTML = '<p class="small fieldmsg" style="margin-top:10px">This browser couldn’t make a code. Try a current version of Chrome, Safari, Edge or Firefox.</p>'; });
    },
    importOpen() {
      $('#moveout').innerHTML = `<label class="small" for="pin" style="display:block;margin-top:16px"><b>Paste the code from your other device</b></label><textarea class="codearea" id="pin" rows="4" spellcheck="false" autocomplete="off" placeholder="It starts with EIT1"></textarea><div class="row" style="margin-top:10px"><button class="btn" data-act="importRead">Load it</button></div><div id="pconf" aria-live="polite"></div>`;
      $('#pin').focus();
    },
    async importRead() {
      const box = $('#pconf'); const res = await NS.readProgress($('#pin').value);
      if (res.error) { box.innerHTML = `<p class="small" style="color:var(--bad);margin-top:10px">${res.error === 'old' ? 'This browser is too old to read the code. Try a current version of Chrome, Safari, Edge or Firefox.' : 'That code didn’t work. Codes start with EIT1. Check that you copied all of it, start to end.'}</p>`; return; }
      state.pendingImport = res.data;
      const sum = (data, l) => { const x = NS.progressSummary(data, l); return x.answered || x.tests || x.facts ? `${x.answered.toLocaleString()} problem${x.answered === 1 ? '' : 's'}, ${x.tests} test${x.tests === 1 ? '' : 's'}${x.facts ? `, ${x.facts} fact${x.facts === 1 ? '' : 's'} drilled` : ''}` : 'nothing yet'; };
      box.innerHTML = `<div class="confirm" style="margin-top:12px;flex-direction:column;align-items:flex-start"><div><b>This code has</b><br>High school: ${sum(res.data, 'hs')}<br>Middle school: ${sum(res.data, 'ms')}</div>
        <p class="small muted">Loading it replaces what this device has now (high school: ${sum(S.data, 'hs')}; middle school: ${sum(S.data, 'ms')}).</p>
        <div class="row"><button class="btn small" data-act="importYes">Replace with this</button><button class="btn small ghost" data-act="importNo">Cancel</button></div></div>`;
    },
    importYes() { const d = state.pendingImport; if (!d) return; if (!d.level) d.level = lv(); S.data = d; S.save(); state.pendingImport = null; state.session = null; state.test = null; state.memo = null; applyTheme(); toast('Progress loaded'); go('home'); },
    importNo() { state.pendingImport = null; $('#moveout').innerHTML = ''; },
    names() { S.data.settings.names = !S.data.settings.names; S.save(); state.keepScroll = true; viewPractice(); },
    codeStart() {
      const inp = $('#tcode'); const msg = $('#tcodemsg'); const v = inp.value.trim();
      const spec = NS.readTestCode(v);
      const say = t => { msg.textContent = t; msg.className = 'small fieldmsg'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); };
      if (!v) return say('Type the code first. It looks like HF-7K2M.');
      if (!spec) return say('That code doesn’t look right. Codes are two characters, a dash, then four more, like HF-7K2M. Harder or easier tests add one more letter at the end, like HF-7K2M-H.');
      if (spec.lv !== lv()) return say(`That’s a ${LV[spec.lv].toLowerCase()} test. Switch levels with the button at the top right, then enter it again.`);
      startTest(spec);
    },
    retake(d) { const spec = NS.readTestCode(d.code); if (spec && spec.lv === lv()) startTest(spec); },
    copyCode(d, el) { const code = d.code || (state.test && state.test.code); if (!code) return; const done = () => { el.textContent = 'Copied'; setTimeout(() => { el.textContent = 'Copy'; }, 1600); };
      try { navigator.clipboard.writeText(code).then(done, () => { el.textContent = 'Select the code to copy it'; }); } catch (e) { el.textContent = 'Select the code to copy it'; } },
    testMenu() { state.test = null; viewTests(); },
    drillMissed() { const T = state.test; const q = T.probs.filter((p, i) => T.res.marks[i] === 'bad' || T.res.marks[i] === 'skip').map(p => ({ g: p.gid, s: p.seed, d: p.diff, at: p.at })); const tr = [...new Set(T.probs.filter((p, i) => T.res.marks[i] === 'bad' || T.res.marks[i] === 'skip').map(p => p.trick))]; state.test = null; startSession({ mode: 'practice', tricks: tr, label: 'Test misses', queue: q }); },
    showWhy(d) { const T = state.test; const p = T.probs[+d.i]; const box = $('#why' + d.i); if (box.innerHTML) { box.innerHTML = ''; return; } box.innerHTML = `<ol class="steps" style="margin:8px 0 4px">${p.steps.map(x => `<li>${R(x, true)}</li>`).join('')}</ol><button class="btn link small" data-go="t" data-arg="${p.trick}">Lesson: ${NS.rich(trickName(p.trick))} →</button>`; },
    resetAsk() { $('#resetbox').innerHTML = `<div class="confirm"><b>Erase all ${LV[lv()].toLowerCase()} progress on this device? This can’t be undone.</b><button class="btn small" data-act="resetYes">Erase it</button><button class="btn small ghost" data-act="resetNo">Cancel</button></div>`; },
    resetYes() { S.reset(lv()); toast('Progress erased'); viewProgress(); },
    resetNo() { $('#resetbox').innerHTML = '<button class="btn ghost" data-act="resetAsk">Erase progress</button>'; },
  };

  /* global keys */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SUMMARY') return;
    if (state.view === 'practice' && !state.session) { e.preventDefault(); ACT.startPractice(); }
    else if (state.view === 'practice' && state.session && state.session.done) { e.preventDefault(); ACT.again(); }
    else if (state.session && state.session.state === 'shown') { e.preventDefault(); nextProblem(); }
    else if (state.view === 'memorize' && state.memo && state.memo.done) { e.preventDefault(); ACT.memoAgain(); }
    else if (state.view === 'memorize' && state.memo && state.memo.state === 'shown') { e.preventDefault(); nextCard(); }
    else if (state.view === 'memorize' && !state.memo && state.memoSetId) { e.preventDefault(); ACT.memoDrill({ id: state.memoSetId }); }
  });

  function applyTheme() {
    const st = S.data.settings, root = document.documentElement; const t = st.theme || 'system';
    if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    for (const k of ['tsize', 'contrast', 'font', 'motion']) { if (st[k] && st[k] !== DISPLAY_DEF[k]) root.setAttribute('data-' + k, st[k]); else root.removeAttribute('data-' + k); }
    document.body.classList.toggle('showpad', st.pad === 'always');
  }
  // smooth scrolling only when motion is welcome
  NS.reduceMotion = () => S.data.settings.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  applyTheme();
  // practice hash changes made by startSession should not reset the session
  const _route = route;
  window.removeEventListener('hashchange', route);
  window.addEventListener('hashchange', () => { if (state.silent) { state.silent = false; renderSession(); setNav('practice'); state.view = 'practice'; return; } if (location.hash === '#test' && state.test && !state.test.done) { state.view = 'test'; renderTest(); setNav('test'); window.scrollTo(0, 0); return; } _route(); });
  NS._state = state;
  // links from the trick and test pages pick the level: ?level=ms or ?level=hs
  try { const q = new URLSearchParams(location.search).get('level'); if (q === 'ms' || q === 'hs') { if (S.data.level !== q) { S.data.level = q; S.save(); } history.replaceState(null, '', location.pathname + location.hash); } } catch (e) { /* the page still works without it */ }
  route();
})();
