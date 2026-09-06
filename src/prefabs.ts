import type {World} from './ecs/world';
import {WORLD_HEIGHT, WORLD_WIDTH} from './state';

export function spawnPlayer(world: World): void {
  const entity = world.createEntity();
  world.positions.set(entity, {x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2});
  world.velocities.set(entity, {x: 0, y: 0});
  world.facings.set(entity, {x: 1, y: 0});
  world.cooldowns.set(entity, {value: 0});
  world.radii.set(entity, {value: 22});
  world.players.add(entity);
}

export function spawnPrism(world: World, x: number, y: number, color: number): void {
  const entity = world.createEntity();
  world.positions.set(entity, {x, y});
  world.radii.set(entity, {value: 18});
  world.prismColors.set(entity, {index: color});
  world.prisms.add(entity);
}

export function spawnEnemy(world: World, x: number, y: number, type: number): void {
  const entity = world.createEntity();
  world.positions.set(entity, {x, y});
  world.velocities.set(entity, {x: 0, y: 0});
  world.radii.set(entity, {value: type === 2 ? 34 : 19});
  world.enemies.set(entity, {type, health: type === 2 ? 6 : 1});
  world.cooldowns.set(entity, {value: 1});
}

export function spawnProjectile(world: World, x: number, y: number, vx: number, vy: number, friendly: boolean): void {
  const entity = world.createEntity();
  world.positions.set(entity, {x, y});
  world.velocities.set(entity, {x: vx, y: vy});
  world.radii.set(entity, {value: friendly ? 13 : 10});
  world.projectiles.set(entity, {friendly, life: friendly ? 1 : 1.6});
}
