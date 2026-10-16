/* #46 Son d'un bloc en mélodie libre : chaque note démarre à son instant exact (120 BPM, un tour = 2 s) */
const { openApp, melo, oneBlock } = require('./lib');
const capture = () => { window.__o = []; const c = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function(){ const o = c.call(this); const st = o.start.bind(o); o.start = t => { window.__o.push([t, o.frequency.value]); return st(t); }; return o; }; };
async function starts(url, notes, len, fx) {
  const p = await openApp(url, { project: oneBlock(melo(notes, len, { synth: 'triangle', fx: fx || [] })), init: capture });
  await p.click('#play'); await p.waitForTimeout(100); await p.evaluate(() => { window.__o = []; });
  await p.click('#play'); await p.waitForTimeout(len * 2000 + 300);
  const r = await p.evaluate(len => { const o = window.__o, m = Math.min(...o.map(x => x[0])); return o.map(x => +(x[0] - m).toFixed(3)).filter(t => t < len * 2 - .01).sort((a, b) => a - b); }, len);
  const err = p.errors; await p.close2(); return { r, err };
}
module.exports = async ({ url, check }) => {
  const notes = [{ t: 0, d: .375, v: '0' }, { t: .5, d: .125, v: '2' }, { t: .6875, d: .3125, v: '4' }, { t: 1.25, d: .5, v: '0,4' }];
  const a = await starts(url, notes, 2);
  check(JSON.stringify(a.r) === JSON.stringify([0, 1, 1.375, 2.5, 2.5]), 'débuts exacts, accord compris (' + a.r.join(' ') + ')');
  const b = await starts(url, [{ t: 0, d: .25, v: '0' }, { t: .5, d: .25, v: '2' }], 1, [{ type: 'rev' }]);
  check(JSON.stringify(b.r) === JSON.stringify([0, 1]) , 'rev retourne le tour (' + b.r.join(' ') + ')');
  check(!a.err.length && !b.err.length, 'aucune erreur JS');
};
