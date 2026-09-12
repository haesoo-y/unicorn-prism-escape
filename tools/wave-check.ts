import assert from 'node:assert/strict';
import {World} from '../src/ecs/world';
import {spawnPlayer,spawnPrism,spawnEnemy,spawnProjectile} from '../src/prefabs';
import {createGameState} from '../src/state';
import {CollisionSystem} from '../src/systems/collision-system';
import {CleanupSystem} from '../src/systems/cleanup-system';
for(let pass=1;pass<=2;pass++) {
 for(let color=0;color<7;color++) {
  const w=new World(),s=createGameState(7),collision=new CollisionSystem(),cleanup=new CleanupSystem();s.phase='play';s.abilities=1<<5;s.invulnerable=1;spawnPlayer(w);spawnPrism(w,1600,1100,color);
  for(const d of [189,250,299,300,301]){spawnEnemy(w,1600+d,1100,0);spawnProjectile(w,1600,1100+d,0,0,false)}
  spawnProjectile(w,1700,1100,0,0,true);
  const result=collision.update(w,s,0);assert.equal(result.colors,1<<color);assert.equal(w.prisms.size,0);assert.equal(w.waves.size,1);
  const e=[...w.waves.keys()][0]!;assert.equal(w.prismColors.get(e)!.index,color);assert.deepEqual(w.positions.get(e),{x:1600,y:1100});
  assert.deepEqual([...w.enemies.keys()].map(e=>w.positions.get(e)!.x-1600),[309,370,419,300,301]);cleanup.update(w);assert.equal(w.projectiles.size,3);
  w.positions.get([...w.players][0]!)!.x+=100;assert.equal(w.positions.get(e)!.x,1600);
  assert.equal(collision.update(w,s,.3).colors,0);assert.equal(w.waves.get(e)!.value,.3);
  s.phase='upgrade';collision.update(w,s,10);assert.equal(w.waves.get(e)!.value,.3);s.phase='play';collision.update(w,s,.31);cleanup.update(w);assert.equal(w.waves.size,0);assert(!w.positions.has(e));assert(!w.prismColors.has(e));
 }
 const w=new World(),s=createGameState(7),c=new CollisionSystem();s.phase='play';spawnPlayer(w);spawnPrism(w,1600,1100,0);c.update(w,s,0);assert.equal(w.waves.size,0);new CleanupSystem().update(w);
 s.abilities=1<<5;for(let i=0;i<7;i++)spawnPrism(w,1600,1100,i);c.update(w,s,0);assert.equal(w.waves.size,7);assert.equal(c.update(w,s,0).colors,0);w.clear();assert.equal(w.waves.size,0);assert.equal(w.entities.size,0);
 console.log('Wave pass '+pass+': 7 colors, 190–300px boundary, friendly shots preserved, one-shot collection, anchored effect, expiry, pause and clear passed');
}
