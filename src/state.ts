export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2200;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 720;
export const STAGE_COUNT = 10;
export const ABILITIES = [
  ['GATE MAP', 'Shows you and the open rainbow gate'],
  ['PRISM MAP', 'Also shows every remaining prism'],
  ['ENEMY SENSE', 'Also shows every enemy'],
  ['RAINBOW HORN', 'SPACE: launch a wide unicorn charge'],
  ['RAINBOW BOLT', 'Auto-fires a short-range rainbow bolt'],
  ['RAINBOW WAVE', 'Prisms clear shots and push enemies'],
  ['SPEED UP', 'Move 20% faster'],
  ['PRISM MAGNET', 'Pull in nearby prisms'],
  ['SLOW AURA', 'Greatly slow enemies and shots in the aura'],
] as const;
export const RAINBOW_COLORS = ['#ff4057', '#ff8b2b', '#ffd23f', '#45d66b', '#3a9cff', '#5552c9', '#ad5cff'] as const;

export type Phase = 'play' | 'upgrade' | 'advance' | 'failed' | 'complete';

export interface GameState {
  phase: Phase;
  collected: number;
  total: number;
  stage: number;
  rainbowMask: number;
  selectedAbility: number;
  pointerArmed: number;
  abilities: number;
  attackRequested: boolean;
  meleeFlash: number;
  invulnerable: number;
  elapsed: number;
  stageElapsed: number;
  restartRequested: boolean;
  audioEvents: number;
}

export function createGameState(total: number): GameState {
  return {
    phase: 'play', collected: 0, total, stage: 0, rainbowMask: 0,
    selectedAbility: 0, pointerArmed: -1, abilities: 0,
    attackRequested: false, meleeFlash: 0, invulnerable: 0,
    elapsed: 0, stageElapsed: 0, restartRequested: false, audioEvents: 0,
  };
}
