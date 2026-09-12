import {World} from './ecs/world';
import {canvas, context} from './globals';
import {InputState} from './input';
import {spawnEnemy, spawnPlayer, spawnPrism} from './prefabs';
import {createGameState, WORLD_HEIGHT, WORLD_WIDTH, type GameState} from './state';
import {AISystem} from './systems/ai-system';
import {AudioSystem} from './systems/audio-system';
import {CleanupSystem} from './systems/cleanup-system';
import {CollisionSystem} from './systems/collision-system';
import {InputSystem} from './systems/input-system';
import {MovementSystem} from './systems/movement-system';
import {RenderSystem} from './systems/render-system';
import {RulesSystem} from './systems/rules-system';

const STAGES = [
  [[1700,1100],[1770,920],[1600,780],[1390,900],[1330,1120],[1450,1320],[1720,1360]],
  [[1500,900],[2050,800],[2250,1200],[1900,1550],[1300,1500],[950,1150],[1150,650]],
  [[1600,650],[2150,500],[2500,950],[2350,1550],[1600,1750],[900,1500],[700,850]],
  [[800,450],[1600,400],[2450,450],[2700,1100],[2400,1750],[1500,1800],[550,1350]],
  [[500,350],[1600,350],[2750,400],[2750,1500],[1700,1850],[600,1750],[1000,1050]],
  [[400,1100],[850,350],[1750,300],[2700,600],[2800,1550],[1800,1850],[700,1700]],
  [[350,300],[1500,300],[2800,350],[2850,1100],[2700,1850],[1500,1850],[350,1750]],
  [[500,450],[1100,1050],[550,1750],[1600,1650],[2700,1800],[2200,1100],[2750,350]],
  [[300,1100],[850,300],[1800,350],[2850,500],[2700,1650],[1700,1900],[600,1750]],
  [[300,300],[1600,250],[2900,300],[2850,1100],[2900,1900],[1600,1950],[300,1850]],
] as const;
const ENEMIES = [[1,0,0],[4,0,0],[6,0,0],[6,3,0],[7,4,0],[8,5,0],[8,5,2],[9,6,3],[10,7,4],[12,9,5]] as const;

export class Game {
  private readonly world = new World();
  private readonly input = new InputState();
  private readonly inputSystem = new InputSystem(this.input);
  private readonly aiSystem = new AISystem();
  private readonly audioSystem = new AudioSystem();
  private readonly movementSystem = new MovementSystem();
  private readonly collisionSystem = new CollisionSystem();
  private readonly rulesSystem = new RulesSystem();
  private readonly renderSystem = new RenderSystem(context, this.input);
  private readonly cleanupSystem = new CleanupSystem();
  private state: GameState = createGameState(7);
  private lastTime = 0;

  constructor() {
    this.input.attach();
    canvas.addEventListener('pointerdown', event => {
      if (this.state.phase === 'title') {this.state.phase = 'start'; return}
      if (this.state.phase === 'play') {
        if (this.renderSystem.attackAt(event.clientX, event.clientY, this.state)) this.input.attack();
        else if (event.pointerType !== 'mouse' && event.clientX < canvas.clientWidth / 2) {
          this.input.startMove(event.pointerId, event.clientX, event.clientY);
          canvas.setPointerCapture(event.pointerId);
        }
        return;
      }
      if (this.state.phase === 'upgrade') {const choice = this.renderSystem.choiceAt(event.clientX, event.clientY); if (choice >= 0) this.input.choose(choice)}
    });
    canvas.addEventListener('pointermove', event => this.input.move(event.pointerId, event.clientX, event.clientY));
    canvas.addEventListener('pointerup', event => this.input.stopMove(event.pointerId));
    canvas.addEventListener('pointercancel', event => this.input.stopMove(event.pointerId));
    if (DEBUG) globalThis.__setStage = (stage, abilities = 0, safeSeconds = 1) => {
      this.state.stage = Math.max(0, Math.min(STAGES.length - 1, stage));
      this.state.abilities = abilities;
      this.startStage();
      this.state.invulnerable = safeSeconds;
    };
    this.reset();
  }

