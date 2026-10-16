/* #56 Les démos : chacune s'importe entièrement en blocs, est riche (au moins 4 blocs) et utilise la mélodie libre */
const { openApp } = require('./lib');
const osc = () => { window.__n = 0; const c = AudioContext.prototype.createOscillator, b = AudioContext.prototype.createBufferSource; AudioContext.prototype.createOscillator = function(){ window.__n++; return c.call(this); }; AudioContext.prototype.createBufferSource = function(){ window.__n++; return b.call(this); }; };
module.exports = async ({ url, check }) => {
  const seen = {};
  for (let seed = 1; seed <= 60; seed++) {
    const p = await openApp(url, { seed, init: osc });
    const r = await p.evaluate(() => {
      const P = window.BTB.getProject(), blocks = P.stacks.flatMap(s => s.blocks), mel = blocks.filter(b => b.type === 'n');
      return { title: P.stacks[0] && P.stacks[0].title, code: blocks.filter(b => b.type === 'code').length, n: blocks.length,
        libre: mel.some(b => b.len > 1 || new Set(b.notes.map(x => x.d.toFixed(4))).size > 1), melo: mel.length };
    });
    if (seen[r.title]) { await p.close2(); continue; }
    seen[r.title] = 1;
    await p.evaluate(() => { window.__n = 0; }); await p.waitForTimeout(1500);
    const sons = await p.evaluate(() => window.__n);
    check(r.code === 0 && r.n >= 4 && r.melo >= 1 && r.libre && sons > 0 && !p.errors.length,
      'démo « ' + r.title + ' » : ' + r.n + ' blocs, ' + r.code + ' bloc code, mélodie libre : ' + (r.libre ? 'oui' : 'non') + ', ' + sons + ' sons en 1,5 s' + (p.errors.length ? ', erreur : ' + p.errors[0] : ''));
    await p.close2();
  }
  check(Object.keys(seen).length >= 10, Object.keys(seen).length + ' démos différentes vues');
};
