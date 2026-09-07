import { CORE_TIERS } from '../entities/coreTiers.js';
import { Polarity } from '../types.js';

export interface SlimeExpression {
  blinkProgress: number; // 0 = open, 1 = fully closed
  mouthOpen: boolean;    // true when anticipating food/merge
  squishScaleX: number;  // horizontal deformation
  squishScaleY: number;  // vertical deformation
  rotation: number;
}

export class ProceduralSlimeRenderer {
  /**
   * Renders a 3D-styled glossy translucent jelly slime with specular highlights and cute face.
   */
  public static renderSlime(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    tierNumber: number,
    polarity: Polarity,
    expression: SlimeExpression,
    isQueen: boolean = false,
    animTime: number = 0
  ): void {
    const tier = CORE_TIERS[tierNumber] || CORE_TIERS[1];
    const isSun = polarity === 1;
    const baseColor = isSun ? tier.colorBaseAlpha : tier.colorBaseBeta;
    const glowColor = isSun ? tier.glowColorAlpha : tier.glowColorBeta;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(expression.rotation);
    ctx.scale(expression.squishScaleX, expression.squishScaleY);

    // 1. Soft Outer Jelly Aura Glow
    const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.35);
    auraGrad.addColorStop(0, glowColor);
    auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base Jelly Body with 3D Spherical Light
    // Light source offset to top-left (-radius*0.28, -radius*0.28)
    const lx = -radius * 0.28;
    const ly = -radius * 0.28;

