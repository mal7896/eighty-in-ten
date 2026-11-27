/* ===== the app (DOM) ===== */
(function () {
  const S = NS.store; S.load();
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = NS.esc;
  const LV = { ms: 'Middle school', hs: 'High school' };
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
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg>',
  };
  const TABS = [['home', 'Home'], ['tricks', 'Tricks'], ['memorize', 'Memorize'], ['practice', 'Practice'], ['test', 'Tests'], ['progress', 'Progress']];

  /* ---------- shell ---------- */
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="top"><div class="top-in">
      <button class="brand" data-go="home" aria-label="Eighty in Ten, home"><b>eighty<i>in</i>ten</b></button>
      <nav class="nav" aria-label="Main">${TABS.map(([k, l]) => `<button data-go="${k}">${IC[k]}${l}</button>`).join('')}</nav>
      <button class="lvl" data-act="level" id="lvlbtn" title="Switch level"><span id="lvlname"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    </div></header>
    <main id="main" tabindex="-1"></main>
    <nav class="tabbar" aria-label="Main">${TABS.map(([k, l]) => `<button data-go="${k}">${IC[k]}<span>${l}</span></button>`).join('')}</nav>`);
  const main = $('#main');

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
  }
  function route() {
    const h = location.hash.slice(1) || 'home';
    if (!lv() || h === 'level') return viewLevel();
    const [v, ...rest] = h.split('-'); const arg = rest.join('-');
    if (state.session && !state.session.done && v !== 'practice' && v !== 't') endSession(true);
    state.view = v;
    if (state.memo && v !== 'memorize') state.memo = null;
    const views = { home: viewHome, tricks: viewTricks, t: () => viewLesson(arg), memorize: () => viewMemorize(arg), practice: viewPractice, test: viewTests, progress: viewProgress };
    (views[v] || viewHome)();
    setNav(v === 't' ? 'tricks' : v);
    if (!state.keepScroll) window.scrollTo(0, 0); state.keepScroll = false;
  }

  /* ---------- level picker ---------- */
  function viewLevel() {
    setNav(''); document.body.classList.remove('in-session');
    const ms = NS.makeProblem('sameFront', 'ms', 31), hs = NS.makeProblem('logs', 'hs', 12);
    main.innerHTML = `<section class="welcome">
      <h1>Which test are you practicing for?</h1>
      <p class="lede">Lessons, drills and full practice tests for Number Sense, built from real contest tests.</p>
      <div class="grid2" style="margin-top:22px">
        <button class="pick" data-act="setLevel" data-lv="ms"><span class="lvtag">Grades 6–8</span><h2>Middle school</h2><span class="muted">TMSCA middle school and UIL A+ junior high.</span><span class="sample">${R(ms.p.h, true)} <span class="sample-a">${R(NS.keyHtml(ms.a), true)}</span></span></button>
        <button class="pick" data-act="setLevel" data-lv="hs"><span class="lvtag">Grades 9–12</span><h2>High school</h2><span class="muted">UIL and TMSCA high school, through calculus.</span><span class="sample">${R(hs.p.h, true)} <span class="sample-a">${R(NS.keyHtml(hs.a), true)}</span></span></button>
      </div>
      <p class="faint small" style="margin-top:16px">You can switch later from the top bar. Progress is saved in this browser, and the Progress page can move it to another device.</p>
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
          <button class="li" data-act="quickWeak"><span><b>${weak.length ? 'Weak spots' : misses ? 'Problems you missed' : 'Weak spots'}</b><span class="muted">${weak.length ? `${weak.length} trick${weak.length > 1 ? 's' : ''} under 85%, starting with ${NS.rich(trickName(weak[0]))}.` : misses ? `${misses} problem${misses > 1 ? 's' : ''} waiting to be redone.` : 'Nothing here yet. Tricks you miss will collect here.'}</span></span><span class="arr">→</span></button>
          <button class="li" data-act="memoMix"><span><b>Facts drill</b><span class="muted">Twenty quick cards: squares, cubes, fractions, triples and more.</span></span><span class="arr">→</span></button>
          <button class="li" data-go="test"><span><b>Full practice test</b><span class="muted">80 problems, 10 minutes, scored like a contest.</span></span><span class="arr">→</span></button>
        </div></div>
      <div class="duo">
        <div class="sect"><div class="sect-h"><h2>Your tricks</h2><button class="btn link" data-go="tricks">All ${ids.length} →</button></div>
          <div>${statusBar(cnt, ids.length)}</div></div>
        <div class="sect"><div class="sect-h"><h2>Full tests</h2><button class="btn link" data-go="${fulls.length >= 2 ? 'progress' : 'test'}">${fulls.length >= 2 ? 'Progress' : 'Take one'} →</button></div>
          ${fulls.length >= 2 ? chartSvg(fulls.slice(-12).map(t => t.score), 400) : `<p class="muted">${fulls.length ? `One so far: ${fulls[0].score} out of 400. Your scores show up here as a chart after the second.` : 'No full tests yet. One a week is a good rhythm, with single columns in between.'}</p>`}</div>
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
    const theme = S.data.settings.theme || 'system';
    return `<footer class="foot"><span>Tricks drawn from <a href="https://bryantheath.com/files/2018/04/Heath_NSTricks_revA.pdf" target="_blank" rel="noopener">Bryant Heath’s Number Sense Tricks</a> and <a href="https://www.math-magic.org" target="_blank" rel="noopener">Math Magic</a>. Problem order follows the <a href="https://www.uiltexas.org/academics/stem/number-sense" target="_blank" rel="noopener">UIL sequence chart</a>. Problems here are generated fresh; for real past tests, see <a href="https://www.uiltexas.org/academics/page/high-school-academic-study-materials" target="_blank" rel="noopener">UIL’s study materials</a>.</span>
      <span class="row" style="gap:14px"><button data-act="theme">Theme: ${theme}</button><button data-act="level">Switch level</button></span></footer>`;
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
          <div><div class="row" style="gap:14px"><p class="eyebrow">Problems ${COLR[c]}</p>${pillFor(st, true)}</div><h1 style="margin-top:6px">${NS.rich(t.title)}</h1><p class="spot"><b>Use it when:</b> ${NS.rich(t.s)}</p></div>
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
        <p class="muted small">${T.right === 5 ? 'You’ve got the idea. A round of 20 is what makes it automatic.' : T.right >= 3 ? 'Close. In a practice round, every miss shows you the shortcut for that exact problem.' : 'Read the steps once more, then try a round. Every miss shows the shortcut for that problem.'}</p>
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
    sets.push({ k: 'custom', name: 'Choose tricks…', d: state.custom.size ? `${state.custom.size} selected.` : 'Pick exactly what to drill.', tricks: [...state.custom] });
    return sets;
  }
  function viewPractice() {
    if (state.session && !state.session.done) return renderSession();
    if (state.session && state.session.done && state.session.showSummary) return renderSummary();
    const l = lv(); const sets = practiceSets(l); if (!state.pickDiff) state.pickDiff = S.data.settings.pdiff || 'auto';
    if (!state.pickSet || !sets.find(s => s.k === state.pickSet)) state.pickSet = sets[0].k;
    const cur = sets.find(s => s.k === state.pickSet);
    const ids = NS.tricksFor(l);
    const modeHint = state.pickMode === 'sprint' ? 'As many as you can before time runs out. Right answers move on by themselves.' : '20 problems, no clock. Miss one and you see how to do that exact problem fast.';
    main.innerHTML = `<div class="setup"><header class="pagehead"><p class="eyebrow">${LV[l]}</p><h1>Practice</h1></header>
      <div class="cfg">
        <div class="cfg-row"><span class="cfg-l">Mode</span><div class="cfg-v"><div class="row" style="gap:8px"><div class="seg" role="group" aria-label="Mode"><button data-act="pmode" data-m="practice" aria-pressed="${state.pickMode === 'practice'}">Practice round</button><button data-act="pmode" data-m="sprint" aria-pressed="${state.pickMode === 'sprint'}">Sprint</button></div>
          ${state.pickMode === 'sprint' ? `<div class="seg" role="group" aria-label="Sprint length">${[[60, '1 min'], [120, '2 min'], [300, '5 min']].map(([sec, nm]) => `<button data-act="plen" data-s="${sec}" aria-pressed="${state.sprintLen === sec}">${nm}</button>`).join('')}</div>` : ''}</div>
          <p class="note-s">${modeHint}</p></div></div>
        <div class="cfg-row"><span class="cfg-l">Difficulty</span><div class="cfg-v">${diffSeg('pdiff', state.pickDiff, true)}</div></div>
        ${cur.tricks.length > 1 ? `<div class="cfg-row"><span class="cfg-l">Trick names</span><div class="cfg-v"><button class="switch" role="switch" aria-checked="${!!S.data.settings.names}" data-act="names"><span class="sw" aria-hidden="true"></span><span class="swt"><span>${S.data.settings.names ? 'Shown on each problem.' : 'Hidden, like a real test. You spot the trick; the name shows after you answer.'}</span></span></button></div></div>` : ''}
      </div>
      <h2 class="label">Problems from</h2>
      <div class="opts" role="group" aria-label="Problems from">${sets.map(st => `<button class="opt" data-act="pset" data-k="${st.k}" aria-pressed="${st.k === state.pickSet}"><b>${NS.rich(st.name)}</b><span>${NS.rich(st.d)}</span></button>`).join('')}</div>
      ${state.pickSet === 'custom' ? `<div class="picker" id="picker">${[1, 2, 3, 4].map(c => { const arr = ids.filter(id => NS.trickCol(id, l) === c); return arr.length ? `<h4>Problems ${COLR[c]}</h4>${arr.map(id => `<label><input type="checkbox" data-trick="${id}" ${state.custom.has(id) ? 'checked' : ''}>${NS.rich(trickName(id))}</label>`).join('')}` : ''; }).join('')}</div>` : ''}
      <div class="row startbar"><button class="btn" data-act="startPractice" ${cur.tricks.length ? '' : 'disabled'}>Start ${state.pickMode === 'sprint' ? 'sprint' : 'round'} <span class="kbd">Enter</span></button>${cur.tricks.length ? '' : '<span class="faint small">Pick at least one trick.</span>'}</div>
      </div>${footer()}`;
    const pk = $('#picker'); if (pk) pk.addEventListener('change', e => { const id = e.target.dataset.trick; if (!id) return; if (e.target.checked) state.custom.add(id); else state.custom.delete(id); const keep = pk.scrollTop; state.keepScroll = true; viewPractice(); const p2 = $('#picker'); if (p2) p2.scrollTop = keep; });
  }

  /* ---------- practice session ---------- */
  function startSession(opts) {
    const l = lv();
    const dsel = opts.diff || state.pickDiff || 'auto'; const auto = dsel === 'auto';
    // Auto starts at Contest, or at Warm-up when every trick in the round is still new
    const startDi = auto ? (opts.tricks.length && opts.tricks.every(id => NS.trickStatus(id, l).key === 'new') ? 0 : 1) : NS.diffIdx(dsel);
    state.session = { mode: opts.mode, tricks: opts.tricks, label: opts.label, lv: l, total: opts.mode === 'practice' ? 20 : null, dur: opts.dur || 120, results: [], r: new NS.Rng(newSeed()), queue: opts.queue || [], startAt: performance.now(), done: false, state: 'ask', last: null, auto, di: startDi, di0: startDi, diMax: startDi, hist: [], moved: 0 };
    if (location.hash.slice(1) !== 'practice') { state.silent = true; location.hash = 'practice'; }
    setNav('practice'); nextProblem();
  }
  function nextProblem() {
    const s = state.session; if (!s) return;
    if (s.mode === 'practice' && s.results.length >= s.total) return finishSession();
    let p;
    while (s.queue.length && !NS.GBY[s.queue[0].g]) s.queue.shift();
    const due = (s.retry || []).findIndex(x => s.results.length >= x.due);
    const dname = NS.DIFFS[s.di].id;
    if (!s.queue.length && due >= 0) { const tr = s.retry.splice(due, 1)[0].trick; p = NS.problemForTrick(tr, s.lv, s.r.int(1, 2 ** 31), s.last && s.last.gid, dname); }
    else if (s.queue.length) { const m = s.queue.shift(); p = NS.makeProblem(m.g, s.lv, m.s, m.d || 'contest', m.at); }
    else { const tr = NS.pickTrick(s.tricks, s.lv, s.r, s.last && s.last.trick); p = NS.problemForTrick(tr, s.lv, s.r.int(1, 2 ** 31), s.last && s.last.gid, dname); }
    s.cur = p; s.state = 'ask'; s.t0 = performance.now(); s.last = p;
    renderSession();
  }
  function renderSession() {
    const s = state.session; const p = s.cur; setNav('practice');
    const right = s.results.filter(x => x.ok).length, wrong = s.results.length - right;
    const pct = s.mode === 'practice' ? s.results.length / s.total * 100 : 0;
    main.innerHTML = `<div class="session">
      <div class="sbar"><button class="x" data-act="quitSession" aria-label="End session">${IC.x}</button><span class="what">${NS.rich(s.label)}</span>${diffChip(p.diff || 'contest', s.auto ? '<span class="dauto"> · auto</span>' : '')}
        <span class="tally"><span class="g">✓ ${right}</span><span class="r">✗ ${wrong}</span></span>${s.mode === 'sprint' ? `<span class="clock" id="clock">${fmtTime(s.dur)}</span>` : `<span class="faint num small">${s.results.length + 1}/${s.total}</span>`}</div>
      <div class="prog"><span id="progbar" style="width:${pct}%"></span></div>
      <div class="stage" id="stage">
        <span class="tk" id="stk">${s.tricks.length === 1 ? '' : S.data.settings.names ? NS.rich(trickName(p.trick), true) : s.mode === 'sprint' ? '' : 'Which trick fits?'}</span>${p.est ? '<span class="star">* within 5%</span>' : ''}
        <div class="prob ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)}</div>
        <div>${blankHtml(p, 'id="sin"')}</div>
        <div class="preview" id="spv"></div>
        <div class="feedback" id="sfb" aria-live="polite"></div>
        <div id="sshort"></div>
        ${keypadHtml(p)}
        <div class="under" id="sunder">${s.mode === 'practice' ? '<button class="btn" data-act="sSubmit">Check <span class="kbd">Enter</span></button><button class="btn ghost" data-act="sGiveUp">Show the shortcut</button>' : '<button class="btn ghost small" data-act="sGiveUp">Skip</button>'}</div>
      </div>
      <p class="faint small" style="text-align:center;margin-top:14px">${touch ? 'Use space for mixed numbers: 3 1/4.' : 'Type mixed numbers with a space: 3 1/4. Fractions with a slash: 7/8.'}</p></div>`;
    const inp = $('#sin');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (s.state === 'ask') ACT.sSubmit(); else if (s.state === 'shown') nextProblem(); } });
    inp.addEventListener('input', () => { $('#spv').innerHTML = previewOf(inp.value); if (s.mode === 'sprint' && s.state === 'ask' && NS.check(p.a, inp.value).ok) ACT.sSubmit(); });
    if (!touch) inp.focus({ preventScroll: true }); else activeInput = inp;
    if (s.moved) { const fb = $('#sfb'); fb.className = 'feedback lvl fadeout'; fb.textContent = s.moved > 0 ? `Nice run. Moving up to ${NS.DIFFS[s.di].name}.` : `Stepping back to ${NS.DIFFS[s.di].name} for a few.`; s.moved = 0; }
    else if (s.mode === 'sprint' && s.flash != null) {
      // the last answer was right: say so on the new problem, where it stays readable, then fade
      const fb = $('#sfb'); fb.className = 'feedback ok fadeout'; fb.textContent = `✓ Right · ${(s.flash / 1000).toFixed(1)}s`;
      $('#stage').classList.add('pulse'); $('.tally .g').classList.add('bump'); s.flash = null;
    }
    if (s.mode === 'sprint') tickSprint();
  }
  function tickSprint() {
    const s = state.session; clearInterval(state.sprintTimer);
    const upd = () => { if (!state.session || s !== state.session || s.done) return clearInterval(state.sprintTimer);
      const left = Math.max(0, s.dur - (performance.now() - s.startAt) / 1000); const c = $('#clock'); if (c) { c.textContent = fmtTime(Math.ceil(left)); c.classList.toggle('low', left <= 10); }
      if (left <= 0) { clearInterval(state.sprintTimer); finishSession(); } };
    upd(); state.sprintTimer = setInterval(upd, 200);
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
    renderSummary();
  }
  function endSession(silent) { const s = state.session; if (!s) return; clearInterval(state.sprintTimer); s.done = true; s.showSummary = !silent && s.results.length > 0; if (silent) state.session = null; }
  function renderSummary() {
    const s = state.session; setNav('practice'); document.body.classList.remove('in-session');
    const n = s.results.length, right = s.results.filter(x => x.ok).length; const acc = n ? right / n : 0;
    const times = s.results.filter(x => x.ok).map(x => x.ms).sort((a, b) => a - b); const med = times.length ? times[Math.floor(times.length / 2)] / 1000 : null;
    const by = {}; s.results.forEach(x => { const k = x.p.trick; by[k] = by[k] || { n: 0, ok: 0 }; by[k].n++; if (x.ok) by[k].ok++; });
    const misses = s.results.filter(x => !x.ok);
    const headline = s.mode === 'sprint' ? `${right} right in ${fmtTime(s.dur)}` : `${right} of ${n} right`;
    const dline = s.auto ? (s.diMax > s.di0 ? `Auto difficulty: started at ${NS.DIFFS[s.di0].name}, reached ${NS.DIFFS[s.diMax].name}.` : `Auto difficulty: stayed at ${NS.DIFFS[s.di0].name}${s.di < s.di0 ? ` and stepped back to ${NS.DIFFS[s.di].name}` : ''}.`) : `Difficulty: ${NS.DIFFS[s.di].name}.`;
    const msg = acc === 1 ? 'Every one right.' : acc >= 0.85 ? 'Accurate. Next round, push the pace a little.' : acc >= 0.6 ? 'Read through the misses below, then run it again.' : 'Go back over the lesson, then try another round.';
    main.innerHTML = `<div class="session stack">
      <div class="card"><p class="eyebrow">${NS.rich(s.label)}</p><div class="res-top" style="margin-top:8px"><div class="big">${Math.round(acc * 100)}%</div>
        <div class="stack" style="gap:8px"><h2>${headline}</h2><p class="muted">${msg}</p><p class="small faint">${dline}</p><div class="kv"><div><b>${right}</b><span>right</span></div><div><b>${n - right}</b><span>missed</span></div><div><b>${med ? med.toFixed(1) + 's' : '—'}</b><span>typical time</span></div></div></div></div>
        <div class="row" style="margin-top:20px"><button class="btn hi" data-act="again">Go again <span class="kbd">Enter</span></button>${misses.length ? '<button class="btn ghost" data-act="redoMissed">Redo the misses</button>' : ''}<button class="btn ghost" data-act="newSetup">Change settings</button></div></div>
      ${Object.keys(by).length > 1 ? `<div class="card"><h3 style="margin-bottom:6px">By trick</h3><div class="tablewrap"><table class="t"><thead><tr><th>Trick</th><th style="text-align:right">Right</th><th></th></tr></thead><tbody>${Object.entries(by).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([k, v]) => `<tr><td>${NS.rich(trickName(k))}</td><td class="n">${v.ok}/${v.n}</td><td style="text-align:right"><button class="btn link small" data-go="t" data-arg="${k}">Lesson</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${misses.length ? `<div class="card"><h3>Misses, with the shortcut</h3><div class="stack" style="margin-top:10px;gap:0">${misses.map((x, i) => `<details style="border-top:1px solid var(--line);padding:10px 0" ${i === 0 ? 'open' : ''}><summary style="cursor:pointer"><span class="m">${R(x.p.p.h)}</span> <span class="faint small">you wrote</span> <span class="m" style="color:var(--bad)">${x.given ? esc(x.given) : '—'}</span> <span class="faint small">· answer</span> <span class="m">${R(NS.keyHtml(x.p.a), true)}</span></summary><ol class="steps" style="margin-top:10px">${x.p.steps.map(t => `<li>${R(t, true)}</li>`).join('')}</ol></details>`).join('')}</div></div>` : ''}
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
    const tot = NS.MEMO.reduce((a, s) => { const c = NS.memoCount(l, s.id); a.k += c.known; a.t += c.total; return a; }, { k: 0, t: 0 });
    main.innerHTML = `<header class="pagehead" style="margin-bottom:0"><p class="eyebrow">${LV[l]}</p><h1>Memorize</h1>
      <p class="lede">Some answers you don’t work out; you just know them. Look over a table, then drill it until every answer comes without thinking.</p></header>
      <div class="row" style="margin-top:20px"><button class="btn" data-act="memoMix">Drill a mix</button><span class="faint small">20 cards from every set, mostly ones you don’t know yet. ${tot.k} of ${tot.t} facts known.</span></div>
      <div class="msets">${NS.MEMO.map(s => { const c = NS.memoCount(l, s.id); return `<button class="mset" data-go="memorize" data-arg="${s.id}"><b>${NS.rich(s.title, true)}</b><span class="muted small">${NS.rich(s.blurb[l], true)}</span><span class="mprog">${memoBar(c)}</span></button>`; }).join('')}</div>
      ${footer()}`;
  }
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
      <div class="mtable${cover ? ' covered' : ''}" id="mtable">${b.groups.map(g => `${g.name ? `<p class="eyebrow mgh">${esc(g.name)}</p>` : ''}<div class="mgrid${hasAns ? '' : ' tight'}${id === 'fractions' ? ' wide' : ''}${id === 'measures' ? ' wide words' : ''}">${g.cells.map(cellHtml).join('')}</div>`).join('')}</div>
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
    const msg = right === n ? (slow.length ? 'Every card right. A few were slow.' : 'Every card right.') : right / n >= 0.8 ? 'Nearly there. Look over the misses below.' : 'Read the table once more, then go again.';
    main.innerHTML = `<div class="session stack">
      <div class="card"><p class="eyebrow">${NS.rich(m.title, true)}</p><div class="res-top" style="margin-top:8px"><div class="big">${Math.round(right / n * 100)}%</div>
        <div class="stack" style="gap:8px"><h2>${right} of ${n} right</h2><p class="muted">${msg}</p><div class="kv"><div><b>${right}</b><span>right</span></div><div><b>${n - right}</b><span>missed</span></div><div><b>${med}</b><span>typical time</span></div></div></div></div>
        <div class="row" style="margin-top:20px"><button class="btn hi" data-act="memoAgain">Go again <span class="kbd">Enter</span></button><button class="btn ghost" data-act="memoBack">${m.ids.length === 1 ? 'Back to the table' : 'Back to Memorize'}</button></div></div>
      ${missed.length ? `<div class="card"><h3>Look these over</h3><div class="mlist">${missed.map(x => `<div>${R(x.card.show, true)}</div>`).join('')}</div></div>` : ''}
      ${slow.length ? `<div class="card"><h3>Right, but slow</h3><p class="muted small" style="margin-top:4px">These should come instantly. They’ll keep showing up until they do.</p><div class="mlist">${slow.map(x => `<div>${R(x.card.show, true)} <span class="faint small mono">${(x.ms / 1000).toFixed(1)}s</span></div>`).join('')}</div></div>` : ''}
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
      <div class="row startbar"><button class="btn" data-act="startTest">Start the clock</button><span class="faint small">Enter moves to the next blank. Don’t sit on a hard one; a skip costs the same as a miss.</span></div>
      <div class="codes">
        <div class="codebox"><label for="tcode"><b>Got a test code?</b> <span class="muted">Everyone who enters the same code gets the same test, so a team can take one together and compare.</span></label>
          <div class="row" style="margin-top:10px"><input id="tcode" class="field" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. ${l === 'ms' ? 'MF' : 'HF'}-7K2M" maxlength="10" aria-describedby="tcodemsg"><button class="btn ghost" data-act="codeStart">Start this test</button></div>
          <p class="small" id="tcodemsg" aria-live="polite" style="margin-top:8px"></p></div>
        <div class="codebox" id="teambox">${teamBox()}</div>
      </div>
      <details class="rules"><summary>Scoring and a few reminders</summary>
        <div class="grid2" style="margin-top:14px">
          <ul class="stack small" style="padding-left:18px;margin:0;gap:6px"><li>Work in order. A skipped problem before your last answer counts as wrong.</li><li>No scratch paper, no calculators. Write only the final answer.</li><li>At a real contest, an erased or written-over answer can be marked wrong. Write it once.</li><li>Fractions in lowest terms. Mixed numbers or improper fractions are both fine unless the problem names one.</li><li>A repeating value like 2/3 must be a fraction, not .67.</li><li>Starred (*) problems accept anything within 5% of the exact answer.</li></ul>
          <ul class="stack small" style="padding-left:18px;margin:0;gap:6px"><li>Every right answer is +5 and every wrong or skipped one is −4, so a skip is never free.</li><li>Stop when the clock stops. Answers you haven’t reached don’t count against you.</li><li>On a star problem, don’t compute exactly. Round and write it down.</li><li>Losing time on a hard problem costs you easy ones later. Give it a few seconds, guess if you must, and move on.</li></ul>
        </div></details>
      <div class="sect"><div class="sect-h"><h2>Recent tests</h2></div>${hist.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>When</th><th>Test</th><th style="text-align:right">Score</th><th style="text-align:right">Right</th><th style="text-align:right">Last tried</th><th>Code</th></tr></thead><tbody>${hist.map(t => `<tr><td>${new Date(t.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td>${t.kind === 'full' ? 'Full' : `Problems ${COLR[t.col]}`}${codeDiff(t.code)}</td><td class="n"><b>${t.score}</b></td><td class="n">${t.correct}</td><td class="n">${t.last}</td><td>${t.code ? `<button class="btn link small mono" data-act="retake" data-code="${t.code}" title="Take this test again">${t.code}</button>` : '<span class="faint">—</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No tests yet. A full test once a week is a good rhythm, with single columns in between.</div>'}</div>
    </div>${footer()}`;
    const tc = $('#tcode'); if (tc) { tc.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACT.codeStart(); } }); tc.addEventListener('input', () => { tc.removeAttribute('aria-invalid'); $('#tcodemsg').textContent = ''; }); }
  }
  // a fresh code for whatever test is selected above, without starting it
  function teamBox() {
    const l = lv(); const dn = NS.DIFFS[NS.diffIdx(state.testDiff)].name; const what = (state.testKind === 'full' ? 'the full test (80 problems)' : `problems ${COLR[state.testCol]}`) + `, ${dn}`;
    const tc = state.teamCode;
    if (!tc) return `<b>Giving your team a test?</b> <span class="muted">Make a code for ${what} without starting it. Share the code, and everyone enters it in the box ${matchMedia('(max-width: 720px)').matches ? 'above' : 'beside this one'}.</span>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="teamCode">Make a team code</button></div>`;
    return `<b>Your team code</b> <span class="muted">${LV[l]}, ${tc.what}.</span>
      <div class="teamcode"><span class="mono" id="teamcode">${tc.code}</span><button class="btn small" data-act="copyCode" data-code="${tc.code}">Copy</button></div>
      <p class="small muted">Students open Tests, enter the code under <i>Got a test code?</i>, and start when you say go. Each code always gives the same problems.</p>
      <div class="row" style="margin-top:10px"><button class="btn ghost small" data-act="teamStart">Take it myself</button><button class="btn link small" data-act="teamCode">Make a different code</button></div>`;
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
    if (!noScroll) { const r = inp.closest('.q').getBoundingClientRect(); const topSafe = 140, botSafe = touch ? 340 : 40; if (r.top < topSafe || r.bottom > innerHeight - botSafe) window.scrollBy({ top: r.top - Math.max(topSafe, (innerHeight - botSafe) / 2 - 40), behavior: 'smooth' }); }
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
    const nextUp = tdi < 3 && reach >= 0.75 && acc >= 0.9 ? `Strong test. Try the next one at ${NS.DIFFS[tdi + 1].name}.` : tdi > 1 && acc < 0.6 ? `That one was rough. A ${NS.DIFFS[1].name} test is the real-contest level, and a good place to build back up.` : '';
    main.innerHTML = `<div class="stack">
      <div class="card"><p class="eyebrow">${full ? 'Full test' : `Problems ${COLR[T.cols[0]]}`} · ${NS.DIFFS[NS.diffIdx(T.diff)].name} · ${T.timeUp ? 'time' : `finished at ${fmtTime(T.used)}`}</p>
        <div class="res-top" style="margin-top:10px"><div><div class="big">${r.score}</div><p class="faint small">out of ${max}${pb ? ' · <b style="color:var(--ok)">personal best</b>' : ''}</p></div>
          <div class="stack" style="gap:10px"><div class="kv"><div><b>${r.correct}</b><span>right (+${5 * r.correct})</span></div><div><b>${r.wrong}</b><span>wrong (−${4 * r.wrong})</span></div><div><b>${r.skipped}</b><span>skipped (−${4 * r.skipped})</span></div><div><b>${r.last}</b><span>last problem tried</span></div></div>
          ${full ? `<div class="cols4">${byCol.map(b => `<div><span class="faint small">${COLR[b.c]}</span><br><b>${b.ok}</b><span class="faint small">/${b.tried || 0} tried</span></div>`).join('')}</div>` : ''}</div></div>
        ${nextUp ? `<p class="small" style="margin-top:14px"><b>${nextUp}</b></p>` : ''}
        ${r.skipped ? `<p class="small" style="margin-top:14px">Skips cost as much as wrong answers. ${r.skipped} skip${r.skipped > 1 ? 's' : ''} took ${4 * r.skipped} points. If you can’t do one, an honest guess beats a blank.</p>` : ''}
        <p class="small muted" style="margin-top:14px">Test code <b class="mono" style="color:var(--ink)">${T.code}</b>. Share it and teammates get this same test. <button class="btn link small" data-act="copyCode">Copy</button></p>
        <div class="row" style="margin-top:12px"><button class="btn hi" data-act="testAgain">New test</button><button class="btn ghost" data-act="testMenu">Test options</button>${missTricks.length ? `<button class="btn ghost" data-act="drillMissed">Drill what I missed</button>` : ''}</div></div>
      ${missTricks.length ? `<div class="card"><h3 style="margin-bottom:10px">Review these tricks</h3><div class="row">${missTricks.map(id => `<button class="btn small ghost" data-go="t" data-arg="${id}">${NS.rich(trickName(id))}</button>`).join('')}</div></div>` : ''}
      <div><h2 style="margin-bottom:10px">Your sheet</h2><p class="muted small" style="margin-bottom:12px">Tap any problem you missed to see the shortcut.</p>
      <div>${pages(T.probs, (p, i) => { const m = r.marks[i]; const given = T.answers[i];
        return `<div class="q mark-${m}${m === 'after' ? ' after' : ''}"><span class="qn">${p.est ? '<span class="s">*</span>' : ''}(${p.n})</span><div class="qb"><span class="t ${isLong(p) ? 'long' : ''}">${R(p.p.h, true)}</span></div>
          <div class="keyline">${m === 'ok' ? `<span class="m" style="color:var(--ok)">${esc(given)}</span>` : `${given && given.trim() ? `<span class="m" style="color:var(--bad);text-decoration:line-through">${esc(given)}</span>` : m === 'skip' ? '<span style="color:var(--bad)">skipped</span>' : ''}<span>key:</span><span class="m">${R(NS.keyHtml(p.a), true)}</span>`}
          ${m !== 'ok' ? `<button class="btn link small" data-act="showWhy" data-i="${i}">Shortcut</button>` : ''}</div><div class="why" id="why${i}"></div></div>`; })}</div></div>
    </div>`;
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
        ${[1, 2, 3, 4].map(c => { const arr = ids.filter(id => NS.trickCol(id, l) === c); return arr.length ? `<div><p class="eyebrow" style="margin:6px 0 8px">Problems ${COLR[c]}</p><div class="heat">${arr.map(id => { const s = NS.trickStatus(id, l); return `<button class="cell ${s.key}" data-go="t" data-arg="${id}" title="${esc(s.label)}">${NS.rich(trickName(id))}</button>`; }).join('')}</div></div>` : ''; }).join('')}</div>
      ${rows.length ? `<div class="sect"><div class="sect-h"><h2>Detail</h2><span class="faint small">Weakest first</span></div><div class="tablewrap"><table class="t"><thead><tr><th>Trick</th><th>Status</th><th style="text-align:right">Last 12</th><th style="text-align:right">Typical time</th><th style="text-align:right">Target</th></tr></thead><tbody>${rows.sort((a, b) => (a.st.acc ?? 0) - (b.st.acc ?? 0)).map(x => `<tr><td><button class="btn link" data-go="t" data-arg="${x.id}" style="padding:0">${NS.rich(trickName(x.id))}</button></td><td>${pillFor(x.st)}</td><td class="n">${x.st.acc !== null ? Math.round(x.st.acc * 100) + '%' : '—'}</td><td class="n">${x.st.med ? x.st.med.toFixed(1) + 's' : '—'}</td><td class="n">${x.st.target}s</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="sect"><div class="sect-h"><h2>Facts</h2><button class="btn link" data-go="memorize">Memorize →</button></div><div class="mfacts">${NS.MEMO.map(s => `<button class="mf" data-go="memorize" data-arg="${s.id}"><b>${NS.rich(s.short || s.title, true)}</b><span class="mprog">${memoBar(NS.memoCount(l, s.id))}</span></button>`).join('')}</div></div>
      <div class="sect"><div class="sect-h"><h2>Use another device</h2></div><div>
        <p class="muted" style="max-width:62ch">Progress is saved in this browser only. To move it, copy your progress code, send it to yourself (an email or a note works), then paste it on the other device. One code carries both levels.</p>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="exportCode">Copy my progress code</button><button class="btn ghost" data-act="importOpen">Paste a code</button></div>
        <div id="moveout"></div></div></div>
      <div class="sect"><div class="sect-h"><h2>Reset</h2></div><div id="resetbox"><button class="btn ghost" data-act="resetAsk">Erase ${LV[l].toLowerCase()} progress</button></div></div>
      ${footer()}`;
  }

  /* ---------- actions ---------- */
  const ACT = {
    setLevel(d) { S.data.level = d.lv; S.save(); state.session = null; state.test = null; state.teamCode = null; state.lessonTry = null; state.pickSet = null; state.custom = new Set(); location.hash = 'home'; route(); },
    level() { guard(() => { state.session = null; location.hash = 'level'; }); },
    theme() { const order = ['system', 'light', 'dark']; const cur = S.data.settings.theme || 'system'; const nx = order[(order.indexOf(cur) + 1) % 3]; S.data.settings.theme = nx; S.save(); applyTheme(); state.keepScroll = true; route(); },
    tfilter(d) { state.trickFilter = d.f; state.keepScroll = true; viewTricks(); },
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
    startPractice() { const sets = practiceSets(lv()); const cur = sets.find(s => s.k === state.pickSet); if (!cur || !cur.tricks.length) return;
      startSession({ mode: state.pickMode, dur: state.sprintLen, tricks: cur.tricks, label: (state.pickMode === 'sprint' ? 'Sprint · ' : '') + cur.name.replace(/\s*\(\d+\)$/, '').replace(/^Up next: /, ''), queue: cur.misses ? L().misses.slice(-20) : [] }); },
    pdiff(d) { state.pickDiff = d.d; S.data.settings.pdiff = d.d; S.save(); state.keepScroll = true; viewPractice(); },
    tdiff(d) { state.testDiff = d.d; S.data.settings.tdiff = d.d; S.save(); state.teamCode = null; state.keepScroll = true; viewTests(); },
    sSubmit() {
      const s = state.session; if (!s || s.state !== 'ask') return; const inp = $('#sin'); const p = s.cur;
      if (!inp.value.trim()) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return; }
      const res = NS.check(p.a, inp.value); const ms = performance.now() - s.t0;
      s.results.push({ p, ok: res.ok, ms, given: inp.value }); S.record(p, res.ok, ms); autoAdjust(s, res.ok, ms, p);
      const fb = $('#sfb'); inp.disabled = true; const stk = $('#stk'); if (stk) stk.innerHTML = NS.rich(trickName(p.trick), true);
      if (res.ok && s.mode === 'sprint') { s.flash = ms; return nextProblem(); }
      if (res.ok) {
        inp.classList.add('ok'); fb.className = 'feedback ok'; const tgt = NS.TARGET[p.col] + (p.est ? 6 : 0); fb.textContent = `Right · ${(ms / 1000).toFixed(1)}s${s.mode === 'practice' && ms / 1000 > tgt ? ` · test pace is about ${tgt}s` : ''}`; s.state = 'flash';
        $('.tally .g').textContent = `✓ ${s.results.filter(x => x.ok).length}`;
        setTimeout(() => { if (state.session === s && !s.done) nextProblem(); }, s.mode === 'sprint' ? 60 : (ms / 1000 > NS.TARGET[p.col] + (p.est ? 6 : 0) ? 1100 : 480));
      } else {
        inp.classList.add('bad', 'shake'); fb.className = 'feedback bad'; fb.textContent = res.note || 'Not quite.';
        $('.tally .r').textContent = `✗ ${s.results.filter(x => !x.ok).length}`;
        s.state = 'shown'; if (s.mode === 'practice') (s.retry = s.retry || []).push({ trick: p.trick, due: s.results.length + 3 }); if (s.mode === 'sprint') $('#sshort').innerHTML = `<p class="muted" style="margin-top:6px">Answer: <b class="m" style="color:var(--ink)">${R(NS.keyHtml(p.a), true)}</b>. The shortcut is in your summary.</p>`; else showShortcut(p, $('#sshort'), inp.value, null); const kp = $('#stage .keypad'); if (kp) kp.remove();
        $('#sunder').innerHTML = `<button class="btn" data-act="sNext">Next <span class="kbd">Enter</span></button>`;
        inp.disabled = false; inp.readOnly = true; if (!touch) inp.focus({ preventScroll: true });
      }
    },
    sGiveUp() { const s = state.session; if (!s || s.state !== 'ask') return; const p = s.cur; const ms = performance.now() - s.t0; s.results.push({ p, ok: false, ms, given: '' }); S.record(p, false, ms); autoAdjust(s, false, ms, p);
      s.state = 'shown'; if (s.mode === 'practice') (s.retry = s.retry || []).push({ trick: p.trick, due: s.results.length + 3 }); { const stk = $('#stk'); if (stk) stk.innerHTML = NS.rich(trickName(p.trick), true); } $('#sfb').className = 'feedback'; $('#sfb').textContent = ''; showShortcut(p, $('#sshort')); const kp = $('#stage .keypad'); if (kp) kp.remove();
      $('.tally .r').textContent = `✗ ${s.results.filter(x => !x.ok).length}`;
      $('#sunder').innerHTML = `<button class="btn" data-act="sNext">Next <span class="kbd">Enter</span></button>`; const inp = $('#sin'); inp.readOnly = true; if (!touch) inp.focus({ preventScroll: true }); },
    sNext() { nextProblem(); },
    quitSession() { const s = state.session; if (!s) return; if (s.results.length) finishSession(); else { endSession(true); viewPractice(); setNav('practice'); } },
    again() { const s = state.session; state.session = null; startSession({ mode: s.mode, dur: s.dur, tricks: s.tricks, label: s.label, diff: s.auto ? 'auto' : NS.DIFFS[s.di].id }); },
    redoMissed() { const s = state.session; const q = s.results.filter(x => !x.ok).map(x => ({ g: x.p.gid, s: x.p.seed, d: x.p.diff, at: x.p.at })); state.session = null; startSession({ mode: 'practice', tricks: s.tricks, label: s.label.replace(/^Sprint · /, ''), queue: q, diff: s.auto ? 'auto' : NS.DIFFS[s.di].id }); },
    newSetup() { state.session = null; viewPractice(); },
    tkind(d) { state.testKind = d.k; state.teamCode = null; state.keepScroll = true; viewTests(); },
    tcol(d) { state.testCol = +d.c; state.teamCode = null; state.keepScroll = true; viewTests(); },
    teamCode() {
      const l = lv(); const cols = state.testKind === 'full' ? [1, 2, 3, 4] : [state.testCol];
      const diff = state.testDiff || 'contest'; const dn = NS.DIFFS[NS.diffIdx(diff)].name;
      let code; do { code = NS.testCode(l, cols, NS.testSeed(), diff); } while (state.teamCode && code === state.teamCode.code);
      state.teamCode = { code, lv: l, what: (cols.length === 4 ? 'full test, 80 problems' : `problems ${COLR[cols[0]]}`) + `, ${dn}` };
      $('#teambox').innerHTML = teamBox(); $('#teambox [data-act="copyCode"]').focus({ preventScroll: true });
    },
    teamStart() { const tc = state.teamCode; const spec = tc && NS.readTestCode(tc.code); if (spec && spec.lv === lv()) startTest(spec); },
    startTest() { startTest(); },
    finishTest() { const T = state.test; if (!T) return; const blank = T.answers.filter(a => !a.trim()).length; confirmBar(`Grade now? ${fmtTime(Math.max(0, T.dur - (Date.now() - T.start) / 1000))} is left on the clock.`, 'Grade it', () => gradeTest(false)); void blank; },
    leaveTest() { guard(() => go('test')); },
    testAgain() { state.test = null; startTest(); },
    memoDrill(d) { startMemo([d.id], memoSet(d.id).title); },
    memoMix() { guard(() => startMemo(NS.MEMO.map(s => s.id), 'Mixed facts')); },
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

  function applyTheme() { const t = S.data.settings.theme || 'system'; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
  applyTheme();
  // practice hash changes made by startSession should not reset the session
  const _route = route;
  window.removeEventListener('hashchange', route);
  window.addEventListener('hashchange', () => { if (state.silent) { state.silent = false; renderSession(); setNav('practice'); state.view = 'practice'; return; } if (location.hash === '#test' && state.test && !state.test.done) { state.view = 'test'; renderTest(); setNav('test'); window.scrollTo(0, 0); return; } _route(); });
  NS._state = state;
  route();
})();
