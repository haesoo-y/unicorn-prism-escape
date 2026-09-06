import type {World, Enemy} from '../ecs/world';
import type {Entity} from '../ecs/entity';
import type {GameState} from '../state';

export interface CollisionResult {colors: number; playerHit: boolean}

export class CollisionSystem {
  update(world: World, state: GameState, delta: number): CollisionResult {
    const result = {colors: 0, playerHit: false};
    if (state.phase !== 'play') return result;
    const player = world.players.values().next().value;
    if (player === undefined) return result;
    const pp = world.positions.get(player), pr = world.radii.get(player)?.value ?? 0, facing = world.facings.get(player);
    if (!pp || !facing) return result;
    for (const prism of world.prisms) {
      const p = world.positions.get(prism), r = world.radii.get(prism)?.value ?? 0;
      if (!p) continue;
      let dx = pp.x - p.x, dy = pp.y - p.y, distance = Math.hypot(dx, dy);
      if (state.abilities & 1 << 6 && distance < 160 && distance > 0) {p.x += dx / distance * 180 * delta; p.y += dy / distance * 180 * delta; distance = Math.hypot(pp.x - p.x, pp.y - p.y)}
      if (distance <= pr + r) {
        world.consumed.add(prism);
        const color = world.prismColors.get(prism); if (color) result.colors |= 1 << color.index;
        if (state.abilities & 1 << 8) this.wave(world, pp.x, pp.y);
      }
    }
    if (state.attackRequested && state.abilities & 1 << 2) for (const [entity, enemy] of world.enemies) {
      const p = world.positions.get(entity); if (!p) continue;
      const dx = p.x - pp.x, dy = p.y - pp.y, forward = dx * facing.x + dy * facing.y, side = Math.abs(dx * facing.y - dy * facing.x);
      if (forward > 0 && forward < 115 && side < 56) this.damage(world, entity, enemy, 2);
    }
    for (const [shotEntity, shot] of world.projectiles) {
      if (world.consumed.has(shotEntity)) continue;
      const sp = world.positions.get(shotEntity), sr = world.radii.get(shotEntity)?.value ?? 0; if (!sp) continue;
      if (shot.friendly) {
        for (const [enemyEntity, enemy] of world.enemies) {
          if (world.consumed.has(enemyEntity)) continue;
          const ep = world.positions.get(enemyEntity), er = world.radii.get(enemyEntity)?.value ?? 0;
          if (ep && Math.hypot(ep.x - sp.x, ep.y - sp.y) <= er + sr) {world.consumed.add(shotEntity); this.damage(world, enemyEntity, enemy, 1.5); break}
        }
      } else if (state.invulnerable <= 0 && Math.hypot(pp.x - sp.x, pp.y - sp.y) <= pr + sr) {world.consumed.add(shotEntity); result.playerHit = true}
    }
    if (state.invulnerable <= 0) for (const entity of world.enemies.keys()) {
      if (world.consumed.has(entity)) continue;
      const p = world.positions.get(entity), r = world.radii.get(entity)?.value ?? 0;
      if (p && Math.hypot(pp.x - p.x, pp.y - p.y) <= pr + r) {result.playerHit = true; break}
    }
    return result;
  }
  private damage(world: World, entity: Entity, enemy: Enemy, damage: number): void {enemy.health -= damage; if (enemy.health <= 0) world.consumed.add(entity)}
  private wave(world: World, x: number, y: number): void {
    for (const [entity, shot] of world.projectiles) {const p = world.positions.get(entity); if (!shot.friendly && p && Math.hypot(p.x - x, p.y - y) < 190) world.consumed.add(entity)}
    for (const entity of world.enemies.keys()) {const p = world.positions.get(entity); if (!p) continue; const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy); if (d < 190 && d > 0) {p.x += dx / d * 120; p.y += dy / d * 120}}
  }
}
