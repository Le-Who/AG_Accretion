import Matter from 'matter-js';
import { GAME_CONFIG } from '../config.js';
import { CORE_TIERS, MAX_TIER } from '../entities/coreTiers.js';
import { AccretionEntity, CentralCoreLevelUpEvent, MergeEvent, Polarity } from '../types.js';
import { MagneticFieldSystem } from './magneticField.js';

export interface SimulationCallbacks {
  onMerge: (event: MergeEvent) => void;
  onCentralCoreLevelUp: (event: CentralCoreLevelUpEvent) => void;
  onCollisionImpact: (
    intensity: number,
    contact?: { bodyAId: number; bodyBId: number; normalX: number; normalY: number }
  ) => void;
  onHazardStateChange: (inHazard: boolean, maxDistFromCenter: number) => void;
}

interface PendingMerge {
  entityA: AccretionEntity;
  entityB: AccretionEntity;
  bodyA: Matter.Body;
  bodyB: Matter.Body;
}

interface PendingCentralAbsorption {
  consumedEntity: AccretionEntity;
  consumedBody: Matter.Body;
}

export class PhysicsSimulation {
  private engine: Matter.Engine;
  private world: Matter.World;
  private entities = new Map<number, AccretionEntity>();
  private bodies = new Map<number, Matter.Body>();
  private pendingMerges: PendingMerge[] = [];
  private pendingCentralAbsorptions: PendingCentralAbsorption[] = [];
  private callbacks: SimulationCallbacks;

  // The Central Core Entity (starts at Tier 1)
  private centralEntity: AccretionEntity;
  private centralNucleus: Matter.Body;

  // Fixed timestep accumulator
  private accumulator = 0;
  private idCounter = 1;

