/* #46 Aller-retour par le vrai bouton Importer : code → blocs → code identique */
const { openApp } = require('./lib');
const importCode = async (p, code) => { await p.evaluate(c => { document.getElementById('importText').value = c; document.getElementById('importReplace').click(); }, code); await p.waitForTimeout(300); };
const meloState = p => p.evaluate(() => JSON.stringify(window.BTB.getProject().stacks.flatMap(s => s.blocks.filter(b => b.type === 'n').map(b => [b.len, b.notes]))));
module.exports = async ({ url, check }) => {
  const seen = {};
  for (let seed = 1; seed <= 40 && Object.keys(seen).length < 10; seed++) {
    const p = await openApp(url, { seed });
    const title = await p.evaluate(() => window.BTB.getProject().stacks[0].title);
    if (!seen[title]) {
      seen[title] = 1;
      const code1 = await p.$eval('#code', x => x.textContent), s1 = await meloState(p);
      await importCode(p, code1);
      check(code1 === await p.$eval('#code', x => x.textContent) && s1 === await meloState(p) && !p.errors.length, 'démo « ' + title + ' » : même code et mêmes notes après import');
    }
    await p.close2();
  }
  const p = await openApp(url);
  const free = '$: n("0@6 ~@2 2@2 ~ 4@9 [0,2,4]@8 ~@4, 7@3 ~@5").slow(2)\n  .scale("A3:minor").s("piano")';
  await importCode(p, free);
  const r = await p.evaluate(() => { const P = window.BTB.getProject(); return { blocks: P.stacks.reduce((n, s) => n + s.blocks.length, 0), len: P.stacks[0].blocks[0].len, code: document.querySelector('#code').textContent.split('\n').filter(l => /n\(/.test(l)).join('') }; });
  check(r.blocks === 1 && r.len === 2, 'deux voix dans un seul n(…) : un seul bloc, phrase de 2 tours');
  check(r.code.includes('n("0@6 ~@2 2@2 ~ 4@9 [0,2,4]@8 ~@4, 7@3 ~@5").slow(2)'), 'deux voix sur deux tours : code identique');
  check(!p.errors.length, 'aucune erreur JS'); await p.close2();
};
