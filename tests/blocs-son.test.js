/* Blocs Son après le ménage de #46 (étape 5) : menu d'un pas, suppression, sélection multiple, palette ; dépôt d'une note sur un piano roll */
const { openApp, melo, zoomOn } = require('./lib');
module.exports = async ({ url, check }) => {
  const proj = { stacks: [{ id: 'st', title: 'Test', x: 0, y: 0, muted: false, blocks: [
    { id: 'bs', type: 's', muted: false, steps: ['bd', '~', 'sd', '~'], alt: [['hh', 'hh', '~', 'oh']], fx: [] },
    melo([{ t: 0, d: .25, v: '0' }], 1)] }] };
  const p = await openApp(url, { project: proj });
  const steps = () => p.evaluate(() => { const b = window.BTB.getProject().stacks[0].blocks[0]; return [b.steps].concat(b.alt || []).map(l => l.join(' ')).join(' | '); });
  await p.click('#codeToggle'); await zoomOn(p, '.b-s', 4);
  // menu d'un pas : choisir un son, puis supprimer le pas
  await p.click('.cell[data-key="bs:0:1"]'); await p.waitForTimeout(150);
  await p.click('#pop [data-pick="cp"]'); await p.waitForTimeout(150);
  check((await steps()).startsWith('bd cp sd ~'), 'menu d\'un pas Son : choisir un son');
  await p.click('.cell[data-key="bs:0:3"]'); await p.click('#pop [data-pick="__del"]'); await p.waitForTimeout(150);
  check((await steps()).startsWith('bd cp sd |'), 'menu d\'un pas Son : supprimer le pas');
  // sélection multiple (appui long) puis silence
  const c = await (await p.$('.cell[data-key="bs:1:0"]')).boundingBox();
  await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up();
  await p.click('.cell[data-key="bs:1:1"]'); await p.click('[data-ab="m-rest"]'); await p.waitForTimeout(150);
  check((await steps()).endsWith('~ ~ ~ oh'), 'sélection multiple de pas Son : mettre en silence');
  // un son de la palette va dans la ligne sélectionnée
  await p.click('.s-ln[data-l="1"]'); await p.click('[data-tab="sons"]').catch(() => {}); await p.click('[data-sec="sons"] [data-pal*="\\"rim\\""]'); await p.waitForTimeout(150);
  check((await steps()).endsWith('~ ~ ~ oh rim'), 'palette : le son va dans la ligne Son sélectionnée');
  // glisser une note de la palette sur le piano roll
  await p.click('[data-tab="notes"]').catch(() => {});
  const pad = await (await p.$('.pal-pads .pi-pad:nth-child(4)')).boundingBox(), body = await (await p.$('.roll-body')).boundingBox();
  await p.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2); await p.mouse.down();
  for (let k = 1; k <= 10; k++) await p.mouse.move(pad.x + (body.x + body.width * .52 - pad.x) * k / 10, pad.y + (body.y + 18 - pad.y) * k / 10);
  await p.mouse.up(); await p.waitForTimeout(200);
  const n = await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[1].notes.map(x => x.v + '@' + x.t).join(' '));
  check(n === '0@0 3@0.5', 'glisser une note sur le piano roll la pose là où on la lâche (' + n + ')');
  check(!p.errors.length, 'aucune erreur JS ' + p.errors.join(' ')); await p.close2();
};
