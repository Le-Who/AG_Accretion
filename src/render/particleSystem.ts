import { Particle } from '../types.js';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private readonly MAX_PARTICLES = 280;

  public update(dtMs: number): void {
    const dt = dtMs / 16.666;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtMs;
      
      if (p.type === 'IMPLODE' && p.targetX !== undefined && p.targetY !== undefined) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.x += dx * 0.18 * dt;
        p.y += dy * 0.18 * dt;
        p.radius *= 0.94;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.alpha <= 0.01) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dtMs;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife || ft.alpha <= 0.01) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public emitMerge(x: number, y: number, color: string, isResonant: boolean): void {
    const count = isResonant ? 40 : 22;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.MAX_PARTICLES) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = isResonant ? (2.5 + Math.random() * 5.0) : (1.5 + Math.random() * 3.5);

      if (isResonant && i < 16) {
        // Rainbow Confetti
        const confettiColors = ['#ff3b77', '#ff8800', '#ffd000', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];
        const confettiColor = confettiColors[i % confettiColors.length];
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed * 1.3,
          vy: Math.sin(angle) * speed * 1.3 - 2.0, // Initial pop upwards
          radius: 3.5 + Math.random() * 3.0,
          color: confettiColor,
          alpha: 1.0,
          decay: 0.015,
          life: 0,
          maxLife: 600 + Math.random() * 400,
          type: 'SPARK'
        });
      } else {
        // Radiating sweet sparks
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.0 + Math.random() * 2.8,
          color,
          alpha: 1.0,
          decay: 0.02,
          life: 0,
          maxLife: 400 + Math.random() * 300,
          type: 'SPARK'
        });
      }
    }

    // Ring shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 8,
      color,
      alpha: 0.9,
      decay: 0.03,
      life: 0,
      maxLife: 420,
      type: 'RING'
    });
  }

  public emitHearts(x: number, y: number): void {
    const heartColors = ['#ff3b77', '#ff70a6', '#f43f5e', '#fb7185', '#ffd700'];
    for (let i = 0; i < 24; i++) {
      if (this.particles.length >= this.MAX_PARTICLES) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 2.0 + Math.random() * 4.0;
      const color = heartColors[i % heartColors.length];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5 + Math.random() * 3.0,
        color,
        alpha: 1.0,
        decay: 0.015,
        life: 0,
        maxLife: 700 + Math.random() * 400,
        type: 'SPARK'
      });
    }
  }

  public emitFluxPulseWave(cx: number, cy: number): void {
    for (let r = 20; r <= 80; r += 25) {
      this.particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: r,
        color: '#38bdf8',
        alpha: 0.85,
        decay: 0.02,
        life: 0,
        maxLife: 600,
        type: 'RING'
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#fbbf24'): void {
    if (this.floatingTexts.length >= 20) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.4,
      life: 0,
      maxLife: 900
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Render Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'RING') {
        const currentRadius = p.radius + (p.life / p.maxLife) * 110;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 4 * (1 - p.life / p.maxLife));
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render Floating Texts
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
    this.floatingTexts = [];
  }
}
