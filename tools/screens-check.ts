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
const pointerEvents:Record<string,(event:any)=>void>={};
class Canvas{width=960;height=720;clientWidth=960;clientHeight=720;getContext(){return context}addEventListener(name:string,fn:(event:any)=>void){pointerEvents[name]=fn}setPointerCapture(){}}
const canvas=new Canvas();context.canvas=canvas;
Object.assign(globalThis,{HTMLCanvasElement:Canvas,document:{querySelector:()=>canvas},innerWidth:960,innerHeight:720,devicePixelRatio:1,requestAnimationFrame:()=>{}});
const {Game}=await import('../src/game');

for(let pass=1;pass<=2;pass++){
 const g:any=new Game(),rules=new RulesSystem();g.startStage();let total=0;
 for(let stage=0;stage<10;stage++){
  assert.equal(g.gameState.stage,stage);const duration=16.4+stage*.317;
  // A failed attempt contributes to the existing cumulative timer.
  g.gameState.elapsed=total+3;g.gameState.stageElapsed=3;g.gameState.phase='failed';g.startStage();assert.equal(g.gameState.elapsed,total+3);assert.equal(g.gameState.stageElapsed,0);
  total+=duration;g.gameState.elapsed=total;rules.update(g.world,g.gameState,{...none,gateEntered:true});
  assert(Math.abs(g.gameState.stageTimes[stage]-duration)<1e-8);assert.equal(g.gameState.phase,stage===9?'complete':'upgrade');
  const times=[...g.gameState.stageTimes];rules.update(g.world,g.gameState,{...none,gateEntered:true});assert.deepEqual(g.gameState.stageTimes,times);
  g.lastTime=1000;g.frame(1020);g.frame(2020);assert.equal(g.gameState.elapsed,total);
  if(stage<9)g.nextStage();
 }
 assert(Math.abs(g.gameState.stageTimes.reduce((a:number,b:number)=>a+b,0)-g.gameState.elapsed)<1e-8);
 g.reset();assert.equal(g.gameState.elapsed,0);assert.deepEqual(g.gameState.stageTimes,[]);
 for(const pointerType of ['touch','mouse']){
  const retry:any=new Game();retry.startStage();retry.gameState.stage=3;retry.gameState.elapsed=42;retry.gameState.stageTimes=[10,12,15];retry.gameState.abilities=1<<6;retry.gameState.phase='failed';
  pointerEvents.pointerdown!({pointerType,pointerId:1,clientX:100,clientY:100});assert.equal(retry.gameState.restartRequested,true);retry.frame(16);assert.equal(retry.gameState.phase,'play');assert.equal(retry.gameState.stage,3);assert.equal(retry.gameState.elapsed,42);assert.deepEqual(retry.gameState.stageTimes,[10,12,15]);assert.equal(retry.gameState.abilities,1<<6);assert.equal(retry.gameState.restartRequested,false);
  retry.gameState.phase='complete';pointerEvents.pointerdown!({pointerType,pointerId:2,clientX:100,clientY:100});retry.frame(32);assert.equal(retry.gameState.phase,'title');assert.equal(retry.gameState.stage,0);assert.equal(retry.gameState.elapsed,0);assert.deepEqual(retry.gameState.stageTimes,[]);assert.equal(retry.gameState.abilities,0);
 }
 for(const pointerType of ['touch','mouse','pen']){
  const stick:any=new Game();stick.startStage();const point=(id:number,x:number,y:number)=>({pointerType,pointerId:id,clientX:x,clientY:y});
  pointerEvents.pointerdown!(point(1,300,300));assert.equal(stick.input.touchId,-1);
  pointerEvents.pointerdown!(point(1,66,canvas.clientHeight-66));assert.equal(stick.input.touchId,1);assert.equal(stick.input.moveX,0);
  pointerEvents.pointermove!(point(1,110,canvas.clientHeight-66));assert.equal(stick.input.moveX,1);assert.equal(stick.input.moveY,0);
  pointerEvents.pointerdown!(point(2,66,canvas.clientHeight-66));assert.equal(stick.input.touchId,1);
  pointerEvents.pointerup!(point(2,66,canvas.clientHeight-66));assert.equal(stick.input.moveX,1);
  pointerEvents.lostpointercapture!(point(1,110,canvas.clientHeight-66));assert.equal(stick.input.touchId,-1);assert.equal(stick.input.moveX,0);
  pointerEvents.pointerdown!(point(3,66,canvas.clientHeight-110));assert.equal(stick.input.moveY,-1);pointerEvents.pointercancel!(point(3,66,canvas.clientHeight-110));assert.equal(stick.input.moveY,0);
  pointerEvents.pointerdown!(point(4,110,canvas.clientHeight-66));pointerEvents.pointerup!(point(4,110,canvas.clientHeight-66));assert.equal(stick.input.moveX,0);
 }
 const stickArcs:number[][]=[];const stickContext:any={canvas,beginPath(){},fill(){},arc(...v:number[]){stickArcs.push(v)}};const stickRenderer:any=new RenderSystem(stickContext,new InputState());for(const [width,height]of [[320,480],[360,640],[844,390],[1920,1080]]){stickRenderer.screenWidth=width;stickRenderer.screenHeight=height;stickArcs.length=0;stickRenderer.drawStick();assert.deepEqual(stickArcs.map(v=>v.slice(0,3)),[[66,height-66,44],[66,height-66,18]]);assert(stickArcs.every(v=>v[0]! - v[2]! >=0&&v[1]!+v[2]!<=height));}
 const renderer:any=new RenderSystem(context,new InputState());assert.equal(renderer.formatTime(178.43),'2:58.430');assert.equal(renderer.formatTime(59.9996),'1:00.000');assert.equal(renderer.formatTime(3600),'60:00.000');
 let screens=0;
 for(const [w,h]of [[320,480],[360,640],[720,540],[568,320],[1280,720],[1920,1080],[844,390],[960,320],[960,440],[960,460]]){
  renderer.screenWidth=w;renderer.screenHeight=h;const calls:any[]=[];renderer.pixelText=(t:string,x:number,y:number,size:number)=>{calls.push({t,x,y,size});assert(x-(t.length*6-1)*size/2>=0,'left '+t);assert(x+(t.length*6-1)*size/2<=w,'right '+t);assert(y>=0&&y+7*size<=h,'vertical '+t)};
  renderer.drawTitle(0);assert(calls.some(c=>c.t==='PRESS SPACE OR TAP'));calls.length=0;
  const state=createGameState(7);state.stageTimes=Array(10).fill(17.843);state.elapsed=178.43;renderer.drawEnding(state);
  const rows=calls.filter(c=>c.t.startsWith('STAGE ')),times=calls.filter(c=>c.t==='0:17.843');
  assert.equal(rows.length,10);for(let i=0;i<10;i++){assert.equal(rows[i].t,'STAGE '+(i+1));assert.equal(rows[i].x,rows[0].x);assert.equal(times[i].x,times[0].x);assert.equal(rows[i].y,times[i].y);if(i)assert(rows[i].y>=rows[i-1].y+rows[i-1].size*7+1);assert(rows[i].y+rows[i].size*7<h-71)}
  assert.equal(calls.filter(c=>c.t.startsWith('STAGE ')).length,10);assert.equal(calls.filter(c=>c.t==='0:17.843').length,10);assert(calls.some(c=>c.t==='2:58.430'));screens+=2;
 }
 console.log({pass,stageRecords:10,retryIncluded:true,pauseAndReset:'passed',timeFormatting:'passed',screenLayouts:screens,environment:'Node with Canvas/Audio stubs; not actual complete playthrough'});
}