  constructor(callbacks: SimulationCallbacks) {
    this.callbacks = callbacks;

    this.engine = Matter.Engine.create({
      gravity: {
        x: 0,
        y: 0,
        scale: 0.001
      },
      constraintIterations: 3,
      positionIterations: 8,
      velocityIterations: 8
    });

    this.world = this.engine.world;

    // Create Central Core Nucleus starting at Tier 1 (smallest size)
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const initialTier = 1;
    const initialRadius = CORE_TIERS[initialTier].radius;

    this.centralNucleus = Matter.Bodies.circle(cx, cy, initialRadius, {
      isStatic: true,
      friction: 0.35,
      restitution: 0.25,
      label: 'CENTRAL_NUCLEUS'
    });

    this.centralEntity = {
      id: 'central_nucleus',
      bodyId: this.centralNucleus.id,
      tier: initialTier,
      polarity: 1,
      radius: initialRadius,
      createdAt: performance.now(),
      isMerging: false,
      spawnTime: performance.now(),
      renderRotation: 0,
      isCentralCore: true
    };

    Matter.World.add(this.world, this.centralNucleus);
    this.entities.set(this.centralNucleus.id, this.centralEntity);
    this.bodies.set(this.centralNucleus.id, this.centralNucleus);

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

      const speedA = Matter.Vector.magnitude(bodyA.velocity);
      const speedB = Matter.Vector.magnitude(bodyB.velocity);
      const relSpeed = Math.abs(speedA - speedB);
      if (relSpeed > maxSpeed) maxSpeed = relSpeed;

      const entityA = this.entities.get(bodyA.id);
      const entityB = this.entities.get(bodyB.id);

      if (!entityA || !entityB) continue;

      // Check if one of the bodies is the Central Nucleus
      const isACentral = entityA.isCentralCore === true;
      const isBCentral = entityB.isCentralCore === true;

      if (isACentral || isBCentral) {
        const consumedEntity = isACentral ? entityB : entityA;
        const consumedBody = isACentral ? bodyB : bodyA;

        // When other core reaches the same tier as the central core -> Central Core absorbs it and levels up!
        if (
          consumedEntity.tier === this.centralEntity.tier &&
          this.centralEntity.tier < MAX_TIER &&
          !consumedEntity.isMerging &&
          !this.centralEntity.isMerging
        ) {
          consumedEntity.isMerging = true;
          this.centralEntity.isMerging = true;
          this.pendingCentralAbsorptions.push({
            consumedEntity,
            consumedBody
          });
        }
        continue;
      }

      // Both are regular accretion cores in the cluster
      if (entityA.tier === entityB.tier && entityA.tier < MAX_TIER) {
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
      const dx = bodyB.position.x - bodyA.position.x;
      const dy = bodyB.position.y - bodyA.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (relSpeed > 0.4) {
        this.callbacks.onCollisionImpact(Math.min(relSpeed / 5.0, 1.0), {
          bodyAId: bodyA.id,
          bodyBId: bodyB.id,
          normalX: dx / dist,
          normalY: dy / dist
        });
      }
    }
  }
}

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
      renderRotation: 0,
      isCentralCore: false
    };

    this.entities.set(body.id, entity);
    this.bodies.set(body.id, body);

    return entity;
  }

  public launchCoreInward(angleRad: number, tierNumber: number, polarity: Polarity): AccretionEntity {
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const launchDist = GAME_CONFIG.LAUNCH_ORBIT_RADIUS;

    const spawnX = cx + Math.cos(angleRad) * launchDist;
    const spawnY = cy + Math.sin(angleRad) * launchDist;

    const speed = GAME_CONFIG.LAUNCH_SPEED;
    const vx = -Math.cos(angleRad) * speed;
    const vy = -Math.sin(angleRad) * speed;

    return this.spawnCore(spawnX, spawnY, tierNumber, polarity, vx, vy);
  }

  public invertAllPolarities(): number {
    let invertedCount = 0;
    for (const entity of this.entities.values()) {
      if (!entity.isMerging && !entity.isCentralCore) {
        entity.polarity = (entity.polarity * -1) as Polarity;
        invertedCount++;
      }
    }
    // Also flip central core polarity
    this.centralEntity.polarity = (this.centralEntity.polarity * -1) as Polarity;
    return invertedCount;
  }

  public step(dtMs: number): void {
    const clampedDt = Math.min(dtMs, GAME_CONFIG.MAX_DELTA_ACCUMULATION_MS);
    this.accumulator += clampedDt;

    const fixedStep = GAME_CONFIG.FIXED_TIMESTEP_MS;
    let subSteps = 0;

    while (this.accumulator >= fixedStep && subSteps < GAME_CONFIG.MAX_SUB_STEPS) {
      // 1. Inward Central Gravity
      this.applyCentralGravity();

      // 2. Pairwise Magnetic Forces
      MagneticFieldSystem.applyMagneticForces(this.entities, this.bodies);

      // 3. Update Matter.js
      Matter.Engine.update(this.engine, fixedStep);

      // 4. Resolve Central Core Absorptions & Regular Merges
      this.resolveCentralAbsorptions();
      this.resolvePendingMerges();

      // 5. Clean up rogue bodies
      this.sanitizeBodies();

      this.accumulator -= fixedStep;
      subSteps++;
    }

    this.evaluateHazardPerimeter();
  }

  private applyCentralGravity(): void {
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const centralR = this.centralEntity.radius;

    for (const [bodyId, body] of this.bodies.entries()) {
      const entity = this.entities.get(bodyId);
      if (!entity || entity.isMerging || entity.isCentralCore) continue;

      const dx = cx - body.position.x;
      const dy = cy - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < centralR * 0.5) continue;

      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      const pull = GAME_CONFIG.CENTRAL_GRAVITY_COEFF * body.mass * (1 + 40 / Math.max(centralR, dist));
      Matter.Body.applyForce(body, body.position, {
        x: nx * pull,
        y: ny * pull
      });

      Matter.Body.setVelocity(body, {
        x: body.velocity.x * GAME_CONFIG.CENTRAL_DAMPING,
        y: body.velocity.y * GAME_CONFIG.CENTRAL_DAMPING
      });
    }
  }

  /**
   * Resolves absorption of a matching-tier core by the Central Nucleus, leveling up the Nucleus!
   */
  private resolveCentralAbsorptions(): void {
    if (this.pendingCentralAbsorptions.length === 0) return;

    const batch = [...this.pendingCentralAbsorptions];
    this.pendingCentralAbsorptions = [];

    for (const item of batch) {
      const { consumedEntity, consumedBody } = item;

      if (!this.entities.has(consumedBody.id)) continue;

      const previousTier = this.centralEntity.tier;
      const newTier = previousTier + 1;
      const newRadius = CORE_TIERS[newTier]?.radius || this.centralEntity.radius;

      const fusionType: 'RESONANT' | 'FORCED' =
        consumedEntity.polarity !== this.centralEntity.polarity ? 'RESONANT' : 'FORCED';

      // Remove consumed body from world
      Matter.World.remove(this.world, consumedBody);
      this.entities.delete(consumedBody.id);
      this.bodies.delete(consumedBody.id);

      // Upgrade Central Core Entity
      this.centralEntity.tier = newTier;
      this.centralEntity.radius = newRadius;
      this.centralEntity.isMerging = false;

      // Recreate central static body with the new radius at center
      const cx = GAME_CONFIG.CENTER_X;
      const cy = GAME_CONFIG.CENTER_Y;

      Matter.World.remove(this.world, this.centralNucleus);
      this.entities.delete(this.centralNucleus.id);
      this.bodies.delete(this.centralNucleus.id);

      this.centralNucleus = Matter.Bodies.circle(cx, cy, newRadius, {
        isStatic: true,
        friction: 0.35,
        restitution: 0.25,
        label: 'CENTRAL_NUCLEUS'
      });

      this.centralEntity.bodyId = this.centralNucleus.id;
      Matter.World.add(this.world, this.centralNucleus);
      this.entities.set(this.centralNucleus.id, this.centralEntity);
      this.bodies.set(this.centralNucleus.id, this.centralNucleus);

      // Gently push surrounding bodies outward so they don't overlap with the newly expanded nucleus
      this.repelBodiesFromExpandedNucleus(cx, cy, newRadius);

      // Shockwave
      if (fusionType === 'RESONANT') {
        this.applyImplosionShockwave(cx, cy, 220);
      } else {
        this.applyExplosionShockwave(cx, cy, 100);
      }

      const tierDef = CORE_TIERS[newTier] || CORE_TIERS[MAX_TIER];
      const scoreGained = Math.round(
        tierDef.scoreValue * 2.0 * (fusionType === 'RESONANT' ? GAME_CONFIG.RESONANT_SCORE_MULTIPLIER : 1.0)
      );

      this.callbacks.onCentralCoreLevelUp({
        previousTier,
        newTier,
        fusionType,
        consumedEntity,
        scoreGained
      });
    }
  }

  private repelBodiesFromExpandedNucleus(cx: number, cy: number, nucleusRadius: number): void {
    for (const [bodyId, body] of this.bodies.entries()) {
      if (bodyId === this.centralNucleus.id) continue;
      const entity = this.entities.get(bodyId);
      if (!entity) continue;

      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minSafeDist = nucleusRadius + entity.radius + 3;

      if (dist < minSafeDist) {
        const nx = dist > 0.01 ? dx / dist : Math.cos(Math.random() * Math.PI * 2);
        const ny = dist > 0.01 ? dy / dist : Math.sin(Math.random() * Math.PI * 2);

        Matter.Body.setPosition(body, {
          x: cx + nx * minSafeDist,
          y: cy + ny * minSafeDist
        });
        Matter.Body.setVelocity(body, {
          x: nx * 1.5,
          y: ny * 1.5
        });
      }
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

      Matter.World.remove(this.world, bodyA);
      Matter.World.remove(this.world, bodyB);
      this.entities.delete(bodyA.id);
      this.entities.delete(bodyB.id);
      this.bodies.delete(bodyA.id);
      this.bodies.delete(bodyB.id);

      const newEntity = this.spawnCore(midX, midY, nextTier, nextPolarity);
      const newBody = this.bodies.get(newEntity.bodyId);
      if (newBody) {
        Matter.Body.setVelocity(newBody, { x: avgVx, y: avgVy });
      }

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
      if (bodyId === this.centralNucleus.id) continue;
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
      if (bodyId === this.centralNucleus.id) continue;
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
      if (bodyId === this.centralNucleus.id) continue;
      if (isNaN(body.position.x) || isNaN(body.position.y)) {
        Matter.World.remove(this.world, body);
        this.bodies.delete(bodyId);
        this.entities.delete(bodyId);
        continue;
      }

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

  private evaluateHazardPerimeter(): void {
    let inHazard = false;
    let maxDist = 0;
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    for (const [bodyId, body] of this.bodies.entries()) {
      if (bodyId === this.centralNucleus.id) continue;
      const entity = this.entities.get(bodyId);
      if (!entity) continue;

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

  public getCentralEntity(): AccretionEntity {
    return this.centralEntity;
  }

  public reset(): void {
    this.pendingMerges = [];
    this.pendingCentralAbsorptions = [];

    // Remove all regular bodies
    for (const [bodyId, body] of this.bodies.entries()) {
      if (bodyId !== this.centralNucleus.id) {
        Matter.World.remove(this.world, body);
      }
    }

    this.entities.clear();
    this.bodies.clear();

    // Reset Central Core to Tier 1
    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;
    const initialTier = 1;
    const initialRadius = CORE_TIERS[initialTier].radius;

    Matter.World.remove(this.world, this.centralNucleus);
    this.centralNucleus = Matter.Bodies.circle(cx, cy, initialRadius, {
      isStatic: true,
      friction: 0.35,
      restitution: 0.25,
      label: 'CENTRAL_NUCLEUS'
    });

    this.centralEntity = {
      id: 'central_nucleus',
      bodyId: this.centralNucleus.id,
      tier: initialTier,
      polarity: 1,
      radius: initialRadius,
      createdAt: performance.now(),
      isMerging: false,
      spawnTime: performance.now(),
      renderRotation: 0,
      isCentralCore: true
    };

    Matter.World.add(this.world, this.centralNucleus);
    this.entities.set(this.centralNucleus.id, this.centralEntity);
    this.bodies.set(this.centralNucleus.id, this.centralNucleus);

    this.accumulator = 0;
  }
}
