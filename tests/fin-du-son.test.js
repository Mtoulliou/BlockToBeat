/* #55 Fin du son : un son perso relancé par la boucle coupe sa copie précédente au lieu de s'empiler ;
   l'effet Durée (.clip) le coupe à la longueur d'un pas. 120 BPM, 4 pas par tour : un pas = 0,5 s.
   Le son dure 1,9 s : assez pour déborder sur le pas suivant, sans dépasser 2 s (au-delà, il aurait son bloc Audio). */
const { openApp, dismissLaunch } = require('./lib');
function wav(sec) {
  const sr = 22050, n = Math.floor(sr * sec), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * i / sr) * 10000), 44 + i * 2);
  return b;
}
/* pour chaque son long lu : son départ et le plus tôt de ses arrêts */
const capture = () => {
  window.__src = []; const c = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function(){
    const s = c.call(this), rec = { start: null, stop: Infinity }, st = s.start.bind(s), sp = s.stop.bind(s);
    /* seulement le son perso de 1,9 s : le bruit des percussions est aussi un tampon de 2 s, à ne pas compter */
    s.start = (t, ...a) => { if (s.buffer && Math.abs(s.buffer.duration - 1.9) < .05) { rec.start = t; window.__src.push(rec); } return st(t, ...a); };
    s.stop = (t) => { rec.stop = Math.min(rec.stop, t); return sp(t); };
    return s;
  };
};
async function run(url, fx) {
  const block = { id: 'bs', type: 's', muted: false, steps: ['long', '~', 'long', '~'], fx };
  const p = await openApp(url, { project: { bpm: 120, stacks: [{ id: 'st', title: 'Test', x: 0, y: 0, muted: false, blocks: [block] }] }, init: capture });
  await p.setInputFiles('#usndFile', { name: 'Long.wav', mimeType: 'audio/wav', buffer: wav(1.9) });
  await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(800); await dismissLaunch(p);
  await p.click('#undo'); await p.waitForTimeout(400);
  if (!(await p.$eval('#play', b => b.getAttribute('aria-pressed') === 'true'))) await p.click('#play');
  await p.waitForTimeout(3200);
  const src = await p.evaluate(() => window.__src.map(r => [r.start, r.stop]).sort((a, b) => a[0] - b[0]));
  const code = await p.$eval('#code', c => c.textContent);
  const err = p.errors; await p.close2();
  return { src, code, err };
}
module.exports = async ({ url, check }) => {
  const a = await run(url, []);
  const overlaps = a.src.slice(0, -1).filter((r, i) => r[1] > a.src[i + 1][0] + .06).length;
  check(a.src.length >= 3 && overlaps === 0, 'chaque relance coupe la copie précédente (' + a.src.length + ' sons, ' + overlaps + ' superposé(s))');

  const b = await run(url, [{ type: 'clip', v: 1 }]);
  const longest = Math.max(...b.src.map(r => r[1] - r[0]));
  check(b.src.length >= 3 && longest <= .53, 'avec .clip(1), chaque son dure un pas (' + longest.toFixed(2) + ' s au plus)');
  check(/s\("long ~ long ~"\)\.clip\(1\)/.test(b.code), 'le code écrit .clip(1)');
  check(!a.err.length && !b.err.length, 'aucune erreur JS');
};
