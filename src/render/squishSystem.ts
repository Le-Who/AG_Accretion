import { JellyMesh } from './jellyMesh.js';
import { SlimeExpression } from './proceduralSlimeRenderer.js';
import { AccretionEntity } from '../types.js';

interface SlimeState {
  mesh: JellyMesh;
  blinkTimer: number;
  blinkDuration: number;
  isBlinking: boolean;
  mouthOpen: boolean;
}

export class SquishSystem {
  private slimes = new Map<number, SlimeState>();
  private queenMesh: JellyMesh;
  private queenState: SlimeState;

  constructor(initialQueenRadius: number = 18) {
    this.queenMesh = new JellyMesh(initialQueenRadius);
    this.queenState = {
      mesh: this.queenMesh,
      blinkTimer: 2.0,
      blinkDuration: 0.18,
      isBlinking: false,
      mouthOpen: false
    };
  }

  public getOrCreateMesh(bodyId: number, radius: number): JellyMesh {
    let state = this.slimes.get(bodyId);
    if (!state) {
      const mesh = new JellyMesh(radius);
      state = {
        mesh,
        blinkTimer: 1.5 + Math.random() * 3.5,
        blinkDuration: 0.18,
        isBlinking: false,
        mouthOpen: false
      };
      this.slimes.set(bodyId, state);
    }
    return state.mesh;
  }

  public getQueenMesh(): JellyMesh {
    return this.queenMesh;
  }

  public updateQueenRadius(radius: number): void {
    this.queenMesh.setBaseRadius(radius);
  }

  public onCollisionImpact(
    bodyAId: number,
    bodyBId: number,
    contactNormal: { x: number; y: number },
    intensity: number
  ): void {
    const angleA = Math.atan2(contactNormal.y, contactNormal.x);
    const angleB = Math.atan2(-contactNormal.y, -contactNormal.x);

    const stateA = this.slimes.get(bodyAId) || (bodyAId === -1 ? this.queenState : undefined);
    const stateB = this.slimes.get(bodyBId) || (bodyBId === -1 ? this.queenState : undefined);

    if (stateA) {
      stateA.mesh.applyImpact(angleA, intensity);
    }
    if (stateB) {
      stateB.mesh.applyImpact(angleB, intensity);
    }
  }

  public triggerQueenImpact(angle: number, intensity: number): void {
    this.queenMesh.applyImpact(angle, intensity);
  }

  public step(
    dtSeconds: number,
    entities: Map<number, AccretionEntity>,
    centralEntity: AccretionEntity,
    bodies: Map<number, Matter.Body>
  ): void {
    // 1. Remove stale bodies
    for (const bodyId of this.slimes.keys()) {
      if (!entities.has(bodyId)) {
        this.slimes.delete(bodyId);
      }
    }

    // 2. Step Queen Mesh & Blinking
    this.queenMesh.step(dtSeconds);
    this.updateBlink(this.queenState, dtSeconds);

    // 3. Evaluate Queen anticipation
    const queenR = centralEntity.radius;
    let matchingNearby = false;

    // 4. Step active slimes
    for (const [bodyId, entity] of entities.entries()) {
      if (entity.isCentralCore) continue;
      const state = this.slimes.get(bodyId) || {
        mesh: this.getOrCreateMesh(bodyId, entity.radius),
        blinkTimer: 2.0,
        blinkDuration: 0.18,
        isBlinking: false,
        mouthOpen: false
      };

      state.mesh.step(dtSeconds);
      this.updateBlink(state, dtSeconds);

      // Check distance to center (320, 320)
      const body = bodies.get(bodyId);
      if (body) {
        const dx = body.position.x - 320;
        const dy = body.position.y - 320;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If matching tier and close, Queen gets happy mouth!
        if (entity.tier === centralEntity.tier && dist < queenR + entity.radius + 120) {
          matchingNearby = true;
          state.mouthOpen = true; // Slime is also excited to merge with the Queen!
        } else {
          state.mouthOpen = false;
        }
      }
    }

    this.queenState.mouthOpen = matchingNearby;
  }

  private updateBlink(state: SlimeState, dtSeconds: number): void {
    state.blinkTimer -= dtSeconds;
    if (state.blinkTimer <= 0) {
      if (!state.isBlinking) {
        state.isBlinking = true;
        state.blinkTimer = state.blinkDuration;
      } else {
        state.isBlinking = false;
        state.blinkTimer = 2.5 + Math.random() * 4.0;
      }
    }
  }

  public getExpression(bodyId: number): SlimeExpression {
    const state = this.slimes.get(bodyId);
    if (!state) {
      return {
        blinkProgress: 0,
        mouthOpen: false,
        squishScaleX: 1,
        squishScaleY: 1,
        rotation: 0
      };
    }

    return {
      blinkProgress: state.isBlinking ? 1 : 0,
      mouthOpen: state.mouthOpen,
      squishScaleX: 1,
      squishScaleY: 1,
      rotation: 0
    };
  }

  public getQueenExpression(): SlimeExpression {
    return {
      blinkProgress: this.queenState.isBlinking ? 1 : 0,
      mouthOpen: this.queenState.mouthOpen,
      squishScaleX: 1,
      squishScaleY: 1,
      rotation: 0
    };
  }

  public reset(): void {
    this.slimes.clear();
    this.queenState.isBlinking = false;
    this.queenState.mouthOpen = false;
    this.queenState.blinkTimer = 2.0;
  }
}
