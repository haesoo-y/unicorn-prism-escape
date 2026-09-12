import type {World} from '../ecs/world';
import type {InputState} from '../input';
import {ABILITIES, type GameState} from '../state';

export class InputSystem {
  constructor(private readonly input: InputState) {}

  update(world: World, state: GameState): void {
    state.attackRequested = false;
    if (state.phase === 'title') {if (this.input.take('Space') || this.input.take('Enter')) state.phase = 'start'; return}
    if (this.input.take('KeyR')) state.restartRequested = true;
    for (const player of world.players) {
      const velocity = world.velocities.get(player), facing = world.facings.get(player);
      if (!velocity || !facing) continue;
      velocity.x = velocity.y = 0;
      if (state.phase === 'play') {
        let x = Number(this.down('ArrowRight', 'KeyD')) - Number(this.down('ArrowLeft', 'KeyA'));
        let y = Number(this.down('ArrowDown', 'KeyS')) - Number(this.down('ArrowUp', 'KeyW'));
        if (x === 0 && y === 0) {x = this.input.moveX; y = this.input.moveY}
        const length = Math.hypot(x, y) || 1, speed = state.abilities & 1 << 6 ? 288 : 240;
        velocity.x = x / length * speed; velocity.y = y / length * speed;
        if (x || y) {facing.x = x / length; facing.y = y / length}
        if ((this.input.take('Space') || this.input.pointerAttack) && state.abilities & 1 << 3) state.attackRequested = true;
      }
    }
    if (state.phase !== 'upgrade') return;
    if (this.input.pointerChoice >= 0 && this.available(state,this.input.pointerChoice)) {
      const choice = this.input.pointerChoice;
      if (state.pointerArmed === choice && state.selectedAbility === choice) this.activate(state);
      else {state.selectedAbility = choice; state.pointerArmed = choice; state.audioEvents |= 64}
    }
    const direction = (this.input.take('ArrowLeft') || this.input.take('KeyA')) ? -1 : (this.input.take('ArrowRight') || this.input.take('KeyD')) ? 1 : (this.input.take('ArrowUp') || this.input.take('KeyW')) ? -3 : (this.input.take('ArrowDown') || this.input.take('KeyS')) ? 3 : 0;
    if (direction) {
      state.pointerArmed = -1;
      const before=state.selectedAbility;
      for(let tries=1;tries<=9;tries++){
        const choice=Math.abs(direction)===3?((Math.floor(before/3)+Math.sign(direction)*Math.ceil(tries/3)+9)%3)*3+(before%3+(tries-1)%3)%3:(before+direction*tries+9)%9;
        if(this.available(state,choice)){state.selectedAbility=choice;break}
      }
      if(state.selectedAbility!==before)state.audioEvents |= 64;
    }
    if (this.input.take('Space')) this.activate(state);
  }

  private activate(state: GameState): void {
    const bit = 1 << state.selectedAbility;
    if (!this.available(state,state.selectedAbility)) return;
    state.abilities |= bit;
    state.pointerArmed = -1;
    state.audioEvents |= 16;
    state.phase = 'advance';
  }
  private available(state:GameState,index:number):boolean{return !(state.abilities&1<<index)&&(index%3===0||!!(state.abilities&1<<index-1))}
  private down(first: string, second: string): boolean {return this.input.held.has(first) || this.input.held.has(second) || this.input.pressed.has(first) || this.input.pressed.has(second)}
}
