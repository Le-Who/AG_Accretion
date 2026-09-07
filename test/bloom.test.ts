import { describe, it, expect } from 'vitest';
import { CORE_TIERS } from '../src/entities/coreTiers.js';
import { GAME_CONFIG } from '../src/config.js';
import { PhysicsSimulation } from '../src/physics/simulation.js';

function simulation() {
  const merges: any[] = [];
  const sim = new PhysicsSimulation({ onMerge: e => merges.push(e), onCentralCoreLevelUp() {}, onCollisionImpact() {}, onHazardStateChange() {} });
  return { sim, merges };
}

describe('Late-game room', () => {
  it('keeps a settled Titan safe beside every queen after spawn grace expires', () => {
    for (let queenTier = 1; queenTier <= 11; queenTier++) {
      let hazard = false;
      const sim = new PhysicsSimulation({ onMerge() {}, onCentralCoreLevelUp() {}, onCollisionImpact() {}, onHazardStateChange: h => { hazard = h; } });
      for (let tier = 1; tier < queenTier; tier++) {
        sim.spawnCore(320, 320, tier, -1);
        sim.step(100);
      }
      expect(sim.getCentralEntity().tier).toBe(queenTier);
      const titan = sim.spawnCore(320 + sim.getCentralEntity().radius + CORE_TIERS[11].radius + 3, 320, 11, 1);
      titan.spawnTime = performance.now() - 2000;
      for (let i = 0; i < 100; i++) sim.step(1000 / 60);
      expect(hazard).toBe(false);
    }
  });
  it('keeps the launcher and its guide inside the canvas for all spawn tiers', () => {
    for (const tier of GAME_CONFIG.SPAWNABLE_TIERS) {
      expect(GAME_CONFIG.LAUNCH_ORBIT_RADIUS + CORE_TIERS[tier].radius + 6).toBeLessThanOrEqual(GAME_CONFIG.CHAMBER_WIDTH / 2);
    }
  });
  it('fits every tier beside every queen with a 12px settling margin', () => {
    for (const queen of Object.values(CORE_TIERS)) {
      for (const slime of Object.values(CORE_TIERS)) {
        expect(queen.radius + slime.radius * 2 + 12).toBeLessThanOrEqual(GAME_CONFIG.CONTAINMENT_PERIMETER_RADIUS);
      }
    }
  });
});

describe('Pair Bloom', () => {
  it('collects distant same-type pairs once and leaves odd slimes and Titans alone', () => {
    const { sim, merges } = simulation();
    sim.spawnCore(140, 320, 2, 1);
    sim.spawnCore(500, 320, 2, 1);
    sim.spawnCore(320, 130, 2, -1);
    sim.spawnCore(200, 200, 11, 1);
    sim.spawnCore(440, 440, 11, -1);
    expect(sim.startPairBloom()).toBe(1);
    expect(sim.startPairBloom()).toBe(0);
    // Check the reserved landing at resolution, before ordinary gravity resumes.
    for (let i = 0; i < 39; i++) sim.step(1000 / 60);
    expect(merges).toHaveLength(1);
    expect(merges[0].resultTier).toBe(3);
    expect(merges[0].pairBloom).toBe(true);
    expect([...sim.getEntities().values()].filter(e => e.tier === 11)).toHaveLength(2);
    const result = [...sim.getEntities().values()].find(e => e.tier === 3)!;
    const body = sim.getBodies().get(result.bodyId)!;
    expect(Math.hypot(body.position.x - 320, body.position.y - 320)).toBeGreaterThanOrEqual(sim.getCentralEntity().radius + result.radius - 3);
  });

  it('does not spend an action on the queen or unmatched slimes', () => {
    const { sim } = simulation();
    sim.spawnCore(120, 320, 1, 1);
    expect(sim.startPairBloom()).toBe(0);
  });

  it('reset cancels in-flight pairs without delayed merges', () => {
    const { sim, merges } = simulation();
    sim.spawnCore(120, 320, 2, 1);
    sim.spawnCore(520, 320, 2, -1);
    sim.startPairBloom();
    sim.reset();
    for (let i = 0; i < 60; i++) sim.step(1000 / 60);
    expect(merges).toHaveLength(0);
    expect(sim.getEntities().size).toBe(1);
  });
});
