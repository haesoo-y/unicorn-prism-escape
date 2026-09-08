declare const DEBUG: boolean;
declare var __audioState: {contexts:number; notes:number; beats:number; events:number; state:string} | undefined;

declare module '*.png' {const url:string;export default url}
declare module '*.webp' {const url:string;export default url}

interface GameDebugState {
  phase: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  elapsed: number;
  stageElapsed: number;
  collected: number;
  total: number;
  stage: number;
  entities: number;
  positions: number;
  velocities: number;
  players: number;
  prisms: number;
  enemies: number;
  enemyTypes: number[];
  projectiles: number;
  friendlyShots: number;
  hostileShots: number;
  abilities: number;
  selectedAbility: number;
  gates: number;
  nearestEnemy: number;
  nearestEnemySpeed: number;
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
  visiblePrisms: number;
}

declare var __gameState: GameDebugState;
declare var __setStage: (stage: number, abilities?: number, safeSeconds?: number) => void;
