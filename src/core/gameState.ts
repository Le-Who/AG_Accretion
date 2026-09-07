import { GAME_CONFIG } from '../config.js';
import { CentralCoreLevelUpEvent, GameStatus, MergeEvent, Polarity } from '../types.js';
import { DeterministicRNG } from './rng.js';

export interface GameStateListener {
  onScoreChange: (score: number, bestScore: number, combo: number) => void;
  onFluxChange: (charge: number, isReady: boolean) => void;
  onIntegrityChange: (integrityPercent: number, isCritical: boolean) => void;
  onNextCoreChange: (currentTier: number, currentPolarity: Polarity, nextTier: number, nextPolarity: Polarity) => void;
  onCentralCoreChange: (tier: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onGameOver: (stats: GameStats) => void;
}

export interface GameStats {
  finalScore: number;
  bestScore: number;
  maxTier: number;
  centralCoreTier: number;
  resonantMerges: number;
  peakCombo: number;
  fluxInversions: number;
}

export class GameState {
  private status: GameStatus = 'READY';
  private rng: DeterministicRNG;
  private listener: GameStateListener;

  // Scoring
  private score: number = 0;
  private bestScore: number = 0;
  private comboMultiplier: number = 1.0;
  private comboTimer: number = 0;
  private peakCombo: number = 1.0;
  private resonantMergeCount: number = 0;
  private fluxInversionCount: number = 0;
  private maxTierReached: number = 1;

  // Central Core Level (starts at Tier 1, levels up when matching tier core fuses into it)
  public centralCoreTier: number = 1;

  // Signature System: Flux Pulse
  private fluxCharge: number = 0;

  // Outer Containment Hazard
  private integrityMs: number = GAME_CONFIG.HAZARD_GRACE_PERIOD_MS;
  private isHazardActive: boolean = false;

  // Spawn Queue
  public currentTier: number = 1;
  public currentPolarity: Polarity = 1;
  public nextTier: number = 1;
  public nextPolarity: Polarity = -1;

  // Radial Aiming: Angle around perimeter in radians
  public aimAngle: number = -Math.PI / 2;
  private launchCooldownTimer: number = 0;

  constructor(listener: GameStateListener, initialSeed?: number) {
    this.listener = listener;
    this.rng = new DeterministicRNG(initialSeed);

    if (typeof localStorage !== 'undefined') {
      const savedBest = localStorage.getItem(GAME_CONFIG.STORAGE_BEST_SCORE_KEY);
      if (savedBest) {
        this.bestScore = parseInt(savedBest, 10) || 0;
      }
    }

    this.initQueue();
  }

  private initQueue(): void {
    this.currentTier = this.rng.nextSpawnTier();
    this.currentPolarity = this.rng.nextPolarity();
    this.nextTier = this.rng.nextSpawnTier();
    this.nextPolarity = this.rng.nextPolarity();
    this.maxTierReached = Math.max(this.maxTierReached, this.currentTier, this.nextTier, this.centralCoreTier);

    this.listener.onNextCoreChange(this.currentTier, this.currentPolarity, this.nextTier, this.nextPolarity);
    this.listener.onCentralCoreChange(this.centralCoreTier);
    this.listener.onScoreChange(this.score, this.bestScore, this.comboMultiplier);
    this.listener.onFluxChange(this.fluxCharge, this.fluxCharge >= GAME_CONFIG.FLUX_MAX_CHARGE);
    this.listener.onIntegrityChange(100, false);
  }

  public advanceQueue(): void {
    this.currentTier = this.nextTier;
    this.currentPolarity = this.nextPolarity;
    this.nextTier = this.rng.nextSpawnTier();
    this.nextPolarity = this.rng.nextPolarity();

    this.listener.onNextCoreChange(this.currentTier, this.currentPolarity, this.nextTier, this.nextPolarity);
  }

  public setAimAngle(rad: number): void {
    this.aimAngle = rad;
  }

  public setAimFromPoint(x: number, y: number): void {
    const dx = x - GAME_CONFIG.CENTER_X;
    const dy = y - GAME_CONFIG.CENTER_Y;
    this.aimAngle = Math.atan2(dy, dx);
  }

  public canLaunch(): boolean {
    return (
      this.status === 'READY' ||
      this.status === 'AIMING' ||
      this.status === 'DANGER'
    ) && this.launchCooldownTimer <= 0;
  }

  public triggerLaunch(): boolean {
    if (!this.canLaunch()) return false;
    this.status = 'DROPPING';
    this.launchCooldownTimer = GAME_CONFIG.SPAWN_SAFE_DELAY_MS;
    return true;
  }

  public onCoreLaunched(): void {
    this.advanceQueue();
  }

