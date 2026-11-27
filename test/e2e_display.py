# Browser check of Display and reading: each setting applies at once, persists, survives a progress code,
# and keeps every page free of sideways scrolling; reduced motion turns animations off; the number pad
# shows on a desktop when asked; high contrast meets 7:1 for body text.
import asyncio, sys
from playwright.async_api import async_playwright
fails = []
def check(c, msg):
    if not c: fails.append(msg); print('FAIL', msg)
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/ns/dist/preview.html')
        await pg.evaluate("()=>{localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'ms',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}})); location.reload()}")
        await pg.wait_for_function("window.NS && NS._state")
        # the Aa button opens the page
        await pg.click('.aa'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("location.hash") == '#display', 'Aa opens Display and reading')
        check(await pg.get_attribute('.aa', 'aria-current') == 'page', 'Aa marked current')
        base = await pg.evaluate("parseFloat(getComputedStyle(document.body).fontSize)")
        for k, v in [('tsize', 'xl'), ('contrast', 'high'), ('font', 'hyper'), ('motion', 'reduce'), ('pad', 'always'), ('theme', 'dark')]:
            await pg.click(f'[data-act="dset"][data-k="{k}"][data-v="{v}"]'); await pg.wait_for_timeout(80)
            check(await pg.evaluate(f"NS.store.data.settings.{k}") == v, f'{k} saved')
            check(await pg.get_attribute(f'[data-act="dset"][data-k="{k}"][data-v="{v}"]', 'aria-pressed') == 'true', f'{k} pressed')
        big = await pg.evaluate("parseFloat(getComputedStyle(document.body).fontSize)")
        check(abs(big / base - 1.3) < 0.02, f'extra large text is 30% bigger: {base} -> {big}')
        attrs = await pg.evaluate("['data-tsize','data-contrast','data-font','data-motion','data-theme'].map(a=>document.documentElement.getAttribute(a))")
        check(attrs == ['xl', 'high', 'hyper', 'reduce', 'dark'], f'root attributes {attrs}')
        check('Atkinson' in await pg.evaluate("getComputedStyle(document.body).fontFamily"), 'readable font applied')
        # contrast of body text and secondary text in high contrast, dark
        ratio = await pg.evaluate("""(()=>{const L=c=>{const m=c.match(/\\d+/g).slice(0,3).map(x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4});return .2126*m[0]+.7152*m[1]+.0722*m[2]};
          const bg=L(getComputedStyle(document.body).backgroundColor); const el=document.querySelector('.note-s'); const fg=L(getComputedStyle(el).color); const [a,b]=[Math.max(bg,fg),Math.min(bg,fg)]; return (a+.05)/(b+.05);})()""")
        check(ratio >= 7, f'secondary text contrast {ratio:.1f}:1')
        # survives a reload and a progress code
        await pg.reload(); await pg.wait_for_function("window.NS && NS._state")
        check(await pg.evaluate("document.documentElement.getAttribute('data-tsize')") == 'xl', 'settings applied on load')
        ok = await pg.evaluate("(async()=>{ const c = await NS.exportProgress(NS.store.data); const r = await NS.readProgress(c); const s = r.data.settings; return s.tsize==='xl' && s.contrast==='high' && s.font==='hyper' && s.motion==='reduce' && s.pad==='always'; })()")
        check(ok, 'settings move with the progress code')
        # reduced motion: no animation on a shaking answer
        await pg.evaluate("location.hash='practice'"); await pg.wait_for_timeout(200)
        await pg.click('[data-act="startPractice"]'); await pg.wait_for_timeout(250)
        check(await pg.evaluate("getComputedStyle(document.querySelector('.keypad')).display") == 'grid', 'number pad shows on desktop when asked')
        await pg.fill('#sin', '99999'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("getComputedStyle(document.querySelector('#sin')).animationName") == 'none', 'reduced motion stops the shake')
        await pg.click('[data-act="quitSession"]'); await pg.wait_for_timeout(150)
        # no sideways scrolling anywhere at large sizes
        for W in [1200, 900, 820, 760, 600, 390, 360]:
            await pg.set_viewport_size({'width': W, 'height': 900})
            for h in ['home', 'tricks', 'practice', 'test', 'progress', 'memorize', 'memorize-squares2', 'memorize-cubes2', 'display', 't-foil']:
                await pg.evaluate(f"NS._state.session=null; location.hash='{h}'"); await pg.wait_for_timeout(90)
                w = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
                check(w[0] <= w[1], f'{h} overflows at {W}px with extra large text: {w}')
        await pg.set_viewport_size({'width': 1200, 'height': 900})
        # back to standard
        await pg.evaluate("location.hash='display'"); await pg.wait_for_timeout(150)
        await pg.click('[data-act="dreset"]'); await pg.wait_for_timeout(150)
        left = await pg.evaluate("['tsize','contrast','font','motion','pad','theme'].filter(k=>NS.store.data.settings[k])")
        check(not left, f'reset clears settings: {left}')
        check(await pg.evaluate("document.documentElement.getAttribute('data-tsize')") is None, 'reset removes attributes')
        # printing is unaffected by text size
        await pg.evaluate("NS.store.data.settings.tsize='xl'; NS.store.save()"); await pg.reload(); await pg.wait_for_function("window.NS && NS._state")
        await pg.evaluate("location.hash='print-MF-7K2M'"); await pg.wait_for_timeout(700)
        check(await pg.evaluate("[...document.querySelectorAll('.upage')].every(p=>NS._pageFits(p))"), 'printed pages still fit with extra large text')
        check(not errs, 'page errors: ' + str(errs[:3]))
        await b.close()
asyncio.run(m())
print('DISPLAY E2E', 'OK' if not fails else f'{len(fails)} FAILURES')
sys.exit(1 if fails else 0)
