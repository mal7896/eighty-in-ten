import pathlib, re, base64
root = pathlib.Path(__file__).parent
order = ['core.js','gens_mult.js','gens_frac.js','gens_nt.js','gens_alg.js','gens_geo.js','gens_misc.js','gens_calc.js','gens_est.js','gens_more.js','gens_uil.js','gens_uil2.js', 'gens_ms.js','tricks.js','engine.js','memo.js','app.js']
js = '\n'.join((root/'src'/f).read_text() for f in order)
css = (root/'src'/'style.css').read_text()
kdir = root/'vendor'/'node_modules'/'katex'/'dist'
kcss = (kdir/'katex.min.css').read_text()
keep = ('KaTeX_AMS', 'KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4')
def face(m):
    block = m.group(0)
    fam = re.search(r'font-family:"?(KaTeX_[A-Za-z0-9]+)', block).group(1)
    if fam not in keep: return ''
    f = re.search(r'url\((fonts/[^)]+\.woff2)\)', block).group(1)
    data = base64.b64encode((kdir/f).read_bytes()).decode()
    return re.sub(r'src:[^}]+', 'src:url(data:font/woff2;base64,' + data + ') format("woff2")', block).replace('font-display:block', 'font-display:swap')
kcss = re.sub(r'@font-face\{[^}]+\}', face, kcss)
kjs_local = (kdir/'katex.min.js').read_text()
fonts = ['family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800', 'family=Atkinson+Hyperlegible+Next:wght@400;600;700', 'family=Atkinson+Hyperlegible+Mono:wght@400;600;700', 'family=Atkinson+Hyperlegible:wght@400;700']
links = '\n'.join(f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{f}&display=swap">' for f in fonts)
html = f'''<title>Eighty in Ten</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Learn and drill the shortcuts for TMSCA and UIL Number Sense, middle school and high school.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{links}
<style>
{kcss}
</style>
<style>
{css}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
<script>
{js}
</script>
'''
(root/'dist'/'index.html').write_text(html)
# local preview with a document skeleton like the publisher adds
(root/'dist'/'preview.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>', '<script>' + kjs_local + '</script>') + '</body></html>')
# standalone site for GitHub Pages (docs/ folder): same page with its own document skeleton
skel = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
(root/'docs').mkdir(exist_ok=True)
(root/'docs'/'index.html').write_text(skel + html + '</body></html>')
(root/'docs'/'.nojekyll').write_text('')
print(len(html)//1024, 'KB')
