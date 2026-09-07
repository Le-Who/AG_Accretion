import Matter from 'matter-js';
import { GAME_CONFIG } from '../config.js';
import { AccretionEntity, Polarity } from '../types.js';

export class MagneticFieldSystem {
  /**
   * Applies pairwise electromagnetic forces between all active accretion cores.
   */
  public static applyMagneticForces(
    entities: Map<number, AccretionEntity>,
    bodies: Map<number, Matter.Body>
  ): void {
    if (!GAME_CONFIG.MAGNETIC_ENABLED) return;

    const entityArray = Array.from(entities.values());
    const len = entityArray.length;

    for (let i = 0; i < len; i++) {
      const eA = entityArray[i];
      if (eA.isMerging) continue;
      const bA = bodies.get(eA.bodyId);
      if (!bA) continue;

      for (let j = i + 1; j < len; j++) {
        const eB = entityArray[j];
        if (eB.isMerging) continue;
        const bB = bodies.get(eB.bodyId);
        if (!bB) continue;

        const dx = bB.position.x - bA.position.x;
        const dy = bB.position.y - bA.position.y;
        const distSq = dx * dx + dy * dy;
        const minDist = eA.radius + eB.radius;

        if (distSq <= minDist * minDist) continue;

        const maxDist = GAME_CONFIG.MAGNETIC_MAX_DISTANCE;
        if (distSq >= maxDist * maxDist) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        const falloff = 1 - dist / maxDist;
        const polarityProduct = eA.polarity * eB.polarity;
        const massFactor = Math.sqrt(bA.mass * bB.mass);
        let forceMag = GAME_CONFIG.MAGNETIC_FORCE_COEFFICIENT * massFactor * falloff;

        if (forceMag > GAME_CONFIG.MAGNETIC_MAX_IMPULSE) {
          forceMag = GAME_CONFIG.MAGNETIC_MAX_IMPULSE;
        }

        const fx = nx * forceMag * (polarityProduct > 0 ? -1 : 1);
        const fy = ny * forceMag * (polarityProduct > 0 ? -1 : 1);

        Matter.Body.applyForce(bA, bA.position, { x: fx, y: fy });
        Matter.Body.applyForce(bB, bB.position, { x: -fx, y: -fy });
      }
    }
  }

  /**
   * Projects an inward curved trajectory taking central gravity and magnetic fields into account.
   */
  public static calculateInwardAimTrajectory(
    angleRad: number,
    polarity: Polarity,
    tierRadius: number,
    entities: Map<number, AccretionEntity>,
    bodies: Map<number, Matter.Body>,
    steps: number = 24
  ): Array<{ x: number; y: number }> {
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const startX = cx + Math.cos(angleRad) * GAME_CONFIG.LAUNCH_ORBIT_RADIUS;
    const startY = cy + Math.sin(angleRad) * GAME_CONFIG.LAUNCH_ORBIT_RADIUS;

    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    let simX = startX;
    let simY = startY;
    let simVx = -Math.cos(angleRad) * GAME_CONFIG.LAUNCH_SPEED;
    let simVy = -Math.sin(angleRad) * GAME_CONFIG.LAUNCH_SPEED;
    const dt = 1.0;

    const entityArray = Array.from(entities.values());

    for (let step = 0; step < steps; step++) {
      // Central gravity pull
      const dxToCenter = cx - simX;
      const dyToCenter = cy - simY;
      const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter);

      // Stop if reached the central core
      if (distToCenter <= GAME_CONFIG.CENTRAL_CORE_RADIUS + tierRadius) {
        points.push({ x: simX, y: simY });
        break;
      }

      let totalFx = (dxToCenter / distToCenter) * (GAME_CONFIG.CENTRAL_GRAVITY_COEFF * 450);
      let totalFy = (dyToCenter / distToCenter) * (GAME_CONFIG.CENTRAL_GRAVITY_COEFF * 450);

      // Accumulate magnetic field from surrounding cluster
      for (let i = 0; i < entityArray.length; i++) {
        const targetEntity = entityArray[i];
        if (targetEntity.isMerging) continue;
        const targetBody = bodies.get(targetEntity.bodyId);
        if (!targetBody) continue;

        const dx = targetBody.position.x - simX;
        const dy = targetBody.position.y - simY;
        const distSq = dx * dx + dy * dy;
        const minDist = tierRadius + targetEntity.radius;

        // Stop prediction if trajectory impacts an existing core
        if (distSq <= minDist * minDist) {
          points.push({ x: simX, y: simY });
          return points;
        }

        const maxDist = GAME_CONFIG.MAGNETIC_MAX_DISTANCE;
        if (distSq < maxDist * maxDist) {
          const dist = Math.sqrt(distSq);
          const falloff = 1 - dist / maxDist;
          const polarityProduct = polarity * targetEntity.polarity;
          const forceMag = (GAME_CONFIG.MAGNETIC_FORCE_COEFFICIENT * 4.5) * falloff;

          totalFx += (dx / dist) * forceMag * (polarityProduct > 0 ? -1 : 1);
          totalFy += (dy / dist) * forceMag * (polarityProduct > 0 ? -1 : 1);
        }
      }

      simVx = (simVx + totalFx * dt) * 0.985;
      simVy = (simVy + totalFy * dt) * 0.985;
      simX += simVx * dt;
      simY += simVy * dt;

      points.push({ x: simX, y: simY });
    }

    return points;
  }
}
