import { describe, it, expect, beforeEach } from 'vitest';
import { DeterministicRNG } from '../src/core/rng.js';
import { GameState } from '../src/core/gameState.js';
import { CORE_TIERS, MAX_TIER } from '../src/entities/coreTiers.js';
import { PhysicsSimulation } from '../src/physics/simulation.js';
import { GAME_CONFIG } from '../src/config.js';
import { MergeEvent } from '../src/types.js';

describe('Tier Progression & Hierarchy', () => {
  it('defines 11 distinct tiers with strictly increasing radii and masses', () => {
    expect(MAX_TIER).toBe(11);
    for (let t = 1; t <= 11; t++) {
      const def = CORE_TIERS[t];
      expect(def).toBeDefined();
      expect(def.tier).toBe(t);
      expect(def.name).toBeTruthy();
      expect(def.scoreValue).toBeGreaterThan(0);
      expect(def.audioFreq).toBeGreaterThan(0);

      if (t > 1) {
        const prev = CORE_TIERS[t - 1];
        expect(def.radius).toBeGreaterThan(prev.radius);
        expect(def.mass).toBeGreaterThan(prev.mass);
        expect(def.scoreValue).toBeGreaterThan(prev.scoreValue);
      }
    }
  });

  it('defines casual Star Slime character personalities and Queen titles', () => {
    expect(CORE_TIERS[1].name).toBe('Cherry Berry');
    expect(CORE_TIERS[2].name).toBe('Sunny Tangerine');
    expect(CORE_TIERS[3].name).toBe('Star Lemon');
    expect(CORE_TIERS[11].name).toBe('Star Titan');
    expect(CORE_TIERS[1].queenTitle).toBe('Princess Cherry');
    expect(CORE_TIERS[11].queenTitle).toBe('Galaxy Mother');
  });
});

describe('Deterministic RNG & Sequence Reproducibility', () => {
  it('generates identical sequences for identical seeds', () => {
    const rng1 = new DeterministicRNG(424242);
    const rng2 = new DeterministicRNG(424242);

    for (let i = 0; i < 50; i++) {
      expect(rng1.nextFloat()).toBe(rng2.nextFloat());
      expect(rng1.nextSpawnTier()).toBe(rng2.nextSpawnTier());
      expect(rng1.nextPolarity()).toBe(rng2.nextPolarity());
    }
  });

  it('prevents monochromatic polarity streaks greater than 3', () => {
    const rng = new DeterministicRNG(99999);
    let currentStreak = 0;
    let lastPol = 0;

    for (let i = 0; i < 200; i++) {
      const pol = rng.nextPolarity();
      expect(pol === 1 || pol === -1).toBe(true);
      if (pol === lastPol) {
        currentStreak++;
        expect(currentStreak).toBeLessThanOrEqual(3);
      } else {
        currentStreak = 1;
        lastPol = pol;
      }
    }
  });
});

