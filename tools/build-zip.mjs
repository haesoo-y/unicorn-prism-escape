import {deflateAsync} from '@gfx/zopfli';
import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const built = spawnSync(process.execPath, ['tools/build-game.mjs', '--prod'], {stdio: 'inherit'});
if (built.status) process.exit(built.status ?? 1);
const name = Buffer.from('index.html');
const data = await readFile('build/index.html');
const compressed = Buffer.from(await deflateAsync(data, {numiterations: 1000}));
let crc = 0xffffffff;
for (const byte of data) {
  crc ^= byte;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
}
crc = (crc ^ 0xffffffff) >>> 0;
const local = Buffer.alloc(30);
local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
const central = Buffer.alloc(46);
central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10);
central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(central.length + name.length, 12); end.writeUInt32LE(local.length + name.length + compressed.length, 16);
const zip = Buffer.concat([local, name, compressed, central, name, end]);
await writeFile('build/game.zip', zip);
console.log(`zip: build/game.zip (${zip.length} bytes)`);
