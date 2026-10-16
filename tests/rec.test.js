/* REC : prise exacte (#16, #43), pas de notes fantômes (#47), écriture directe en piano roll (#46) */
const { openApp, oneBlock } = require('./lib');
const empty = oneBlock(null); empty.stacks[0].blocks = [];
const oscLog = () => { window.__o = []; const c = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function(){ window.__o.push(performance.now()); return c.call(this); }; };
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { project: Object.assign({ bpm: 100 }, empty), init: oscLog });
  await p.click('#play'); await p.waitForTimeout(250);                       // arrêté : la prise démarre sur la première note
  await p.click('#recBtn'); await p.click('#metroBtn'); await p.waitForTimeout(200);
  const st = 150, W = ms => p.waitForTimeout(ms);                           // 100 BPM : un pas = 150 ms
  await p.keyboard.down('a'); await W(3 * st);
  check(await p.$$eval('.roll', x => x.length) === 1 && await p.$$eval('.b-line', x => x.length) === 0, 'pendant la prise, le bloc est déjà un piano roll');
  await p.keyboard.down('d'); await W(st); await p.keyboard.up('a'); await W(4 * st); await p.keyboard.up('d');
  await W(2 * st); await p.keyboard.down('f'); await p.keyboard.down('g'); await W(2 * st); await p.keyboard.up('f'); await p.keyboard.up('g');
  await W(st); await p.keyboard.down('h'); await W(st * .7); await p.keyboard.up('h');
  await W(16 * st - 13.7 * st + 50);                                          // fin du tour 1
  const t0 = await p.evaluate(() => performance.now()); await W(16 * st - 250);
  check(await p.evaluate(t0 => window.__o.filter(t => t > t0).length, t0) === 0, 'un tour sans jouer reste muet (#47)');
  await p.click('#recBtn'); await W(300);
  const take = await p.evaluate(() => { const s = window.BTB.getProject().stacks.find(x => x.title === 'Enregistrement'); const b = s.blocks[0]; return (b.lines ? 'CASES ' : '') + b.notes.slice().sort((x, y) => x.t - y.t).map(n => n.v + '@' + n.t * 16 + '+' + n.d * 16).join(' ') + ' / ' + b.len; });
  check(take === '0@0+3 2@3+5 3,4@10+2 5@13+1 / 1', 'la prise est exactement ce qui a été joué : jeu lié, accord, note brève (' + take + ')');
  check(!p.errors.length, 'aucune erreur JS ' + p.errors.join(' ')); await p.close2();
};
