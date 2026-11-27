# Browser check of the difficulty features: picker and blurb, Auto moving up and down in practice,
# a Hard test from a code, the lesson ramp, progress badges, and phone width.
import asyncio, sys
from playwright.async_api import async_playwright
ANS = "(p=>p.a.type==='num' ? (p.a.est ? String(Math.round(p.a.v.num())) : (p.a.form==='dec'||p.a.form==='money') && !p.a.v.isInt() ? p.a.v.toDecStr() : p.a.form==='frac' ? p.a.v.toFracStr() : p.a.v.toMixedStr()) : p.a.v)"
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
fails = []
def check(c, msg):
    if not c: fails.append(msg); print('FAIL', msg)
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 1000})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/ns/dist/preview.html')
        await pg.evaluate("()=>{localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'ms',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}})); location.reload()}")
        await pg.wait_for_function("window.NS && NS._state")
        # practice setup: Auto is the default and has a blurb
        await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(200)
        pressed = await pg.inner_text('.diffseg [aria-pressed="true"]'); check(pressed == 'Auto', 'practice default should be Auto, got ' + pressed)
        check('adjusts' in await pg.inner_text('.diffnote'), 'Auto blurb')
        if SHOTS: await pg.screenshot(path=SHOTS + '/practice_setup.png')
        # Auto: answer quickly and correctly; the level should climb
        await pg.click('[data-act="pset"][data-k="c1"]'); await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(200)
        levels = []
        for i in range(12):
            a = await pg.evaluate(f"{ANS}(NS._state.session.cur)")
            await pg.fill('#sin', a); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(650)
            levels.append(await pg.evaluate("NS._state.session.di"))
        check(levels[-1] >= 2, f'Auto should climb with quick right answers: {levels}')
        if SHOTS: await pg.screenshot(path=SHOTS + '/practice_auto.png')
        chip = await pg.inner_text('.sbar .dchip'); check('auto' in chip, 'session shows the level chip: ' + chip)
        # now miss two: it should step down
        before = await pg.evaluate("NS._state.session.di")
        for i in range(2):
            await pg.fill('#sin', '99999999'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
            await pg.click('[data-act="sNext"]'); await pg.wait_for_timeout(200)
        after = await pg.evaluate("NS._state.session.di"); check(after == before - 1, f'two misses should step down one level: {before} -> {after}')
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(200)
        summ = await pg.inner_text('main'); check('Auto difficulty' in summ, 'summary mentions difficulty')
        # attempts stored with their level
        lv_att = await pg.evaluate("Object.values(NS.store.data.levels.ms.tricks).flatMap(t=>t.att).map(a=>a[2]===undefined?1:a[2])")
        check(max(lv_att) >= 2, 'attempts recorded with level')
        # tests: pick Hard, start, code ends in -H, header chip shows Hard
        await pg.evaluate("location.hash='test'"); await pg.wait_for_timeout(200)
        await pg.click('[data-act="tdiff"][data-d="hard"]'); await pg.wait_for_timeout(100)
        check('Regional' in await pg.inner_text('.diffnote'), 'Hard blurb')
        await pg.click('[data-act="teamCode"]'); code = await pg.inner_text('#teamcode'); check(code.endswith('-H'), 'team code carries Hard: ' + code)
        if SHOTS: await pg.screenshot(path=SHOTS + '/tests_setup.png')
        await pg.fill('#tcode', code); await pg.click('[data-act="codeStart"]'); await pg.wait_for_timeout(300)
        check(await pg.evaluate("NS._state.test.diff") == 'hard', 'code starts a Hard test')
        check('Hard' in await pg.inner_text('.sheet-top'), 'test header shows Hard')
        same = await pg.evaluate(f"(()=>{{const s=NS.readTestCode('{code}'); return NS.buildTest(s.lv,s.seed,s.cols,s.diff).map(p=>p.p.h).join('|') === NS._state.test.probs.map(p=>p.p.h).join('|');}})()")
        check(same, 'code rebuilds the same test')
        # answer the first 10 and grade
        for i in range(10):
            a = await pg.evaluate(f"{ANS}(NS._state.test.probs[{i}])")
            await pg.evaluate(f"(a=>{{NS._state.test.answers[{i}]=a;}})({repr(a)})")
        await pg.click('[data-act="finishTest"]'); await pg.wait_for_timeout(150)
        btn = await pg.query_selector('.confirm button')
        if btn: await btn.click()
        await pg.wait_for_timeout(300)
        res = await pg.inner_text('main'); check('hard' in res.lower(), 'results show the level')
        hist = await pg.evaluate("NS.store.data.levels.ms.tests.slice(-1)[0].code"); check(hist.endswith('-H'), 'history keeps the Hard code')
        await pg.evaluate("NS._state.test=null; location.hash='home'"); await pg.wait_for_timeout(100)
        await pg.evaluate("location.hash='test'"); await pg.wait_for_timeout(200)
        check('Full · Hard' in await pg.inner_text('table.t'), 'history row names the level')
        # an old-style code still works and is Contest
        await pg.fill('#tcode', 'MF-7K2M'); await pg.click('[data-act="codeStart"]'); await pg.wait_for_timeout(300)
        check(await pg.evaluate("NS._state.test.diff") == 'contest', 'old code reads as Contest')
        await pg.evaluate("NS._state.test=null")
        # lesson ramp: first two are Warm-up, then Contest
        await pg.evaluate("location.hash='t-foil'"); await pg.wait_for_timeout(300)
        labels = []
        for i in range(5):
            labels.append(await pg.inner_text('#tryit .eyebrow'))
            a = await pg.evaluate(f"{ANS}(NS._state.lessonTry.p)"); await pg.fill('#tryin', a); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
        labels = [x.lower() for x in labels]; check('warm-up' in labels[0] and 'warm-up' in labels[1] and 'contest' in labels[2], f'lesson ramp labels {labels}')
        # phone width: no sideways scroll on practice setup, a session, and tests setup
        await pg.evaluate("NS._state.session=null")
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for h in ['practice', 'test']:
            await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(250)
            w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"); check(w[0] <= w[1], f'{h} overflows at 360px: {w}')
            if SHOTS: await pg.screenshot(path=SHOTS + f'/phone_{h}.png', full_page=True)
        await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(200)
        await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(250)
        w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"); check(w[0] <= w[1], f'session overflows at 360px: {w}')
        if SHOTS: await pg.screenshot(path=SHOTS + '/phone_session.png')
        check(not errs, 'page errors: ' + str(errs[:3]))
        await b.close()
asyncio.run(m())
print('DIFFICULTY E2E', 'OK' if not fails else f'{len(fails)} FAILURES')
sys.exit(1 if fails else 0)
