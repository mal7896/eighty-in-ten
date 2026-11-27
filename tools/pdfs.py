# Prints the tests listed in tools/tests.json to PDF, through the app's own print view.
# Run after build.py, then run build.py again so the sitemap lists them:
#   python3 tools/pdfs.py && python3 build.py
import asyncio, json, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'practice-tests'
LV = {'M': 'Middle school', 'H': 'High school'}

async def main():
    tests = json.loads((ROOT / 'tools' / 'tests.json').read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1275, 'height': 900})
        await pg.goto((ROOT / 'dist' / 'preview.html').as_uri())
        await pg.wait_for_function('window.NS && NS._state')
        for t in tests:
            code = t['code']
            await pg.evaluate("location.hash = 'home'"); await pg.wait_for_timeout(100)
            await pg.evaluate(f"location.hash = 'print-{code}'")
            await pg.wait_for_function("document.querySelector('#paper') && document.querySelector('#paper').dataset.fit")
            await pg.wait_for_timeout(600)
            fits = await pg.evaluate("[...document.querySelectorAll('.upage')].every(p => NS._pageFits(p))")
            if not fits: raise SystemExit(f'{code}: a page does not fit')
            hard = code.endswith('-H')
            title = f"{'UIL ' if code[0] == 'H' else ''}Number Sense Practice Test, {LV[code[0]]}{' (Hard)' if hard else ''}, code {code}"
            await pg.evaluate(f"document.title = {json.dumps(title)}")
            await pg.pdf(path=str(OUT / t['file']), format='Letter', prefer_css_page_size=True, print_background=True)
            print(t['file'], (OUT / t['file']).stat().st_size // 1024, 'KB')
        await b.close()

asyncio.run(main())
