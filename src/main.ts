import { GAME_CONFIG } from './config.js';
import { GameState, GameStats } from './core/gameState.js';
import { CORE_TIERS } from './entities/coreTiers.js';
import { PhysicsSimulation } from './physics/simulation.js';
import { CanvasRenderer } from './render/renderer.js';
import { ParticleSystem } from './render/particleSystem.js';
import { SoundEngine } from './audio/soundEngine.js';
import { InputHandler } from './input/inputHandler.js';
import { DebugHarness } from './debug/debugHarness.js';
import { CentralCoreLevelUpEvent, GameStatus, MergeEvent, Polarity } from './types.js';

class AccretionGame {
  // Subsystems
  private gameState: GameState;
  private simulation: PhysicsSimulation;
  private renderer: CanvasRenderer;
  private particles: ParticleSystem;
  private soundEngine: SoundEngine;
  public inputHandler: InputHandler;

  // DOM Elements
  private nucleusTierDisplay: HTMLElement;
  private scoreEl: HTMLElement;
  private bestScoreEl: HTMLElement;
  private comboEl: HTMLElement;
  private comboCard: HTMLElement;

  private nextPreviewCanvas: HTMLCanvasElement;
  private nextPolarityBadge: HTMLElement;

  private integrityText: HTMLElement;
  private integrityBarFill: HTMLElement;

  private fluxStatusText: HTMLElement;
  private btnFluxPulse: HTMLButtonElement;
  private fluxBtnLabel: HTMLElement;

  private feedbackBanner: HTMLElement;
  private feedbackTitle: HTMLElement;
  private feedbackDesc: HTMLElement;
  private feedbackTimeout: number = 0;

  private gameoverModal: HTMLElement;
  private finalScoreEl: HTMLElement;
  private finalBestEl: HTMLElement;
  private finalTierEl: HTMLElement;
  private finalResonantEl: HTMLElement;
  private finalMaxComboEl: HTMLElement;
  private finalFluxCountEl: HTMLElement;
  private btnRestart: HTMLButtonElement;

  private briefingModal: HTMLElement;
  private btnInfo: HTMLButtonElement;
  private btnCloseBriefing: HTMLButtonElement;
  private btnDismissBriefing: HTMLButtonElement;

  private btnSound: HTMLButtonElement;
  private soundIconOn: SVGElement;
  private soundIconOff: SVGElement;
  private btnReset: HTMLButtonElement;
  private btnDeployTouch: HTMLButtonElement;

  private lastTime: number = performance.now();
  private isRunning: boolean = true;

