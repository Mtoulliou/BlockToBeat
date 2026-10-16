/* #52 Moteur : le son ne sature plus, l'effet Voyelle est un vrai effet, les voix synthétisées jouent */
const { openApp, dismissLaunch } = require('./lib');
/* garde l'analyseur de l'app pour mesurer le niveau de sortie */
const keepAnalyser = () => { const c = AudioContext.prototype.createAnalyser; AudioContext.prototype.createAnalyser = function(){ const a = c.call(this); window.__an = a; return a; }; };
async function importCode(p, code) {
  await p.click('#importOpen'); await p.waitForTimeout(150);
  await p.fill('#importText', code);
  await p.click('#importReplace'); await p.waitForTimeout(400);
}
module.exports = async ({ url, check }) => {
  /* Démo de lancement fixe (graine 3) : l'ancien moteur montait à 1,27, au-delà du maximum (1) */
  const p = await openApp(url, { init: keepAnalyser });
  if (!(await p.$eval('#play', b => b.getAttribute('aria-pressed') === 'true'))) await p.click('#play');
  await p.waitForTimeout(800);
  const peak = await p.evaluate(async () => {
    const a = window.__an, d = new Float32Array(a.fftSize); let m = 0; const t0 = performance.now();
    while (performance.now() - t0 < 5000) { a.getFloatTimeDomainData(d); for (const x of d) m = Math.max(m, Math.abs(x)); await new Promise(r => setTimeout(r, 25)); }
    return m;
  });
  check(peak > .1 && peak <= 1, 'la sortie ne dépasse jamais le niveau maximum (crête ' + peak.toFixed(2) + ')');

  /* .vowel() relu comme un effet Voyelle (et pas comme du code brut), avec la voix lead */
  await importCode(p, 'setcpm(120/4)\n$: n("0 2 4 ~").scale("A4:minor").s("gm_synth_voice").vowel("o").room(0.3)');
  const fx = await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[0].fx.map(f => f.type + ':' + (f.v != null ? f.v : f.code)));
  check(fx.includes('vowel:o'), 'l’import garde .vowel("o") comme effet Voyelle (' + fx.join(', ') + ')');
  const code = await p.$eval('#code', c => c.textContent);
  check(/\.s\("gm_synth_voice"\)\.vowel\("o"\)/.test(code), 'le code réécrit .s("gm_synth_voice").vowel("o")');
  const err = p.errors; await p.close2();
  check(!err.length, 'aucune erreur JS');
};
