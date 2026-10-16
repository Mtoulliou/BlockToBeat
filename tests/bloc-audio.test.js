/* #55 Bloc Audio : un son long importé devient un bloc joué une fois sur plusieurs mesures, calé sur le tempo (.loopAt),
   avec un point de départ (.begin). L'aperçu d'un son perso dure 1,5 s au plus. 120 BPM : une mesure = 2 s. */
const { openApp } = require('./lib');
function wav(sec) {
  const sr = 22050, n = Math.floor(sr * sec), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * i / sr) * 10000 * (1 - i / n)), 44 + i * 2);
  return b;
}
/* chaque lecture d'un son long : départ, arrêt le plus tôt, vitesse, point de départ dans le son */
const capture = () => {
  window.__src = []; const c = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function(){
    const s = c.call(this), rec = { start: null, stop: Infinity }, st = s.start.bind(s), sp = s.stop.bind(s);
    s.start = (t, off) => { if (s.buffer && s.buffer.duration > 3) { Object.assign(rec, { start: t, off: off || 0, rate: s.playbackRate.value }); window.__src.push(rec); } return st(t, off); };
    s.stop = (t) => { rec.stop = Math.min(rec.stop, t); return sp(t); };
    return s;
  };
};
const blocks = p => p.evaluate(() => window.BTB.getProject().stacks.flatMap(s => s.blocks));
const code = p => p.$eval('#code', c => c.textContent);
async function importCode(p, text) {
  await p.click('#importOpen'); await p.waitForTimeout(150);
  await p.fill('#importText', text);
  await p.click('#importReplace'); await p.waitForTimeout(400);
}
async function playFor(p, ms) {
  await p.evaluate(() => { window.__src = []; });
  if (!(await p.$eval('#play', b => b.getAttribute('aria-pressed') === 'true'))) await p.click('#play');
  await p.waitForTimeout(ms);
  await p.click('#play'); await p.waitForTimeout(200);
  return p.evaluate(() => window.__src.map(r => ({ ...r })));
}
module.exports = async ({ url, check }) => {
  const project = { bpm: 120, stacks: [{ id: 'st', title: 'Beat', x: 0, y: 0, muted: false, blocks: [{ id: 'bs', type: 's', muted: false, steps: ['bd', '~', '~', '~'], fx: [] }] }] };
  const p = await openApp(url, { project, init: capture });

  /* un son de 4 s importé : il arrive dans un bloc Audio de 2 mesures, calé sur le tempo */
  await p.setInputFiles('#usndFile', { name: 'Long.wav', mimeType: 'audio/wav', buffer: wav(4) });
  await p.waitForTimeout(800);
  const a = (await blocks(p)).find(b => b.audio);
  check(a && a.steps[0] === 'long' && a.audio.bars === 2 && a.audio.fit, 'le son long a son bloc Audio de 2 mesures (' + JSON.stringify(a && a.audio) + ')');
  check(await p.$('.b-a .a-svg') !== null, 'le bloc Audio montre la forme d’onde');
  check((await code(p)).includes('s("long").loopAt(2)'), 'le code écrit s("long").loopAt(2)');

  /* il joue une fois toutes les 2 mesures, sans s'empiler sur lui-même */
  let src = await playFor(p, 9000);
  const gaps = src.slice(1).map((r, i) => +(r.start - src[i].start).toFixed(2));
  check(src.length >= 2 && gaps.every(g => Math.abs(g - 4) < .05), 'il repart toutes les 2 mesures, soit 4 s (écarts : ' + gaps.join(', ') + ')');
  check(src.every((r, i) => !src[i + 1] || r.stop <= src[i + 1].start + .05), 'chaque lecture s’arrête avant la suivante');
  check(src.every(r => Math.abs(r.rate - 1) < .01), 'sur 2 mesures, un son de 4 s garde sa vitesse (' + src.map(r => r.rate).join(', ') + ')');

  /* 4 mesures, calé sur le tempo : le son est étiré à 8 s, donc lu deux fois moins vite */
  await p.selectOption('select[data-nf="abars"]', '4'); await p.waitForTimeout(200);
  src = await playFor(p, 1500);
  check(src.length >= 1 && Math.abs(src[0].rate - .5) < .01, 'sur 4 mesures, il est lu à la vitesse 0,5 (' + src.map(r => r.rate).join(', ') + ')');
  check((await code(p)).includes('s("long").loopAt(4)'), 'le code suit : .loopAt(4)');

  /* point de départ à la moitié : la lecture commence à 2 s dans le son */
  await p.selectOption('select[data-nf="abeg"]', '0.5'); await p.waitForTimeout(200);
  src = await playFor(p, 1500);
  check(src.length >= 1 && Math.abs(src[0].off - 2) < .01, 'avec Début 50 %, la lecture part de 2 s dans le son (' + src.map(r => r.off).join(', ') + ')');
  check((await code(p)).includes('s("long").loopAt(4).begin(0.5)'), 'le code écrit .begin(0.5)');

  /* à l'arrêt, le son long ne continue pas : il s'arrête tout de suite */
  await p.evaluate(() => { window.__src = []; });
  await p.click('#play'); await p.waitForTimeout(700);
  const now = await p.evaluate(() => { const r = window.__src[0]; return r && r.start; });
  await p.click('#play'); await p.waitForTimeout(150);
  const cut = await p.evaluate(() => window.__src[0] && window.__src[0].stop);
  check(now != null && cut - now < 1.2, 'Stop coupe le son long tout de suite (arrêt ' + (cut - now).toFixed(2) + ' s après le départ au lieu de 8 s)');

  /* relecture du code : .loopAt et .slow redonnent un bloc Audio */
  await importCode(p, 'setcpm(120/4)\n$: s("long").slow(8)');
  let b = (await blocks(p))[0];
  check(b.audio && b.audio.bars === 8 && !b.audio.fit && !b.fx.length, 'l’import de s("long").slow(8) donne un bloc Audio de 8 mesures à vitesse réelle (' + JSON.stringify(b) + ')');
  await importCode(p, 'setcpm(120/4)\n$: s("long").loopAt(2).begin(.25).room(.3)');
  b = (await blocks(p))[0];
  check(b.audio && b.audio.bars === 2 && b.audio.fit && b.audio.begin === .25 && b.fx.map(f => f.type).join() === 'room', 'l’import de .loopAt(2).begin(.25) garde tout, la réverb en effet (' + JSON.stringify(b) + ')');

  /* l'aperçu d'un son perso dans la palette dure 1,5 s au plus */
  await p.evaluate(() => { window.__src = []; const t = document.querySelector('[data-tab="sons"]'); if (t) t.click(); });
  await p.evaluate(() => document.querySelector('[data-sec="sons"] .chip--sound[data-snd="usr"]').click());
  await p.waitForTimeout(300);
  const pv = await p.evaluate(() => window.__src.map(r => r.stop - r.start));
  check(pv.length === 1 && pv[0] <= 1.6, 'l’aperçu dans la palette dure 1,5 s au plus (' + pv.map(x => x.toFixed(2)).join(', ') + ' s)');

  const err = p.errors; await p.close2();
  check(!err.length, 'aucune erreur JS (' + err.join(' | ') + ')');
};