  constructor() {
    // 1. Resolve DOM Elements
    this.nucleusTierDisplay = document.getElementById('nucleus-tier-display')!;
    this.scoreEl = document.getElementById('score-display')!;
    this.bestScoreEl = document.getElementById('best-score-display')!;
    this.comboEl = document.getElementById('combo-display')!;
    this.comboCard = document.getElementById('combo-card')!;

    this.nextPreviewCanvas = document.getElementById('next-preview-canvas') as HTMLCanvasElement;
    this.nextPolarityBadge = document.getElementById('next-polarity-badge')!;

    this.integrityText = document.getElementById('integrity-text')!;
    this.integrityBarFill = document.getElementById('integrity-bar-fill')!;

    this.fluxStatusText = document.getElementById('flux-status-text')!;
    this.btnFluxPulse = document.getElementById('btn-flux-pulse') as HTMLButtonElement;
    this.fluxBtnLabel = document.getElementById('flux-btn-label')!;

    this.feedbackBanner = document.getElementById('feedback-banner')!;
    this.feedbackTitle = document.getElementById('feedback-title')!;
    this.feedbackDesc = document.getElementById('feedback-desc')!;

    this.gameoverModal = document.getElementById('gameover-modal')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.finalBestEl = document.getElementById('final-best')!;
    this.finalTierEl = document.getElementById('final-tier')!;
    this.finalResonantEl = document.getElementById('final-resonant-count')!;
    this.finalMaxComboEl = document.getElementById('final-max-combo')!;
    this.finalFluxCountEl = document.getElementById('final-flux-count')!;
    this.btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;

    this.briefingModal = document.getElementById('briefing-modal')!;
    this.btnInfo = document.getElementById('btn-info') as HTMLButtonElement;
    this.btnCloseBriefing = document.getElementById('btn-close-briefing') as HTMLButtonElement;
    this.btnDismissBriefing = document.getElementById('btn-dismiss-briefing') as HTMLButtonElement;

    this.btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
    this.soundIconOn = document.getElementById('sound-icon-on') as unknown as SVGElement;
    this.soundIconOff = document.getElementById('sound-icon-off') as unknown as SVGElement;
    this.btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
    this.btnDeployTouch = document.getElementById('btn-deploy-touch') as HTMLButtonElement;

    const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // 2. Initialize Subsystems
    this.soundEngine = new SoundEngine();
    this.updateSoundIcons();

    this.particles = new ParticleSystem();

    this.simulation = new PhysicsSimulation({
      onMerge: (event: MergeEvent) => this.handleMerge(event),
      onCentralCoreLevelUp: (event: CentralCoreLevelUpEvent) => this.handleCentralCoreLevelUp(event),
      onCollisionImpact: (intensity: number) => this.soundEngine.playImpact(intensity),
      onHazardStateChange: (inHazard: boolean) => this.gameState.setHazardState(inHazard)
    });

    this.gameState = new GameState({
      onScoreChange: (score, best, combo) => this.updateScoreUI(score, best, combo),
      onFluxChange: (charge, isReady) => this.updateFluxUI(charge, isReady),
      onIntegrityChange: (percent, isCritical) => this.updateIntegrityUI(percent, isCritical),
      onNextCoreChange: (ct, cp, nt, np) => this.updateNextCoreUI(ct, cp, nt, np),
      onCentralCoreChange: (tier) => this.updateCentralCoreUI(tier),
      onStatusChange: (status) => this.updateStatusUI(status),
      onGameOver: (stats) => this.handleGameOver(stats)
    });

    this.renderer = new CanvasRenderer(gameCanvas, this.nextPreviewCanvas);

    this.inputHandler = new InputHandler(gameCanvas, this.gameState, {
      onAimAngle: (rad) => this.gameState.setAimAngle(rad),
      onLaunch: () => this.launchCore(),
      onFluxPulse: () => this.triggerFluxPulse(),
      onRestart: () => this.restartGame(),
      onToggleSound: () => this.toggleSound()
    });

    // 3. Bind UI Buttons
    this.btnSound.addEventListener('click', () => this.toggleSound());
    this.btnReset.addEventListener('click', () => this.restartGame());
    this.btnRestart.addEventListener('click', () => this.restartGame());
    this.btnDeployTouch.addEventListener('click', () => this.launchCore());
    this.btnFluxPulse.addEventListener('click', () => this.triggerFluxPulse());

    this.btnInfo.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.briefingModal.classList.remove('hidden');
    });

    const closeBriefing = () => {
      this.soundEngine.playClick();
      this.briefingModal.classList.add('hidden');
    };
    this.btnCloseBriefing.addEventListener('click', closeBriefing);
    this.btnDismissBriefing.addEventListener('click', closeBriefing);

    // 4. Install Debug API Harness
    DebugHarness.install(
      this.gameState,
      this.simulation,
      this.particles,
      () => this.launchCore(),
      () => this.triggerFluxPulse(),
      (seed) => this.restartGame(seed)
    );

    // 5. Start Render & Game Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private launchCore(): void {
    if (!this.gameState.canLaunch()) return;

    const tier = this.gameState.currentTier;
    const polarity = this.gameState.currentPolarity;
    const angle = this.gameState.aimAngle;

    if (this.gameState.triggerLaunch()) {
      this.simulation.launchCoreInward(angle, tier, polarity);
      this.soundEngine.playDrop();
      this.gameState.onCoreLaunched();
    }
  }

  private triggerFluxPulse(): void {
    if (!this.gameState.canTriggerFluxPulse()) return;

    if (this.gameState.consumeFluxPulse()) {
      const invertedCount = this.simulation.invertAllPolarities();
      const cx = GAME_CONFIG.CENTER_X;
      const cy = GAME_CONFIG.CENTER_Y;

      this.particles.emitFluxPulseWave(cx, cy);
      this.soundEngine.playFluxPulse();

      this.showFeedbackBanner('SINGULARITY PULSE', `Inverted ${invertedCount} Core Dipoles`);
    }
  }

  private handleMerge(event: MergeEvent): void {
    this.gameState.handleMergeEvent(event);

    const isResonant = event.fusionType === 'RESONANT';
    const tierDef = CORE_TIERS[event.resultTier] || CORE_TIERS[1];
    const particleColor = event.resultPolarity === 1 ? tierDef.colorBaseAlpha : tierDef.colorBaseBeta;

    this.particles.emitMerge(event.x, event.y, particleColor, isResonant);
    this.soundEngine.playMerge(event.resultTier, isResonant, this.gameState.getScore());

    const gainedText = `+${event.scoreGained}`;
    this.particles.addFloatingText(event.x, event.y - 8, gainedText, isResonant ? '#38bdf8' : '#fbbf24');

    if (isResonant) {
      this.showFeedbackBanner('RESONANT FUSION', `+${event.scoreGained} Energy | Cluster Implosion`);
    }
  }

  /**
   * High-impact handler when a matching tier core fuses into and upgrades the Central Nucleus
   */
  private handleCentralCoreLevelUp(event: CentralCoreLevelUpEvent): void {
    this.gameState.handleCentralCoreLevelUp(event);

    const tierDef = CORE_TIERS[event.newTier] || CORE_TIERS[1];
    const particleColor = tierDef.colorBaseAlpha;

    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    this.particles.emitMerge(cx, cy, particleColor, true);
    this.particles.emitFluxPulseWave(cx, cy);
    this.soundEngine.playMerge(event.newTier, true, this.gameState.getScore());

    const gainedText = `+${event.scoreGained} NUCLEUS EVOLVED!`;
    this.particles.addFloatingText(cx, cy - 20, gainedText, '#fbbf24');

    this.showFeedbackBanner(
      `NUCLEUS EVOLVED: TIER ${event.newTier}`,
      `${tierDef.name} (${tierDef.codename}) Anchored!`
    );
  }

  private showFeedbackBanner(title: string, desc: string): void {
    this.feedbackTitle.textContent = title;
    this.feedbackDesc.textContent = desc;
    this.feedbackBanner.classList.remove('hidden');

    window.clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = window.setTimeout(() => {
      this.feedbackBanner.classList.add('hidden');
    }, 1900);
  }

  private updateCentralCoreUI(tier: number): void {
    const tierDef = CORE_TIERS[tier] || CORE_TIERS[1];
    if (this.nucleusTierDisplay) {
      this.nucleusTierDisplay.textContent = `T${tier} ${tierDef.codename}`;
    }
  }

  private updateScoreUI(score: number, best: number, combo: number): void {
    this.scoreEl.textContent = score.toLocaleString();
    this.bestScoreEl.textContent = best.toLocaleString();
    this.comboEl.textContent = `${combo.toFixed(1)}x`;

    if (combo > 1.0) {
      this.comboCard.style.borderColor = 'var(--color-amber)';
    } else {
      this.comboCard.style.borderColor = 'var(--border-subtle)';
    }
  }

  private updateFluxUI(charge: number, isReady: boolean): void {
    this.fluxBtnLabel.textContent = `FLUX ${Math.floor(charge)}%`;
    this.btnFluxPulse.disabled = !isReady;

    if (isReady) {
      this.btnFluxPulse.classList.add('ready');
      this.fluxStatusText.textContent = 'READY (SPACE)';
      this.fluxStatusText.style.color = 'var(--color-accent)';
    } else {
      this.btnFluxPulse.classList.remove('ready');
      this.fluxStatusText.textContent = 'CHARGING';
      this.fluxStatusText.style.color = 'var(--color-dim)';
    }
  }

  private updateIntegrityUI(percent: number, isCritical: boolean): void {
    this.integrityText.textContent = `${percent}%`;
    this.integrityBarFill.style.width = `${percent}%`;

    if (isCritical) {
      this.integrityText.className = 'integrity-percent critical';
      this.integrityBarFill.className = 'integrity-bar-fill critical';
      this.soundEngine.playHazardAlert();
    } else if (percent < 85) {
      this.integrityText.className = 'integrity-percent warning';
      this.integrityBarFill.className = 'integrity-bar-fill warning';
    } else {
      this.integrityText.className = 'integrity-percent';
      this.integrityBarFill.className = 'integrity-bar-fill';
    }
  }

  private updateNextCoreUI(_ct: number, _cp: Polarity, _nt: number, nextPolarity: Polarity): void {
    if (nextPolarity === 1) {
      this.nextPolarityBadge.textContent = '+ALPHA';
      this.nextPolarityBadge.className = 'polarity-badge positive';
    } else {
      this.nextPolarityBadge.textContent = '−BETA';
      this.nextPolarityBadge.className = 'polarity-badge negative';
    }
  }

  private updateStatusUI(status: GameStatus): void {
    if (status === 'GAMEOVER') {
      this.soundEngine.playBreach();
    }
  }

  private handleGameOver(stats: GameStats): void {
    this.finalScoreEl.textContent = stats.finalScore.toLocaleString();
    this.finalBestEl.textContent = stats.bestScore.toLocaleString();
    this.finalTierEl.textContent = CORE_TIERS[stats.centralCoreTier]?.name || `Tier ${stats.centralCoreTier}`;
    this.finalResonantEl.textContent = stats.resonantMerges.toString();
    this.finalMaxComboEl.textContent = `${stats.peakCombo.toFixed(1)}x`;
    this.finalFluxCountEl.textContent = stats.fluxInversions.toString();

    this.gameoverModal.classList.remove('hidden');
    this.btnRestart.focus();
  }

  private restartGame(seed?: number): void {
    this.soundEngine.playClick();
    this.gameoverModal.classList.add('hidden');
    this.particles.clear();
    this.simulation.reset();
    this.gameState.reset(seed);
  }

  private toggleSound(): void {
    const isMuted = this.soundEngine.toggleMuted();
    this.updateSoundIcons();
    if (!isMuted) {
      this.soundEngine.playClick();
    }
  }

  private updateSoundIcons(): void {
    const isMuted = this.soundEngine.getIsMuted();
    if (isMuted) {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
      this.btnSound.setAttribute('title', 'Unmute Sound (M)');
    } else {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
      this.btnSound.setAttribute('title', 'Mute Sound (M)');
    }
  }

  private gameLoop(time: number): void {
    if (!this.isRunning) return;

    const dt = Math.min(time - this.lastTime, 50);
    this.lastTime = time;

    this.simulation.step(dt);
    this.gameState.update(dt);
    this.particles.update(dt);

    this.renderer.render(this.gameState, this.simulation, this.particles, dt);

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

function updateViewportHeight(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', updateViewportHeight);
updateViewportHeight();

window.addEventListener('DOMContentLoaded', () => {
  new AccretionGame();
});
