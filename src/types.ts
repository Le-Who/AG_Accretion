export type Polarity = 1 | -1; // 1 = Alpha (+), -1 = Beta (-)

export type GameStatus = 
  | 'BOOT'
  | 'READY'
  | 'AIMING'
  | 'DROPPING'
  | 'RESOLVING'
  | 'DANGER'
  | 'GAMEOVER'
  | 'PAUSED';

export interface CoreTierDefinition {
  tier: number;
  name: string;
  codename: string;
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  frictionAir: number;
  colorBaseAlpha: string; // Color when +Alpha
  colorBaseBeta: string;  // Color when -Beta
  glowColorAlpha: string;
  glowColorBeta: string;
  scoreValue: number;
  audioFreq: number; // Hz for harmonic synthesizer
}

export interface AccretionEntity {
  id: string;
  bodyId: number;
  tier: number;
  polarity: Polarity;
  radius: number;
  createdAt: number;
  isMerging: boolean;
  spawnTime: number;
  renderRotation: number;
}

export interface MergeEvent {
  entityA: AccretionEntity;
  entityB: AccretionEntity;
  fusionType: 'RESONANT' | 'FORCED';
  resultTier: number;
  resultPolarity: Polarity;
  x: number;
  y: number;
  scoreGained: number;
  comboMultiplier: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
  type?: 'SPARK' | 'RING' | 'IMPLODE';
  targetX?: number;
  targetY?: number;
}

export interface DebugScenario {
  name: string;
  description: string;
  setup: () => void;
}
