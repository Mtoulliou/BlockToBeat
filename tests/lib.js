/* Outils communs aux tests */
const pw = require('playwright');
const SEED = s => { Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; };

/* Un seul navigateur par type pour toute la suite (le lancer coûte 1 à 2 s) ; chaque test a son propre contexte,
   donc un stockage vide comme avant. */
const browsers = {};
function getBrowser(name, sound) {
  const key = name + (sound ? ':son' : '');
  if (!browsers[key]) browsers[key] = pw[name].launch(sound ? { args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  return browsers[key];
}
async function closeAll() { for (const k of Object.keys(browsers)) { const b = await browsers[k]; await b.close(); delete browsers[k]; } }
/* attend que l'app soit prête ; si le son est bloqué, l'écran de lancement apparaît au plus tard 600 ms après */
async function ready(page, blocked) {
  await page.waitForFunction(() => window.BTB && document.querySelector('#canvas .stack, #canvas .empty-canvas'));
  if (blocked) await page.waitForFunction(() => performance.now() > 750);
  await page.waitForTimeout(120);
}

/* Ouvre l'app. opts : project (le projet à charger à la place de la démo), seed (démo fixe), viewport, touch,
   sound (true : le navigateur autorise le son, sinon on touche l'écran de lancement), browser ('chromium' | 'firefox'), init (script à injecter) */
async function openApp(url, opts = {}) {
  const name = opts.browser || 'chromium', sound = name === 'chromium' && opts.sound !== false;
  const browser = await getBrowser(name, sound);
  const context = await browser.newContext({ viewport: opts.viewport || { width: 1100, height: 800 }, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await context.newPage();
  page.errors = []; page.on('pageerror', e => page.errors.push(e.message));
  await page.addInitScript(SEED, opts.seed || 3);
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(url); await ready(page, !sound);
  if (opts.project) {
    const proj = Object.assign({ bpm: 120, mode: 'loop', lanes: [[]] }, opts.project);
    await page.evaluate(m => localStorage.setItem('blocktobeat-poc-1', JSON.stringify(m)), proj);
    await page.reload(); await ready(page, !sound);
  }
  await dismissLaunch(page);
  if (opts.project) { await page.click('#undo'); await page.waitForTimeout(150); }
  page.close2 = () => context.close();
  return page;
}
/* charge une démo précise par son id (BTB._loadDemo) */
async function loadDemo(page, id) { await page.evaluate(id => window.BTB._loadDemo(id), id); await page.waitForTimeout(100); }
const demoList = page => page.evaluate(() => window.BTB._demos());
/* l'écran « Touche l'écran pour lancer la musique » capte les clics : on le fait disparaître */
async function dismissLaunch(page) {
  await page.evaluate(() => { const h = document.getElementById('soundHint'); if (h && !h.hidden) h.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  await page.waitForTimeout(150);
}
const project = (page) => page.evaluate(() => window.BTB.getProject());
const notesOf = async (page, si = 0, bi = 0) => (await project(page)).stacks[si].blocks[bi].notes;
/* notes lisibles : "4@0.5+0.25" (valeur @ début + durée, en tours) */
const fmtNotes = ns => ns.map(n => n.v + '@' + (+n.t.toFixed(4)) + '+' + (+n.d.toFixed(4))).join(' ');
const melo = (notes, len, extra) => Object.assign({ id: 'bn', type: 'n', muted: false, root: 'A3', scale: 'minor', synth: 'piano', fx: [], notes, len }, extra || {});
const oneBlock = (b) => ({ stacks: [{ id: 'st', title: 'Test', x: 0, y: 0, muted: false, blocks: [b] }] });
/* zoome sur un élément (molette + Ctrl) pour pouvoir viser les petites notes */
async function zoomOn(page, sel, steps = 6) {
  for (let k = 0; k < steps; k++) { const r = await (await page.$(sel)).boundingBox(); await page.mouse.move(r.x + 20, r.y + 10); await page.keyboard.down('Control'); await page.mouse.wheel(0, -80); await page.keyboard.up('Control'); await page.waitForTimeout(50); }
}
async function drag(page, x0, y0, dx, dy = 0, steps = 6) {
  await page.mouse.move(x0, y0); await page.mouse.down();
  for (let k = 1; k <= steps; k++) await page.mouse.move(x0 + dx * k / steps, y0 + dy * k / steps);
  await page.mouse.up(); await page.waitForTimeout(150);
}
/* onglet de la palette (Blocs, Sons, Notes, Effets) : visible seulement en largeur téléphone */
async function tab(page, name) { await page.evaluate(n => { const t = document.querySelector('[data-tab="' + n + '"]'); if (t && t.offsetParent) t.click(); }, name); }
module.exports = { tab, pw, SEED, openApp, closeAll, loadDemo, demoList, dismissLaunch, project, notesOf, fmtNotes, melo, oneBlock, zoomOn, drag };
