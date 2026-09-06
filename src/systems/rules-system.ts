import type {CollisionResult} from './collision-system';
import {ABILITIES, STAGE_COUNT, type GameState} from '../state';

export class RulesSystem {
  update(state: GameState, collision: CollisionResult): void {
    state.rainbowMask |= collision.colors;
    for (let colors = collision.colors; colors; colors &= colors - 1) state.collected++;
    if (collision.playerHit && state.phase === 'play') {
      if (state.shieldAvailable) {state.shieldAvailable = false; state.invulnerable = 1}
      else state.phase = 'failed';
    }
    if (state.phase === 'play' && state.collected >= state.total) {
      state.phase = state.stage === STAGE_COUNT - 1 ? 'complete' : 'upgrade';
      state.pointerArmed = -1;
      for (let index = 0; index < ABILITIES.length; index++) if (!(state.abilities & 1 << index)) {state.selectedAbility = index; break}
    }
  }
}
