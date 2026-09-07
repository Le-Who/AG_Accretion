import { GAME_CONFIG } from '../config.js';
import { GameState } from '../core/gameState.js';
import { CORE_TIERS } from '../entities/coreTiers.js';
import { MagneticFieldSystem } from '../physics/magneticField.js';
import { PhysicsSimulation } from '../physics/simulation.js';
import { ParticleSystem } from './particleSystem.js';
import { SquishSystem } from './squishSystem.js';
import { ProceduralSlimeRenderer } from './proceduralSlimeRenderer.js';

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private animTime: number = 0;
  private squishSystem: SquishSystem;
  private stars: Star[] = [];

  constructor(canvas: HTMLCanvasElement, previewCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas.getContext('2d')!;
    this.squishSystem = new SquishSystem(CORE_TIERS[1].radius);

    this.initStars();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 48; i++) {
      this.stars.push({
        x: Math.random() * GAME_CONFIG.CHAMBER_WIDTH,
        y: Math.random() * GAME_CONFIG.CHAMBER_HEIGHT,
        size: 1.0 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 2.0
      });
    }
  }

  public getSquishSystem(): SquishSystem {
    return this.squishSystem;
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
    this.previewCanvas.style.width = '46px';
    this.previewCanvas.style.height = '46px';
  }

  public render(
    gameState: GameState,
    simulation: PhysicsSimulation,
    particles: ParticleSystem,
    dtMs: number
  ): void {
    const dtSec = Math.min(dtMs * 0.001, 0.05);
    this.animTime += dtSec;

    // Step the 2.5D harmonic squish system
    this.squishSystem.step(
      dtSec,
      simulation.getEntities(),
      simulation.getCentralEntity(),
      simulation.getBodies()
    );

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    // 1. Cozy Starry Night Sky Background with Nebulae
    this.drawCozyStarryBackground(ctx, cx, cy);

    // 2. Soft Range Rings & Orbit Reticles
    this.drawSoftOrbitRings(ctx, cx, cy);

    // 3. Starlight Floral Containment Perimeter
    this.drawStarlightPerimeter(ctx, cx, cy, gameState);

    // 4. Inward Rainbow Aim Trajectory
    if (gameState.canLaunch()) {
      this.drawInwardRainbowTrajectory(ctx, gameState, simulation);
    }

    // 5. Active Accreted Slimes in Chamber (with 2.5D harmonic mesh)
    this.drawActiveSlimes(ctx, simulation, gameState.centralCoreTier);

    // 6. Queen Slime at Chamber Center
    this.drawQueenSlime(ctx, cx, cy, simulation, gameState);

    // 7. Aiming Slingshot at Orbital Perimeter
    if (gameState.canLaunch()) {
      this.drawOrbitalLauncher(ctx, cx, cy, gameState);
    }

    // 8. Particles, Confetti, Hearts & Score Popups
    particles.render(ctx);

    ctx.restore();

    // 9. Next Slime Sensor Preview
    this.renderNextPreview(gameState);
  }

  private drawCozyStarryBackground(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    // Deep warm cosmic sky
    const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 350);
    bgGrad.addColorStop(0, '#1c1538');
    bgGrad.addColorStop(0.5, '#120f26');
    bgGrad.addColorStop(1, '#0b0918');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_CONFIG.CHAMBER_WIDTH, GAME_CONFIG.CHAMBER_HEIGHT);

    // Soft Pastel Nebula Clouds
    const nebulaGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
    nebulaGrad.addColorStop(0, 'rgba(236, 72, 153, 0.12)'); // Rose pink
    nebulaGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)'); // Lavender
    nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling Star Field
    for (const star of this.stars) {
      const alpha = 0.35 + Math.sin(this.animTime * star.speed + star.phase) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSoftOrbitRings(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    const radii = [80, 150, 210];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.2;

    for (const r of radii) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawStarlightPerimeter(
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
      const alpha = 0.6 + Math.sin(this.animTime * 12) * 0.35;
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
    } else if (isWarning) {
      const alpha = 0.6 + Math.sin(this.animTime * 7) * 0.3;
      ctx.strokeStyle = `rgba(251, 146, 60, ${alpha})`;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 0;
    }

    // Cute dotted starlight perimeter
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Little pastel flower nodes along the perimeter
    const nodeCount = 16;
    for (let i = 0; i < nodeCount; i++) {
      const a = (i * Math.PI * 2) / nodeCount + this.animTime * 0.04;
      const nx = cx + Math.cos(a) * r;
      const ny = cy + Math.sin(a) * r;

      ctx.fillStyle = isCritical ? '#f43f5e' : (isWarning ? '#fb923c' : 'rgba(251, 207, 232, 0.7)');
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawQueenSlime(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    simulation: PhysicsSimulation,
    gameState: GameState
  ): void {
    const central = simulation.getCentralEntity();
    const nr = central.radius;
    const isFluxReady = gameState.canTriggerFluxPulse();
    const queenMesh = this.squishSystem.getQueenMesh();
    queenMesh.setBaseRadius(nr);

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Loving Heart Aura Glow
    const auraPulse = 1 + Math.sin(this.animTime * 3.5) * 0.08;
    const auraR = nr * 2.2 * auraPulse;
    const auraGrad = ctx.createRadialGradient(0, 0, nr * 0.4, 0, 0, auraR);
    if (isFluxReady) {
      auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      auraGrad.addColorStop(0.6, 'rgba(236, 72, 153, 0.25)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      auraGrad.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
      auraGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swirling Sparkle Halo Rings
    ctx.save();
    ctx.rotate(this.animTime * 0.6);
    ctx.strokeStyle = isFluxReady ? 'rgba(251, 191, 36, 0.8)' : 'rgba(244, 114, 182, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, nr + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Render the Queen Slime itself via Procedural 2.5D Slime Renderer
    const expr = this.squishSystem.getQueenExpression();
    ProceduralSlimeRenderer.renderSlime(
      ctx,
      0,
      0,
      nr,
      central.tier,
      central.polarity,
      expr,
      true,
      this.animTime
    );

    ctx.restore();
  }

  private drawActiveSlimes(
    ctx: CanvasRenderingContext2D,
    simulation: PhysicsSimulation,
    centralCoreTier: number
  ): void {
    const bodies = simulation.getBodies();
    const entities = simulation.getEntities();

    for (const [bodyId, entity] of entities.entries()) {
      if (entity.isCentralCore) continue;
      const body = bodies.get(bodyId);
      if (!body) continue;

      const expr = this.squishSystem.getExpression(bodyId);
      expr.rotation = body.angle;

      ProceduralSlimeRenderer.renderSlime(
        ctx,
        body.position.x,
        body.position.y,
        entity.radius,
        entity.tier,
        entity.polarity,
        expr,
        false,
        this.animTime
      );

      // Highlight slimes matching the Queen's tier (ready to feed the Queen!)
      if (entity.tier === centralCoreTier) {
        this.drawQueenMatchingBeacon(ctx, body.position.x, body.position.y, entity.radius);
      }
    }
  }

  private drawQueenMatchingBeacon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ): void {
    ctx.save();
    const pulse = 1 + Math.sin(this.animTime * 6) * 0.12;
    const r = (radius + 5) * pulse;

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Golden heart above the matching slime
    ctx.fillStyle = '#fbbf24';
    const hy = y - radius - 10 - Math.sin(this.animTime * 5) * 3;
    this.drawSmallHeart(ctx, x, hy, 4);

    ctx.restore();
  }

  private drawSmallHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - size, cy - size, cx - size * 2, cy + size * 0.4, cx, cy + size * 1.8);
    ctx.bezierCurveTo(cx + size * 2, cy + size * 0.4, cx + size, cy - size, cx, cy);
    ctx.fill();
  }

  private drawInwardRainbowTrajectory(
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
    const isSun = gameState.currentPolarity === 1;
    ctx.strokeStyle = isSun ? 'rgba(251, 191, 36, 0.65)' : 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 6]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Projected target circle
    const end = points[points.length - 1];
    ctx.strokeStyle = isSun ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(end.x, end.y, tierDef.radius, 0, Math.PI * 2);
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

    const isSun = gameState.currentPolarity === 1;
    const tierDef = CORE_TIERS[gameState.currentTier];

    // Slingshot guide arc
    ctx.strokeStyle = isSun ? 'rgba(251, 191, 36, 0.8)' : 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, tierDef.radius + 6, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Friendly pointing arrow
    ctx.fillStyle = isSun ? '#fbbf24' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -tierDef.radius - 12);
    ctx.lineTo(-6, -tierDef.radius - 4);
    ctx.lineTo(6, -tierDef.radius - 4);
    ctx.closePath();
    ctx.fill();

    // Draw upcoming launching slime
    ProceduralSlimeRenderer.renderSlime(
      ctx,
      0,
      0,
      tierDef.radius,
      gameState.currentTier,
      gameState.currentPolarity,
      {
        blinkProgress: 0,
        mouthOpen: false,
        squishScaleX: 1,
        squishScaleY: 1,
        rotation: 0
      },
      false,
      this.animTime
    );

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
    const previewRadius = Math.min(18, tierDef.radius * 0.65);

    ProceduralSlimeRenderer.renderSlime(
      ctx,
      30,
      30,
      previewRadius,
      nextTier,
      nextPolarity,
      {
        blinkProgress: 0,
        mouthOpen: false,
        squishScaleX: 1,
        squishScaleY: 1,
        rotation: 0
      },
      false,
      this.animTime
    );

    ctx.restore();
  }
}
