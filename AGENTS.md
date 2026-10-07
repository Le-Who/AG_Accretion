# Task routing

For source changes, read [code ownership and conventions](CODING_STANDARDS.md#code-ownership-and-conventions) and [runtime validation](CODING_STANDARDS.md#runtime-validation).

- **Bloom, charging, hazard, or Queen progression:** read [gameplay boundaries](CODING_STANDARDS.md#pair-bloom-and-queen-progression) and [Bloom safety and balance](docs/bloom-balance.md) before changing behavior.
- **Simulation timing or visual motion:** read [motion boundaries](CODING_STANDARDS.md#simulation-timing-and-visual-motion) and [music and rendering](docs/music-and-rendering.md) before choosing an implementation.
- **Music playback or tracks, particle emitters, rendering cost, or media assets:** read [music and presentation](CODING_STANDARDS.md#music-and-presentation) and [music and rendering](docs/music-and-rendering.md) for the affected branch's workflow and regressions.
- **Spawn generation or reproducibility claims:** read [queue reproducibility](CODING_STANDARDS.md#spawn-generation-and-reproducibility).

For documentation-only changes, use [documentation validation](CODING_STANDARDS.md#documentation-validation). If the change describes gameplay or presentation, also follow the matching branch above to resolve current behavior; README terminology and historical plans can lag behind the implementation.
