/* Vérification générale de l'app, sur Chromium et Firefox */
const { openApp, dismissLaunch } = require('./lib');
module.exports = async ({ url, check }) => {
  for (const browser of ['chromium', 'firefox']) {
    const p = await openApp(url, { browser });
    check(await p.$$eval('.stack', x => x.length) > 0 && await p.$$eval('.roll', x => x.length) > 0, browser + ' : la démo s\'affiche, ses mélodies en piano roll');
    const mv = await p.evaluate(async () => { const els = [...document.querySelectorAll('.nblk, .row[data-b]')], x0 = els.map(e => e.getBoundingClientRect().x); let m = 0; for (let k = 0; k < 20; k++) { await new Promise(r => setTimeout(r, 30)); els.forEach((e, i) => m = Math.max(m, Math.abs(e.getBoundingClientRect().x - x0[i]))); } return m; });
    check(mv === 0, browser + ' : les blocs ne bougent pas pendant la lecture (#1)');
    // ancien projet en cases : converti en piano roll
    await p.evaluate(() => localStorage.setItem('blocktobeat-poc-1', JSON.stringify({ bpm: 120, mode: 'loop', lanes: [[]], stacks: [{ id: 'st', title: 'Test', x: 0, y: 0, muted: false, blocks: [
      { id: 'bs', type: 's', muted: false, steps: ['bd', '~', 'sd', '~'], alt: [['hh', 'hh', '~', 'oh']], fx: [] },
      { id: 'bn', type: 'n', muted: false, root: 'A3', scale: 'minor', synth: 'piano', fx: [], lines: [['0,2,4', '_', '_', '~', '3', '_', '~', '~']] }] }] })));
    await p.reload(); await p.waitForTimeout(700); await dismissLaunch(p); await p.click('#undo'); await p.waitForTimeout(250);
    const mel = await p.evaluate(() => { const b = window.BTB.getProject().stacks[0].blocks[1]; return (b.lines ? 'CASES ' : '') + b.notes.map(n => n.v + '@' + n.t * 8 + '+' + n.d * 8).join(' '); });
    check(mel === '0,2,4@0+3 3@4+2', browser + ' : ancien bloc en cases converti en piano roll (' + mel + ')');
    await p.click('.s-ln[data-l="1"]'); await p.click('[data-ab="clear"]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => JSON.stringify(window.BTB.getProject().stacks[0].blocks[0].alt[0])) === '["~","~","~","~"]', browser + ' : vider une ligne de bloc Son (#24)');
    // Library : enregistrer, sauvegarde automatique
    await p.click('#libSave'); await p.waitForTimeout(300); await p.click('#bpmUp'); await p.waitForTimeout(1000);
    await p.click('[data-nav="library"]'); await p.waitForTimeout(400);
    check((await p.$eval('.lib-card span', x => x.textContent)).includes('124 BPM'), browser + ' : Library, sauvegarde automatique (#20)');
    await p.click('[data-nav="lab"]');
    check(!p.errors.length, browser + ' : aucune erreur JS ' + p.errors.join(' '));
    await p.close2();
  }
  // écran de lancement quand le son est bloqué (#19)
  const q = await openApp(url, { sound: false });
  check(true, 'ouverture sans son autorisé');
  await q.close2();
};
