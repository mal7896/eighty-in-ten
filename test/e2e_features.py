# Browser check of the practice options and printing: round length, No Enter, Hardcore (best streak saved),
# Test answering (no feedback until the end), live stats, the arithmetic warm-up and its best score,
# the estimation drill, sample problems in the trick picker, and the printable test with its key.
import asyncio, sys
from playwright.async_api import async_playwright
ANS = "(p=>p.a.type==='num' ? (p.a.est ? String(Math.round(p.a.v.num())) : (p.a.form==='dec'||p.a.form==='money') && !p.a.v.isInt() ? p.a.v.toDecStr() : p.a.form==='frac' ? p.a.v.toFracStr() : p.a.v.toMixedStr()) : p.a.v)"
fails = []
def check(c, msg):
    if not c: fails.append(msg); print('FAIL', msg)
async def answer(pg, right=True, enter=True):
    a = await pg.evaluate(f"{ANS}(NS._state.session.cur)") if right else '987654'
    await pg.fill('#sin', a)
    if enter: await pg.keyboard.press('Enter')
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 1000})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/ns/dist/preview.html')
        await pg.evaluate("()=>{localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}})); location.reload()}")
        await pg.wait_for_function("window.NS && NS._state")
        await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(200)
        # round length 10, saved as a setting
        await pg.click('[data-act="prlen"][data-n="10"]'); check(await pg.evaluate("NS.store.data.settings.plen") == 10, 'round length saved')
        await pg.click('[data-act="pset"][data-k="c1"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("NS._state.session.total") == 10, 'round of 10')
        check('/10' in await pg.inner_text('.sbar'), 'counter shows /10')
        # live stats: average fills in after an answer, time ticks
        await answer(pg); await pg.wait_for_timeout(700)
        avg = await pg.inner_text('#lavg'); check(avg.endswith('s') and avg != '—', 'average shows after an answer: ' + avg)
        t1 = await pg.inner_text('#ltime'); await pg.wait_for_timeout(1100); t2 = await pg.inner_text('#ltime'); check(t1 != t2, f'time ticks {t1} -> {t2}')
        for i in range(9): await answer(pg); await pg.wait_for_timeout(650)
        check(await pg.evaluate("NS._state.session.done"), 'round of 10 ends after 10')
        txt = await pg.inner_text('main'); check('average' in txt and 'total time' in txt, 'summary has average and total time')
        await pg.click('[data-act="newSetup"]'); await pg.wait_for_timeout(150)
        # No Enter: a right answer moves on without pressing Enter
        await pg.click('[data-act="pbeh"][data-b="noenter"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        await answer(pg, enter=False); await pg.wait_for_timeout(250)
        check(await pg.evaluate("NS._state.session.results.length") == 1, 'No Enter: right answer submitted by itself')
        await answer(pg, right=False, enter=False); await pg.wait_for_timeout(250)
        check(await pg.evaluate("NS._state.session.results.length") == 1, 'No Enter: a wrong answer waits for Enter')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("NS._state.session.state") == 'shown', 'No Enter: Enter checks a wrong answer')
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(200); await pg.click('[data-act="newSetup"]'); await pg.wait_for_timeout(150)
        # Hardcore: no round length, one miss ends it, best streak saved
        await pg.click('[data-act="pbeh"][data-b="hardcore"]'); await pg.wait_for_timeout(100)
        check(await pg.query_selector('[data-act="prlen"]') is None, 'Hardcore hides round length')
        await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("NS._state.session.total") is None, 'Hardcore has no set length')
        for i in range(4): await answer(pg); await pg.wait_for_timeout(650)
        await answer(pg, right=False); await pg.wait_for_timeout(250)
        check('See how you did' in await pg.inner_text('#sunder'), 'Hardcore miss ends the run')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
        check(await pg.evaluate("NS.store.data.levels.hs.best.hc") == 4, 'best streak saved')
        check('streak of 4' in await pg.inner_text('main'), 'summary shows the streak')
        await pg.click('[data-act="again"]'); await pg.wait_for_timeout(200)
        check('Best streak' in await pg.inner_text('.lstats'), 'best streak shown during the next run')
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(150)
        await pg.evaluate("NS._state.session=null; location.hash='home'"); await pg.wait_for_timeout(100); await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(200)
        # Test answering: no right/wrong until the end; Enter moves on
        await pg.click('[data-act="pbeh"][data-b="test"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        await answer(pg, right=False); await pg.wait_for_timeout(250)
        fb = await pg.inner_text('#sfb'); check('Not quite' not in fb and await pg.evaluate("NS._state.session.state") == 'ask', 'Test mode gives no feedback on a miss: ' + fb)
        check(await pg.query_selector('.tally .r') is None, 'Test mode hides the tally')
        for i in range(9): await answer(pg); await pg.wait_for_timeout(120)
        check(await pg.evaluate("NS._state.session.done"), 'Test round ends')
        check('9 of 10 right' in await pg.inner_text('main'), 'Test summary scores at the end')
        await pg.click('[data-act="newSetup"]'); await pg.wait_for_timeout(150)
        await pg.click('[data-act="pbeh"][data-b="normal"]')
        # trick picker samples
        await pg.click('[data-act="pset"][data-k="custom"]'); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('#picker .pke .katex').length"); total = await pg.evaluate("document.querySelectorAll('#picker label').length")
        check(n >= total * 0.8, f'picker shows sample problems ({n} of {total})')
        # estimation drill: every problem is starred
        await pg.click('[data-act="pset"][data-k="est"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        ests = []
        for i in range(5): ests.append(await pg.evaluate("NS._state.session.cur.est")); await answer(pg); await pg.wait_for_timeout(650)
        check(all(ests), 'estimation drill gives starred problems')
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(150); await pg.click('[data-act="newSetup"]'); await pg.wait_for_timeout(150)
        # arithmetic warm-up: ops toggles, ranges, 1-minute run, best score
        await pg.click('[data-act="pmode"][data-m="arith"]'); await pg.wait_for_timeout(150)
        await pg.click('[data-act="arop"][data-op="/"]'); await pg.click('[data-act="arop"][data-op="-"]'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("NS.store.data.settings.arith.ops") == '+x', 'ops toggled off')
        await pg.fill('input[data-ar="mul"][data-i="1"]', '9'); await pg.press('input[data-ar="mul"][data-i="1"]', 'Tab'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("NS.store.data.settings.arith.mul[1]") == 9, 'range saved')
        await pg.click('[data-act="plen"][data-s="60"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        await pg.evaluate("NS._state.session.startAt -= 50000"); seen = set()
        for i in range(12):
            q = await pg.evaluate("NS._state.session.cur.p.t"); seen.add(' '.join(q.split()[1:2]))
            if '*' in q: check(int(q.split('*')[0].strip()) <= 9, 'multiplication range respected: ' + q)
            await answer(pg, enter=False); await pg.wait_for_timeout(120)
        check(seen <= {'+', '*'}, f'only + and × asked: {seen}')
        await pg.wait_for_timeout(10500)
        check(await pg.evaluate("NS._state.session.done"), 'warm-up ends on time')
        key = await pg.evaluate("NS.arithKey(NS.store.data.settings.arith, 60)")
        best = await pg.evaluate(f"NS.store.data.levels.hs.best.ar['{key}']"); check(best == 12, f'warm-up best saved: {best}')
        check('12' in await pg.inner_text('.big'), 'warm-up summary shows the count')
        await pg.click('[data-act="newSetup"]'); await pg.wait_for_timeout(150)
        check('best with these settings: 12' in await pg.inner_text('#arbest'), 'best shown on setup')
        # best and settings survive a progress code round trip
        ok = await pg.evaluate("(async()=>{ const c = await NS.exportProgress(NS.store.data); const r = await NS.readProgress(c); return r.data.levels.hs.best.hc === 4 && r.data.settings.arith.ops === '+x' && r.data.settings.plen === 10; })()")
        check(ok, 'best scores and settings move with the progress code')
        # printable test: code, pages, key with ranges for starred problems
        await pg.evaluate("location.hash='test'"); await pg.wait_for_timeout(200)
        await pg.click('[data-act="printTest"]'); await pg.wait_for_timeout(500)
        h = await pg.evaluate("location.hash"); check(h.startswith('#print-HF-'), 'print view opened: ' + h)
        check(await pg.evaluate("document.querySelectorAll('.upage').length") == 3, 'front, back and a key page')
        check(await pg.evaluate("document.querySelectorAll('.uq').length") == 80, '80 problems on the sheet')
        keys = await pg.evaluate("[...document.querySelectorAll('.uk')].map(x=>x.innerText)")
        check(len(keys) == 80 and all('–' in k for k in keys[9::10]), 'key gives a range for each starred problem')
        code = h[len('#print-'):]
        same = await pg.evaluate(f"(()=>{{const s=NS.readTestCode('{code}'); const t=NS.buildTest(s.lv,s.seed,s.cols,s.diff); return [...document.querySelectorAll('.uq .un')].map(x=>x.textContent).join()===t.map(p=>(p.est?'*':'')+'('+p.n+')').join();}})()")
        check(same, 'printed test matches its code')
        first = await pg.evaluate("[...document.querySelectorAll('.upage')].map(p=>p.querySelectorAll('.uq').length)")
        check(first == [33, 47, 0], f'UIL split: 1-33 front, 34-80 back: {first}')
        fits = await pg.evaluate("[...document.querySelectorAll('.upage')].every(p=>NS._pageFits(p))")
        check(fits, 'every printed page fits on one sheet')
        await pg.emulate_media(media='print')
        vis = await pg.evaluate("[getComputedStyle(document.querySelector('header.top')).display, getComputedStyle(document.querySelector('.noprint')).display]")
        check(vis == ['none', 'none'], f'print hides the site chrome: {vis}')
        await pg.emulate_media(media='screen')
        # print from a team code and from results
        await pg.evaluate("location.hash='test'"); await pg.wait_for_timeout(200)
        await pg.click('[data-act="tkind"][data-k="col"]'); await pg.click('[data-act="teamCode"]'); tc = await pg.inner_text('#teamcode')
        await pg.click('[data-act="printCode"]'); await pg.wait_for_timeout(400)
        check(await pg.evaluate("location.hash") == '#print-' + tc, 'team code prints')
        check(await pg.evaluate("document.querySelectorAll('.uq').length") == 20, 'one column prints 20')
        # phone width
        await pg.set_viewport_size({'width': 360, 'height': 780}); await pg.wait_for_timeout(200)
        w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"); check(w[0] <= w[1], f'print view overflows at 360px: {w}')
        await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(250)
        w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"); check(w[0] <= w[1], f'arithmetic setup overflows at 360px: {w}')
        await pg.click('[data-act="pmode"][data-m="practice"]'); await pg.click('[data-act="pset"][data-k="custom"]'); await pg.wait_for_timeout(300)
        w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"); check(w[0] <= w[1], f'picker overflows at 360px: {w}')
        check(not errs, 'page errors: ' + str(errs[:3]))
        await b.close()
asyncio.run(m())
print('FEATURES E2E', 'OK' if not fails else f'{len(fails)} FAILURES')
sys.exit(1 if fails else 0)
