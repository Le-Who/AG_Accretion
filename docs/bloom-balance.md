# Pair Bloom safety and balance

## Gameplay contracts

### Atomic pair resolution

In [PhysicsSimulation](../src/physics/simulation.ts), reserve nonoverlapping landing sites before animation begins, accounting for the Queen, perimeter clearance, bystanders, and every accepted result. `safeBloomTarget` owns the clearance and search values. Pairs without a safe site remain dynamic and playable for a later activation.

Hold bystander physics and player launches through the atomic animation so reserved sites stay available. Hold danger, combo, and cooldown time in [GameState](../src/core/gameState.ts), then resume their remaining values. Continue detecting overflow; preserve the hazard rather than clearing it on activation. [main.ts](../src/main.ts) spends charge only after `startPairBloom` accepts at least one action.

Collect matching-tier pairs once, leaving unmatched slimes available; maximum-tier slimes use the ascension path below. Reset cancels in-flight pairs without delayed merges.

### Charge and origin

Carry `bloomOrigin` through automatic merges and into Queen-evolution events. Bloom results and these descendants emit visual effects without physical shockwaves or ability charge until the next player launch clears their origin. Ordinary Queen growth still separates bodies from the expanded nucleus.

Read charge rewards and readiness threshold from [configuration](../src/config.ts), and animation duration from `advancePairBloom` in simulation. The HUD uses actual charge for readiness; its fill transition is presentation only.

### Maximum-tier ascension

A maximum-tier Queen absorbs at most one maximum-tier slime per activation while preserving her tier and radius. `GameState.handleAscension` owns the persistent run-multiplier increase. Apply that multiplier alongside temporary combo to merge and evolution scores, display it in score details, and reset it on restart.

### Gameplay validation

- [Bloom balance regressions](../test/bloom-balance.test.ts): reservations and unmoved bystanders, blocked pairs remaining dynamic, persistent overflow, danger-time hold/resume, self-charge suppression, single maximum-tier absorption, run scoring and restart.
- [Bloom geometry regressions](../test/bloom.test.ts): room beside every Queen, launch-guide fit, pair selection, and in-flight reset.
- Inspect the browser path from charged activation through blocked/accepted resolution, subsequent automatic merges and Queen evolution, the next player launch, and ascension/reset. Check combo/cooldown hold and actual-charge readiness through main and GameState; the listed tests do not exhaust these integration branches.

The ascension/reset path was checked in earlier browser runs. Late-game economy still needs playtesting across complete runs; current tuning is not an analytics-derived target.

## Presentation

Desktop grid tracks center the actual Next canvas, with Harmony on the left and score, Bloom, and settings on the right. Preserve the mobile layout. The layout lives in [style.css](../src/style.css) and [index.html](../index.html), with HUD wiring in main.

Earlier browser checks covered desktop centering at 601/768/1024/1440px and mobile overflow at 390px. These are historical checks, not a substitute for validating a changed layout.

## Background

The earlier implementation chose landing sites independently against only the Queen and perimeter. Results could overlap each other or bystanders, and ordinary merge shockwaves displaced neighbouring slimes. The atomic reservation contract addresses that failure.
