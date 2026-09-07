/**
 * Mathematical 2.5D Jelly Mesh with Harmonic Spring Vertices and Volume Preservation.
 */
export class JellyMesh {
  public static readonly VERTEX_COUNT = 12;
  private baseRadius: number;
  private displacements: Float32Array;
  private velocities: Float32Array;
  private angles: Float32Array;

  // Spring & Surface Tension constants
  private omega = 18.0;         // Natural oscillation frequency
  private damping = 0.30;       // Damping ratio
  private surfaceTension = 14.0; // Coupling with adjacent vertices

  constructor(baseRadius: number) {
    this.baseRadius = baseRadius;
    const n = JellyMesh.VERTEX_COUNT;
    this.displacements = new Float32Array(n);
    this.velocities = new Float32Array(n);
    this.angles = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      this.angles[i] = (i / n) * Math.PI * 2;
    }
  }

  public setBaseRadius(newRadius: number): void {
    this.baseRadius = newRadius;
  }

  public getBaseRadius(): number {
    return this.baseRadius;
  }

  /**
   * Applies an impact impulse along impactAngle, causing local indentation
   * and perpendicular volume-preserving bulge.
   */
  public applyImpact(impactAngle: number, intensity: number): void {
    const n = JellyMesh.VERTEX_COUNT;
    const clampedIntensity = Math.min(22, Math.max(0.5, intensity));

    for (let i = 0; i < n; i++) {
      const diff = this.angles[i] - impactAngle;
      const cosVal = Math.cos(diff);
      const sinVal = Math.sin(diff);

      // Contact indentation (only on front impact hemisphere)
      const indent = cosVal > 0 ? -clampedIntensity * cosVal * cosVal : 0;

      // Transverse volume-preserving bulge (peaks at +/- 90 degrees)
      const bulge = clampedIntensity * 0.52 * sinVal * sinVal;

      this.velocities[i] += (indent + bulge);
    }
  }

  /**
   * Integrates the harmonic oscillator and surface tension forces over dt seconds.
   */
  public step(dt: number): void {
    const n = JellyMesh.VERTEX_COUNT;
    const clampedDt = Math.min(dt, 0.05);

    // Calculate accelerations
    const omegaSq = this.omega * this.omega;
    const twoZetaOmega = 2 * this.damping * this.omega;

    for (let i = 0; i < n; i++) {
      const prev = i === 0 ? n - 1 : i - 1;
      const next = i === n - 1 ? 0 : i + 1;

      const d = this.displacements[i];
      const v = this.velocities[i];

      // Harmonic spring force + damping
      let a = -omegaSq * d - twoZetaOmega * v;

      // Surface tension coupling
      const tension = this.displacements[prev] + this.displacements[next] - 2 * d;
      a += this.surfaceTension * tension;

      this.velocities[i] += a * clampedDt;
    }

    // Update displacements with safety clamping
    const maxCompress = -this.baseRadius * 0.55;
    const maxExpand = this.baseRadius * 0.70;

    for (let i = 0; i < n; i++) {
      this.displacements[i] += this.velocities[i] * clampedDt;

      if (this.displacements[i] < maxCompress) {
        this.displacements[i] = maxCompress;
        if (this.velocities[i] < 0) this.velocities[i] = 0;
      } else if (this.displacements[i] > maxExpand) {
        this.displacements[i] = maxExpand;
        if (this.velocities[i] > 0) this.velocities[i] = 0;
      }
    }
  }

  public getRadii(): number[] {
    const n = JellyMesh.VERTEX_COUNT;
    const list: number[] = [];
    for (let i = 0; i < n; i++) {
      list.push(this.baseRadius + this.displacements[i]);
    }
    return list;
  }

  /** No allocation in the per-frame squish path. */
  public getAxisScale(): number {
    const horizontal = this.baseRadius + (this.displacements[0] + this.displacements[6]) * .5;
    const vertical = this.baseRadius + (this.displacements[3] + this.displacements[9]) * .5;
    return Math.max(.88, Math.min(1.12, Math.sqrt(horizontal / vertical)));
  }

  public getPoints(): Array<{ x: number; y: number }> {
    const n = JellyMesh.VERTEX_COUNT;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < n; i++) {
      const r = this.baseRadius + this.displacements[i];
      pts.push({
        x: Math.cos(this.angles[i]) * r,
        y: Math.sin(this.angles[i]) * r
      });
    }
    return pts;
  }

  /**
   * Draws a continuous, organic closed Bezier path on the Canvas context.
   */
  public drawContour(ctx: CanvasRenderingContext2D): void {
    const pts = this.getPoints();
    const n = pts.length;
    if (n < 3) return;

    ctx.beginPath();
    // Start at midpoint between last and first
    const midLast = {
      x: (pts[n - 1].x + pts[0].x) / 2,
      y: (pts[n - 1].y + pts[0].y) / 2
    };
    ctx.moveTo(midLast.x, midLast.y);

    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const mid = {
        x: (pts[i].x + pts[nextIdx].x) / 2,
        y: (pts[i].y + pts[nextIdx].y) / 2
      };
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y);
    }
    ctx.closePath();
  }
}
