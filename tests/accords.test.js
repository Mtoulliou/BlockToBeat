/* #40 Accords qui vont bien ensemble : couleurs dans les pads (mode Accords) et dans le menu d'une note */
const { openApp, melo, oneBlock } = require('./lib');
const classes = p => p.$$eval('.pal-pads .pi-pad', x => x.map(e => (e.className.match(/ch-(self|strong|good|far)/) || ['', '-'])[1]));
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { project: oneBlock(melo([{ t: 0, d: .5, v: '0,2,4' }], 1, { scale: 'minor', root: 'A3' })), viewport: { width: 1100, height: 800 } });
  await p.click('.b-n .b-key');                                     // la gamme des pads suit le bloc sélectionné : La mineur
  await p.click('[data-chordmode]'); await p.waitForTimeout(100);
  check((await classes(p)).every(c => c === '-'), 'mode Accords sans accord touché : aucune couleur');
  await p.dispatchEvent('.pal-pads .pi-pad:nth-child(1)', 'pointerdown'); await p.waitForTimeout(100);
  let c = await classes(p);
  check(c[0] === 'self' && c[3] === 'strong' && c[4] === 'strong' && c[5] === 'strong', 'La m touché : Ré m, Mi m, Fa en vert vif (' + c.slice(0, 7).join(' ') + ')');
  check(c[2] === 'good' && c[6] === 'good' && c[1] === 'far', 'Do et Sol vont bien, Si dim s\'estompe');
  check(c[7] === 'self' && c[10] === 'strong', 'au-delà de l\'octave, même logique');
  await p.dispatchEvent('.pal-pads .pi-pad:nth-child(5)', 'pointerdown'); await p.waitForTimeout(100);
  c = await classes(p);
  check(c[4] === 'self' && c[0] === 'strong' && c[5] === 'strong', 'Mi m touché : La m et Fa en vert vif');
  await p.click('[data-chordmode]'); await p.click('[data-chordmode]'); await p.waitForTimeout(100);
  check((await classes(p)).every(x => x === '-'), 'quitter le mode Accords efface les couleurs');
  // menu d'une note qui est un accord de la gamme
  await p.click('.roll-note[data-ni="0"]'); await p.waitForTimeout(150);
  const pk = await p.$$eval('#pop .pick--chord', x => x.slice(0, 7).map(e => (e.className.match(/ch-(self|strong|good|far)/) || ['', '-'])[1]));
  check(pk[0] === 'self' && pk[3] === 'strong' && pk[1] === 'far' && await p.$('#pop .ch-legend') !== null, 'menu d\'une note : mêmes couleurs, avec la légende (' + pk.join(' ') + ')');
  await p.keyboard.press('Escape');
  // gamme chromatique : cycle des quintes
  await p.selectOption('select[data-nf="scale"]', 'chromatic'); await p.click('.b-n .b-key'); await p.waitForTimeout(100);
  await p.dispatchEvent('.pal-pads .pi-pad:nth-child(1)', 'pointerdown'); await p.waitForTimeout(100);
  c = await classes(p);
  check(c[5] === 'strong' && c[7] === 'strong' && c[1] === 'far', 'gamme chromatique : quarte et quinte en vert vif');
  check(!p.errors.length, 'aucune erreur JS ' + p.errors.join(' ')); await p.close2();
};
