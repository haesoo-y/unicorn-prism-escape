import type {CollisionResult} from './collision-system';
import type {World} from '../ecs/world';
import {spawnEnemy} from '../prefabs';
import {ABILITIES, STAGE_COUNT, WORLD_HEIGHT, WORLD_WIDTH, type GameState} from '../state';

export class RulesSystem {
  update(world:World,state: GameState, collision: CollisionResult): void {
    state.rainbowMask |= collision.colors;
    for (let colors = collision.colors; colors; colors &= colors - 1) state.collected++;
    if (collision.gateEntered && state.collected >= state.total && state.phase === 'play') {
      state.stageTimes[state.stage] = state.elapsed - state.stageTimes.reduce((sum,seconds)=>sum+seconds,0);
      state.phase = state.stage === STAGE_COUNT - 1 ? 'complete' : 'upgrade';
      state.pointerArmed = -1;
      for (let index = 0; index < ABILITIES.length; index++) if (!(state.abilities&1<<index)&&(index%3===0||state.abilities&1<<index-1)) {state.selectedAbility=index;break}
    } else if (collision.playerHit && state.phase === 'play') state.phase = 'failed';
    const interval=state.stage<2?10:state.stage<5?5:state.stage<8?4:3;
    if(state.phase==='play'&&Math.floor(state.stageElapsed/interval)>state.reinforcementWave){
      state.reinforcementWave=Math.floor(state.stageElapsed/interval);
      const player=world.players.values().next().value,p=player===undefined?undefined:world.positions.get(player);
      const kinds=Math.min(3,1+Math.floor(state.stage/3)),limit=[4,7,9,15,17,19,24,27,30,35][state.stage]??4;
      let living=0;for(const enemy of world.enemies.keys())if(!world.consumed.has(enemy))living++;
      if(living<limit){
        const type=Math.floor(Math.random()*kinds);
        const edge=Math.floor(Math.random()*4),horizontal=edge%2===0,length=horizontal?WORLD_WIDTH:WORLD_HEIGHT;
        let along=160+Math.random()*(length-320),x=horizontal?along:edge===1?WORLD_WIDTH-48:48,y=horizontal?(edge===0?48:WORLD_HEIGHT-48):along;
        if(p&&Math.hypot(x-p.x,y-p.y)<160){along=along<length/2?length-160:160;if(horizontal)x=along;else y=along}
        spawnEnemy(world,x,y,type);
      }
    }
  }
}
