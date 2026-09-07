import { GAME_CONFIG } from '../config.js';
import { GameState } from '../core/gameState.js';
import { CORE_TIERS } from '../entities/coreTiers.js';
import { MagneticFieldSystem } from '../physics/magneticField.js';
import { PhysicsSimulation } from '../physics/simulation.js';
import { AccretionEntity } from '../types.js';
import { ParticleSystem } from './particleSystem.js';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private animTime: number = 0;

  constructor(canvas: HTMLCanvasElement, previewCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas.getContext('2d')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    const container = this.canvas.parentElement;
    if (!container) return;

    const availableWidth = container.clientWidth - 16;
    const availableHeight = container.clientHeight - 16;

    const targetSize = Math.min(availableWidth, availableHeight, 640);

    this.canvas.style.width = `${Math.floor(targetSize)}px`;
    this.canvas.style.height = `${Math.floor(targetSize)}px`;

    this.canvas.width = Math.floor(GAME_CONFIG.CHAMBER_WIDTH * this.dpr);
    this.canvas.height = Math.floor(GAME_CONFIG.CHAMBER_HEIGHT * this.dpr);

    this.previewCanvas.width = 60 * this.dpr;
    this.previewCanvas.height = 60 * this.dpr;
    this.previewCanvas.style.width = '42px';
    this.previewCanvas.style.height = '42px';
  }

  public render(
    gameState: GameState,
    simulation: PhysicsSimulation,
    particles: ParticleSystem,
    dtMs: number
  ): void {
    this.animTime += dtMs * 0.001;
    const ctx = this.ctx;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    // 1. Deep Space Cosmic Background
    this.drawDeepSpaceBackground(ctx, cx, cy);

    // 2. Orbital Coordinate Grid & Range Rings
    this.drawOrbitalCoordinates(ctx, cx, cy);

    // 3. Containment Perimeter Ring (Critical Event Horizon)
    this.drawContainmentPerimeter(ctx, cx, cy, gameState);

    // 4. Inward Trajectory Aim Preview
    if (gameState.canLaunch()) {
      this.drawInwardTrajectory(ctx, gameState, simulation);
    }

    // 5. Active Accreted Cores in Chamber
    this.drawActiveCores(ctx, simulation, gameState.centralCoreTier);

    // 6. The Central Core (Zero-Point Nucleus Anchor Chip)
    this.drawCentralNucleus(ctx, cx, cy, simulation, gameState);

    // 7. Aiming Launcher at Orbital Perimeter
    if (gameState.canLaunch()) {
      this.drawOrbitalLauncher(ctx, cx, cy, gameState);
    }

    // 8. Particles, Shockwaves & Floating Energy Numbers
    particles.render(ctx);

    ctx.restore();

    // 9. HUD Upcoming Core Sensor Preview
    this.renderNextPreview(gameState);
  }

  private drawDeepSpaceBackground(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
    bgGrad.addColorStop(0, '#090e1a');
    bgGrad.addColorStop(0.55, '#04060b');
    bgGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_CONFIG.CHAMBER_WIDTH, GAME_CONFIG.CHAMBER_HEIGHT);

    // Central gravitational lens glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 190);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
    glowGrad.addColorStop(0.6, 'rgba(129, 140, 248, 0.03)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 190, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawOrbitalCoordinates(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();

    const radii = [75, 140, 200];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (const r of radii) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.moveTo(cx - 270, cy);
    ctx.lineTo(cx + 270, cy);
    ctx.moveTo(cx, cy - 270);
    ctx.lineTo(cx, cy + 270);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    const tickCount = 12;
    for (let i = 0; i < tickCount; i++) {
      const angle = (i * Math.PI * 2) / tickCount + this.animTime * 0.03;
      const rInner = 250;
      const rOuter = 260;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
      ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawContainmentPerimeter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    gameState: GameState
  ): void {
    const r = GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS;
    const integrity = gameState.getIntegrityPercent();
    const isCritical = integrity < 35;
    const isWarning = integrity < 85;

    ctx.save();

    if (isCritical) {
      const alpha = 0.5 + Math.sin(this.animTime * 14) * 0.45;
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;
    } else if (isWarning) {
      const alpha = 0.6 + Math.sin(this.animTime * 8) * 0.35;
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.8;
    } else {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
    }

    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawCentralNucleus(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    simulation: PhysicsSimulation,
    gameState: GameState
  ): void {
    const central = simulation.getCentralEntity();
    const nr = central.radius;
    const pulse = 1 + Math.sin(this.animTime * 3.5) * 0.05;
    const isFluxReady = gameState.canTriggerFluxPulse();

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Grand Outer Ethereal Nucleus Crown Aura
    const auraGrad = ctx.createRadialGradient(0, 0, nr * 0.5, 0, 0, nr * 2.5);
    if (isFluxReady) {
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      auraGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.15)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, nr * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rotating Tech Gyro Crown Rings
    ctx.strokeStyle = isFluxReady ? 'rgba(251, 191, 36, 0.85)' : 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);

    ctx.save();
    ctx.rotate(this.animTime * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, nr + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-this.animTime * 1.8);
    ctx.beginPath();
    ctx.arc(0, 0, nr + 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Render the Central Core Chip itself (Starts at Tier 1 and grows with upgrades)
    this.renderCoreEntity(ctx, 0, 0, this.animTime * 0.3, central, 1.0);

    // 4. Central Core Emblem Crown Overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(0, 0, nr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawActiveCores(
    ctx: CanvasRenderingContext2D,
    simulation: PhysicsSimulation,
    centralCoreTier: number
  ): void {
    const bodies = simulation.getBodies();
    const entities = simulation.getEntities();

    for (const [bodyId, entity] of entities.entries()) {
      if (entity.isCentralCore) continue; // Rendered via drawCentralNucleus
      const body = bodies.get(bodyId);
      if (!body) continue;

      this.renderCoreEntity(ctx, body.position.x, body.position.y, body.angle, entity);

      // Highlight cores that match the Central Core's tier (ready to level up the central nucleus!)
      if (entity.tier === centralCoreTier) {
        this.drawNucleusMatchingBeacon(ctx, body.position.x, body.position.y, entity.radius);
      }
    }
  }

  private drawNucleusMatchingBeacon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ): void {
    ctx.save();
    const pulse = 1 + Math.sin(this.animTime * 6) * 0.08;
    const r = (radius + 4) * pulse;

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawOrbitalLauncher(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    gameState: GameState
  ): void {
    const angle = gameState.aimAngle;
    const rOrbit = GAME_CONFIG.LAUNCH_ORBIT_RADIUS;

    const lx = cx + Math.cos(angle) * rOrbit;
    const ly = cy + Math.sin(angle) * rOrbit;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle + Math.PI / 2);

    const isAlpha = gameState.currentPolarity === 1;
    const tierDef = CORE_TIERS[gameState.currentTier];

    ctx.strokeStyle = isAlpha ? 'rgba(245, 158, 11, 0.7)' : 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, tierDef.radius + 6, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, tierDef.radius + 6, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    ctx.fillStyle = isAlpha ? '#fbbf24' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-6, tierDef.radius + 12);
    ctx.lineTo(6, tierDef.radius + 12);
    ctx.lineTo(0, tierDef.radius + 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const hoverOffset = Math.sin(this.animTime * 5) * 2;
    const coreX = cx + Math.cos(angle) * (rOrbit + hoverOffset);
    const coreY = cy + Math.sin(angle) * (rOrbit + hoverOffset);

    const mockEntity: AccretionEntity = {
      id: 'aiming',
      bodyId: -1,
      tier: gameState.currentTier,
      polarity: gameState.currentPolarity,
      radius: tierDef.radius,
      createdAt: 0,
      isMerging: false,
      spawnTime: 0,
      renderRotation: 0,
      isCentralCore: false
    };

    this.renderCoreEntity(ctx, coreX, coreY, this.animTime * 0.5, mockEntity, 0.95);
  }

  private drawInwardTrajectory(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    simulation: PhysicsSimulation
  ): void {
    const tierDef = CORE_TIERS[gameState.currentTier];
    const points = MagneticFieldSystem.calculateInwardAimTrajectory(
      gameState.aimAngle,
      gameState.currentPolarity,
      tierDef.radius,
      simulation.getEntities(),
      simulation.getBodies()
    );

    if (points.length < 2) return;

    ctx.save();
    const isAlpha = gameState.currentPolarity === 1;
    ctx.strokeStyle = isAlpha ? 'rgba(245, 158, 11, 0.45)' : 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 6]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    const end = points[points.length - 1];
    ctx.strokeStyle = isAlpha ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(end.x, end.y, tierDef.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderCoreEntity(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    entity: AccretionEntity,
    alphaMultiplier: number = 1.0
  ): void {
    const tierDef = CORE_TIERS[entity.tier] || CORE_TIERS[1];
    const r = entity.radius;
    const isAlpha = entity.polarity === 1;

    const baseColor = isAlpha ? tierDef.colorBaseAlpha : tierDef.colorBaseBeta;
    const glowColor = isAlpha ? tierDef.glowColorAlpha : tierDef.glowColorBeta;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alphaMultiplier;

    // 1. Atmospheric Glow
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.4);
    glowGrad.addColorStop(0, glowColor);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Glassmorphic Body
    const bodyGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.3, baseColor);
    bodyGrad.addColorStop(0.85, isAlpha ? '#78350f' : '#0e3b5e');
    bodyGrad.addColorStop(1, '#020617');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Delicate Concentric Orbital Ring
    const spinDir = isAlpha ? 1 : -1;
    const ringAngle = this.animTime * 1.8 * spinDir;

    ctx.save();
    ctx.rotate(ringAngle);
    ctx.strokeStyle = isAlpha ? 'rgba(254, 240, 138, 0.75)' : 'rgba(165, 243, 252, 0.75)';
    ctx.lineWidth = Math.max(1.0, r * 0.05);

    ctx.setLineDash([r * 0.35, r * 0.25]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    if (entity.tier >= 3) {
      const nodeCount = entity.tier >= 6 ? 4 : 3;
      const innerR = r * 0.52;
      const nodeDotR = Math.max(1.5, r * 0.04);
      for (let k = 0; k < nodeCount; k++) {
        const na = (k * Math.PI * 2) / nodeCount;
        ctx.beginPath();
        ctx.arc(Math.cos(na) * innerR, Math.sin(na) * innerR, nodeDotR, 0, Math.PI * 2);
        ctx.fillStyle = isAlpha ? '#fde68a' : '#a5f3fc';
        ctx.fill();
      }
    }

    ctx.restore();

    // 4. Polarity Glyph (+ or −) in Technical Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(10, Math.floor(r * 0.5))}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(isAlpha ? '+' : '−', 0, -r * 0.06);

    // Codename Readout
    if (r >= 22) {
      ctx.font = `600 ${Math.max(7, Math.floor(r * 0.2))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isAlpha ? '#fef08a' : '#cffafe';
      ctx.fillText(tierDef.codename, 0, r * 0.46);
    }

    // 5. Precision Edge Bevel Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderNextPreview(gameState: GameState): void {
    const ctx = this.previewCtx;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, 60, 60);

    const nextTier = gameState.nextTier;
    const nextPolarity = gameState.nextPolarity;
    const tierDef = CORE_TIERS[nextTier];

    const mockEntity: AccretionEntity = {
      id: 'preview',
      bodyId: -2,
      tier: nextTier,
      polarity: nextPolarity,
      radius: Math.min(18, tierDef.radius * 0.65),
      createdAt: 0,
      isMerging: false,
      spawnTime: 0,
      renderRotation: 0,
      isCentralCore: false
    };

    this.renderCoreEntity(ctx, 30, 30, this.animTime * 0.8, mockEntity, 1.0);
    ctx.restore();
  }
}
