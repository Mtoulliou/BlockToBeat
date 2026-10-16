/* #41 La vague (mascotte) : calme sans son, rebondit sur les percussions, ondule sur la mélodie */
const { openApp, melo } = require('./lib');
async function watch(url, blocks) {
  const p = await openApp(url, { project: { stacks: [{ id: 'st', title: 'T', x: 0, y: 0, muted: false, blocks }] } });
  /* pause puis lecture : on repart du projet testé, sans l'élan de la démo du lancement */
  if (await p.evaluate(() => document.body.classList.contains('is-playing'))) await p.click('#play');
  await p.waitForTimeout(200); await p.click('#play'); await p.waitForTimeout(700);
  const r = await p.evaluate(() => new Promise(res => {
    const out = { jy: [], amp: [] }, t0 = performance.now();
    (function f(){
      const tr = document.getElementById('mascot').style.transform, m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tr) || /translateY\(([-\d.]+)px\)/.exec(tr);
      out.jy.push(m ? +(m[2] != null ? m[2] : m[1]) : 0);
      const ys = (document.getElementById('mWave').getAttribute('d').match(/[-\d.]+ [-\d.]+/g) || []).map(x => +x.split(' ')[1]);
      out.amp.push(ys.length ? Math.max(...ys) - Math.min(...ys) : 0);
      out.tr = (out.tr || new Set()).add(tr); if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res({ jy: Math.min(...out.jy), amp: Math.max(...out.amp), still: [...out.tr].every(x => x === 'none'), light: getComputedStyle(document.querySelector('.edge-light')).opacity === '1' });
    })();
  }));
  r.errors = p.errors; await p.close2(); return r;
}
module.exports = async ({ url, check }) => {
  const drums = await watch(url, [{ id: 'bs', type: 's', muted: false, steps: ['bd', 'bd', 'bd', 'bd'], fx: [] }]);
  const mel = await watch(url, [melo([{ t: 0, d: .5, v: '0' }, { t: .5, d: .5, v: '4' }], 1, { synth: 'triangle' })]);
  const quiet = await watch(url, [Object.assign(melo([{ t: 0, d: .5, v: '0' }], 1), { muted: true })]);
  const none = await watch(url, []);
  check(drums.jy < -2.5, 'percussions : la vague rebondit (saut ' + drums.jy.toFixed(1) + ' px)');
  check(mel.jy > -1.5 && mel.amp > drums.amp, 'mélodie : elle ondule sans sauter (saut ' + mel.jy.toFixed(1) + ' px, vague ' + mel.amp.toFixed(1) + ' contre ' + drums.amp.toFixed(1) + ' avec les percussions seules)');
  check(quiet.still && quiet.amp < mel.amp, 'en lecture, blocs coupés : elle ne bouge pas (vague ' + quiet.amp.toFixed(1) + ')');
  check(none.still && !none.light, 'en lecture sans aucun bloc : elle ne bouge pas et le liseré de lumière reste éteint');
  check(drums.light, 'avec du son, le liseré de lumière s\'allume');
  check(!drums.errors.length && !mel.errors.length && !quiet.errors.length && !none.errors.length, 'aucune erreur JS');
};
