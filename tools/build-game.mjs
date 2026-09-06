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
  script = (await minify(script, {compress: {passes: 5, unsafe: true, unsafe_math: true, unsafe_arrows: true, unsafe_methods: true, booleans_as_integers: true, pure_getters: true, keep_fargs: false}, mangle: {toplevel: true}, toplevel: true, format: {comments: false}})).code;
  const packer = new Packer([{data:script,type:'js',action:'eval'}],{allowFreeVars:true,modelRecipBaseCount:14,modelMaxCount:7,numAbbreviations:14,sparseSelectors:[0,1,2,3,7,13,26,44,57,114,194,209],recipLearningRate:710});
  const packed = packer.makeDecoder();
  script = packed.firstLine + packed.secondLine;
  style = style.replace(/\s*([{}:;,])\s*/g, '$1').trim();
  html = html.replace(/>\s+</g, '><').trim();
}
html = html.replace('/*STYLE*/', style).replace('/*SCRIPT*/', script);
await mkdir('build', {recursive: true});
const output = `build/${debug ? 'debug' : 'index'}.html`;
await writeFile(output, html);
console.log(`${mode}: ${output} (${Buffer.byteLength(html)} bytes)`);
