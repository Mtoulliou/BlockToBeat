/* Lance tous les tests : node tests/run.js [filtre]
   Sert le site en local, puis exécute chaque tests/*.test.js avec Playwright (Chromium, Firefox). */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
/* Les fichiers qui écoutent la musique en temps réel passent seuls à la fin, pour garder un timing fiable ;
   les autres tournent PARALLELE par PARALLELE. */
const SEULS = ['rec', 'vague', 'fin-du-son', 'moteur', 'sons-perso'];
const PARALLELE = 3;
server.listen(0, async () => {
  const url = 'http://localhost:' + server.address().port + '/', only = process.argv[2] || '';
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && f.includes(only)).sort();
  const alone = f => SEULS.includes(f.replace('.test.js', ''));
  const lib = require('./lib');
  let ok = 0, ko = 0; const t0 = Date.now();
  async function runFile(f) {
    const lines = [], t = Date.now();
    const check = (cond, msg) => { if (cond) { ok++; lines.push('  OK    ' + msg); } else { ko++; lines.push('  ÉCHEC ' + msg); } };
    try { await require(path.join(__dirname, f))({ url, check }); }
    catch (e) { ko++; lines.push('  ÉCHEC le test a planté : ' + (e && e.message ? e.message.split('\n')[0] : e)); }
    console.log('\n▶ ' + f + ' (' + ((Date.now() - t) / 1000).toFixed(1) + ' s)\n' + lines.join('\n'));
  }
  const queue = files.filter(f => !alone(f));
  await Promise.all(Array.from({ length: PARALLELE }, async () => { while (queue.length) await runFile(queue.shift()); }));
  for (const f of files.filter(alone)) await runFile(f);
  await lib.closeAll();
  console.log('\n' + ok + ' vérification(s) réussie(s), ' + ko + ' échec(s), en ' + Math.round((Date.now() - t0) / 1000) + ' s.');
  server.close(); process.exit(ko ? 1 : 0);
});