  resize(): void {const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d)}

  readonly frame = (time: number): void => {
    const delta = this.lastTime === 0 ? 0 : Math.min((time - this.lastTime) / 1000, .05);
    this.state.audioEvents = 0;
    this.lastTime = time; if (this.state.phase === 'start') {this.state.stageElapsed += delta;if(this.state.stageElapsed>.3){this.state.phase='play';this.state.stageElapsed=0}} else if (this.state.phase === 'play') {this.state.elapsed += delta; this.state.stageElapsed += delta}
    this.inputSystem.update(this.world, this.state);
    if (this.state.restartRequested) {if (this.state.phase === 'complete') this.reset(); else {this.state.restartRequested = false; this.startStage()}}
    else if (this.state.phase === 'advance') this.nextStage();
    this.aiSystem.update(this.world, this.state, delta);
    this.movementSystem.update(this.world, delta);
    const collision = this.collisionSystem.update(this.world, this.state, delta);
    this.rulesSystem.update(this.world,this.state, collision);
    if (collision.enemyHit) this.state.audioEvents |= 2;
    if (collision.colors) this.state.audioEvents |= 32;
    this.audioSystem.update(this.state);
    this.renderSystem.draw(this.world, this.state, time);
    this.cleanupSystem.update(this.world);
    if (DEBUG) {
      const player = this.world.players.values().next().value;
      const position = player === undefined ? undefined : this.world.positions.get(player);
      const velocity = player === undefined ? undefined : this.world.velocities.get(player);
      let nearestEnemy=Infinity,nearestEnemySpeed=0;const enemyTypes=[0,0,0],shots=[0,0];for(const [entity,enemy] of this.world.enemies){enemyTypes[enemy.type]=(enemyTypes[enemy.type]??0)+1;const ep=this.world.positions.get(entity);if(ep&&position){const distance=Math.hypot(ep.x-position.x,ep.y-position.y);if(distance<nearestEnemy){nearestEnemy=distance;const ev=this.world.velocities.get(entity);nearestEnemySpeed=ev?Math.hypot(ev.x,ev.y):0}}}for(const shot of this.world.projectiles.values()){const index=shot.friendly?0:1;shots[index]=(shots[index]??0)+1}
      globalThis.__gameState = {
        phase:this.state.phase,x:position?.x??0,y:position?.y??0,vx:velocity?.x??0,vy:velocity?.y??0,
        elapsed:this.state.elapsed,stageElapsed:this.state.stageElapsed,collected:this.state.collected,total:this.state.total,stage:this.state.stage,
        entities:this.world.entities.size,positions:this.world.positions.size,velocities:this.world.velocities.size,
        players:this.world.players.size,prisms:this.world.prisms.size,enemies:this.world.enemies.size,enemyTypes,projectiles:this.world.projectiles.size,friendlyShots:shots[0]??0,hostileShots:shots[1]??0,
        abilities:this.state.abilities,selectedAbility:this.state.selectedAbility,gates:this.world.gates.size,nearestEnemy:Number.isFinite(nearestEnemy)?nearestEnemy:-1,nearestEnemySpeed,cameraX:this.renderSystem.cameraX,cameraY:this.renderSystem.cameraY,
        viewWidth:this.renderSystem.viewWidth,viewHeight:this.renderSystem.viewHeight,visiblePrisms:this.renderSystem.visiblePrisms,
      };
    }
    this.input.endFrame(); requestAnimationFrame(this.frame);
  };

  private reset(): void {this.state = createGameState(7); this.startStage();this.state.phase='title'}
  private nextStage(): void {this.state.stage++; this.startStage()}
  private startStage(): void {
    this.world.clear(); this.state.phase = 'play'; this.state.stageElapsed = this.state.reinforcementWave = 0; this.state.collected = this.state.rainbowMask = 0; this.state.attackRequested = false; this.state.invulnerable = 1;
    spawnPlayer(this.world);
    const positions = STAGES[this.state.stage] ?? STAGES[0];
    positions.forEach(([x,y], color) => spawnPrism(this.world,x,y,color));
    const counts = ENEMIES[this.state.stage] ?? ENEMIES[0]; let index = 0;
    counts.forEach((count,type) => {for (let i=0;i<count;i++,index++) {const angle=index*2.4+this.state.stage, radius=620+(index%3)*170; spawnEnemy(this.world,Math.max(60,Math.min(WORLD_WIDTH-60,WORLD_WIDTH/2+Math.cos(angle)*radius)),Math.max(60,Math.min(WORLD_HEIGHT-60,WORLD_HEIGHT/2+Math.sin(angle)*radius)),type)}});
  }
}
