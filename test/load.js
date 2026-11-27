// Loads the browser source files into a Node context in build order.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ORDER = ['core.js', 'gens_mult.js', 'gens_frac.js', 'gens_nt.js', 'gens_alg.js', 'gens_geo.js', 'gens_misc.js', 'gens_calc.js', 'gens_est.js', 'gens_more.js', 'gens_uil.js', 'gens_uil2.js', 'gens_ms.js', 'tricks.js', 'engine.js', 'memo.js'];
module.exports = function load(extra = {}) {
  const ctx = { ...extra, console, Math, BigInt, Number, String, Array, Object, Set, Map, JSON, Error, RegExp };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ORDER) {
    const p = path.join(__dirname, '..', 'src', f);
    if (!fs.existsSync(p)) continue;
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  return ctx.NS;
};
module.exports.ORDER = ORDER;
