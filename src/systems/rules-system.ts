import type {CollisionResult} from './collision-system';
import type {World} from '../ecs/world';
import {spawnGate} from '../prefabs';
import {ABILITIES, STAGE_COUNT, WORLD_HEIGHT, WORLD_WIDTH, type GameState} from '../state';

export class RulesSystem {
  update(world:World,state: GameState, collision: CollisionResult): void {
    state.rainbowMask |= collision.colors;
    for (let colors = collision.colors; colors; colors &= colors - 1) state.collected++;
    if (collision.gateEntered && state.phase === 'play') {
      state.phase = state.stage === STAGE_COUNT - 1 ? 'complete' : 'upgrade';
      state.pointerArmed = -1;
      for (let index = 0; index < ABILITIES.length; index++) if (!(state.abilities&1<<index)&&(index%3===0||state.abilities&1<<index-1)) {state.selectedAbility=index;break}
    } else if (collision.playerHit && state.phase === 'play') state.phase = 'failed';
    if (state.phase === 'play' && state.collected >= state.total && !world.gates.size) {
      const player=world.players.values().next().value,p=player===undefined?undefined:world.positions.get(player);let x=WORLD_WIDTH/2,y=WORLD_HEIGHT/2;
      if(state.stage&&p){const seed=Math.random()*7;for(let tries=0;tries<6;tries++){const a=seed+tries*1.3;x=Math.max(80,Math.min(WORLD_WIDTH-80,p.x+Math.cos(a)*500));y=Math.max(80,Math.min(WORLD_HEIGHT-80,p.y+Math.sin(a)*500));if([...world.enemies.keys()].every(e=>{const q=world.positions.get(e);return !q||Math.hypot(q.x-x,q.y-y)>120}))break}}
      spawnGate(world,x,y);
    }
  }
}
