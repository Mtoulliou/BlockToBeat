/* #55 Mes sons : importer un son, le jouer dans un bloc Son après rechargement, le supprimer */
const { openApp, dismissLaunch } = require('./lib');
/* un petit son de 0,5 s (WAV 16 bits), fabriqué ici pour ne dépendre d'aucun fichier */
function wav(sec) {
  const sr = 22050, n = Math.floor(sr * sec), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 330 * i / sr) * 12000), 44 + i * 2);
  return b;
}
/* note la durée de chaque son lu depuis un fichier (les bruits du moteur durent 2 s, notre son 0,5 s) */
const capture = () => { window.__src = []; const c = AudioContext.prototype.createBufferSource; AudioContext.prototype.createBufferSource = function(){ const s = c.call(this); const st = s.start.bind(s); s.start = (...a) => { if (s.buffer) window.__src.push(+s.buffer.duration.toFixed(2)); return st(...a); }; return s; }; };
const toast = p => p.$eval('#toast', t => t.textContent);
module.exports = async ({ url, check }) => {
  const project = { stacks: [{ id: 'st', title: 'Voix', x: 0, y: 0, muted: false, blocks: [{ id: 'bs', type: 's', muted: false, steps: ['ma_voix', '~', 'ma_voix', '~'], fx: [] }] }] };
  const p = await openApp(url, { project, init: capture });

  await p.setInputFiles('#usndFile', { name: 'trop gros.mp3', mimeType: 'audio/mpeg', buffer: Buffer.alloc(6 * 1024 * 1024) });
  await p.waitForTimeout(300);
  check(/5 Mo/.test(await toast(p)), 'un fichier de 6 Mo est refusé avec un message clair');

  await p.setInputFiles('#usndFile', { name: 'Ma voix.wav', mimeType: 'audio/wav', buffer: wav(.5) });
  await p.waitForTimeout(800);
  const chips = await p.$$eval('[data-sec="sons"] .chip--sound[data-snd="usr"]', c => c.map(x => x.textContent));
  check(chips.includes('Ma voix'), 'le son importé apparaît dans la palette Sons (' + chips.join(', ') + ')');

  /* il est gardé sur l'appareil : après rechargement, le bloc qui l'utilise le joue */
  await p.reload(); await p.waitForTimeout(800); await dismissLaunch(p);
  await p.click('#undo'); await p.waitForTimeout(400);
  if (!(await p.$eval('#play', b => b.getAttribute('aria-pressed') === 'true'))) await p.click('#play');
  await p.waitForTimeout(2500);
  const played = await p.evaluate(() => window.__src.filter(d => d === .5).length);
  check(played >= 2, 'après rechargement, le bloc Son joue le son importé (' + played + ' fois)');
  const code = await p.$eval('#code', c => c.textContent);
  check(code.includes('s("ma_voix ~ ma_voix ~")') && /Sons perso.*ma_voix/.test(code), 'le code écrit s("ma_voix") et signale le son perso');
  const cell = await p.$eval('.b-s .cell[data-snd]', c => c.dataset.snd + ' ' + c.textContent);
  check(cell === 'usr Ma voix', 'la case du bloc affiche le nom du son (' + cell + ')');

  /* suppression en deux touchers */
  await p.evaluate(() => { const t = document.querySelector('[data-tab="sons"]'); if (t) t.click(); });
  await p.click('[data-usnd-del]'); await p.waitForTimeout(100);
  const armed = await p.$eval('[data-usnd-del]', b => b.textContent);
  await p.click('[data-usnd-del]'); await p.waitForTimeout(500);
  const left = await p.$$eval('[data-sec="sons"] [data-snd="usr"]', c => c.length);
  check(armed === 'Supprimer ?' && left === 0, 'le premier toucher demande confirmation, le second supprime');
  const err = p.errors; await p.close2();
  check(!err.length, 'aucune erreur JS');
};
