import { GAME_CONFIG } from '../config.js';
import { GameState } from '../core/gameState.js';
import { PhysicsSimulation } from '../physics/simulation.js';
import { ParticleSystem } from '../render/particleSystem.js';
import { Polarity } from '../types.js';

export interface GameDebugAPI {
  getState: () => {
    status: string;
    score: number;
    bestScore: number;
    fluxCharge: number;
    integrityPercent: number;
    currentTier: number;
    currentPolarity: number;
    nextTier: number;
    nextPolarity: number;
    activeBodiesCount: number;
  };
  getEntities: () => Array<{ id: string; tier: number; polarity: number; x: number; y: number }>;
  setScore: (score: number) => void;
  setFlux: (charge: number) => void;
  spawnTier: (tier: number, polarity: Polarity, x?: number, y?: number) => void;
  setAimAngle: (angleRad: number) => void;
  triggerDrop: () => boolean;
  triggerLaunch: () => boolean;
  triggerFluxPulse: () => boolean;
  triggerGameOver: () => void;
  reset: (seed?: number) => void;
  setSeed: (seed: number) => void;
  loadScenario: (scenarioName: string) => boolean;
  step: (dtMs: number) => void;
}

declare global {
  interface Window {
    __GAME_DEBUG__?: GameDebugAPI;
  }
}

export class DebugHarness {
  public static install(
    gameState: GameState,
    simulation: PhysicsSimulation,
    particles: ParticleSystem,
    onLaunchTriggered: () => void,
    onFluxPulseTriggered: () => void,
    onResetTriggered: (seed?: number) => void
  ): void {
    const api: GameDebugAPI = {
      getState: () => {
        const bodies = simulation.getBodies();
        return {
          status: gameState.getStatus(),
          score: gameState.getScore(),
          bestScore: gameState.getBestScore(),
          fluxCharge: gameState.getFluxCharge(),
          integrityPercent: gameState.getIntegrityPercent(),
          currentTier: gameState.currentTier,
          currentPolarity: gameState.currentPolarity,
          nextTier: gameState.nextTier,
          nextPolarity: gameState.nextPolarity,
          activeBodiesCount: bodies.size
        };
      },

      getEntities: () => {
        const entities = simulation.getEntities();
        const bodies = simulation.getBodies();
        const list: Array<{ id: string; tier: number; polarity: number; x: number; y: number }> = [];

        for (const [bodyId, entity] of entities.entries()) {
          const body = bodies.get(bodyId);
          if (body) {
            list.push({
              id: entity.id,
              tier: entity.tier,
              polarity: entity.polarity,
              x: body.position.x,
              y: body.position.y
            });
          }
        }
        return list;
      },

      setScore: (newScore: number) => {
        (gameState as unknown as { score: number }).score = newScore;
      },

      setFlux: (charge: number) => {
        (gameState as unknown as { fluxCharge: number }).fluxCharge = Math.min(100, Math.max(0, charge));
      },

      setAimAngle: (angleRad: number) => {
        gameState.setAimAngle(angleRad);
      },

      spawnTier: (tier: number, polarity: Polarity, x?: number, y?: number) => {
        const posX = x ?? GAME_CONFIG.CENTER_X;
        const posY = y ?? (GAME_CONFIG.CENTER_Y - 70);
        simulation.spawnCore(posX, posY, tier, polarity);
      },

      triggerDrop: () => {
        if (gameState.canLaunch()) {
          onLaunchTriggered();
          return true;
        }
        return false;
      },

      triggerLaunch: () => {
        if (gameState.canLaunch()) {
          onLaunchTriggered();
          return true;
        }
        return false;
      },

      triggerFluxPulse: () => {
        if (gameState.canTriggerFluxPulse()) {
          onFluxPulseTriggered();
          return true;
        }
        return false;
      },

      triggerGameOver: () => {
        gameState.triggerGameOver();
      },

      reset: (seed?: number) => {
        onResetTriggered(seed);
      },

      setSeed: (seed: number) => {
        gameState.getRNG().setSeed(seed);
      },

      loadScenario: (scenarioName: string) => {
        simulation.reset();
        particles.clear();

        const cx = GAME_CONFIG.CENTER_X;
        const cy = GAME_CONFIG.CENTER_Y;

        switch (scenarioName) {
          case 'basic_merge': {
            // Two Tier 1 cores touching next to the central core for instant merge
            simulation.spawnCore(cx - 14, cy - 55, 1, 1);
            simulation.spawnCore(cx + 14, cy - 55, 1, 1);
            return true;
          }

          case 'resonance_merge': {
            // Tier 3 +Alpha and Tier 3 -Beta aligned for resonant fusion
            simulation.spawnCore(cx - 26, cy - 65, 3, 1);
            simulation.spawnCore(cx + 26, cy - 65, 3, -1);
            return true;
          }

          case 'chain_reaction': {
            // Cascade ring around the central nucleus
            simulation.spawnCore(cx, cy - 55, 1, 1);
            simulation.spawnCore(cx + 26, cy - 55, 1, -1);
            simulation.spawnCore(cx + 55, cy - 55, 2, 1);
            simulation.spawnCore(cx + 90, cy - 55, 3, -1);
            return true;
          }

          case 'near_breach': {
            // Large accretion bodies extending beyond the containment perimeter radius (250px)
            const c1 = simulation.spawnCore(cx, cy - 100, 8, 1);
            const c2 = simulation.spawnCore(cx, cy - 230, 7, -1);
            // c2 reaches radius: (cy - (cy - 230)) + 69 = 299 > 250!
            c1.spawnTime = performance.now() - 2000;
            c2.spawnTime = performance.now() - 2000;
            return true;
          }

          case 'stress_test': {
            // Fill orbit with 35 assorted bodies to test frame rate
            for (let i = 0; i < 35; i++) {
              const angle = (i / 35) * Math.PI * 2;
              const dist = 60 + Math.random() * 160;
              const tier = (i % 6) + 1;
              const pol: Polarity = i % 2 === 0 ? 1 : -1;
              simulation.spawnCore(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, tier, pol);
            }
            return true;
          }

          default:
            console.warn(`Unknown scenario: ${scenarioName}`);
            return false;
        }
      },

      step: (dtMs: number) => {
        simulation.step(dtMs);
      }
    };

    window.__GAME_DEBUG__ = api;
  }
}
