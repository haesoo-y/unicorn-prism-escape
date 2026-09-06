const CONTROL_CODES = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export class InputState {
  readonly held = new Set<string>();
  readonly pressed = new Set<string>();
  pointerChoice = -1;
  pointerAttack = false;
  touchId = -1;
  moveX = 0;
  moveY = 0;
  stickX = 0;
  stickY = 0;

  attach(): void {
    addEventListener('keydown', this.keyDown);
    addEventListener('keyup', this.keyUp);
    addEventListener('blur', this.clear);
  }

  choose(index: number): void {
    this.pointerChoice = index;
  }

  attack(): void {this.pointerAttack = true}

  startMove(id: number, x: number, y: number): void {
    this.touchId = id;
    this.stickX = x;
    this.stickY = y;
  }

  move(id: number, x: number, y: number): void {
    if (id !== this.touchId) return;
    const dx = x - this.stickX;
    const dy = y - this.stickY;
    const length = Math.hypot(dx, dy);
    this.moveX = length > 12 ? dx / length : 0;
    this.moveY = length > 12 ? dy / length : 0;
  }

  stopMove(id: number): void {
    if (id !== this.touchId) return;
    this.touchId = -1;
    this.moveX = this.moveY = 0;
  }

  take(code: string): boolean {
    return this.pressed.delete(code);
  }

  endFrame(): void {
    this.pressed.clear();
    this.pointerChoice = -1;
    this.pointerAttack = false;
  }

  private readonly keyDown = (event: KeyboardEvent): void => {
    if (CONTROL_CODES.has(event.code)) event.preventDefault();
    this.held.add(event.code);
    if (!event.repeat) this.pressed.add(event.code);
  };

  private readonly keyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
  };

  private readonly clear = (): void => {
    this.held.clear();
    this.pressed.clear();
    this.touchId = -1;
    this.moveX = this.moveY = 0;
  };
}
