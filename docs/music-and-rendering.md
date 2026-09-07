# Music and visual polish

## Add a track

1. Keep the original in `audio-source/` (ignored) or another local folder.
2. Install FFmpeg or set `FFMPEG_PATH` to its executable, then run:

   ```powershell
   npm run music:prepare -- "audio-source/My Song.mp3" my-song
   ```

3. Add a title and the generated `.ogg` / `.m4a` source URLs to `src/audio/musicLibrary.ts`, following the first track.
4. Commit the optimized files in `public/assets/music/` and the library change. Originals are not required by the build. The converter refuses overwriting existing files; use a new slug for a revised track.

The library plays in order and repeats. A single track loops. Music starts after user interaction; no music request is made during initial page load. Opus is preferred; AAC is a compatibility/error fallback, not a second initial download. Settings provide an independent music checkbox and volume; the Sound button mutes both music and effects. Hidden tabs pause music, returning resumes it. A blocked play is retried on the next gesture; exhausted source errors stop retrying.

`Garden of Floating Stars` was converted from the supplied 3,716,779-byte MP3 to 1,441,412-byte Opus (61.2% smaller) and 1,985,814-byte AAC. Both preserve stereo and the complete approximately 159.65-second track. Cover art and source metadata are removed; AAC places its index first for streaming. Original file preserved unchanged. Lossy transcoding trades some fidelity for transfer size; playback/decoding were verified, not a formal listening-quality study.

## Visual-only changes

- Physics stays at 60 fixed steps per second; launch speed, gravity, cooldowns and the 650ms Pair Bloom duration are unchanged.
- Render poses interpolate previous/current fixed-step positions, including Bloom movement. This adds at most one physics-step of display latency, not slower gameplay. Teleports and new bodies snap to valid current positions.
- Existing jelly springs now drive bounded, volume-preserving squash/stretch. Merged bodies get a brief 180ms visual pop without delaying their collision or scoring. Blink transitions are continuous.
- Confetti tumbles; evolution emits heart silhouettes. Frame-rate-independent damping makes particle travel consistent at 60/120Hz. All emitters share the hard 280-particle cap.
- Body gradients/gloss are cached in up to 22 small textures, and the static nebula background is cached. Faces, badges and accessories stay dynamic. No full-screen blur or postprocessing pass was added.

## Verification

Run `npm test` and `npm run build`. Tests cover music preferences/mute/playlist/fallback, interpolation without physical motion changes, collision/squish integration, particle budget/frame-rate invariance, and previous gameplay regressions.

Local Chromium synthetic rendering measurement, same 35-body scene, 400 measured frames after 50 warm-up frames, DPR 1: median 1.8ms → 0.7ms, p95 4.9ms → 2.9ms. This measures command submission on this machine, not universal GPU or mobile FPS; browser scheduling creates noisy outliers. Browser checks also verified real Opus/AAC playback, no initial music request, volume/mute, and looping.

Browser captures and local benchmark scripts remain under ignored `output/playwright/`; runtime tools, browser logs, builds, secrets and audio masters are excluded by `.gitignore`. Shipping music and source/tests remain versionable.
