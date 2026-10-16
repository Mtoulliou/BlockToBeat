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
  check(take === '0@0+3 2@3+5 3,4@10+2 5@13+1 / 1', 'aimant 1/16 (par défaut) : la prise est ce qui a été joué, jeu lié, accord, note brève (' + take + ')');
  // aimant libre : les notes gardent leur instant réel ; retour au 1/16 : la même prise calée
  await p.click('.stack:has-text("Enregistrement") .b-key'); await p.waitForTimeout(100);
  await p.selectOption('.stack:has-text("Enregistrement") select[data-nf="snap"]', 'off'); await p.waitForTimeout(150);
  const free = await p.evaluate(() => window.BTB.getProject().stacks.find(x => x.title === 'Enregistrement').blocks[0].notes.map(n => n.t * 16));
  check(free.length === 4 && free.some(t => Math.abs(t - Math.round(t)) > .01), 'aimant libre : les notes reprennent leur instant exact, hors grille');
  await p.selectOption('.stack:has-text("Enregistrement") select[data-nf="snap"]', '16'); await p.waitForTimeout(150);
  const back = await p.evaluate(() => window.BTB.getProject().stacks.find(x => x.title === 'Enregistrement').blocks[0].notes.slice().sort((x, y) => x.t - y.t).map(n => n.v + '@' + n.t * 16 + '+' + n.d * 16).join(' '));
  check(back === '0@0+3 2@3+5 3,4@10+2 5@13+1', 'retour à l\'aimant 1/16 : la même prise calée (' + back + ')');
  check(!p.errors.length, 'aucune erreur JS ' + p.errors.join(' ')); await p.close2();

  // triolets et note qui passe d'un tour à l'autre (100 BPM : un tour = 2,4 s)
  const q = await openApp(url, { project: Object.assign({ bpm: 100 }, empty) });
  await q.click('#play'); await q.waitForTimeout(250);
  await q.click('#recBtn'); await q.click('#metroBtn'); await q.waitForTimeout(200);
  for (const [key, wait] of [['a', 800], ['d', 800], ['g', 800 - 50]]) { await q.keyboard.down(key); await q.waitForTimeout(400); await q.keyboard.up(key); await q.waitForTimeout(wait - 400); }
  await q.waitForTimeout(50 + 2400 * 0.75);                      // 0,75 tour du 2e tour
  await q.keyboard.down('j'); await q.waitForTimeout(150 * 6); await q.keyboard.up('j');   // tenue 6 pas : passe sur le 3e tour
  await q.waitForTimeout(300); await q.click('#recBtn'); await q.waitForTimeout(300);
  const get = () => q.evaluate(() => { const b = window.BTB.getProject().stacks.find(x => x.title === 'Enregistrement').blocks[0]; return { len: b.len, n: b.notes.slice().sort((x, y) => x.t - y.t).map(n => [n.v, +n.t.toFixed(4), +n.d.toFixed(4)]) }; });
  await q.click('.stack:has-text("Enregistrement") .b-key'); await q.selectOption('.stack:has-text("Enregistrement") select[data-nf="snap"]', '12'); await q.waitForTimeout(150);
  const tri = await get(), first3 = tri.n.slice(0, 3).map(x => x[1]);
  check(JSON.stringify(first3) === JSON.stringify([0, .3333, .6667]), 'aimant triolets : trois notes jouées en triolets tombent sur 0, 1/3, 2/3 (' + first3 + ')');
  const last = tri.n[tri.n.length - 1];
  check(tri.len === 3 && last[1] < 2 && last[1] + last[2] > 2, 'une note tenue au-delà du tour passe sur la ligne suivante (' + JSON.stringify(last) + ', ' + tri.len + ' tours)');
  check(!q.errors.length, 'aucune erreur JS ' + q.errors.join(' ')); await q.close2();
};
