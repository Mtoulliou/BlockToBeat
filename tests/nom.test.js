/* #48 L'app s'appelle Strudy ; les projets enregistrés avant le changement de nom sont toujours là */
const { openApp, melo, oneBlock } = require('./lib');
module.exports = async ({ url, check }) => {
  const p = await openApp(url, { project: oneBlock(melo([{ t: 0, d: .5, v: '3' }], 1, { id: 'ancien' })) });
  const r = await p.evaluate(async () => ({
    title: document.title, logo: document.querySelector('.logo').textContent,
    apple: document.querySelector('meta[name="apple-mobile-web-app-title"]').content,
    manifest: (await (await fetch('manifest.webmanifest')).json()).name,
    visible: !/BlockToBeat/.test(document.body.innerText)
  }));
  check(r.title === 'Strudy' && r.logo === 'Strudy' && r.apple === 'Strudy' && r.manifest === 'Strudy', 'nom Strudy : onglet, logo, app installée (' + JSON.stringify(r) + ')');
  check(r.visible, 'plus de « BlockToBeat » visible dans l\'app');
  check((await p.evaluate(() => window.BTB.getProject().stacks[0].blocks[0].id)) === 'ancien', 'un projet enregistré avant le changement de nom se recharge');
  check(!p.errors.length, 'aucune erreur JS'); await p.close2();
};
