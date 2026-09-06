import type {World} from '../ecs/world';

export class CleanupSystem {
  update(world: World): void {
    for (const entity of world.consumed) world.destroyEntity(entity);
  }
}
