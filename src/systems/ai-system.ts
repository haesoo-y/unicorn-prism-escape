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
    if (state.attackRequested) {state.meleeFlash = .15; state.audioEvents |= 4}
    if (state.abilities & 1 << 4 && playerCooldown.value <= 0) {
      for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]] as const) spawnProjectile(world, playerPosition.x + x * 34, playerPosition.y + y * 34, x * 400, y * 400, true);
      state.audioEvents |= 8;
      playerCooldown.value = 2;
    }
    for (const [entity, enemy] of world.enemies) {
      const position = world.positions.get(entity), velocity = world.velocities.get(entity), cooldown = world.cooldowns.get(entity);
      if (!position || !velocity || !cooldown) continue;
      const dx = playerPosition.x - position.x, dy = playerPosition.y - position.y, distance = Math.hypot(dx, dy) || 1;
      let speed = ([210, 205, 200][enemy.type] ?? 205) + ([0,8,18,28,38,50,62,74,88,102][state.stage] ?? 0);
      if (state.abilities & 1 << 8 && distance < 200) speed -= 50;
      const rush = distance < 120 || enemy.type !== 1 && (state.elapsed + entity * (enemy.type === 0 ? .37 : .61)) % (enemy.type === 0 ? 2.6 : 4.2) < (enemy.type === 0 ? .85 : 1.4);
      const orbit=rush?0:enemy.type===0?18+entity%3*24:enemy.type===1?70+entity%3*18:24+entity%2*38,angle=entity*2.4+state.elapsed*(enemy.type===0 ? .8 : enemy.type===1 ? -.45 : .22),chaseX=playerPosition.x+Math.cos(angle)*orbit-position.x,chaseY=playerPosition.y+Math.sin(angle)*orbit-position.y,chaseDistance=Math.hypot(chaseX,chaseY)||1,nx=chaseX/chaseDistance,ny=chaseY/chaseDistance,curve=rush?0:enemy.type===0?Math.sin(state.elapsed*3+entity*1.7)*.2:enemy.type===1?(entity%2 ? .22 : -.22):Math.sin(state.elapsed*.9+entity*2)*.12;
      let steerX=nx-ny*curve,steerY=ny+nx*curve;const radius=world.radii.get(entity)?.value??10;
      for(const other of world.enemies.keys()){if(other===entity||world.consumed.has(other))continue;const op=world.positions.get(other),otherRadius=world.radii.get(other)?.value??10;if(!op)continue;const ox=position.x-op.x,oy=position.y-op.y,gap=radius+otherRadius+8,d=Math.hypot(ox,oy);if(d<gap){const angle=(entity-other)*2.4,force=(gap-d)/gap*(rush?.8:2.2);steerX+=(d?ox/d:Math.cos(angle))*force;steerY+=(d?oy/d:Math.sin(angle))*force}}
      const length=Math.max(1,Math.hypot(steerX,steerY)),vx=steerX/length*speed,vy=steerY/length*speed;
      if(enemy.type===2){const turn=Math.min(1,delta*(rush?5:2.5));velocity.x+=(vx-velocity.x)*turn;velocity.y+=(vy-velocity.y)*turn}else{velocity.x=vx;velocity.y=vy}
      cooldown.value -= delta;
      if (enemy.type === 1 && distance < 260 && cooldown.value <= 0) {
        spawnProjectile(world, position.x, position.y, dx / distance * 300, dy / distance * 300, false);
        state.audioEvents |= 1;
        cooldown.value = 2;
      }
    }
    for (const [entity, shot] of world.projectiles) {
      shot.life -= delta;
      if (shot.life <= 0) {world.consumed.add(entity); continue}
      if (!shot.friendly && state.abilities & 1 << 8) {
        const position = world.positions.get(entity), velocity = world.velocities.get(entity);
        if (position && velocity) {
          const distance = Math.hypot(position.x - playerPosition.x, position.y - playerPosition.y);
          const length = Math.hypot(velocity.x, velocity.y) || 1, speed = distance < 200 ? 250 : 300;
          velocity.x = velocity.x / length * speed; velocity.y = velocity.y / length * speed;
        }
      }
    }
  }
}
