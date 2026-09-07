import Matter from 'matter-js';
import { GAME_CONFIG } from '../config.js';
import { CORE_TIERS, MAX_TIER } from '../entities/coreTiers.js';
import { AccretionEntity, CentralCoreLevelUpEvent, MergeEvent, Polarity } from '../types.js';
import { MagneticFieldSystem } from './magneticField.js';

export interface SimulationCallbacks {
  onAscension?: () => void;
  onMerge: (event: MergeEvent) => void;
  onCentralCoreLevelUp: (event: CentralCoreLevelUpEvent) => void;
  onCollisionImpact: (
    intensity: number,
    contact?: { bodyAId: number; bodyBId: number; normalX: number; normalY: number }
  ) => void;
  onHazardStateChange: (inHazard: boolean, maxDistFromCenter: number) => void;
}

interface PendingMerge {
  ascension?: boolean;
  pairBloom?: boolean;
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
  private previousPoses = new Map<number, { x: number; y: number; angle: number }>();

  /** Rendering only: physics remains at its fixed 60Hz step and original speed. */
  public getRenderPose(bodyId: number): { x: number; y: number; angle: number } | undefined {
    const body = this.bodies.get(bodyId);
    if (!body) return undefined;
    const previous = this.previousPoses.get(bodyId);
    if (!previous || Math.hypot(body.position.x - previous.x, body.position.y - previous.y) > 80) {
      return { ...body.position, angle: body.angle };
    }
    const alpha = Math.min(1, this.accumulator / GAME_CONFIG.FIXED_TIMESTEP_MS);
    return { x: previous.x + (body.position.x - previous.x) * alpha, y: previous.y + (body.position.y - previous.y) * alpha, angle: previous.angle + (body.angle - previous.angle) * alpha };
  }
  private bloomPairs: Array<{ merge: PendingMerge; fromA: Matter.Vector; fromB: Matter.Vector; target: Matter.Vector; elapsed: number }> = [];
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

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      const relSpeed = Matter.Vector.magnitude(Matter.Vector.sub(bodyA.velocity, bodyB.velocity));

      const entityA = this.entities.get(bodyA.id);
      const entityB = this.entities.get(bodyB.id);

      if (!entityA || !entityB) continue;
      if (!entityA.isMerging && !entityB.isMerging && relSpeed > .4) {
        const dx = bodyB.position.x - bodyA.position.x;
        const dy = bodyB.position.y - bodyA.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.callbacks.onCollisionImpact(Math.min(relSpeed / 5, 1), {
          bodyAId: entityA.isCentralCore ? -1 : bodyA.id,
          bodyBId: entityB.isCentralCore ? -1 : bodyB.id,
          normalX: dx / dist,
          normalY: dy / dist
        });
      }

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
    for (const e of this.entities.values()) e.bloomOrigin = false;
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

  public getPairBloomCount(): number {
    if (this.bloomPairs.length) return 0;
    const counts = new Map<number, number>();
    for (const e of this.entities.values()) {
      if (!e.isCentralCore && !e.isMerging && e.tier < MAX_TIER) counts.set(e.tier, (counts.get(e.tier) || 0) + 1);
    }
    const titan = this.centralEntity.tier === MAX_TIER && [...this.entities.values()].some(e => !e.isCentralCore && !e.isMerging && e.tier === MAX_TIER);
    return [...counts.values()].reduce((sum, n) => sum + Math.floor(n / 2), 0) + (titan ? 1 : 0);
  }

  public isBloomActive(): boolean { return this.bloomPairs.length > 0; }