describe('GameState & Scoring Logic', () => {
  let state: GameState;
  let scoreHistory: number[] = [];

  beforeEach(() => {
    scoreHistory = [];
    state = new GameState({
      onScoreChange: (score) => { scoreHistory.push(score); },
      onFluxChange: () => {},
      onIntegrityChange: () => {},
      onNextCoreChange: () => {},
      onCentralCoreChange: () => {},
      onStatusChange: () => {},
      onGameOver: () => {}
    }, 12345);
  });

  it('starts at 0 score and ready status', () => {
    expect(state.getScore()).toBe(0);
    expect(state.getStatus()).toBe('READY');
    expect(state.canLaunch()).toBe(true);
  });

  it('calculates score with resonant fusion multiplier and combo increases', () => {
    const mockMergeEvent: MergeEvent = {
      entityA: { id: '1', bodyId: 1, tier: 1, polarity: 1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
      entityB: { id: '2', bodyId: 2, tier: 1, polarity: -1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
      fusionType: 'RESONANT',
      resultTier: 2,
      resultPolarity: 1,
      x: 300,
      y: 300,
      scoreGained: 125,
      comboMultiplier: 1.0
    };

    state.handleMergeEvent(mockMergeEvent);
    expect(state.getScore()).toBe(188);
    expect(state.getFluxCharge()).toBe(GAME_CONFIG.FLUX_CHARGE_RESONANT_MERGE);
  });

  it('charges Flux Pulse to 100% and enables signature pulse', () => {
    expect(state.canTriggerFluxPulse()).toBe(false);

    for (let i = 0; i < 4; i++) {
      state.handleMergeEvent({
        entityA: { id: 'a', bodyId: 1, tier: 1, polarity: 1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
        entityB: { id: 'b', bodyId: 2, tier: 1, polarity: -1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
        fusionType: 'RESONANT',
        resultTier: 2,
        resultPolarity: 1,
        x: 300,
        y: 300,
        scoreGained: 100,
        comboMultiplier: 1.0
      });
    }

    expect(state.getFluxCharge()).toBe(100);
    expect(state.canTriggerFluxPulse()).toBe(true);

    const consumed = state.consumeFluxPulse();
    expect(consumed).toBe(true);
    expect(state.getFluxCharge()).toBe(0);
    expect(state.canTriggerFluxPulse()).toBe(false);
  });

  it('resets cleanly into a fresh state', () => {
    state.handleMergeEvent({
      entityA: { id: 'a', bodyId: 1, tier: 1, polarity: 1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
      entityB: { id: 'b', bodyId: 2, tier: 1, polarity: -1, radius: 15, createdAt: 0, isMerging: false, spawnTime: 0, renderRotation: 0 },
      fusionType: 'FORCED',
      resultTier: 2,
      resultPolarity: 1,
      x: 300,
      y: 300,
      scoreGained: 50,
      comboMultiplier: 1.0
    });

    expect(state.getScore()).toBeGreaterThan(0);
    state.reset(54321);
    expect(state.getScore()).toBe(0);
    expect(state.getStatus()).toBe('READY');
    expect(state.getIntegrityPercent()).toBe(100);
  });
});

describe('Physics Simulation & Central Core Radial Accretion', () => {
  it('creates the central nucleus anchor in the world', () => {
    const sim = new PhysicsSimulation({
      onMerge: () => {},
      onCentralCoreLevelUp: () => {},
      onCollisionImpact: () => {},
      onHazardStateChange: () => {}
    });

    const nucleus = sim.getCentralNucleus();
    expect(nucleus).toBeDefined();
    expect(nucleus.position.x).toBe(GAME_CONFIG.CENTER_X);
    expect(nucleus.position.y).toBe(GAME_CONFIG.CENTER_Y);
    expect(nucleus.isStatic).toBe(true);
  });

  it('merges two colliding identical cores into next tier without duplicate consumption', () => {
    const mergesRecorded: MergeEvent[] = [];
    const sim = new PhysicsSimulation({
      onMerge: (event) => mergesRecorded.push(event),
      onCentralCoreLevelUp: () => {},
      onCollisionImpact: () => {},
      onHazardStateChange: () => {}
    });

    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    // Spawn two Tier 1 cores touching next to the central core
    sim.spawnCore(cx - 10, cy - 60, 1, 1);
    sim.spawnCore(cx + 10, cy - 60, 1, -1);

    // Initial count: Central Core (1) + 2 spawned cores = 3
    expect(sim.getEntities().size).toBe(3);

    for (let i = 0; i < 20; i++) {
      sim.step(16.666);
    }

    expect(mergesRecorded.length).toBe(1);
    expect(mergesRecorded[0].resultTier).toBe(2);
    expect(mergesRecorded[0].fusionType).toBe('RESONANT');
    // Post-merge: Central Core (1) + 1 merged Tier 2 core = 2
    expect(sim.getEntities().size).toBe(2);

    const nonCentralEntities = Array.from(sim.getEntities().values()).filter(e => !e.isCentralCore);
    expect(nonCentralEntities.length).toBe(1);
    expect(nonCentralEntities[0].tier).toBe(2);
  });

  it('inverts all active core polarities upon singularity pulse', () => {
    const sim = new PhysicsSimulation({
      onMerge: () => {},
      onCentralCoreLevelUp: () => {},
      onCollisionImpact: () => {},
      onHazardStateChange: () => {}
    });

    sim.spawnCore(200, 300, 1, 1);
    sim.spawnCore(400, 300, 2, -1);

    const regularEntitiesBefore = Array.from(sim.getEntities().values()).filter(e => !e.isCentralCore);
    expect(regularEntitiesBefore[0].polarity).toBe(1);
    expect(regularEntitiesBefore[1].polarity).toBe(-1);

    const invertedCount = sim.invertAllPolarities();
    expect(invertedCount).toBe(2);

    const regularEntitiesAfter = Array.from(sim.getEntities().values()).filter(e => !e.isCentralCore);
    expect(regularEntitiesAfter[0].polarity).toBe(-1);
    expect(regularEntitiesAfter[1].polarity).toBe(1);
  });

  it('levels up the Central Core when a core of the same tier fuses into it', () => {
    let levelUpEventRecorded: any = null;
    const sim = new PhysicsSimulation({
      onMerge: () => {},
      onCentralCoreLevelUp: (event) => { levelUpEventRecorded = event; },
      onCollisionImpact: () => {},
      onHazardStateChange: () => {}
    });

    const cx = GAME_CONFIG.CENTER_X;
    const cy = GAME_CONFIG.CENTER_Y;

    // Central Core starts at Tier 1
    const initialCentral = sim.getCentralEntity();
    expect(initialCentral.tier).toBe(1);
    expect(initialCentral.radius).toBe(CORE_TIERS[1].radius);

    // Spawn a matching Tier 1 core touching the central core
    // Distance between centers: initialCentral.radius + tier1.radius = 15 + 15 = 30
    sim.spawnCore(cx, cy - 26, 1, -1);

    // Step physics to trigger collision and central absorption
    for (let i = 0; i < 20; i++) {
      sim.step(16.666);
    }

    // Central Core should be Tier 2 now!
    expect(levelUpEventRecorded).toBeDefined();
    expect(levelUpEventRecorded.previousTier).toBe(1);
    expect(levelUpEventRecorded.newTier).toBe(2);

    const updatedCentral = sim.getCentralEntity();
    expect(updatedCentral.tier).toBe(2);
    expect(updatedCentral.radius).toBe(CORE_TIERS[2].radius);

    // Now spawn a Tier 1 core touching the Tier 2 Central Core -> should NOT level up
    levelUpEventRecorded = null;
    sim.spawnCore(cx, cy - 32, 1, 1);
    for (let i = 0; i < 20; i++) {
      sim.step(16.666);
    }
    expect(levelUpEventRecorded).toBeNull();
    expect(sim.getCentralEntity().tier).toBe(2);

    // Now spawn a matching Tier 2 core touching the Tier 2 Central Core -> levels up to Tier 3!
    sim.spawnCore(cx, cy - 36, 2, -1);
    for (let i = 0; i < 20; i++) {
      sim.step(16.666);
    }
    expect(levelUpEventRecorded).toBeDefined();
    expect(levelUpEventRecorded.newTier).toBe(3);
    expect(sim.getCentralEntity().tier).toBe(3);
    expect(sim.getCentralEntity().radius).toBe(CORE_TIERS[3].radius);
  });
});
