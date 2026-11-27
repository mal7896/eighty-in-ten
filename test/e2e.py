import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/ns/dist/preview.html'
OUT='/tmp/claude-0/-home-claude/95553048-2e74-515a-bf44-6ee128d0757f/scratchpad/shots/'
ANS = "(p=>p.a.type==='num' ? (p.a.est ? String(Math.round(p.a.v.num())) : (p.a.form==='dec'||p.a.form==='money') && !p.a.v.isInt() ? p.a.v.toDecStr() : p.a.form==='frac' ? p.a.v.toFracStr() : p.a.v.toMixedStr()) : p.a.v)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width':1200,'height':850})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(200)
        await pg.click('[data-lv="ms"]')
        # lesson flow: answer 5 (4 right, 1 wrong)
        await pg.wait_for_timeout(200); await pg.click('[data-go="t"]'); await pg.wait_for_timeout(300)
        for i in range(5):
            if i == 2:
                await pg.fill('#tryin', '1'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
                assert await pg.query_selector('#tryhow .shortcut'), 'shortcut shown after miss'
                await pg.click('[data-act="trySubmit"]'); await pg.wait_for_timeout(150); continue
            a = await pg.evaluate(f"{ANS}(NS._state.lessonTry.p)")
            await pg.fill('#tryin', a); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(800)
        txt = await pg.inner_text('#tryit'); assert '4 of 5 right' in txt, txt
        # drill from lesson end
        await pg.click('#tryit [data-act="drillTrick"]'); await pg.wait_for_timeout(200)
        for i in range(20):
            a = await pg.evaluate(f"{ANS}(NS._state.session.cur)")
            await pg.fill('#sin', a if i % 6 else 'oops'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(560)
            if i % 6 == 0: await pg.keyboard.press('Enter'); await pg.wait_for_timeout(120)
        t = await pg.inner_text('main'); assert '% ' in t or '%' in t
        assert '16 of 20 right' in t, t[:300]
        await pg.screenshot(path=OUT+'e2e_summary.png', full_page=True)
        # redo misses
        await pg.click('[data-act="redoMissed"]'); await pg.wait_for_timeout(200)
        q = await pg.evaluate("NS._state.session.queue.length"); assert q == 3, q
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(200)
        # sprint with auto-advance
        await pg.click('.nav [data-go="practice"]'); await pg.click('[data-act="pmode"][data-m="sprint"]'); await pg.click('[data-act="plen"][data-s="60"]'); await pg.click('[data-act="pset"][data-k="c1"]'); await pg.click('[data-act="startPractice"]')
        for i in range(8):
            a = await pg.evaluate(f"{ANS}(NS._state.session.cur)")
            await pg.type('#sin', a, delay=5); await pg.wait_for_timeout(150)
        n = await pg.evaluate("NS._state.session.results.filter(x=>x.ok).length"); assert n >= 7, n
        await pg.evaluate("NS._state.session.dur = 1"); await pg.wait_for_timeout(600)
        assert await pg.evaluate("NS._state.session.done"), 'sprint ended'
        # test: shorten clock and let it expire
        await pg.click('.nav [data-go="test"]'); await pg.click('[data-act="tkind"][data-k="col"]'); await pg.click('[data-act="tcol"][data-c="2"]'); await pg.click('[data-act="startTest"]'); await pg.wait_for_timeout(300)
        for i in range(12):
            a = await pg.evaluate(f"{ANS}(NS._state.test.probs[{i}])")
            if i == 5: a = ''
            if i == 7: a = '999999'
            await pg.fill(f'#a{i}', a)
        await pg.evaluate("NS._state.test.dur = 1"); await pg.wait_for_timeout(700)
        res = await pg.evaluate("NS._state.test.res"); print('column test result', {k: res[k] for k in ('last','correct','wrong','skipped','score')})
        assert res['correct'] == 10 and res['wrong'] == 1 and res['skipped'] == 1 and res['score'] == 50 - 8, res
        await pg.screenshot(path=OUT+'e2e_results.png', full_page=False)
        # progress page renders with data
        await pg.click('.nav [data-go="progress"]'); await pg.wait_for_timeout(200); await pg.screenshot(path=OUT+'e2e_progress.png', full_page=True)
        await pg.click('[data-act="resetAsk"]'); await pg.click('[data-act="resetNo"]')
        # leaving a test asks first
        await pg.click('.nav [data-go="test"]'); await pg.click('[data-act="testMenu"]') if await pg.query_selector('[data-act="testMenu"]') else None
        await pg.click('[data-act="tkind"][data-k="full"]'); await pg.click('[data-act="startTest"]'); await pg.wait_for_timeout(200)
        assert not await pg.is_visible('.nav'), 'navigation hides while a test runs'
        await pg.click('[data-act="leaveTest"]'); await pg.wait_for_timeout(150)
        assert await pg.query_selector('#confirmbar'), 'guard'
        await pg.click('[data-c="n"]'); assert await pg.query_selector('#sheet')
        await pg.click('[data-act="leaveTest"]'); await pg.click('[data-c="y"]'); await pg.wait_for_timeout(150)
        assert 'Practice tests' in await pg.inner_text('main') and await pg.is_visible('.nav')
        await pg.click('.nav [data-go="home"]'); await pg.wait_for_timeout(150)
        assert 'Today' in await pg.inner_text('main')
        # reload persists progress
        await pg.reload(); await pg.wait_for_timeout(300)
        st = await pg.evaluate("JSON.parse(localStorage.getItem('eighty-in-ten:v1')).levels.ms.tests.length"); assert st == 1, st
        # switch level and theme
        await pg.click('#lvlbtn'); await pg.click('[data-lv="hs"]'); await pg.wait_for_timeout(150)
        assert 'High school' in await pg.inner_text('#lvlname')
        await pg.click('.foot [data-go="display"]'); await pg.wait_for_timeout(150)
        await pg.click('[data-act="dset"][data-k="theme"][data-v="light"]'); assert await pg.evaluate("document.documentElement.dataset.theme") == 'light'
        print('errors', errs); print('E2E OK')
        await b.close()
asyncio.run(main())
