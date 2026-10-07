# Coding standards

## Code ownership and conventions

Use `.js` specifiers for relative TypeScript imports.

Keep run state, scoring, charge, hazard timers, and the launch queue in [GameState](src/core/gameState.ts); body lifecycle, collisions, merge resolution, Bloom geometry, and fixed-step advancement in [PhysicsSimulation](src/physics/simulation.ts); subsystem callbacks, input wiring, HUD updates, and presentation-effect dispatch in [main.ts](src/main.ts). Carry simulation events across these boundaries.

Read tuning from [configuration](src/config.ts), [tier definitions](src/entities/coreTiers.ts), and the owning implementation instead of copying values into active guidance.

## Task contracts

- **Bloom, charging, hazard, Queen progression:** [Bloom contracts](docs/bloom-balance.md#gameplay-contracts).
- **HUD or layout:** [presentation contract](docs/bloom-balance.md#presentation).
- **Simulation timing, animation, gaze, particles, rendering cost:** [visual contracts](docs/music-and-rendering.md#visual-contracts).
- **Visual assets:** [asset integration](docs/music-and-rendering.md#visual-assets).
- **Music playback:** [playback contract](docs/music-and-rendering.md#playback-contract).
- **Music tracks:** [track preparation](docs/music-and-rendering.md#add-a-track).
- **Spawn generation or reproducibility:** keep the launch queue on [DeterministicRNG](src/core/rng.ts), with equal-seed sequences covered in [logic tests](test/logic.test.ts). Seed guarantees apply to the GameState queue; simulation uses `Math.random()` for other outcomes.

## Runtime validation

For runtime changes, run the test and build scripts in [package.json](package.json), then inspect affected visible or audio behavior in the browser using scenarios from the applicable guide. Use [the debug harness](src/debug/debugHarness.ts) to construct gameplay scenarios. Store browser captures and local benchmarks under ignored `output/`, following [.gitignore](.gitignore).

## Documentation validation

For documentation-only changes, verify repository link targets and heading anchors, then run `git diff --check`. Check behavioral descriptions against the implementation and tuning sources reached through the applicable task routes; historical specs and plans describe earlier designs.
