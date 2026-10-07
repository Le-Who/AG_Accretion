# Music and visual polish

## Add a track

1. Keep the original in `audio-source/` (ignored) or another local folder.
2. Install FFmpeg or set `FFMPEG_PATH` to its executable, then run:

   ```powershell
   npm run music:prepare -- "audio-source/My Song.mp3" my-song
   ```

3. Add a title and the generated `.ogg` / `.m4a` source URLs to [musicLibrary.ts](../src/audio/musicLibrary.ts), following the first track.
4. Commit the optimized files in `public/assets/music/` and the library change. Originals stay local and are not required by the build. [The converter](../scripts/optimize-music.mjs) owns encoding settings and refuses overwrites; use a new slug for a revised track.
5. Verify both generated formats in the browser, including complete playback and playlist transitions, using the playback contract below.

## Playback contract

[MusicEngine](../src/audio/musicEngine.ts) streams one media element, with activation and visibility wired in [main.ts](../src/main.ts). Keep loading gated by user interaction so initial page load makes no music request. Preserve independent persisted music enable/volume preferences and the Sound button's master mute for music and effects. Pause hidden tabs and resume eligible playback on return.

Play the library in order and repeat; a single track loops. Prefer a supported encoding, with Opus before AAC when both are supported. Load alternate sources only on failure, retry blocked play on the next gesture, and stop source retries when candidates are exhausted.

[Music regressions](../test/music.test.ts) cover gesture-gated loading, preferences, master mute, playlist/visibility, and bounded source fallback. In the browser, check initial network requests, real decoding of both formats, gesture activation, volume/master mute, tab hide/return, looping, and multi-track progression when applicable.

## Visual contracts

### Simulation and display

Keep physics on the configured fixed step in [simulation](../src/physics/simulation.ts). Use `getRenderPose` for display interpolation, including Bloom movement; displayed positions stay separate from physical positions. New bodies and teleports render at valid current poses. Visual polish preserves launch speed, gravity, cooldowns, and Bloom timing from their owning sources.

[Renderer](../src/render/renderer.ts) consumes those poses. [SquishSystem](../src/render/squishSystem.ts) drives bounded, volume-preserving squash/stretch from jelly springs; merge pop and continuous blinks remain visual and leave collision/scoring timing intact. [Gaze](../src/render/gaze.ts) converts the target into clamped local face coordinates, returning neutral gaze when disabled or the pointer is absent.

### Particles and rendering cost

Every emitter in [ParticleSystem](../src/render/particleSystem.ts) shares its hard particle budget. Keep travel and damping independent of frame rate, reclaim expired effects, and preserve distinct tumbling confetti and heart silhouettes.

Reuse cached body gradients/gloss in [proceduralSlimeRenderer](../src/render/proceduralSlimeRenderer.ts) and the static nebula background in Renderer, while faces, badges, and accessories remain dynamic. Measure changed rendering cost with the same scene and device conditions; report submission timing separately from GPU work or observed FPS.

### Visual assets

Trace the active consumer before replacing visual assets. The current Renderer calls ProceduralSlimeRenderer directly; [AssetManager](../src/render/assetManager.ts) can load `public/assets/slimes/` sprites but is unreferenced by the live renderer. A sprite replacement needs an explicit integration path and browser verification that the changed art appears in the intended canvas and previews. Use the visual contracts and validation in this section for that path.

### Visual validation

- [Motion regressions](../test/visual-motion.test.ts): interpolation without physical displacement, collision impacts, and bounded volume-preserving squish.
- [Gaze regressions](../test/gaze.test.ts): neutral gaze, local coordinates, and clamping.
- [Particle regressions](../test/particles.test.ts): shared budget, frame-rate invariance, distinct effects, and expiry.
- Browser checks: spawn/teleport poses, Bloom travel, collision squish, merge pop, blinks/gaze, and stacked particle bursts.

## Historical measurements

`Garden of Floating Stars` was converted from the supplied 3,716,779-byte MP3 to 1,441,412-byte Opus (61.2% smaller) and 1,985,814-byte AAC, preserving stereo and the approximately 159.65-second track. Cover art and source metadata were removed; AAC placed its index first for streaming. The original was preserved unchanged. Playback/decoding were verified; this was not a formal listening-quality study.

An earlier local Chromium measurement used the same 35-body scene, 400 measured frames after 50 warm-up frames, DPR 1: median submission time 1.8ms → 0.7ms, p95 4.9ms → 2.9ms. This describes that machine and revision, not universal GPU or mobile FPS; browser scheduling produced noisy outliers.
