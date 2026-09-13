import assert from 'node:assert/strict';
import {World} from '../src/ecs/world';
import {createGameState} from '../src/state';
import {spawnPlayer,spawnEnemy} from '../src/prefabs';
import {AISystem} from '../src/systems/ai-system';
import {MovementSystem} from '../src/systems/movement-system';
for(let pass=1;pass<=2;pass++){
 let cases=0,stalled=0,reversals=0;
 for(const fps of [30,60,120])for(const stage of [0,9])for(const aura of [0,1<<8])for(const type of [0,1,2])for(const elapsed of [0,1,2,3])for(let direction=0;direction<8;direction++){
  const w=new World(),s=createGameState(7),ai=new AISystem(),move=new MovementSystem();s.phase='play';s.stage=stage;s.abilities=aura;s.elapsed=elapsed;
  spawnPlayer(w);const angle=direction*Math.PI/4;spawnEnemy(w,1600+Math.cos(angle)*110,1100+Math.sin(angle)*110,type);
  const e=[...w.enemies.keys()][0]!,p=w.positions.get(e)!;let contacted=false,lastX=0,lastY=0;
  for(let frame=0;frame<fps*2;frame++){
   ai.update(w,s,1/fps);const v=w.velocities.get(e)!;
   assert(Number.isFinite(v.x)&&Number.isFinite(v.y));
   if(v.x*lastX+v.y*lastY<0)reversals++;
   lastX=v.x;lastY=v.y;move.update(w,1/fps);s.elapsed+=1/fps;
   if(Math.hypot(p.x-1600,p.y-1100)<=11+w.radii.get(e)!.value){contacted=true;break}
  }
  cases++;if(!contacted)stalled++;
 }
 // Nearly opposing pursuit/separation forces must not amplify tiny offsets to full speed.
 for(const offset of [-.01,0,.01]){
  const w=new World(),s=createGameState(7);s.phase='play';spawnPlayer(w);spawnEnemy(w,1490,1100,0);
  const e=[...w.enemies.keys()][0]!;
  for(let i=0;i<2;i++)spawnEnemy(w,1500.5+offset,1100,0);
  new AISystem().update(w,s,1/60);const v=w.velocities.get(e)!;
  assert(Math.hypot(v.x,v.y)<1);
 }
 console.log({pass,cases,stalled,reversals,environment:'Actual AI and movement in Node; stationary player, no browser rendering'});
 if(!process.env.BASELINE){assert.equal(stalled,0);assert.equal(reversals,0)}
}
