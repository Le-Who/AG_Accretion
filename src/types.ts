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
  queenTitle: string;
}

export interface AccretionEntity {
  mergeBorn?: boolean;
  id: string;
  bodyId: number;
  tier: number;
  polarity: Polarity;
  radius: number;
  createdAt: number;
  isMerging: boolean;
  spawnTime: number;
  renderRotation: number;
  isCentralCore?: boolean;
}

export interface MergeEvent {
  pairBloom?: boolean;
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

export interface CentralCoreLevelUpEvent {
  previousTier: number;
  newTier: number;
  fusionType: 'RESONANT' | 'FORCED';
  consumedEntity: AccretionEntity;
  scoreGained: number;
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
  type?: 'SPARK' | 'RING' | 'IMPLODE' | 'CONFETTI' | 'HEART';
  rotation?: number;
  spin?: number;
  targetX?: number;
  targetY?: number;
}

export interface DebugScenario {
  name: string;
  description: string;
  setup: () => void;
}
