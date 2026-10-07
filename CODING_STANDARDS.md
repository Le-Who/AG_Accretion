# Coding standards

## Code ownership and conventions

Use `.js` specifiers for relative TypeScript imports, following the source and tests.

Keep run state, scoring, charge, hazard timers, and spawn queue logic in [GameState](src/core/gameState.ts). Keep body lifecycle, collisions, merge resolution, Bloom geometry, and fixed-step advancement in [PhysicsSimulation](src/physics/simulation.ts). Wire subsystem callbacks, input, HUD, and presentation effects in [main.ts](src/main.ts); use simulation events to update game state and presentation.

Read tuning values from [configuration](src/config.ts) and [tier definitions](src/entities/coreTiers.ts). Resolve current behavior from the implementation and the branch guides linked below. README's older Flux Pulse descriptions and historical plans may describe earlier behavior; current gameplay uses Pair Bloom.

## Simulation timing and visual motion

When changing simulation timing or visual motion, preserve fixed-step physics and use `getRenderPose` for display interpolation. Snap new bodies and teleports to current physical poses. [Motion regressions](test/visual-motion.test.ts) cover the separation between displayed and physical positions.

Read [music and rendering](docs/music-and-rendering.md) for the existing visual pipeline before choosing the implementation or validation path.

## Pair Bloom and Queen progression

When changing Bloom, charging, hazard handling, or Queen progression, read [Bloom safety and balance](docs/bloom-balance.md) alongside the corresponding implementation in [simulation](src/physics/simulation.ts), [game state](src/core/gameState.ts), and [integration](src/main.ts).

Reserve landing sites against bystanders and every accepted result before animation begins. Keep blocked pairs playable and spend charge only when at least one action succeeds. Hold bystander physics, launches, danger time, combo time, and cooldown time through the atomic animation; resume the remaining timers and continue detecting overflow.

Carry Bloom origin through automatic merges and Queen evolution so effects remain visual and charging resumes after the next player launch. For maximum-tier ascension, consume at most one maximum-tier slime per activation, preserve Queen size and tier, apply the run multiplier to merge/evolution scoring, and reset that multiplier on restart.

[Bloom balance regressions](test/bloom-balance.test.ts) cover charge, bystanders, blocked pairs, hazard timers, ascension, scoring, and restart. [Bloom geometry regressions](test/bloom.test.ts) cover landing room, pair selection, and in-flight reset.

## Spawn generation and reproducibility

Keep the queue on [DeterministicRNG](src/core/rng.ts) and verify equal-seed sequences in [logic tests](test/logic.test.ts). Scope seed guarantees to the queue: simulation currently uses `Math.random()` for other outcomes. Use configuration and tier definitions for tuning rather than copying their values into documentation.

## Music and presentation

When changing music, animation, rendering cost, or media assets, read [music and rendering](docs/music-and-rendering.md) before choosing the implementation or validation path.

When changing [music playback](src/audio/musicEngine.ts), retain gesture-gated loading, independent music preferences, master mute, hidden-tab pause, and bounded source fallback. [Music tests](test/music.test.ts) cover these branches.

When adding music, follow the guide's [track preparation workflow](docs/music-and-rendering.md#add-a-track), register optimized public files in [the library](src/audio/musicLibrary.ts), and retain originals locally. Keep browser captures and benchmarks under ignored `output/`, following [.gitignore](.gitignore).

When changing particle emitters, preserve the shared budget and frame-rate-independent travel covered by [particle tests](test/particles.test.ts).

## Runtime validation

For runtime changes, run the test and build scripts in [package.json](package.json), then inspect affected visible or audio behavior in the browser. Use [the debug harness](src/debug/debugHarness.ts) to construct gameplay scenarios. Select affected scenarios and regression branches from the sections above and their linked guides.

## Documentation validation

For documentation-only changes, verify repository link targets and heading anchors, then run `git diff --check`. When describing behavior or tuning, check the corresponding implementation and configuration through the relevant section above.
