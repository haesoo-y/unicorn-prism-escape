// Advisory bot run: normal input/physics/rules, stubbed presentation. Not a human playtest.
import assert from 'node:assert/strict';
(globalThis as any).Image=class {complete=true;src=''};
(globalThis as any).addEventListener=()=>{};
class Canvas {getContext(){return {imageSmoothingEnabled:false}}addEventListener(){}}
const canvas=new Canvas();Object.assign(globalThis,{HTMLCanvasElement:Canvas,document:{querySelector:()=>canvas},requestAnimationFrame:()=>{}});
const {Game}=await import('../src/game');
for(let pass=1;pass<=2;pass++)for(const seed of [13,42,97]){
 let random=seed;Math.random=()=>((random=Math.imul(random,1664525)+1013904223>>>0)/4294967296);
 const g:any=new Game();g.renderSystem.draw=()=>{};g.audioSystem.update=()=>{};
 g.input.pressed.add('Space');let failures=0,clock=1;const order=[6,7,8,3,4,5,0,1,2];
 for(let frame=0;frame<60*900&&failures<10&&g.gameState.phase!=='complete';frame++){
  const s=g.gameState,w=g.world,p=w.positions.get([...w.players][0]);
  if(s.phase==='failed'){failures++;g.input.pressed.add('KeyR')}
  if(s.phase==='upgrade'){g.input.choose(order[s.stage]);g.input.pressed.add('Space')}
  if(s.phase==='play'){
   const targets=[...(s.collected===7?w.gates:w.prisms)].map(e=>w.positions.get(e));targets.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const target=targets[0];
   if(target){const base=Math.atan2(target.y-p.y,target.x-p.x);let best=-Infinity,angle=base;
    for(let i=-8;i<=8;i++){const a=base+i*Math.PI/8,x=Math.cos(a),y=Math.sin(a),nx=p.x+x*90,ny=p.y+y*90;let score=Math.cos(a-base)*120;
     score-=Math.max(0,50-nx,50-ny,nx-3150,ny-2150)*10;
     for(const e of w.enemies.keys()){const q=w.positions.get(e),v=w.velocities.get(e);const d=Math.hypot(nx-q.x-(v?.x??0)*.25,ny-q.y-(v?.y??0)*.25);score-=Math.max(0,(w.enemies.get(e).type===2?115:80)-d)*4}
     for(const [e,shot]of w.projectiles)if(!shot.friendly){const q=w.positions.get(e),v=w.velocities.get(e),d=Math.hypot(nx-q.x-v.x*.25,ny-q.y-v.y*.25);score-=Math.max(0,55-d)*4}
     if(score>best){best=score;angle=a}
    }g.input.moveX=Math.cos(angle);g.input.moveY=Math.sin(angle);g.input.attack();
   }
  }
  g.frame(clock+=1000/60);
 }
 const s=g.gameState;assert(Number.isFinite(s.elapsed));assert(s.stageTimes.every((n:number)=>Number.isFinite(n)&&n>=0));console.log(JSON.stringify({pass,seed,phase:s.phase,stage:s.stage+1,failures,seconds:Math.round(s.elapsed),stageSeconds:s.stageTimes.map((n:number)=>Math.round(n)),environment:'Node bot, normal physics and upgrades, no teleport/invulnerability; not browser or human timing'}));
}