  private safeBloomTarget(radius: number, preferred: Matter.Vector, excluded: Set<number>): Matter.Vector | null {
    const min = this.centralEntity.radius + radius + 6;
    const max = GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS - radius - 12;
    const angle = Math.atan2(preferred.y - GAME_CONFIG.CENTER_Y, preferred.x - GAME_CONFIG.CENTER_X);
    const obstacles = [...this.entities.values()].filter(e => !excluded.has(e.bodyId) && !e.isCentralCore && !e.isMerging);
    const valid = (p: Matter.Vector) => obstacles.every(e => {
      const b = this.bodies.get(e.bodyId)!;
      return Math.hypot(p.x - b.position.x, p.y - b.position.y) >= radius + e.radius + 4;
    }) && this.bloomPairs.every(pair => pair.merge.ascension || Math.hypot(p.x - pair.target.x, p.y - pair.target.y) >= radius + CORE_TIERS[pair.merge.entityA.tier + 1].radius + 4);
    for (let r = min; r <= max; r += 6) {
      for (let i = 0; i < 96; i++) {
        const a = angle + Math.ceil(i / 2) * (i % 2 ? 1 : -1) * Math.PI / 48;
        const p = { x: GAME_CONFIG.CENTER_X + Math.cos(a) * r, y: GAME_CONFIG.CENTER_Y + Math.sin(a) * r };
        if (valid(p)) return p;
      }
    }
    return null;
  }

