const NS = require('./load')();
const strip = h => h.replace(/<span class="mw">(\d+)<\/span>/g, '$1 ').replace(/<span class="fr"><span class="nu">([\s\S]*?)<\/span><span class="de">([\s\S]*?)<\/span><\/span>/g, '[$1/$2]').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<sub>(.*?)<\/sub>/g, '_$1').replace(/<mark>(.*?)<\/mark>/g, '«$1»').replace(/<[^>]+>/g, '').replace(/&amp;/g,'&');
const only = process.argv[2]; const n = +(process.argv[3] || 2);
for (const g of NS.GENS) { if (only && !only.split(',').includes(g.id)) continue;
  for (const lv of ['ms', 'hs']) { if (!g.col[lv]) continue;
    for (let i = 0; i < n; i++) { const o = g.gen(new NS.Rng(1000 + i * 31 + lv.length), lv);
      console.log(`${g.id}/${lv}: ${strip(o.p.h)} ${o.form || ''} ${o.suffix || ''}  →  ${strip(NS.keyHtml(o.a))}`);
      if (process.argv[4]) o.steps.forEach(s => console.log('      · ' + strip(s)));
    } } }
