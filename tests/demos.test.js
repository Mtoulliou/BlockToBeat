/* #56 Les démos : chacune s'importe entièrement en blocs, est riche (au moins 4 blocs) et utilise la mélodie libre */
const { openApp, loadDemo, demoList } = require('./lib');
const osc = () => { window.__n = 0; const c = AudioContext.prototype.createOscillator, b = AudioContext.prototype.createBufferSource; AudioContext.prototype.createOscillator = function(){ window.__n++; return c.call(this); }; AudioContext.prototype.createBufferSource = function(){ window.__n++; return b.call(this); }; };
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { init: osc }), list = await demoList(p);
  for (const d of list) {
    await loadDemo(p, d.id);
    const r = await p.evaluate(() => {
      const P = window.BTB.getProject(), blocks = P.stacks.flatMap(s => s.blocks), mel = blocks.filter(b => b.type === 'n');
      return { title: P.stacks[0] && P.stacks[0].title, code: blocks.filter(b => b.type === 'code').length, n: blocks.length,
        libre: mel.some(b => b.len > 1 || new Set(b.notes.map(x => x.d.toFixed(4))).size > 1), melo: mel.length };
    });
    /* on attend le premier son (au plus 4 s : l'Ambient est lente, un accord tous les deux tours) */
    await p.evaluate(() => { window.__n = 0; });
    const sons = await p.waitForFunction(() => window.__n > 0, null, { timeout: 4000 }).then(() => p.evaluate(() => window.__n)).catch(() => 0);
    check(r.code === 0 && r.n >= 4 && r.melo >= 1 && r.libre && sons > 0 && !p.errors.length,
      'démo « ' + r.title + ' » : ' + r.n + ' blocs, ' + r.code + ' bloc code, mélodie libre : ' + (r.libre ? 'oui' : 'non') + ', ' + sons + ' son(s) entendu(s)' + (p.errors.length ? ', erreur : ' + p.errors[0] : ''));
  }
  check(list.length >= 10, list.length + ' démos');
  await p.close2();
};
