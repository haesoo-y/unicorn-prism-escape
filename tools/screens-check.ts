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
const context:any=new Proxy({canvas:null as any},{get(t,k){if(k in t)return t[k as keyof typeof t];return ()=>{}},set(t,k,v){(t as any)[k]=v;return true}});
class Canvas{width=960;height=720;clientWidth=960;clientHeight=720;getContext(){return context}addEventListener(){}setPointerCapture(){}}
const canvas=new Canvas();context.canvas=canvas;
Object.assign(globalThis,{HTMLCanvasElement:Canvas,document:{querySelector:()=>canvas},innerWidth:960,innerHeight:720,devicePixelRatio:1,requestAnimationFrame:()=>{}});
const {Game}=await import('../src/game');

for(let pass=1;pass<=2;pass++){
 const g:any=new Game(),rules=new RulesSystem();g.startStage();let total=0;
 for(let stage=0;stage<10;stage++){
  assert.equal(g.state.stage,stage);const duration=16.4+stage*.317;
  // A failed attempt contributes to the existing cumulative timer.
  g.state.elapsed=total+3;g.state.stageElapsed=3;g.state.phase='failed';g.startStage();assert.equal(g.state.elapsed,total+3);assert.equal(g.state.stageElapsed,0);
  total+=duration;g.state.elapsed=total;rules.update(g.world,g.state,{...none,gateEntered:true});
  assert(Math.abs(g.state.stageTimes[stage]-duration)<1e-8);assert.equal(g.state.phase,stage===9?'complete':'upgrade');
  const times=[...g.state.stageTimes];rules.update(g.world,g.state,{...none,gateEntered:true});assert.deepEqual(g.state.stageTimes,times);
  g.lastTime=1000;g.frame(1020);g.frame(2020);assert.equal(g.state.elapsed,total);
  if(stage<9)g.nextStage();
 }
 assert(Math.abs(g.state.stageTimes.reduce((a:number,b:number)=>a+b,0)-g.state.elapsed)<1e-8);
 g.reset();assert.equal(g.state.elapsed,0);assert.deepEqual(g.state.stageTimes,[]);
 const renderer:any=new RenderSystem(context,new InputState());assert.equal(renderer.formatTime(178.43),'2:58.430');assert.equal(renderer.formatTime(59.9996),'1:00.000');assert.equal(renderer.formatTime(3600),'60:00.000');
 let screens=0;
 for(const [w,h]of [[320,480],[360,640],[720,540],[568,320]]){
  renderer.width=w;renderer.height=h;const calls:any[]=[];renderer.pixelText=(t:string,x:number,y:number,size:number)=>{calls.push({t,x,y,size});assert(x-(t.length*6-1)*size/2>=0,'left '+t);assert(x+(t.length*6-1)*size/2<=w,'right '+t);assert(y>=0&&y+7*size<=h,'vertical '+t)};
  renderer.drawTitle(0);assert(calls.some(c=>c.t==='PRESS SPACE OR TAP'));calls.length=0;
  const state=createGameState(7);state.stageTimes=Array(10).fill(17.843);state.elapsed=178.43;renderer.drawEnding(state);
  assert.equal(calls.filter(c=>c.t.startsWith('STAGE ')).length,10);assert.equal(calls.filter(c=>c.t==='0:17.843').length,10);assert(calls.some(c=>c.t==='2:58.430'));screens+=2;
 }
 console.log({pass,stageRecords:10,retryIncluded:true,pauseAndReset:'passed',timeFormatting:'passed',screenLayouts:screens,environment:'Node with Canvas/Audio stubs; not actual complete playthrough'});
}
