import type {CollisionResult} from './collision-system';
import type {World} from '../ecs/world';
import {spawnEnemy, spawnGate} from '../prefabs';
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
      if(state.stage&&p){x=p.x<WORLD_WIDTH/2?WORLD_WIDTH-90:90;y=p.y<WORLD_HEIGHT/2?WORLD_HEIGHT-90:90;for(let tries=0;tries<20;tries++){const gx=90+Math.random()*(WORLD_WIDTH-180),gy=90+Math.random()*(WORLD_HEIGHT-180);if(Math.hypot(gx-p.x,gy-p.y)>600&&[...world.enemies.keys()].every(e=>{const q=world.positions.get(e);return !q||Math.hypot(q.x-gx,q.y-gy)>140})){x=gx;y=gy;break}}}
      spawnGate(world,x,y);
    }
    if(state.phase==='play'&&Math.floor(state.stageElapsed/5)>state.reinforcementWave){
      state.reinforcementWave=Math.floor(state.stageElapsed/5);
      const edges=[0,1,2,3],player=world.players.values().next().value,p=player===undefined?undefined:world.positions.get(player);
      for(let type=0;type<=Math.floor(state.stage/3)&&type<3;type++){
        const edge=edges.splice(Math.floor(Math.random()*edges.length),1)[0]??0,horizontal=edge%2===0,length=horizontal?WORLD_WIDTH:WORLD_HEIGHT;
        let along=160+Math.random()*(length-320),x=horizontal?along:edge===1?WORLD_WIDTH-48:48,y=horizontal?(edge===0?48:WORLD_HEIGHT-48):along;
        if(p&&Math.hypot(x-p.x,y-p.y)<160){along=along<length/2?length-160:160;if(horizontal)x=along;else y=along}
        spawnEnemy(world,x,y,type);
      }
    }
  }
}
