import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const built = spawnSync(process.execPath, ['tools/build-game.mjs', '--debug'], {stdio: 'inherit'});
if (built.status) process.exit(built.status ?? 1);
const port = Number(process.env.PORT || 8080);
http.createServer(async (_, response) => {
  try { response.end(await readFile('build/debug.html')); }
  catch { response.statusCode = 500; response.end('Build missing'); }
}).listen(port, () => console.log(`debug: http://localhost:${port}`));
