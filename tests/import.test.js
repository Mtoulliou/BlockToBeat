/* #46 Aller-retour par le vrai bouton Importer : code → blocs → code identique */
const { openApp, loadDemo, demoList } = require('./lib');
const importCode = async (p, code) => { await p.evaluate(c => { document.getElementById('importText').value = c; document.getElementById('importReplace').click(); }, code); await p.waitForTimeout(300); };
const meloState = p => p.evaluate(() => JSON.stringify(window.BTB.getProject().stacks.flatMap(s => s.blocks.filter(b => b.type === 'n').map(b => [b.len, b.notes]))));
module.exports = async ({ url, check }) => {
  const q = await openApp(url);
  for (const d of await demoList(q)) {
    await loadDemo(q, d.id);
    const code1 = await q.$eval('#code', x => x.textContent), s1 = await meloState(q);
    await importCode(q, code1);
    check(code1 === await q.$eval('#code', x => x.textContent) && s1 === await meloState(q) && !q.errors.length, 'démo « ' + d.name + ' » : même code et mêmes notes après import');
  }
  await q.close2();
  const p = await openApp(url);
  const free = '$: n("0@6 ~@2 2@2 ~ 4@9 [0,2,4]@8 ~@4, 7@3 ~@5").slow(2)\n  .scale("A3:minor").s("piano")';
  await importCode(p, free);
  const r = await p.evaluate(() => { const P = window.BTB.getProject(); return { blocks: P.stacks.reduce((n, s) => n + s.blocks.length, 0), len: P.stacks[0].blocks[0].len, code: document.querySelector('#code').textContent.split('\n').filter(l => /n\(/.test(l)).join('') }; });
  check(r.blocks === 1 && r.len === 2, 'deux voix dans un seul n(…) : un seul bloc, phrase de 2 tours');
  check(r.code.includes('n("0@6 ~@2 2@2 ~ 4@9 [0,2,4]@8 ~@4, 7@3 ~@5").slow(2)'), 'deux voix sur deux tours : code identique');
  check(!p.errors.length, 'aucune erreur JS'); await p.close2();
};
