import {build} from 'esbuild';
import {minify} from 'terser';
import {Packer} from 'roadroller';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

const debug = process.argv.includes('--debug');
const mode = debug ? 'debug' : 'prod';
const result = await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  write: false,
  minify: false,
  loader: {'.png': 'dataurl','.webp':'dataurl'},
  define: {DEBUG: String(debug)},
  target: 'es2020'
});
let script = result.outputFiles[0].text;
let style = await readFile('src/style.css', 'utf8');
let html = await readFile('src/index.html', 'utf8');
if (!debug) {
  // Only explicitly listed game properties are shortened; browser built-ins stay reserved.
  script = (await minify(script, {compress: {passes: 5, unsafe: true, unsafe_math: true, unsafe_arrows: true, unsafe_methods: true, booleans_as_integers: true, pure_getters: true, keep_fargs: false}, mangle: {toplevel: true, properties: {regex: /^(abilities|activate|aiSystem|attach|attack|attackAt|attackRect|attackRequested|audio|audioEvents|audioSystem|available|beats|cameraX|cameraY|choiceAt|choiceRects|choose|cleanupSystem|clear|collected|collisionSystem|colors|componentStores|consumed|context|contexts|cooldowns|createComponentStore|createEntity|createTagStore|damage|destroyEntity|down|draw|drawArena|drawAttack|drawAura|drawCharge|drawEnemy|drawGate|drawHud|drawMap|drawOverlay|drawPrism|drawShot|drawStick|drawTime|drawTitle|drawUnicorn|elapsed|endFrame|enemies|enemy|enemyHit|enemyTypes|entities|events|facings|frame|friendly|friendlyShots|gate|gateEntered|gates|health|height|held|hostileShots|index|input|inputSystem|invulnerable|keyDown|keyUp|lastPlayerX|lastPlayerY|lastTime|life|master|meleeFlash|move|moveX|moveY|movementSystem|music|nearestEnemy|nearestEnemySpeed|next|nextEntityId|nextStage|notes|phase|playerHit|players|pointerArmed|pointerAttack|pointerChoice|positions|pressed|prismColors|prisms|projectiles|radii|rainbowMask|reinforcementType|reinforcementWave|renderSystem|reset|resize|restartRequested|rulesSystem|selectedAbility|stage|stageElapsed|startMove|startStage|state|step|stickX|stickY|stopMove|stride|tagStores|take|tone|total|touchId|type|unicorn|update|value|velocities|viewHeight|viewWidth|visiblePrisms|vx|vy|wave|width|world|x|y)$/}}, toplevel: true, format: {comments: false}})).code;
  // Keep already-compressed WebP data outside Roadroller; ZIP still contains every asset.
  const assets=[];
  script=script.replace(/"data:image\/webp;base64,[^"]+"/g,value=>{const name='__asset'+assets.length;assets.push('const '+name+'='+value+';');return name;});
  const packer = new Packer([{data:script,type:'js',action:'eval'}],{allowFreeVars:true,modelRecipBaseCount:10,modelMaxCount:6,numAbbreviations:32,sparseSelectors:[0,1,2,3,7,13,42,57,70,113,148,393],recipLearningRate:777});
  const packed = packer.makeDecoder();
  script = assets.join('') + packed.firstLine + packed.secondLine;
  style = style.replace(/\s*([{}:;,])\s*/g, '$1').trim();
  html = html.replace(/>\s+</g, '><').trim();
}
html = html.replace('/*STYLE*/', style).replace('/*SCRIPT*/', script);
await mkdir('build', {recursive: true});
const output = `build/${debug ? 'debug' : 'index'}.html`;
await writeFile(output, html);
console.log(`${mode}: ${output} (${Buffer.byteLength(html)} bytes)`);
