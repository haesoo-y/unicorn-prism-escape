import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('..',import.meta.url).pathname,dir=await mkdtemp(join(tmpdir(),'upe-playthrough-'));
try{const file=join(dir,'simulation.mjs');await build({absWorkingDir:root,entryPoints:['tools/playthrough-simulation.ts'],outfile:file,bundle:true,platform:'node',format:'esm',loader:{'.webp':'dataurl'},define:{DEBUG:'false'}});process.stdout.write(execFileSync(process.execPath,[file],{encoding:'utf8'}))}finally{await rm(dir,{recursive:true,force:true})}
