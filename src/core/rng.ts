import { GAME_CONFIG } from '../config.js';
import { Polarity } from '../types.js';

export class DeterministicRNG {
  private seed: number;
  private current: number;
  private polarityStreak: number = 0;
  private lastPolarity: Polarity = 1;

  constructor(initialSeed: number = Date.now()) {
    this.seed = initialSeed >>> 0;
    this.current = this.seed;
  }

  public setSeed(newSeed: number): void {
    this.seed = newSeed >>> 0;
    this.current = this.seed;
    this.polarityStreak = 0;
  }

  public getSeed(): number {
    return this.seed;
  }

  /**
   * Mulberry32 32-bit generator. Fast, high quality distribution.
   */
  public nextFloat(): number {
    let t = (this.current += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.current = (t ^ (t >>> 14)) >>> 0;
    return this.current / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Selects a spawnable tier based on weighted probabilities.
   */
  public nextSpawnTier(): number {
    const r = this.nextFloat();
    let accumulated = 0;
    for (let i = 0; i < GAME_CONFIG.SPAWN_WEIGHTS.length; i++) {
      accumulated += GAME_CONFIG.SPAWN_WEIGHTS[i];
      if (r <= accumulated) {
        return GAME_CONFIG.SPAWNABLE_TIERS[i];
      }
    }
    return GAME_CONFIG.SPAWNABLE_TIERS[0];
  }

  /**
   * Generates a balanced polarity with max streak clamp of 3.
   */
  public nextPolarity(): Polarity {
    let polarity: Polarity = this.nextFloat() < 0.5 ? 1 : -1;

    if (polarity === this.lastPolarity) {
      this.polarityStreak++;
      if (this.polarityStreak >= 3) {
        // Invert to prevent boring or punishing monochromatic streaks
        polarity = (this.lastPolarity * -1) as Polarity;
        this.polarityStreak = 1;
      }
    } else {
      this.polarityStreak = 1;
    }

    this.lastPolarity = polarity;
    return polarity;
  }
}
