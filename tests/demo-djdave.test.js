/* #55 Démo « DJ_Dave » : tout le code devient de vrais blocs (aucun code brut), avec les nouveautés
   (Voyelle, chœur « ooh », basse 808), et la relecture redonne exactement le même code */
const { openApp } = require('./lib');
async function importCode(p, code) {
  await p.click('#importOpen'); await p.waitForTimeout(150);
  await p.fill('#importText', code);
  await p.click('#importReplace'); await p.waitForTimeout(400);
  return p.$eval('#code', c => c.textContent);
}
module.exports = async ({ url, check }) => {
  const p = await openApp(url);
  const html = await p.evaluate(async u => (await fetch(u + 'index.html')).text(), url);
  const m = /id: "djdave"[\s\S]*?code: `([\s\S]*?)`,/.exec(html);
  check(!!m, 'la démo « DJ_Dave » est dans la liste des démos');
  if (!m) { await p.close2(); return; }
  const code1 = await importCode(p, m[1]);
  const blocks = await p.evaluate(() => window.BTB.getProject().stacks.flatMap(st => st.blocks));
  const raw = blocks.filter(b => b.type === 'code' || (b.fx || []).some(f => f.type === 'raw')).length;
  check(blocks.length >= 6 && raw === 0, 'tout devient de vrais blocs, sans code brut (' + blocks.length + ' blocs, ' + raw + ' brut)');
  check(blocks.some(b => (b.fx || []).some(f => f.type === 'vowel' && f.v === 'o')), 'l’arpège garde son effet Voyelle');
  check(blocks.some(b => b.synth === 'gm_voice_oohs'), 'le chœur utilise la Voix douce');
  const code2 = await importCode(p, code1);
  check(code1 === code2, 'relire le code généré redonne exactement le même code');
  if (!(await p.$eval('#play', b => b.getAttribute('aria-pressed') === 'true'))) await p.click('#play');
  await p.waitForTimeout(1500);
  const err = p.errors; await p.close2();
  check(!err.length, 'la démo joue sans erreur JS');
};