    const bodyGrad = ctx.createRadialGradient(lx, ly, radius * 0.1, 0, 0, radius);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.22, baseColor);
    bodyGrad.addColorStop(0.78, this.darkenHex(baseColor, 0.25));
    bodyGrad.addColorStop(1.0, this.darkenHex(baseColor, 0.45));

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Subsurface Scattering Translucent Bottom Rim
    const rimGrad = ctx.createRadialGradient(0, radius * 0.4, radius * 0.3, 0, radius * 0.4, radius * 0.75);
    rimGrad.addColorStop(0, glowColor);
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Tier-Specific Cute Accessories
    this.renderAccessories(ctx, radius, tierNumber, isQueen, animTime);

    // 5. Specular Highlights (Top Gloss)
    // Large primary soft highlight
    ctx.save();
    ctx.translate(lx * 0.85, ly * 0.85);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.38, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Small sharp secondary highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(lx * 0.5, ly * 1.2, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // 6. Cute Anime Face
    this.renderFace(ctx, radius, expression, isQueen, animTime);

    // 7. Sun / Moon Polarity Particles / Emblems
    this.renderPolarityAccents(ctx, radius, isSun, animTime);

    // 8. Queen Slime Golden Royal Crown
    if (isQueen) {
      this.renderQueenCrown(ctx, radius, animTime);
    }

    ctx.restore();
  }

  private static renderFace(
    ctx: CanvasRenderingContext2D,
    radius: number,
    expression: SlimeExpression,
    _isQueen: boolean,
    _animTime: number
  ): void {
    if (radius < 12) return; // Too small for facial micro-details

    const eyeOffsetX = radius * 0.32;
    const eyeOffsetY = -radius * 0.05;
    const eyeR = Math.max(2.5, radius * 0.18);
    const blink = expression.blinkProgress;

    // Blush cheeks
    const blushOffsetX = radius * 0.52;
    const blushOffsetY = radius * 0.12;
    const blushR = radius * 0.15;

    ctx.fillStyle = 'rgba(255, 105, 180, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-blushOffsetX, blushOffsetY, blushR, blushR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(blushOffsetX, blushOffsetY, blushR, blushR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (blink > 0.8) {
      // Closed happy arc eyes (^_^)
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      ctx.lineCap = 'round';

      // Left eye arc
      ctx.beginPath();
      ctx.arc(-eyeOffsetX, eyeOffsetY + 2, eyeR * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Right eye arc
      ctx.beginPath();
      ctx.arc(eyeOffsetX, eyeOffsetY + 2, eyeR * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      // Big sparkling open eyes
      const eyeH = eyeR * (1 - blink * 0.7);

      // Left eye
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeR, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeR, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye catchlights (double sparkle)
      ctx.fillStyle = '#ffffff';
      // Left eye highlights
      ctx.beginPath();
      ctx.arc(-eyeOffsetX - eyeR * 0.25, eyeOffsetY - eyeH * 0.25, eyeR * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-eyeOffsetX + eyeR * 0.3, eyeOffsetY + eyeH * 0.25, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Right eye highlights
      ctx.beginPath();
      ctx.arc(eyeOffsetX - eyeR * 0.25, eyeOffsetY - eyeH * 0.25, eyeR * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeOffsetX + eyeR * 0.3, eyeOffsetY + eyeH * 0.25, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = Math.max(1.2, radius * 0.05);
    ctx.lineCap = 'round';

    if (expression.mouthOpen) {
      // Big joyful open mouth (O) anticipating food!
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, radius * 0.18, radius * 0.16, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Sweet curved smile (u)
      ctx.beginPath();
      ctx.arc(0, radius * 0.12, radius * 0.13, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }

  private static renderQueenCrown(ctx: CanvasRenderingContext2D, radius: number, animTime: number): void {
    const crownW = radius * 0.72;
    const crownH = radius * 0.45;
    const crownY = -radius * 0.95;

    ctx.save();
    ctx.translate(0, crownY);

    // Subtle crown floating wobble
    const wobble = Math.sin(animTime * 4) * 0.05;
    ctx.rotate(wobble);

    // Golden Crown base
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = Math.max(1.2, radius * 0.04);

    ctx.beginPath();
    ctx.moveTo(-crownW * 0.5, 0);
    ctx.lineTo(-crownW * 0.6, -crownH * 0.8); // Left peak
    ctx.lineTo(-crownW * 0.2, -crownH * 0.4);
    ctx.lineTo(0, -crownH * 1.05);            // Center high peak
    ctx.lineTo(crownW * 0.2, -crownH * 0.4);
    ctx.lineTo(crownW * 0.6, -crownH * 0.8);  // Right peak
    ctx.lineTo(crownW * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown Jewels (Emerald, Ruby, Sapphire)
    const jewelR = Math.max(1.8, radius * 0.07);

    // Left jewel (Sapphire)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-crownW * 0.35, -crownH * 0.3, jewelR, 0, Math.PI * 2);
    ctx.fill();

    // Center jewel (Ruby)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -crownH * 0.45, jewelR * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Right jewel (Emerald)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(crownW * 0.35, -crownH * 0.3, jewelR, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sparkles on Crown peaks
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -crownH * 1.05, jewelR * 0.6, 0, Math.PI * 2);
    ctx.arc(-crownW * 0.6, -crownH * 0.8, jewelR * 0.5, 0, Math.PI * 2);
    ctx.arc(crownW * 0.6, -crownH * 0.8, jewelR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static renderAccessories(
    ctx: CanvasRenderingContext2D,
    radius: number,
    tierNumber: number,
    isQueen: boolean,
    _animTime: number
  ): void {
    if (tierNumber === 1 && !isQueen) {
      // Cherry sprout & leaf
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.15, -radius * 0.9, radius * 0.25, radius * 0.12, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (tierNumber === 2) {
      // Tangerine sprout
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.95, radius * 0.18, radius * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (tierNumber === 3) {
      // Star emblem on forehead
      ctx.fillStyle = '#fef08a';
      this.drawStar(ctx, 0, -radius * 0.45, 5, radius * 0.2, radius * 0.09);
    } else if (tierNumber === 5) {
      // Internal bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, radius * 0.2, radius * 0.12, 0, Math.PI * 2);
      ctx.arc(radius * 0.35, radius * 0.3, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (tierNumber === 10 || tierNumber === 11) {
      // Celestial planetary ring
      ctx.save();
      ctx.rotate(0.3);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
      ctx.lineWidth = Math.max(2, radius * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private static renderPolarityAccents(
    ctx: CanvasRenderingContext2D,
    radius: number,
    isSun: boolean,
    animTime: number
  ): void {
    ctx.save();
    if (isSun) {
      // Sun Sparkle: gold mini-star at top right
      ctx.fillStyle = '#fbbf24';
      const angle = animTime * 1.5;
      const sx = Math.cos(angle) * (radius * 0.85);
      const sy = Math.sin(angle) * (radius * 0.85);
      this.drawStar(ctx, sx, sy, 4, radius * 0.14, radius * 0.06);
    } else {
      // Moon Frost: diamond star at top left
      ctx.fillStyle = '#a5f3fc';
      const angle = -animTime * 1.5;
      const mx = Math.cos(angle) * (radius * 0.85);
      const my = Math.sin(angle) * (radius * 0.85);
      this.drawStar(ctx, mx, my, 4, radius * 0.14, radius * 0.06);
    }
    ctx.restore();
  }

  private static drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerR;
      let y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  }

  private static darkenHex(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) {
      color = color.split('').map(c => c + c).join('');
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) - Math.round(255 * amount);
    let g = ((num >> 8) & 0x00ff) - Math.round(255 * amount);
    let b = (num & 0x0000ff) - Math.round(255 * amount);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
