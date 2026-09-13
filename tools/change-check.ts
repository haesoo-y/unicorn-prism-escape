import assert from 'node:assert/strict';
import {World} from '../src/ecs/world';
import {createGameState} from '../src/state';
import {spawnEnemy,spawnPlayer,spawnProjectile} from '../src/prefabs';
import {AISystem} from '../src/systems/ai-system';
import {RulesSystem} from '../src/systems/rules-system';
import {RenderSystem} from '../src/systems/render-system';
import {InputState} from '../src/input';
import {AudioSystem} from '../src/systems/audio-system';
const none={colors:0,playerHit:false,enemyHit:false,gateEntered:false};
const oldRandom=Math.random;
(globalThis as any).Image=class {complete=true;src=''};
(globalThis as any).addEventListener=()=>{};
const context:any=new Proxy({canvas:null as any,createLinearGradient:()=>({addColorStop(){}})},{get(t,k){if(k in t)return t[k as keyof typeof t];return ()=>{}},set(t,k,v){(t as any)[k]=v;return true}});
class Canvas{width=960;height=720;clientWidth=960;clientHeight=720;getContext(){return context}addEventListener(){}setPointerCapture(){}}
const canvas=new Canvas();context.canvas=canvas;
Object.assign(globalThis,{HTMLCanvasElement:Canvas,document:{querySelector:()=>canvas},innerWidth:960,innerHeight:720,devicePixelRatio:1,requestAnimationFrame:()=>{}});
const {Game}=await import('../src/game');
for(let pass=1;pass<=2;pass++){
 let spawnChecks=0,speedChecks=0,renderChecks=0;
 for(let stage=0;stage<10;stage++)for(let seed=1;seed<=32;seed++){
  let r=seed;Math.random=()=>((r=(Math.imul(r,1664525)+1013904223)>>>0)/4294967296);
  const w=new World(),s=createGameState(7),rules=new RulesSystem();s.stage=stage;spawnPlayer(w);const player=[...w.players][0]!;w.positions.set(player,{x:48,y:160+seed*45});
  s.stageElapsed=7.999;rules.update(w,s,none);assert.equal(w.enemies.size,0);
  let expected=0;const kinds=stage<3?1:stage<6?2:3;
  for(const time of [8,16,24]){s.stageElapsed=time;const before=new Set(w.enemies.keys());rules.update(w,s,none);expected+=kinds;assert.equal(w.enemies.size,expected);const edges=new Set<number>(),types=new Set<number>();for(const [e,enemy]of w.enemies){if(before.has(e))continue;const p=w.positions.get(e)!;assert(p.x>=48&&p.x<=3152&&p.y>=48&&p.y<=2152);const edge=p.y===48?0:p.x===3152?1:p.y===2152?2:p.x===48?3:-1;assert(edge>=0);assert(!edges.has(edge));edges.add(edge);types.add(enemy.type);const q=w.positions.get(player)!;assert(Math.hypot(p.x-q.x,p.y-q.y)>=160)}assert.equal(types.size,kinds);rules.update(w,s,none);assert.equal(w.enemies.size,expected)}
  for(const phase of ['upgrade','failed','complete','title'] as const){s.phase=phase;s.stageElapsed=32;rules.update(w,s,none);assert.equal(w.enemies.size,expected)}
  spawnChecks++;
 }
 Math.random=oldRandom;
 for(let stage=0;stage<10;stage++)for(let type=0;type<3;type++)for(const slowed of [false,true]){
  const w=new World(),s=createGameState(7),ai=new AISystem();s.stage=stage;s.abilities=slowed?1<<8:0;spawnPlayer(w);spawnEnemy(w,slowed?1750:2200,1100,type);const e=[...w.enemies.keys()][0]!;
  for(let f=0;f<180;f++)ai.update(w,s,.05);
  const v=w.velocities.get(e)!;assert(Math.abs(Math.hypot(v.x,v.y)-([200,180,160][type]!+stage*5)*(slowed?.65:1))<.001);speedChecks++;
 }
 for(let stage=0;stage<10;stage++){
  const g:any=new Game();g.gameState.stage=stage;g.startStage();g.lastTime=1000;g.gameState.stageElapsed=7.99;g.gameState.elapsed=42;g.gameState.invulnerable=100;const initial=g.world.enemies.size;g.frame(1020);assert.equal(g.world.enemies.size,initial+(stage<3?1:stage<6?2:3));
  const elapsed=g.gameState.elapsed;g.gameState.phase='upgrade';for(let t=1040;t<7040;t+=20)g.frame(t);assert.equal(g.gameState.elapsed,elapsed);assert.equal(g.world.enemies.size,initial+(stage<3?1:stage<6?2:3));
  g.startStage();assert.equal(g.gameState.stageElapsed,0);assert.equal(g.gameState.reinforcementWave,0);assert.equal(g.world.enemies.size,initial);assert.equal(g.gameState.elapsed,elapsed);assert.equal(g.world.entities.size,9+initial);
  if(stage<9){g.nextStage();assert.equal(g.gameState.reinforcementWave,0);assert.equal(g.gameState.elapsed,elapsed)}g.reset();assert.equal(g.gameState.elapsed,0);assert.equal(g.gameState.reinforcementWave,0);
 }
 // Cap, partial waves, pending deaths, skipped-wave debt and rotating priority.
 for(let stage=0;stage<10;stage++){
  const w=new World(),s=createGameState(7),rules=new RulesSystem(),cap=[4,7,9,15,17,19,24,27,30,35][stage]!,kinds=Math.min(3,1+Math.floor(stage/3));s.stage=stage;spawnPlayer(w);
  for(let i=0;i<cap;i++)spawnEnemy(w,300+i*20,300,0);
  for(const t of [8,16,24]){s.stageElapsed=t;rules.update(w,s,none);assert.equal(w.enemies.size,cap);assert.equal(s.reinforcementType,0)}
  for(let turn=0;turn<kinds*2;turn++){
   const dead=[...w.enemies.keys()][0]!;w.consumed.add(dead);const before=new Set(w.enemies.keys());s.stageElapsed=32+turn*8;rules.update(w,s,none);const added=[...w.enemies.keys()].filter(e=>!before.has(e));assert.equal(added.length,1);assert.equal(w.enemies.get(added[0]!)!.type,turn%kinds);assert.equal(w.enemies.size-1,cap);w.destroyEntity(dead);rules.update(w,s,none);assert.equal(w.enemies.size,cap);
  }
 }
 for(const facing of [[1,0],[0,-1],[-1,1]]){
  const w=new World(),s=createGameState(7),ai=new AISystem();spawnPlayer(w);const p=[...w.players][0]!;w.facings.set(p,{x:facing[0]!,y:facing[1]!});ai.update(w,s,0);assert.equal(w.projectiles.size,0);s.abilities=1<<4;ai.update(w,s,0);assert.equal(w.projectiles.size,4);
  const vectors=[...w.projectiles.keys()].map(e=>{const v=w.velocities.get(e)!,q=w.positions.get(e)!;assert.equal(Math.hypot(v.x,v.y),420);assert.equal(q.x,1600+v.x/420*34);assert.equal(q.y,1100+v.y/420*34);assert.equal(w.projectiles.get(e)!.life,1);return `${v.x},${v.y}`}).sort();assert.deepEqual(vectors,['-420,0','0,-420','0,420','420,0'].sort());
  ai.update(w,s,.5);assert.equal(w.projectiles.size,4);s.phase='upgrade';ai.update(w,s,2);assert.equal(w.projectiles.size,4);s.phase='play';ai.update(w,s,.5);assert.equal(w.projectiles.size,4);ai.update(w,s,.999);assert.equal(w.projectiles.size,4);ai.update(w,s,.002);assert.equal(w.projectiles.size,8);assert.equal(w.consumed.size,4);
 }
 const w=new World(),s=createGameState(7),ai=new AISystem();spawnPlayer(w);spawnProjectile(w,50,50,300,0,false);const shot=[...w.projectiles.keys()][0]!;assert.equal(w.projectiles.get(shot)!.life,2);for(let i=0;i<39;i++)ai.update(w,s,.05);assert(!w.consumed.has(shot));ai.update(w,s,.051);assert(w.consumed.has(shot));
 for(let direction=0;direction<8;direction++)for(let phase=0;phase<4;phase++){
  const calls:any[][]=[],rotations:number[]=[];const c:any={imageSmoothingEnabled:false,save(){},restore(){},translate(...n:number[]){assert(n.every(Number.isInteger))},scale(x:number,y:number){assert(Math.abs(x)===1&&y===1)},rotate(a:number){rotations.push(a)},drawImage(...a:any[]){calls.push(a)}};
  const r:any=new RenderSystem(c,new InputState());r.stride=phase*Math.PI/2;r.drawUnicorn(1600,1100,Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4),false,1,true);assert.equal(rotations.length,0);assert(calls.length>=3);for(const a of calls){assert.equal(a[3],a[7]);assert.equal(a[4],a[8]);assert(a.slice(1).every(Number.isInteger))}r.drawUnicorn(1600,1100,1,0,false,1,false);assert.deepEqual(calls.at(-1)!.slice(3),[56,56,-28,-28,56,56]);renderChecks++;
 }
 // Diagonal feet must stay inside one moving piece and never slide sideways at the hip.
 for(const direction of [1,3,5,7])for(let phase=0;phase<16;phase++){
  const calls:any[][]=[],c:any={save(){},restore(){},translate(){},scale(){},drawImage(...a:any[]){calls.push(a)}};
  const r:any=new RenderSystem(c,new InputState());r.stride=phase*Math.PI/8;r.drawUnicorn(0,0,Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4),false,1,true);
  const cell=direction<4?3:4,legs=calls.filter(a=>a[2]>0),foot=cell===3?[23,30]:[18,23];
  assert(legs.some(a=>a[1]<=cell*56+foot[0]!&&a[1]+a[3]>cell*56+foot[1]!), 'a diagonal foot must not be split between opposing phases');
  for(const a of legs){assert.equal(a[5],a[1]-cell*56-28,'no lateral gap at diagonal leg seam');assert(a[6]<=a[2]-28,'leg remains attached by overlapping the body')}
  assert.equal(calls.reduce((area,a)=>area+a[3]*a[4],0),56*56,'every source pixel drawn once');
 }
 // Side-view rear foot (source x9..22) must move as a whole, outside the fixed tail.
 for(const facing of [-1,1])for(let phase=0;phase<16;phase++){
  const calls:any[][]=[],c:any={save(){},restore(){},translate(){},scale(){},drawImage(...a:any[]){calls.push(a)}};
  const r:any=new RenderSystem(c,new InputState());r.stride=phase*Math.PI/8;r.drawUnicorn(0,0,facing,0,false,1,true);
  const lower=calls.filter(a=>a[2]>0),fixed=lower[0],moving=lower.slice(1);assert(fixed[1]+fixed[3]<=56+9,'fixed tail must not retain rear-leg outline');
  assert(moving.some(a=>a[1]<=56+9&&a[1]+a[3]>56+22),'rear foot must remain within one moving crop');
 }
 const auraContext:any={beginPath(){},arc(){},fill(){},stroke(){}};const auraRenderer:any=new RenderSystem(auraContext,new InputState());auraRenderer.drawAura(0,0,0);assert.equal(auraContext.strokeStyle,'#75fff022');assert.equal(auraContext.fillStyle,'#64ffe808');
 const sw=new World(),ss=createGameState(7);spawnPlayer(sw);ss.abilities=1<<8;spawnProjectile(sw,1700,1100,300,0,false);const se=[...sw.projectiles.keys()][0]!;new AISystem().update(sw,ss,0);assert.equal(sw.velocities.get(se)!.x,105);sw.positions.set(se,{x:2000,y:1100});new AISystem().update(sw,ss,0);assert.equal(sw.velocities.get(se)!.x,300);
 // The 200px aura boundary applies to enemies and hostile projectiles.
 for(const distance of [199,200,201]){const w=new World(),s=createGameState(7);spawnPlayer(w);s.abilities=1<<8;spawnEnemy(w,1600+distance,1100,0);spawnProjectile(w,1600+distance,1100,300,0,false);new AISystem().update(w,s,0);const e=[...w.enemies.keys()][0]!,v=w.velocities.get(e)!;assert(Math.abs(Math.hypot(v.x,v.y)-(distance<200?130:200))<.001);const shot=[...w.projectiles.keys()][0]!;assert.equal(w.velocities.get(shot)!.x,distance<200?105:300)}
 let shownRadius=0;auraContext.arc=(_x:number,_y:number,r:number)=>shownRadius=r;auraRenderer.drawAura(0,0,0);assert.equal(shownRadius,200);
 // All demons: native-size complete source coverage and two alternating planted legs.
 for(const type of [0,1,2])for(let frame=0;frame<16;frame++)for(const facing of [-1,1]){
  const calls:any[][]=[],shadows:any[][]=[],transforms:any[][]=[];const c:any={save(){},restore(){},translate(...v:number[]){transforms.push(v)},scale(x:number,y:number){assert.equal(Math.abs(x),1);assert.equal(y,1)},rotate(){throw new Error('Enemy sprites must remain pixel aligned')},fillRect(...v:number[]){shadows.push(v)},drawImage(...v:any[]){calls.push(v)}};
  const r:any=new RenderSystem(c,new InputState()),size=type===2?96:48,half=size/2,top=size*.75,lift=type===2?6:2;r.drawEnemy(0,0,type,0,false,facing,frame*Math.PI*140/8,false);
  assert.equal(calls.length,3);assert.equal(shadows[0][1],half-3);assert(transforms.flat().every(Number.isInteger));assert.deepEqual(calls.map(v=>[v[1],v[2],v[3],v[4]]),[[type*48,0,size,top],[type*48,top,half,size-top],[type*48+half,top,half,size-top]]);
  const legs=calls.slice(1);assert(legs.some(v=>v[6]===top-half));assert(legs.every(v=>v[6]>=top-half-lift&&v[6]<=top-half));if(frame===4||frame===12)assert(legs.some(v=>v[6]===top-half-lift));for(const v of calls){assert.equal(v[3],v[7]);assert.equal(v[4],v[8])}
 }
 const audio:any=new AudioSystem(),phases=[0,2,5,8],counts:number[]=[],intervals:number[]=[];
 for(const stage of phases){const notes:any[][]=[];audio.tone=(...n:any[])=>notes.push(n);for(let beat=0;beat<32;beat++)audio.music(stage,beat,beat*.2);assert(notes.every(n=>Number.isFinite(n[0])&&n[0]>0&&n[1]>.01&&n[2]>0&&n[2]<.1));assert(notes.some(n=>n[0]<200)&&notes.some(n=>n[0]>=400));counts.push(notes.length);audio.audio={state:'running',currentTime:0};audio.next=0;audio.step=0;const state=createGameState(7);state.stage=stage;audio.update(state);intervals.push(audio.next)}

 const ended:any[]=[],events:Record<string,Function>={};let contexts=0,disconnects=0;
 (globalThis as any).addEventListener=(name:string,fn:Function)=>{events[name]=fn};
 const param=()=>({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 (globalThis as any).AudioContext=class {state='suspended';currentTime=0;destination={};constructor(){contexts++}resume(){this.state='running'}createGain(){return {gain:param(),connect(t:any){return t},disconnect(){disconnects++}}}createOscillator(){const node:any={frequency:param(),connect(t:any){return t},start(){},stop(t:number){assert(Number.isFinite(t)&&t>0);ended.push(node)},disconnect(){disconnects++}};return node}};
 const lifecycle:any=new AudioSystem();assert.equal(contexts,0);events.pointerdown!();events.pointerdown!();assert.equal(contexts,1);lifecycle.update(createGameState(7));assert(ended.length>0);for(const node of ended)node.onended();assert.equal(disconnects,ended.length*2);events.keydown!({code:'KeyM',repeat:false});assert.equal(lifecycle.master.gain.value,0);events.keydown!({code:'KeyM',repeat:false});assert.equal(lifecycle.master.gain.value,1.12);
 (globalThis as any).addEventListener=()=>{};
 assert(counts[3]!>counts[0]!);assert(intervals.every((v,i)=>i===0||v<intervals[i-1]!));
 console.log(JSON.stringify({pass,spawnChecks,speedChecks,capAndRotationStages:10,fourDirectionFacingCases:3,gameLifecycleStages:10,meleeEnemyMotionCases:32,largeEnemyMotionCases:32,rangedEnemyMotionCases:32,renderChecks,projectileLife:'2 seconds',audioUnlockMuteAndCleanup:'pass',musicNotesPer32Steps:counts,musicStepSeconds:intervals,environment:'Node, Canvas/Audio API stubs; not browser or listening'}));
}
Math.random=oldRandom;
