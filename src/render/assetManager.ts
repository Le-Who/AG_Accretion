import { Polarity } from '../types.js';
import { ProceduralSlimeRenderer, SlimeExpression } from './proceduralSlimeRenderer.js';

export class AssetManager {
  private static instance: AssetManager;
  private spriteCache = new Map<string, HTMLImageElement>();
  private loadedKeys = new Set<string>();

  private constructor() {
    this.preloadKnownSprites();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private preloadKnownSprites(): void {
    const assets = [
      { key: 'queen', url: '/assets/slimes/queen_slime.png' },
      { key: 'tier_1', url: '/assets/slimes/tier_1.png' },
      { key: 'tier_2', url: '/assets/slimes/tier_2.png' }
    ];

    for (const item of assets) {
      const img = new Image();
      img.src = item.url;
      img.onload = () => {
        this.spriteCache.set(item.key, img);
        this.loadedKeys.add(item.key);
      };
      img.onerror = () => {
        // Silently use procedural fallback
      };
    }
  }

  public hasSprite(key: string): boolean {
    return this.loadedKeys.has(key);
  }

  public getSprite(key: string): HTMLImageElement | undefined {
    return this.spriteCache.get(key);
  }

  /**
   * Renders either the pre-rendered extracted 3D sprite or the high-fidelity procedural 3D slime.
   */
  public renderSlime(
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
    const spriteKey = isQueen ? 'queen' : `tier_${tierNumber}`;
    const sprite = this.spriteCache.get(spriteKey);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(expression.rotation);
      ctx.scale(expression.squishScaleX, expression.squishScaleY);

      // Draw subtle glow
      const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.3);
      glowGrad.addColorStop(0, polarity === 1 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(56, 189, 248, 0.4)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Sprite with squish deformation
      const size = radius * 2.2;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      // High-fidelity procedural 3D jelly fallback
      ProceduralSlimeRenderer.renderSlime(
        ctx,
        x,
        y,
        radius,
        tierNumber,
        polarity,
        expression,
        isQueen,
        animTime
      );
    }
  }
}
