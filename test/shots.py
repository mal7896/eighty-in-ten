import asyncio, sys, json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/-home-claude/95553048-2e74-515a-bf44-6ee128d0757f/scratchpad/shots/'
URL='file:///home/claude/ns/dist/preview.html'
async def run(name, w, h, steps, dark=False, touch=False):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': w, 'height': h}, color_scheme='dark' if dark else 'light', has_touch=touch, is_mobile=touch, device_scale_factor=1)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        i=0
        for st in steps:
            kind = st[0]
            if kind=='click': await pg.click(st[1]); await pg.wait_for_timeout(st[2] if len(st)>2 else 250)
            elif kind=='type': await pg.keyboard.type(st[1]); await pg.wait_for_timeout(150)
            elif kind=='press': await pg.keyboard.press(st[1]); await pg.wait_for_timeout(250)
            elif kind=='js': r = await pg.evaluate(st[1]); 
            elif kind=='wait': await pg.wait_for_timeout(st[1])
            elif kind=='shot':
                await pg.screenshot(path=OUT+f'{name}_{st[1]}.png', full_page=(len(st)>2 and st[2]))
        print(name, 'errors:', [e for e in errs if 'fonts.g' not in e and 'ERR_' not in e][:8])
        await b.close()
async def main():
    which = sys.argv[1] if len(sys.argv)>1 else 'all'
    jobs = {
     'desk': ('desk', 1280, 860, [('shot','level'), ('click','[data-lv="ms"]'), ('shot','home', True), ('click','.nav [data-go="tricks"]'), ('shot','tricks', True), ('click','.titem'), ('click','[data-act="exStep"]'), ('click','[data-act="exAll"]'), ('shot','lesson', True)]),
     'sess': ('sess', 1280, 860, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js','location.reload()'), ('wait',400), ('click','.nav [data-go="practice"]'), ('shot','setup', True), ('click','[data-act="pset"][data-k="c3"]'), ('click','[data-act="startPractice"]'), ('shot','ask'), ('type','12345'), ('press','Enter'), ('wait',300), ('shot','wrong', True),
        ('press','Enter'), ('js',"document.querySelector('#sin').value = NS.keyText(NS._state.session.cur.a)"), ('press','Enter'), ('wait',100), ('shot','right')]),
     'test': ('test', 1280, 860, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js','location.reload()'), ('wait',400), ('click','.nav [data-go="test"]'), ('click','[data-act="startTest"]'), ('wait',400), ('shot','sheet'),
        ('js',"(()=>{const T=NS._state.test; T.probs.forEach((p,i)=>{ if(i<52){ const inp=document.querySelector('#a'+i); inp.value = i%9===4 ? '7' : (i===20?'':(p.a.type==='num'&&p.a.est? String(Math.round(p.a.v.num())) : NS.keyText(p.a))); inp.dispatchEvent(new Event('input',{bubbles:true})); }});})()"),
        ('wait',200), ('shot','sheetfull', True), ('click','[data-act="finishTest"]'), ('click','[data-c="y"]'), ('wait',300), ('shot','results', True)]),
     'mob': ('mob', 390, 844, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'ms',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js','location.reload()'), ('wait',400), ('shot','home', True), ('click','.tabbar [data-go="practice"]'), ('click','[data-act="startPractice"]'), ('shot','ask'), ('click','[data-key="7"]'), ('click','[data-key="enter"]'), ('wait',300), ('shot','wrong', True), ('js',"NS._state.session=null; location.hash='test'"), ('wait',300), ('click','[data-act="startTest"]'), ('wait',400), ('shot','sheet')], False, True),
     'dark': ('dark', 1280, 860, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js','location.reload()'), ('wait',400), ('shot','home'), ('js',"location.hash='t-matrices'"), ('wait',300), ('click','[data-act="exStep"]'), ('click','[data-act="exAll"]'), ('shot','lesson', True)], True),
     'mob2': ('mob2', 390, 844, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js',"location.hash='t-aOverB'; location.reload()"), ('wait',500), ('click','[data-act="exStep"]'), ('click','[data-act="exStep"]'), ('shot','lesson', True), ('js',"location.hash='tricks'"), ('wait',300), ('shot','tricks')], True, True),
     'mob3': ('mob3', 390, 844, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js',"location.hash='test'; location.reload()"), ('wait',500), ('click','[data-act="startTest"]'), ('wait',400), ('click','[data-key="4"]'), ('click','[data-key="next"]'), ('click','[data-key="7"]'), ('click','[data-key="next"]'), ('wait',500), ('shot','sheet'), ('js',"NS._state.test.dur=1"), ('wait',800), ('shot','results', True)], True, True),
     'les': ('les', 1280, 900, [('js',"localStorage.setItem('eighty-in-ten:v1', JSON.stringify({v:1,level:'hs',settings:{},levels:{ms:{tricks:{},tests:[],days:{},misses:[]},hs:{tricks:{},tests:[],days:{},misses:[]}}}))"), ('js',"location.hash='t-roots'; location.reload()"), ('wait',600), ('click','[data-act="exStep"]'), ('click','[data-act="exAll"]'), ('shot','roots', True), ('js',"location.hash='tricks'"), ('wait',300), ('shot','list')]),
    }
    for k,v in jobs.items():
        if which in ('all',k): await run(*v)
asyncio.run(main())
