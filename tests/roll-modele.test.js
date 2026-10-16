/* #46 Mélodie libre : conversion des cases, écriture et relecture du code Strudel (tests unitaires des fonctions) */
const { openApp } = require('./lib');
module.exports = async ({ url, check }) => {
  const p = await openApp(url);
  const r = await p.evaluate(() => {
    const R = window.BTB._roll, out = [];
    const near = (a, b) => Math.abs(a - b) < .006;
    const same = (a, b) => a && b && a.length === b.length && a.every((n, i) => near(n.t, b[i].t) && near(n.d, b[i].d) && n.v === b[i].v);
    const sort = ns => ns.slice().sort((x, y) => x.t - y.t || x.d - y.d);
    // conversion d'un bloc en cases
    const c = R.fromLines([['0', '_', '_', '2', '~', '4,7', '_', '~'], ['5', '~', '3', '_']]);
    out.push([c.len === 2 && same(sort(c.notes), [{ t: 0, d: .375, v: '0' }, { t: .375, d: .125, v: '2' }, { t: .625, d: .25, v: '4,7' }, { t: 1, d: .25, v: '5' }, { t: 1.5, d: .5, v: '3' }]), 'cases → notes (notes tenues, accord, 2 lignes = 2 tours)']);
    // écriture puis relecture : rythmes que les cases ne savaient pas faire
    [['note longue, demi-temps, contretemps', [{ t: 0, d: .375, v: '0' }, { t: .5, d: .125, v: '2' }, { t: .6875, d: .3125, v: '4' }], 1, '0@6 ~@2 2@2 ~ 4@5'],
     ['deux voix qui se chevauchent', [{ t: 0, d: .75, v: '0' }, { t: .25, d: .25, v: '4' }, { t: .5, d: .5, v: '7' }], 1, '0@3 ~, ~ 4 7@2'],
     ['note à cheval sur deux tours', [{ t: .75, d: .5, v: '3' }, { t: 1.5, d: .25, v: '5' }], 2, '~@3 3@2 ~ 5 ~'],
     ['triolets', [{ t: 0, d: 1 / 3, v: '0' }, { t: 1 / 3, d: 1 / 3, v: '2' }, { t: 2 / 3, d: 1 / 3, v: '4' }], 1, '0 2 4'],
     ['accord', [{ t: 0, d: .5, v: '0,2,4' }], 1, '[0,2,4] ~'],
     ['timing libre arrondi au 1/192', [{ t: .013, d: .2, v: '0' }], 1, null]
    ].forEach(([name, notes, len, expect]) => {
      const mini = R.toMini(notes, len), back = R.parse(mini, len);
      out.push([(!expect || mini === expect) && back && back.len === len && same(sort(back.notes), sort(notes)), name + ' : n("' + mini + '")']);
    });
    // relecture d'écritures Strudel variées
    [['0 _ _ 2', 1, [[0, .75, '0'], [.75, .25, '2']]], ['<0 2> 4', 1, [[0, .5, '0'], [.5, .5, '4'], [1, .5, '2'], [1.5, .5, '4']]], ['0!3 ~', 1, [[0, .25, '0'], [.25, .25, '0'], [.5, .25, '0']]],
     ['0@1.5 2@0.5', 1, [[0, .75, '0'], [.75, .25, '2']]], ['0 2', 2, [[0, 1, '0'], [1, 1, '2']]], ['[0 2]*2', 1, [[0, .25, '0'], [.25, .25, '2'], [.5, .25, '0'], [.75, .25, '2']]]
    ].forEach(([mini, slow, exp]) => {
      const back = R.parse(mini, slow), want = exp.map(([t, d, v]) => ({ t, d, v }));
      out.push([back && same(sort(back.notes), sort(want)), 'relecture de n("' + mini + '")' + (slow > 1 ? '.slow(' + slow + ')' : '')]);
    });
    out.push([R.parse('c4 e4', 1) === null, 'n("c4 e4") laissé à l\'ancien lecteur']);
    // aimant : calage sur une grille, accords, durée minimale, fin de phrase
    const raw = [{ t: .013, d: .2, v: '0' }, { t: .49, d: .1, v: '4' }, { t: .51, d: .08, v: '7' }, { t: .97, d: .02, v: '2' }];
    out.push([same(sort(R.quantize(raw, 16, 1)), [{ t: 0, d: .1875, v: '0' }, { t: .5, d: .0625, v: '4,7' }, { t: .9375, d: .0625, v: '2' }]), 'aimant 1/16 : calage, notes ensemble = accord, note de fin gardée dans la phrase']);
    out.push([same(sort(R.quantize([{ t: .32, d: .34, v: '0' }, { t: .68, d: .3, v: '2' }], 12, 1)), [{ t: 1 / 3, d: 1 / 3, v: '0' }, { t: 2 / 3, d: 1 / 3, v: '2' }]), 'aimant triolets']);
    out.push([same(R.quantize(raw, 0, 1), raw), 'aimant libre : rien ne bouge']);
    return out;
  });
  r.forEach(([c, m]) => check(c, m));
  // les 10 démos : cases → notes → code → relecture identique
  const seen = {};
  for (let seed = 1; seed <= 40 && Object.keys(seen).length < 10; seed++) {
    const q = await openApp(url, { seed });
    const res = await q.evaluate(() => {
      const R = window.BTB._roll, P = window.BTB.getProject(), sort = ns => ns.slice().sort((x, y) => x.t - y.t || x.d - y.d);
      return { title: P.stacks[0].title, ok: P.stacks.every(st => st.blocks.every(b => { if (b.type !== 'n') return true; const back = R.parse(R.toMini(b.notes, b.len), b.len); return back && back.len === b.len && JSON.stringify(sort(back.notes).map(n => [n.t.toFixed(4), n.d.toFixed(4), n.v])) === JSON.stringify(sort(b.notes).map(n => [n.t.toFixed(4), n.d.toFixed(4), n.v])); })) };
    });
    if (!seen[res.title]) { seen[res.title] = 1; check(res.ok, 'démo « ' + res.title + ' » : code → relecture identique'); }
    await q.close2();
  }
  check(p.errors.length === 0, 'aucune erreur JS'); await p.close2();
};