  public handleMergeEvent(event: MergeEvent): void {
    if (this.status === 'GAMEOVER') return;

    if (event.resultTier > this.maxTierReached) {
      this.maxTierReached = event.resultTier;
    }

    this.comboTimer = GAME_CONFIG.COMBO_WINDOW_MS;
    this.comboMultiplier = Math.min(
      GAME_CONFIG.MAX_COMBO_MULTIPLIER,
      this.comboMultiplier + GAME_CONFIG.COMBO_INCREMENT
    );
    if (this.comboMultiplier > this.peakCombo) {
      this.peakCombo = this.comboMultiplier;
    }

    const scoredPoints = Math.round(event.scoreGained * this.comboMultiplier);
    this.score += scoredPoints;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GAME_CONFIG.STORAGE_BEST_SCORE_KEY, String(this.bestScore));
      }
    }

    const fluxDelta = event.fusionType === 'RESONANT'
      ? GAME_CONFIG.FLUX_CHARGE_RESONANT_MERGE
      : GAME_CONFIG.FLUX_CHARGE_FORCED_MERGE;

    if (event.fusionType === 'RESONANT') {
      this.resonantMergeCount++;
    }

    this.fluxCharge = Math.min(GAME_CONFIG.FLUX_MAX_CHARGE, this.fluxCharge + fluxDelta);

    this.listener.onScoreChange(this.score, this.bestScore, this.comboMultiplier);
    this.listener.onFluxChange(this.fluxCharge, this.fluxCharge >= GAME_CONFIG.FLUX_MAX_CHARGE);
  }

  /**
   * Called when a matching-tier core fuses into and upgrades the Central Nucleus!
   */
  public handleCentralCoreLevelUp(event: CentralCoreLevelUpEvent): void {
    if (this.status === 'GAMEOVER') return;

    this.centralCoreTier = event.newTier;
    if (event.newTier > this.maxTierReached) {
      this.maxTierReached = event.newTier;
    }

    this.comboTimer = GAME_CONFIG.COMBO_WINDOW_MS;
    this.comboMultiplier = Math.min(
      GAME_CONFIG.MAX_COMBO_MULTIPLIER,
      this.comboMultiplier + 1.0 // Extra combo reward for central nucleus evolution!
    );
    if (this.comboMultiplier > this.peakCombo) {
      this.peakCombo = this.comboMultiplier;
    }

    const scoredPoints = Math.round(event.scoreGained * this.comboMultiplier);
    this.score += scoredPoints;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GAME_CONFIG.STORAGE_BEST_SCORE_KEY, String(this.bestScore));
      }
    }

    // Supercharge flux on nucleus evolution
    this.fluxCharge = Math.min(GAME_CONFIG.FLUX_MAX_CHARGE, this.fluxCharge + 40);

    if (event.fusionType === 'RESONANT') {
      this.resonantMergeCount++;
    }

    this.listener.onCentralCoreChange(this.centralCoreTier);
    this.listener.onScoreChange(this.score, this.bestScore, this.comboMultiplier);
    this.listener.onFluxChange(this.fluxCharge, this.fluxCharge >= GAME_CONFIG.FLUX_MAX_CHARGE);
  }

  public canTriggerFluxPulse(): boolean {
    return this.fluxCharge >= GAME_CONFIG.FLUX_MAX_CHARGE && this.status !== 'GAMEOVER';
  }

  public consumeFluxPulse(): boolean {
    if (!this.canTriggerFluxPulse()) return false;
    this.fluxCharge = 0;
    this.fluxInversionCount++;
    this.listener.onFluxChange(this.fluxCharge, false);
    return true;
  }

  public setHazardState(inHazard: boolean): void {
    this.isHazardActive = inHazard;
    if (inHazard && this.status !== 'GAMEOVER') {
      this.status = 'DANGER';
    } else if (!inHazard && this.status === 'DANGER') {
      this.status = 'READY';
    }
  }

  public update(dtMs: number): void {
    if (this.status === 'GAMEOVER' || this.status === 'PAUSED') return;

    if (this.launchCooldownTimer > 0) {
      this.launchCooldownTimer -= dtMs;
      if (this.launchCooldownTimer <= 0 && this.status === 'DROPPING') {
        this.status = this.isHazardActive ? 'DANGER' : 'READY';
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dtMs;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1.0;
        this.listener.onScoreChange(this.score, this.bestScore, this.comboMultiplier);
      }
    }

    if (this.isHazardActive) {
      this.integrityMs -= dtMs;
      if (this.integrityMs <= 0) {
        this.integrityMs = 0;
        this.triggerGameOver();
      }
    } else {
      if (this.integrityMs < GAME_CONFIG.HAZARD_GRACE_PERIOD_MS) {
        this.integrityMs = Math.min(
          GAME_CONFIG.HAZARD_GRACE_PERIOD_MS,
          this.integrityMs + dtMs * GAME_CONFIG.HAZARD_RECOVERY_RATE
        );
      }
    }

    const integrityPercent = Math.round((this.integrityMs / GAME_CONFIG.HAZARD_GRACE_PERIOD_MS) * 100);
    const isCritical = integrityPercent < 35;
    this.listener.onIntegrityChange(integrityPercent, isCritical);
  }

  public triggerGameOver(): void {
    if (this.status === 'GAMEOVER') return;
    this.status = 'GAMEOVER';
    this.listener.onStatusChange(this.status);
    this.listener.onGameOver({
      finalScore: this.score,
      bestScore: this.bestScore,
      maxTier: this.maxTierReached,
      centralCoreTier: this.centralCoreTier,
      resonantMerges: this.resonantMergeCount,
      peakCombo: this.peakCombo,
      fluxInversions: this.fluxInversionCount
    });
  }

  public reset(seed?: number): void {
    this.status = 'READY';
    this.score = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.peakCombo = 1.0;
    this.resonantMergeCount = 0;
    this.fluxInversionCount = 0;
    this.maxTierReached = 1;
    this.centralCoreTier = 1;
    this.fluxCharge = 0;
    this.integrityMs = GAME_CONFIG.HAZARD_GRACE_PERIOD_MS;
    this.isHazardActive = false;
    this.launchCooldownTimer = 0;

    if (seed !== undefined) {
      this.rng.setSeed(seed);
    }

    this.initQueue();
    this.listener.onStatusChange(this.status);
  }

  public getScore(): number { return this.score; }
  public getBestScore(): number { return this.bestScore; }
  public getStatus(): GameStatus { return this.status; }
  public getFluxCharge(): number { return this.fluxCharge; }
  public getIntegrityPercent(): number {
    return Math.round((this.integrityMs / GAME_CONFIG.HAZARD_GRACE_PERIOD_MS) * 100);
  }
  public getRNG(): DeterministicRNG { return this.rng; }
}
