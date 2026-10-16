/* #54 Déplacer le plan d'un seul doigt ne doit jamais zoomer, même si un toucher précédent a été perdu */
const { openApp } = require('./lib');
const zoom = p => p.evaluate(() => +/scale\(([\d.]+)\)/.exec(document.querySelector('#canvas').style.transform)[1]);
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { viewport: { width: 1100, height: 800 } });
  await p.click('#codeToggle').catch(() => {});
  await p.mouse.move(550, 400); await p.keyboard.down('Control'); await p.mouse.wheel(0, -120); await p.keyboard.up('Control'); await p.waitForTimeout(100);
  // un toucher dont la fin s'est perdue (le navigateur ne l'a jamais signalé)
  await p.evaluate(() => { document.getElementById('viewport').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 99, isPrimary: true, bubbles: true, clientX: 700, clientY: 600, pointerType: 'touch' })); });
  const z0 = await zoom(p), x0 = await p.evaluate(() => document.querySelector('#canvas').style.transform);
  await p.mouse.move(600, 650); await p.mouse.down();
  for (let k = 1; k <= 10; k++) await p.mouse.move(600 - 25 * k, 650 - 20 * k);
  await p.mouse.up(); await p.waitForTimeout(150);
  const z1 = await zoom(p), x1 = await p.evaluate(() => document.querySelector('#canvas').style.transform);
  check(Math.abs(z1 - z0) < 1e-6, 'glisser d\'un doigt ne zoome pas (zoom ' + z0 + ' → ' + z1 + ')');
  check(x1 !== x0, 'le plan s\'est bien déplacé');
  check(!p.errors.length, 'aucune erreur JS'); await p.close2();
  // un vrai pincement à deux doigts zoome toujours
  const t = await openApp(url, { viewport: { width: 390, height: 844 }, touch: true });
  const c = await t.context().newCDPSession(t), z2 = await zoom(t);
  const touch = (type, pts) => c.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await touch('touchStart', [{ x: 120, y: 560, id: 1 }, { x: 260, y: 560, id: 2 }]);
  for (let k = 1; k <= 8; k++) await touch('touchMove', [{ x: 120 - 8 * k, y: 560, id: 1 }, { x: 260 + 8 * k, y: 560, id: 2 }]);
  await touch('touchEnd', []); await t.waitForTimeout(150);
  const z3 = await zoom(t);
  check(z3 > z2 * 1.5, 'écarter deux doigts zoome toujours (' + z2 + ' → ' + z3.toFixed(2) + ')');
  await t.close2();
};
