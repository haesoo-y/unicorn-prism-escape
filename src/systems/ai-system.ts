import type {World} from '../ecs/world';
import {spawnProjectile} from '../prefabs';
import type {GameState} from '../state';

export class AISystem {
  update(world: World, state: GameState, delta: number): void {
    state.meleeFlash = Math.max(0, state.meleeFlash - delta);
    state.invulnerable = Math.max(0, state.invulnerable - delta);
    if (state.phase !== 'play') return;
    const player = world.players.values().next().value;
    if (player === undefined) return;
    const playerPosition = world.positions.get(player), facing = world.facings.get(player), playerCooldown = world.cooldowns.get(player);
    if (!playerPosition || !facing || !playerCooldown) return;
    playerCooldown.value -= delta;
    if (state.attackRequested) state.meleeFlash = .15;
    if (state.abilities & 1 << 3 && playerCooldown.value <= 0) {
      spawnProjectile(world, playerPosition.x + facing.x * 34, playerPosition.y + facing.y * 34, facing.x * 420, facing.y * 420, true);
      playerCooldown.value = 1;
    }
    for (const [entity, enemy] of world.enemies) {
      const position = world.positions.get(entity), velocity = world.velocities.get(entity), cooldown = world.cooldowns.get(entity);
      if (!position || !velocity || !cooldown) continue;
      const dx = playerPosition.x - position.x, dy = playerPosition.y - position.y, distance = Math.hypot(dx, dy) || 1;
      let speed = [135, 108, 78][enemy.type] ?? 108;
      if (state.abilities & 1 << 7 && distance < 220) speed *= .35;
      velocity.x = dx / distance * speed; velocity.y = dy / distance * speed;
      cooldown.value -= delta;
      if (enemy.type === 1 && distance < 260 && cooldown.value <= 0) {
        spawnProjectile(world, position.x, position.y, dx / distance * 150, dy / distance * 150, false);
        cooldown.value = 1.8;
      }
    }
    for (const [entity, shot] of world.projectiles) {
      shot.life -= delta;
      if (shot.life <= 0) {world.consumed.add(entity); continue}
      if (!shot.friendly && state.abilities & 1 << 7) {
        const position = world.positions.get(entity), velocity = world.velocities.get(entity);
        if (position && velocity) {
          const distance = Math.hypot(position.x - playerPosition.x, position.y - playerPosition.y);
          const length = Math.hypot(velocity.x, velocity.y) || 1, speed = distance < 220 ? 52 : 150;
          velocity.x = velocity.x / length * speed; velocity.y = velocity.y / length * speed;
        }
      }
    }
  }
}
