import type {World} from '../ecs/world';
import {WORLD_HEIGHT, WORLD_WIDTH} from '../state';

export class MovementSystem {
  update(world: World, delta: number): void {
    for (const [entity, velocity] of world.velocities) {
      const position = world.positions.get(entity);
      const radius = world.radii.get(entity)?.value ?? 0;
      if (!position) continue;
      position.x = Math.max(radius, Math.min(WORLD_WIDTH - radius, position.x + velocity.x * delta));
      position.y = Math.max(radius, Math.min(WORLD_HEIGHT - radius, position.y + velocity.y * delta));
      if (world.projectiles.has(entity) && (position.x <= radius || position.x >= WORLD_WIDTH - radius || position.y <= radius || position.y >= WORLD_HEIGHT - radius)) world.consumed.add(entity);
    }
  }
}
