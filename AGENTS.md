# Project guidance

## Find the active behavior

When changing Bloom, charging, hazard handling, or Queen progression, read [Bloom safety and balance](docs/bloom-balance.md) and the corresponding implementation in [simulation](src/physics/simulation.ts), [game state](src/core/gameState.ts), and [integration](src/main.ts). Use these sources to resolve the README's older Flux Pulse terminology; current gameplay uses Pair Bloom.

When changing music, animation, rendering cost, or media assets, read [music and rendering](docs/music-and-rendering.md) before choosing the implementation or validation path.

## Gameplay boundaries

When changing simulation timing or visual motion, preserve fixed-step physics and use `getRenderPose` for display interpolation. Snap new bodies and teleports to current physical poses. Check [motion regressions](test/visual-motion.test.ts) for the separation between displayed and physical positions.

When changing Pair Bloom, reserve landing sites against bystanders and every accepted result before animation begins. Keep blocked pairs playable and spend charge only when at least one action succeeds. Hold bystander physics, launches, danger time, combo time, and cooldown time through the atomic animation; resume the remaining timers and continue detecting overflow.

When changing Bloom chains, carry their origin through automatic merges and Queen evolution so effects remain visual and charging resumes after the next player launch. When changing maximum-tier ascension, consume at most one maximum-tier slime per activation, preserve Queen size and tier, apply the run multiplier to merge/evolution scoring, and reset that multiplier on restart. Check [Bloom balance regressions](test/bloom-balance.test.ts) and [Bloom geometry regressions](test/bloom.test.ts).

When changing spawn generation or documenting reproducibility, keep the queue on [DeterministicRNG](src/core/rng.ts) and verify equal-seed sequences in [logic tests](test/logic.test.ts). Scope seed guarantees to the queue: simulation currently uses `Math.random()` for other outcomes. Read tuning values from [configuration](src/config.ts) and [tier definitions](src/entities/coreTiers.ts).

## Music and presentation

When changing [music playback](src/audio/musicEngine.ts), retain gesture-gated loading, independent music preferences, master mute, hidden-tab pause, and bounded source fallback. Validate these branches in [music tests](test/music.test.ts).

When adding music, follow the preparation workflow and register optimized public files in [the library](src/audio/musicLibrary.ts); retain originals locally. Keep browser captures and benchmarks under ignored `output/`, following [.gitignore](.gitignore).

When changing particle emitters, preserve the shared budget and frame-rate-independent travel covered by [particle tests](test/particles.test.ts).

## Validate the changed branch

For runtime changes, run the test and build scripts in [package.json](package.json), then inspect affected visible or audio behavior in the browser. Use [the debug harness](src/debug/debugHarness.ts) to construct gameplay scenarios. For documentation-only changes, verify repository links and `git diff --check`.
