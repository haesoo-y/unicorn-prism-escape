import {stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const limit = Number(process.env.JS13K_LIMIT || 13312);
try { await stat('build/game.zip'); } catch {
  const zipped = spawnSync(process.execPath, ['tools/build-zip.mjs'], {stdio: 'inherit'});
  if (zipped.status) process.exit(zipped.status ?? 1);
}
const bytes = (await stat('build/game.zip')).size;
const remaining = limit - bytes;
console.log(`ZIP ${bytes} / ${limit} bytes (${remaining >= 0 ? remaining + ' remaining' : -remaining + ' over'})`);
if (remaining < 0) process.exitCode = 1;