  public startPairBloom(): number {
    if (this.bloomPairs.length) return 0;
    if (this.centralEntity.tier === MAX_TIER) {
      const titan = [...this.entities.values()].find(e => !e.isCentralCore && !e.isMerging && e.tier === MAX_TIER);
      if (titan) {
        const body = this.bodies.get(titan.bodyId)!;
        titan.isMerging = true;
        this.bloomPairs.push({merge:{entityA:titan,entityB:this.centralEntity,bodyA:body,bodyB:this.centralNucleus,pairBloom:true,ascension:true},fromA:{...body.position},fromB:{...this.centralNucleus.position},target:{...this.centralNucleus.position},elapsed:0});
      }
    }
    const candidates = [...this.entities.values()].filter(e => !e.isCentralCore && !e.isMerging && e.tier < MAX_TIER);
    for (const a of candidates) {
      if (a.isMerging) continue;
      const bodyA = this.bodies.get(a.bodyId)!;
      const b = candidates.filter(e => e !== a && !e.isMerging && e.tier === a.tier)
        .sort((u, v) => Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.bodies.get(u.bodyId)!.position, bodyA.position)) - Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.bodies.get(v.bodyId)!.position, bodyA.position)))[0];
      if (!b) continue;
      const bodyB = this.bodies.get(b.bodyId)!;
      const target = this.safeBloomTarget(CORE_TIERS[a.tier + 1].radius, {x:(bodyA.position.x + bodyB.position.x)/2,y:(bodyA.position.y + bodyB.position.y)/2}, new Set([a.bodyId,b.bodyId]));
      if (!target) continue; // Leave this pair playable; retry on a later activation.
      a.isMerging = b.isMerging = true;
      bodyA.isSensor = bodyB.isSensor = true;
      Matter.Body.setStatic(bodyA, true);
      Matter.Body.setStatic(bodyB, true);
      this.bloomPairs.push({ merge: { entityA: a, entityB: b, bodyA, bodyB, pairBloom: true }, fromA: { ...bodyA.position }, fromB: { ...bodyB.position }, target, elapsed: 0 });
    }
    return this.bloomPairs.length;
  }

  private advancePairBloom(dt: number): void {
    this.bloomPairs = this.bloomPairs.filter(pair => {
      pair.elapsed += dt;
      const t = Math.min(1, (pair.elapsed + 1e-6) / 650);
      const ease = t * t * (3 - 2 * t);
      for (const [body, from] of [[pair.merge.bodyA, pair.fromA], [pair.merge.bodyB, pair.fromB]] as const) {
        Matter.Body.setPosition(body, { x: from.x + (pair.target.x - from.x) * ease, y: from.y + (pair.target.y - from.y) * ease });
      }
      if (t < 1) return true;
      this.pendingMerges.push(pair.merge);
      return false;
    });
  }

  public step(dtMs: number): void {
    const clampedDt = Math.min(dtMs, GAME_CONFIG.MAX_DELTA_ACCUMULATION_MS);
    this.accumulator += clampedDt;

    const fixedStep = GAME_CONFIG.FIXED_TIMESTEP_MS;
    let subSteps = 0;

    while (this.accumulator >= fixedStep && subSteps < GAME_CONFIG.MAX_SUB_STEPS) {
      for (const [id, body] of this.bodies) {
        const pose = this.previousPoses.get(id);
        if (pose) { pose.x = body.position.x; pose.y = body.position.y; pose.angle = body.angle; }
        else this.previousPoses.set(id, { ...body.position, angle: body.angle });
      }
      if (this.isBloomActive()) {
        // Atomic 650ms resolution: bystanders cannot drift into reserved landing sites.
        this.advancePairBloom(fixedStep);
        this.resolvePendingMerges();
        this.accumulator -= fixedStep;
        subSteps++;
        continue;
      }
      // 1. Inward Central Gravity
      this.applyCentralGravity();

      // 2. Pairwise Magnetic Forces
      MagneticFieldSystem.applyMagneticForces(this.entities, this.bodies);

      // 3. Update Matter.js
      Matter.Engine.update(this.engine, fixedStep);
      this.advancePairBloom(fixedStep);

      // 4. Resolve Central Core Absorptions & Regular Merges
      this.resolveCentralAbsorptions();
      this.resolvePendingMerges();

      // 5. Clean up rogue bodies
      this.sanitizeBodies();

      this.accumulator -= fixedStep;
      subSteps++;
    }

    this.evaluateHazardPerimeter();
    for (const id of this.previousPoses.keys()) if (!this.bodies.has(id)) this.previousPoses.delete(id);
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

      // Bloom descendants remain visual-only until the next player launch.
      if (consumedEntity.bloomOrigin) {
        // No secondary shove from an automatic Queen evolution.
      } else if (fusionType === 'RESONANT') {
        this.applyImplosionShockwave(cx, cy, 220);
      } else {
        this.applyExplosionShockwave(cx, cy, 100);
      }

      const tierDef = CORE_TIERS[newTier] || CORE_TIERS[MAX_TIER];
      const scoreGained = Math.round(
        tierDef.scoreValue * 2.0 * (fusionType === 'RESONANT' ? GAME_CONFIG.RESONANT_SCORE_MULTIPLIER : 1.0)
      );

      this.callbacks.onCentralCoreLevelUp({
        pairBloom: consumedEntity.bloomOrigin,
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
      if (merge.ascension) {
        Matter.World.remove(this.world, bodyA);
        this.entities.delete(bodyA.id); this.bodies.delete(bodyA.id);
        this.callbacks.onAscension?.();
        continue;
      }
      merge.pairBloom ||= entityA.bloomOrigin || entityB.bloomOrigin;

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
      newEntity.mergeBorn = true;
      newEntity.bloomOrigin = merge.pairBloom;
      const newBody = this.bodies.get(newEntity.bodyId);
      if (newBody) {
        Matter.Body.setVelocity(newBody, { x: avgVx, y: avgVy });
      }

      if (merge.pairBloom) {
        // Confetti is visual only; no kick into neighbouring stacks.
      } else if (fusionType === 'RESONANT') {
        this.applyImplosionShockwave(midX, midY, 190);
      } else {
        this.applyExplosionShockwave(midX, midY, 80);
      }

      const tierDef = CORE_TIERS[nextTier] || CORE_TIERS[MAX_TIER];
      const scoreGained = tierDef.scoreValue * (fusionType === 'RESONANT' ? GAME_CONFIG.RESONANT_SCORE_MULTIPLIER : 1.0);

      this.callbacks.onMerge({
        pairBloom: merge.pairBloom,
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
      if (!entity || entity.isMerging) continue;

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
    this.previousPoses.clear();
    this.bloomPairs = [];
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
