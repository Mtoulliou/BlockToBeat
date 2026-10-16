/* #46 Piano roll : une ligne par tour, gestes, menu d'une note, menu d'une ligne, pads, tête de lecture */
const { openApp, notesOf, fmtNotes, melo, oneBlock, zoomOn, drag } = require('./lib');
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { project: oneBlock(melo([{ t: 0, d: .25, v: '0' }, { t: 1, d: .25, v: '3' }], 2)) });
  await p.click('#codeToggle'); await p.waitForTimeout(150);
  check(await p.$$eval('.roll-row', x => x.length) === 2, 'une ligne par tour (2 tours = 2 lignes numérotées)');
  await zoomOn(p, '.roll-row');
  const body = await (await p.$('.roll-row[data-row="0"] .roll-body')).boundingBox(), W = body.width;
  // toucher un vide : une note d'un pas + son menu, choisir 4
  const lane = await (await p.$('.roll-row[data-row="0"] .roll-lane')).boundingBox();
  await p.mouse.click(lane.x + W * .5 + 3, lane.y + lane.height / 2); await p.waitForTimeout(200);
  check(await p.$eval('#pop', x => !x.hidden && x.querySelector('strong').textContent === 'Note'), 'toucher un vide ouvre le menu de la nouvelle note');
  await p.click('#pop [data-pick="4"]'); await p.waitForTimeout(150);
  check(fmtNotes(await notesOf(p)).includes('4@0.5+0.0625'), 'note ajoutée au milieu du tour, d\'un pas');
  // glisser la note d'un temps, étirer sa fin de deux pas, annuler
  const ni = (await notesOf(p)).findIndex(n => n.v === '4');
  let box = await (await p.$('.roll-note[data-ni="' + ni + '"]')).boundingBox();
  await drag(p, box.x + 5, box.y + box.height / 2, W * .25);
  check(fmtNotes(await notesOf(p)).includes('4@0.75+0.0625'), 'glisser une note la déplace (aimant au 1/16)');
  box = await (await p.$('.roll-note[data-ni="' + ni + '"] .roll-grab')).boundingBox();
  await drag(p, box.x + 4, box.y + box.height / 2, W * .125);
  check(fmtNotes(await notesOf(p)).includes('4@0.75+0.1875'), 'glisser la poignée change la durée');
  await p.click('#undo'); await p.waitForTimeout(150);
  check(fmtNotes(await notesOf(p)).includes('4@0.75+0.0625'), '↶ annule seulement le dernier geste');
  // menu d'une note : accord, durée, supprimer
  await p.click('.roll-note[data-ni="' + ni + '"]'); await p.waitForTimeout(150);
  await p.click('#pop [data-cmode="1"]'); await p.click('#pop [data-pickchord="2,4,6"]'); await p.waitForTimeout(150);
  check((await notesOf(p))[ni].v === '2,4,6', 'menu d\'une note : poser un accord');
  // menu d'une ligne : Dupliquer, Vider, Supprimer
  await p.click('.roll-row[data-row="0"] .roll-grip'); await p.waitForTimeout(150);
  check((await p.$eval('#actionbar', x => x.innerText)).includes('Ligne 1'), 'toucher le numéro sélectionne la ligne');
  await p.click('[data-ab="dup"]'); await p.waitForTimeout(150);
  let b = (await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[0]));
  check(b.len === 3 && b.notes.filter(n => n.t >= 1 && n.t < 2).length === 2 && b.notes.some(n => n.v === '3' && n.t === 2), 'Dupliquer une ligne : copie juste après, la suite se décale');
  await p.click('[data-ab="clear"]'); await p.waitForTimeout(150);
  b = (await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[0]));
  check(b.len === 3 && !b.notes.some(n => n.t >= 1 && n.t < 2), 'Vider une ligne');
  await p.click('#actionbar .trash'); await p.waitForTimeout(150);
  b = (await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[0]));
  check(b.len === 2 && b.notes.some(n => n.v === '3' && n.t === 1), 'Supprimer une ligne : la suite remonte');
  // pads de l'onglet Notes dans la ligne sélectionnée
  await p.click('.roll-row[data-row="1"] .roll-grip'); await p.click('.pal-pads .pi-pad:nth-child(6)'); await p.waitForTimeout(150);
  check(fmtNotes(await notesOf(p)).includes('5@1.25+0.0625'), 'pad de l\'onglet Notes : ajouté à la suite dans la ligne sélectionnée');
  // tête de lecture : seulement dans la ligne du tour en cours, et elle avance
  const h1 = await p.$$eval('.roll-head.is-here', x => x.length + ':' + x[0].style.left); await p.waitForTimeout(300); const h2 = await p.$eval('.roll-head.is-here', x => x.style.left);
  check(h1.startsWith('1:') && h1.split(':')[1] !== h2, 'tête de lecture visible dans une seule ligne, elle avance');
  // Zoomer : le bloc prend toute la largeur libre
  await p.mouse.move(500, 300); await p.keyboard.down('Control'); await p.mouse.wheel(0, 600); await p.keyboard.up('Control'); await p.waitForTimeout(150);
  const z0 = await p.evaluate(() => +/scale\(([\d.]+)\)/.exec(document.querySelector('#canvas').style.transform)[1]);
  await p.click('.b-n .b-key'); await p.click('[data-ab="zoom"]'); await p.waitForTimeout(150);
  const z1 = await p.evaluate(() => ({ z: +/scale\(([\d.]+)\)/.exec(document.querySelector('#canvas').style.transform)[1], left: document.querySelector('.roll').getBoundingClientRect().left, pal: document.querySelector('#palette').getBoundingClientRect().right }));
  check(z1.z > z0 && Math.abs(z1.left - z1.pal - 24) < 3, 'Zoomer cadre les lignes de notes sur toute la largeur libre (zoom ' + z0 + ' → ' + z1.z.toFixed(2) + ')');
  check(!p.errors.length, 'aucune erreur JS ' + p.errors.join(' ')); await p.close2();
  // au doigt sur un téléphone
  const t = await openApp(url, { project: oneBlock(melo([{ t: 0, d: .25, v: '0' }], 1)), viewport: { width: 390, height: 844 }, touch: true });
  const add = await (await t.$('.roll-add')).boundingBox();
  await t.touchscreen.tap(add.x + add.width * .6, add.y + add.height / 2); await t.waitForTimeout(250);
  check((await notesOf(t)).length === 2 && await t.$eval('#pop', x => !x.hidden), 'au doigt : toucher la bande pointillée ajoute une note');
  await t.close2();
};
