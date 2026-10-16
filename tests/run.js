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
server.listen(0, async () => {
  const url = 'http://localhost:' + server.address().port + '/', only = process.argv[2] || '';
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && f.includes(only)).sort();
  let ok = 0, ko = 0;
  for (const f of files) {
    console.log('\n▶ ' + f);
    const check = (cond, msg) => { if (cond) { ok++; console.log('  OK    ' + msg); } else { ko++; console.log('  ÉCHEC ' + msg); } };
    try { await require(path.join(__dirname, f))({ url, check }); }
    catch (e) { ko++; console.log('  ÉCHEC le test a planté : ' + (e && e.message ? e.message.split('\n')[0] : e)); }
  }
  console.log('\n' + ok + ' vérification(s) réussie(s), ' + ko + ' échec(s).');
  server.close(); process.exit(ko ? 1 : 0);
});
