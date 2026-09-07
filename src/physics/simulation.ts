import Matter from 'matter-js';
import { GAME_CONFIG } from '../config.js';
import { CORE_TIERS, MAX_TIER } from '../entities/coreTiers.js';
import { AccretionEntity, MergeEvent, Polarity } from '../types.js';
import { MagneticFieldSystem } from './magneticField.js';

export interface SimulationCallbacks {
  onMerge: (event: MergeEvent) => void;
  onCollisionImpact: (intensity: number) => void;
  onHazardStateChange: (inHazard: boolean, maxDistFromCenter: number) => void;
}

interface PendingMerge {
  entityA: AccretionEntity;
  entityB: AccretionEntity;
  bodyA: Matter.Body;
  bodyB: Matter.Body;
}

export class PhysicsSimulation {
  private engine: Matter.Engine;
  private world: Matter.World;
  private entities = new Map<number, AccretionEntity>();
  private bodies = new Map<number, Matter.Body>();
  private pendingMerges: PendingMerge[] = [];
  private callbacks: SimulationCallbacks;

  // Central Core Nucleus (The static gravitational anchor)
  private centralNucleus: Matter.Body;

  // Fixed timestep accumulator
  private accumulator = 0;
  private idCounter = 1;

  constructor(callbacks: SimulationCallbacks) {
    this.callbacks = callbacks;

    this.engine = Matter.Engine.create({
      gravity: {
        x: 0,
        y: 0, // Zero global gravity! Replaced by radial central core gravity
        scale: 0.001
      },
      constraintIterations: 3,
      positionIterations: 8,
      velocityIterations: 8
    });

    this.world = this.engine.world;

    // Create central static nucleus anchor
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const nr = GAME_CONFIG.CENTRAL_CORE_RADIUS;

    this.centralNucleus = Matter.Bodies.circle(cx, cy, nr, {
      isStatic: true,
      friction: 0.35,
      restitution: 0.25,
      label: 'CENTRAL_NUCLEUS'
    });

    Matter.World.add(this.world, this.centralNucleus);

    // Collision listener
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.handleCollisions(event.pairs);
    });
  }

  private handleCollisions(pairs: Matter.Pair[]): void {
    let maxSpeed = 0;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Track impact kinetic energy for audio
      const speedA = Matter.Vector.magnitude(bodyA.velocity);
      const speedB = Matter.Vector.magnitude(bodyB.velocity);
      const relSpeed = Math.abs(speedA - speedB);
      if (relSpeed > maxSpeed) maxSpeed = relSpeed;

      const entityA = this.entities.get(bodyA.id);
      const entityB = this.entities.get(bodyB.id);

      if (!entityA || !entityB) continue;

      // Both are active accretion cores
      if (entityA.tier === entityB.tier && entityA.tier < MAX_TIER) {
        // Prevent double consumption
        if (!entityA.isMerging && !entityB.isMerging) {
          entityA.isMerging = true;
          entityB.isMerging = true;

          this.pendingMerges.push({
            entityA,
            entityB,
            bodyA,
            bodyB
          });
        }
      }
    }

    if (maxSpeed > 1.2) {
      this.callbacks.onCollisionImpact(Math.min(maxSpeed / 8.0, 1.0));
    }
  }

  /**
   * Spawns an accretion core at the specified position with optional velocity.
   */
  public spawnCore(
    x: number,
    y: number,
    tierNumber: number,
    polarity: Polarity,
    vx: number = 0,
    vy: number = 0
  ): AccretionEntity {
    const tierDef = CORE_TIERS[tierNumber] || CORE_TIERS[1];

    const body = Matter.Bodies.circle(x, y, tierDef.radius, {
      mass: tierDef.mass,
      restitution: tierDef.restitution,
      friction: tierDef.friction,
      frictionAir: tierDef.frictionAir,
      label: `CORE_TIER_${tierNumber}`
    });

    if (vx !== 0 || vy !== 0) {
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    }

    Matter.World.add(this.world, body);

    const entity: AccretionEntity = {
      id: `core_${this.idCounter++}_${Date.now()}`,
      bodyId: body.id,
      tier: tierNumber,
      polarity,
      radius: tierDef.radius,
      createdAt: performance.now(),
      isMerging: false,
      spawnTime: performance.now(),
      renderRotation: 0
    };

    this.entities.set(body.id, entity);
    this.bodies.set(body.id, body);

    return entity;
  }

  /**
   * Launches a core from the orbital perimeter directed toward the central core.
   */
  public launchCoreInward(angleRad: number, tierNumber: number, polarity: Polarity): AccretionEntity {
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const launchDist = GAME_CONFIG.LAUNCH_ORBIT_RADIUS;

    const spawnX = cx + Math.cos(angleRad) * launchDist;
    const spawnY = cy + Math.sin(angleRad) * launchDist;

    // Direct velocity inward toward the central core
    const speed = GAME_CONFIG.LAUNCH_SPEED;
    const vx = -Math.cos(angleRad) * speed;
    const vy = -Math.sin(angleRad) * speed;

    return this.spawnCore(spawnX, spawnY, tierNumber, polarity, vx, vy);
  }

  /**
   * Inverts the polarity of all active cores in the chamber (Signature Mechanic).
   */
  public invertAllPolarities(): number {
    let invertedCount = 0;
    for (const entity of this.entities.values()) {
      if (!entity.isMerging) {
        entity.polarity = (entity.polarity * -1) as Polarity;
        invertedCount++;
      }
    }
    return invertedCount;
  }

  /**
   * Runs the fixed-step simulation loop.
   */
  public step(dtMs: number): void {
    const clampedDt = Math.min(dtMs, GAME_CONFIG.MAX_DELTA_ACCUMULATION_MS);
    this.accumulator += clampedDt;

    const fixedStep = GAME_CONFIG.FIXED_TIMESTEP_MS;
    let subSteps = 0;

    while (this.accumulator >= fixedStep && subSteps < GAME_CONFIG.MAX_SUB_STEPS) {
      // 1. Apply Central Gravity pulling all cores toward the central core
      this.applyCentralGravity();

      // 2. Apply pairwise magnetic polarity forces
      MagneticFieldSystem.applyMagneticForces(this.entities, this.bodies);

      // 3. Step Matter.js physics engine
      Matter.Engine.update(this.engine, fixedStep);

      // 4. Process deterministic merge queue
      this.resolvePendingMerges();

      // 5. Clean up out-of-bounds or NaN bodies
      this.sanitizeBodies();

      this.accumulator -= fixedStep;
      subSteps++;
    }

    // Evaluate outer containment perimeter hazard state
    this.evaluateHazardPerimeter();
  }

  /**
   * Applies inward radial gravitational force pulling bodies toward the central core nucleus.
   */
  private applyCentralGravity(): void {
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const minR = GAME_CONFIG.CENTRAL_CORE_RADIUS;

    for (const [bodyId, body] of this.bodies.entries()) {
      const entity = this.entities.get(bodyId);
      if (!entity || entity.isMerging) continue;

      const dx = cx - body.position.x;
      const dy = cy - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minR * 0.5) continue;

      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Radial gravity with gentle distance curve
      const pull = GAME_CONFIG.CENTRAL_GRAVITY_COEFF * body.mass * (1 + 40 / Math.max(minR, dist));
      Matter.Body.applyForce(body, body.position, {
        x: nx * pull,
        y: ny * pull
      });

      // Soft damping to prevent infinite orbital slingshotting
      Matter.Body.setVelocity(body, {
        x: body.velocity.x * GAME_CONFIG.CENTRAL_DAMPING,
        y: body.velocity.y * GAME_CONFIG.CENTRAL_DAMPING
      });
    }
  }

  private resolvePendingMerges(): void {
    if (this.pendingMerges.length === 0) return;

    const currentBatch = [...this.pendingMerges];
    this.pendingMerges = [];

    for (const merge of currentBatch) {
      const { entityA, entityB, bodyA, bodyB } = merge;

      if (!this.entities.has(bodyA.id) || !this.entities.has(bodyB.id)) {
        continue;
      }

      const midX = (bodyA.position.x + bodyB.position.x) / 2;
      const midY = (bodyA.position.y + bodyB.position.y) / 2;
      const avgVx = (bodyA.velocity.x + bodyB.velocity.x) * 0.25;
      const avgVy = (bodyA.velocity.y + bodyB.velocity.y) * 0.25;

      const fusionType: 'RESONANT' | 'FORCED' = entityA.polarity !== entityB.polarity ? 'RESONANT' : 'FORCED';
      const nextTier = entityA.tier + 1;

      const nextPolarity: Polarity = fusionType === 'RESONANT'
        ? (Math.random() < 0.5 ? 1 : -1)
        : entityA.polarity;

      // Remove parent bodies
      Matter.World.remove(this.world, bodyA);
      Matter.World.remove(this.world, bodyB);
      this.entities.delete(bodyA.id);
      this.entities.delete(bodyB.id);
      this.bodies.delete(bodyA.id);
      this.bodies.delete(bodyB.id);

      // Spawn merged result core
      const newEntity = this.spawnCore(midX, midY, nextTier, nextPolarity);
      const newBody = this.bodies.get(newEntity.bodyId);
      if (newBody) {
        Matter.Body.setVelocity(newBody, { x: avgVx, y: avgVy });
      }

      // If RESONANT: inward implosive suction toward the central core!
      if (fusionType === 'RESONANT') {
        this.applyImplosionShockwave(midX, midY, 190);
      } else {
        this.applyExplosionShockwave(midX, midY, 80);
      }

      const tierDef = CORE_TIERS[nextTier] || CORE_TIERS[MAX_TIER];
      const scoreGained = tierDef.scoreValue * (fusionType === 'RESONANT' ? GAME_CONFIG.RESONANT_SCORE_MULTIPLIER : 1.0);

      this.callbacks.onMerge({
        entityA,
        entityB,
        fusionType,
        resultTier: nextTier,
        resultPolarity: nextPolarity,
        x: midX,
        y: midY,
        scoreGained: Math.round(scoreGained),
        comboMultiplier: 1.0
      });
    }
  }

  private applyImplosionShockwave(cx: number, cy: number, radius: number): void {
    const rSq = radius * radius;
    for (const [bodyId, body] of this.bodies.entries()) {
      const entity = this.entities.get(bodyId);
      if (!entity || entity.isMerging) continue;

      const dx = cx - body.position.x;
      const dy = cy - body.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 10 && distSq < rSq) {
        const dist = Math.sqrt(distSq);
        const force = 0.009 * (1 - dist / radius);
        Matter.Body.applyForce(body, body.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force
        });
      }
    }
  }

  private applyExplosionShockwave(cx: number, cy: number, radius: number): void {
    const rSq = radius * radius;
    for (const [bodyId, body] of this.bodies.entries()) {
      const entity = this.entities.get(bodyId);
      if (!entity || entity.isMerging) continue;

      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq > 5 && distSq < rSq) {
        const dist = Math.sqrt(distSq);
        const force = 0.004 * (1 - dist / radius);
        Matter.Body.applyForce(body, body.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force
        });
      }
    }
  }

  private sanitizeBodies(): void {
    const maxRadiusAllowed = GAME_CONFIG.LAUNCH_ORBIT_RADIUS + 80;
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    for (const [bodyId, body] of this.bodies.entries()) {
      if (isNaN(body.position.x) || isNaN(body.position.y)) {
        Matter.World.remove(this.world, body);
        this.bodies.delete(bodyId);
        this.entities.delete(bodyId);
        continue;
      }

      // Re-center runaway bodies that escape too far outside
      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxRadiusAllowed) {
        Matter.Body.setPosition(body, {
          x: cx + (dx / dist) * (GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS - 20),
          y: cy + (dy / dist) * (GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS - 20)
        });
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
      }
    }
  }

  /**
   * Checks if any settled core in the accretion cluster expands beyond the outer containment ring.
   */
  private evaluateHazardPerimeter(): void {
    let inHazard = false;
    let maxDist = 0;
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    for (const [bodyId, body] of this.bodies.entries()) {
      const entity = this.entities.get(bodyId);
      if (!entity) continue;

      // Allow grace time after initial launch so moving cores don't immediately trigger breach
      if (performance.now() - entity.spawnTime < 1400) continue;

      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const outerDist = Math.sqrt(dx * dx + dy * dy) + entity.radius;

      if (outerDist > maxDist) {
        maxDist = outerDist;
      }

      if (outerDist > GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS) {
        inHazard = true;
      }
    }

    this.callbacks.onHazardStateChange(inHazard, maxDist);
  }

  public getEntities(): Map<number, AccretionEntity> {
    return this.entities;
  }

  public getBodies(): Map<number, Matter.Body> {
    return this.bodies;
  }

  public getCentralNucleus(): Matter.Body {
    return this.centralNucleus;
  }

  public reset(): void {
    this.pendingMerges = [];
    for (const body of this.bodies.values()) {
      Matter.World.remove(this.world, body);
    }
    this.entities.clear();
    this.bodies.clear();
    this.accumulator = 0;
  }
}
