import { GAME_CONFIG } from './config.js';
import { GameState, GameStats } from './core/gameState.js';
import { CORE_TIERS } from './entities/coreTiers.js';
import { PhysicsSimulation } from './physics/simulation.js';
import { CanvasRenderer } from './render/renderer.js';
import { ParticleSystem } from './render/particleSystem.js';
import { SoundEngine } from './audio/soundEngine.js';
import { MusicEngine } from './audio/musicEngine.js';
import { MUSIC_TRACKS } from './audio/musicLibrary.js';
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
  private music: MusicEngine;
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

    const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // 2. Initialize Subsystems
    this.soundEngine = new SoundEngine();
    this.music = new MusicEngine(MUSIC_TRACKS);
    this.music.setMuted(this.soundEngine.getIsMuted());
    this.music.setVisible(!document.hidden);
    // Kept on user gestures, rather than starting media during page load.
    document.addEventListener('pointerdown', () => { void this.music.activate(); }, { passive: true });
    document.addEventListener('keydown', event => { if (!event.repeat) void this.music.activate(); });
    document.addEventListener('visibilitychange', () => this.music.setVisible(!document.hidden));
    this.updateSoundIcons();

    this.particles = new ParticleSystem();

    this.simulation = new PhysicsSimulation({
      onAscension: () => {
        this.gameState.handleAscension();
        const multiplier = this.gameState.getRunMultiplier();
        this.particles.emitHearts(GAME_CONFIG.CENTER_X, GAME_CONFIG.CENTER_Y);
        this.particles.emitFluxPulseWave(GAME_CONFIG.CENTER_X, GAME_CONFIG.CENTER_Y);
        this.soundEngine.playLevelUp();
        this.showFeedbackBanner('QUEEN ASCENDED', `${multiplier.toFixed(1)}× score for this run`);
      },
      onMerge: (event: MergeEvent) => this.handleMerge(event),
      onCentralCoreLevelUp: (event: CentralCoreLevelUpEvent) => this.handleCentralCoreLevelUp(event),
      onCollisionImpact: (intensity, contact) => {
        this.soundEngine.playImpact(intensity);
        if (contact && this.renderer) {
          this.renderer.getSquishSystem().onCollisionImpact(
            contact.bodyAId,
            contact.bodyBId,
            { x: contact.normalX, y: contact.normalY },
            intensity * 14.0
          );
        }
      },
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
    this.btnFluxPulse.addEventListener('click', () => this.triggerFluxPulse());
    const eyeTracking = document.getElementById('eye-tracking') as HTMLInputElement;
    eyeTracking.checked = localStorage.getItem('slime_eye_tracking') !== 'false';
    this.renderer.setEyeTracking(eyeTracking.checked);
    eyeTracking.addEventListener('change', () => {
      localStorage.setItem('slime_eye_tracking', String(eyeTracking.checked));
      this.renderer.setEyeTracking(eyeTracking.checked);
    });
    const musicEnabled = document.getElementById('music-enabled') as HTMLInputElement;
    const musicVolume = document.getElementById('music-volume') as HTMLInputElement;
    musicEnabled.checked = this.music.getEnabled();
    musicVolume.value = String(Math.round(this.music.getVolume() * 100));
    musicEnabled.addEventListener('change', () => this.music.setEnabled(musicEnabled.checked));
    musicVolume.addEventListener('input', () => this.music.setVolume(Number(musicVolume.value) / 100));
    const menus = [...document.querySelectorAll<HTMLDetailsElement>('.hud-dropdown')];
    for (const menu of menus) {
      menu.addEventListener('toggle', () => {
        if (menu.open) for (const other of menus) if (other !== menu) other.open = false;
      });
    }
    document.addEventListener('pointerdown', event => {
      for (const menu of menus) if (!menu.contains(event.target as Node)) menu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        for (const menu of menus) if (menu.open) {
          menu.open = false;
          menu.querySelector('summary')?.focus();
        }
        this.briefingModal.classList.add('hidden');
      }
    });
    for (const id of ['btn-sound', 'btn-reset', 'btn-info']) {
      const button = document.getElementById(id)!;
      button.append(document.createTextNode(id === 'btn-sound' ? 'Sound' : id === 'btn-reset' ? 'Restart' : 'Guide'));
    }

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
    if (this.simulation.isBloomActive()) return;
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
    const pairCount = this.simulation.startPairBloom();
    if (!pairCount) {
      this.showFeedbackBanner('BLOOM SAVED', 'No safe matching pair yet — charge kept');
      return;
    }

    if (this.gameState.consumeFluxPulse()) {
      const cx = GAME_CONFIG.CENTER_X;
      const cy = GAME_CONFIG.CENTER_Y;

      this.particles.emitFluxPulseWave(cx, cy);
      this.soundEngine.playFluxPulse();

      this.showFeedbackBanner('PAIR BLOOM', `${pairCount} matching ${pairCount === 1 ? 'pair' : 'pairs'} coming together!`);
    }
  }

  private handleMerge(event: MergeEvent): void {
    this.gameState.handleMergeEvent(event);

    const isResonant = event.fusionType === 'RESONANT';
    const tierDef = CORE_TIERS[event.resultTier] || CORE_TIERS[1];
    const particleColor = event.resultPolarity === 1 ? tierDef.colorBaseAlpha : tierDef.colorBaseBeta;

    this.particles.emitMerge(event.x, event.y, particleColor, isResonant || !!event.pairBloom);
    this.soundEngine.playMerge(event.resultTier, isResonant, this.gameState.getScore());

    const gainedText = `+${event.scoreGained}`;
    this.particles.addFloatingText(event.x, event.y - 8, gainedText, isResonant ? '#38bdf8' : '#fbbf24');

    if (isResonant && !event.pairBloom) {
      this.showFeedbackBanner('SUN + MOON', `+${event.scoreGained} · Harmony bonus!`);
    }
  }

  /**
   * High-impact handler when a matching tier core fuses into and upgrades the Central Nucleus
   */
  private handleCentralCoreLevelUp(event: CentralCoreLevelUpEvent): void {
    this.gameState.handleCentralCoreLevelUp(event);

    const tierDef = CORE_TIERS[event.newTier] || CORE_TIERS[1];
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    this.particles.emitHearts(cx, cy);
    this.particles.emitMerge(cx, cy, '#ff3b77', true);
    this.particles.emitFluxPulseWave(cx, cy);
    this.soundEngine.playLevelUp();
    this.renderer.getSquishSystem().triggerQueenImpact(0, 16.0);

    const gainedText = `+${event.scoreGained} QUEEN EVOLVED!`;
    this.particles.addFloatingText(cx, cy - 20, gainedText, '#ffd700');

    this.showFeedbackBanner(
      `QUEEN EVOLVED: LV.${event.newTier}`,
      `${tierDef.queenTitle} (${tierDef.name}) Blessed!`
    );
  }

  private showFeedbackBanner(title: string, desc: string): void {
    this.feedbackTitle.textContent = title;
    this.feedbackDesc.textContent = desc;
    this.feedbackBanner.classList.remove('hidden');

    window.clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = window.setTimeout(() => {
      this.feedbackBanner.classList.add('hidden');
    }, 2200);
  }

  private updateCentralCoreUI(tier: number): void {
    const tierDef = CORE_TIERS[tier] || CORE_TIERS[1];
    if (this.nucleusTierDisplay) {
      this.nucleusTierDisplay.textContent = `👑 LV.${tier} ${tierDef.name}`;
    }
  }

  private updateScoreUI(score: number, best: number, combo: number): void {
    this.scoreEl.textContent = score.toLocaleString();
    this.bestScoreEl.textContent = best.toLocaleString();
    this.comboEl.textContent = `${combo.toFixed(1)}x`;
    const runMultiplier = this.gameState?.getRunMultiplier() || 1;
    document.getElementById('run-multiplier')!.textContent = `${runMultiplier.toFixed(1)}×`;

    if (combo > 1.0) {
      this.comboCard.style.borderColor = 'var(--color-amber)';
    } else {
      this.comboCard.style.borderColor = 'var(--border-subtle)';
    }
  }

  private updateFluxUI(charge: number, isReady: boolean): void {
    this.btnFluxPulse.style.setProperty('--bloom-charge', `${Math.max(0, Math.min(100, charge))}%`);
    this.btnFluxPulse.setAttribute('aria-label', `Pair Bloom, ${Math.floor(charge)} percent charged`);
    this.fluxBtnLabel.textContent = isReady ? 'PAIR BLOOM' : `BLOOM ${Math.floor(charge)}%`;
    this.btnFluxPulse.disabled = !isReady || !!this.simulation?.isBloomActive();

    if (isReady) {
      this.btnFluxPulse.classList.add('ready');
      const pairs = this.simulation?.getPairBloomCount() || 0;
      this.fluxStatusText.textContent = pairs ? `${pairs} ${pairs === 1 ? 'PAIR' : 'PAIRS'} · SPACE` : 'COLLECT A PAIR';
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
      this.nextPolarityBadge.textContent = '☀ SUN';
      this.nextPolarityBadge.className = 'polarity-badge positive';
    } else {
      this.nextPolarityBadge.textContent = '☾ MOON';
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
    this.feedbackBanner.classList.add('hidden');
    this.simulation.reset();
    this.gameState.reset(seed);
  }

  private toggleSound(): void {
    const isMuted = this.soundEngine.toggleMuted();
    this.music.setMuted(isMuted);
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

    if (this.gameState.getStatus() !== 'GAMEOVER' && this.briefingModal.classList.contains('hidden') && !document.querySelector('.hud-dropdown[open]')) {
      const resolvingBloom = this.simulation.isBloomActive();
      this.simulation.step(dt);
      this.gameState.update(dt, resolvingBloom);
      this.particles.update(dt);
    }
    this.updateFluxUI(this.gameState.getFluxCharge(), this.gameState.canTriggerFluxPulse());

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
