import type { MusicTrack } from './musicEngine.js';

/** Add prepared tracks here; they play in order and loop without preloading the library. */
export const MUSIC_TRACKS: readonly MusicTrack[] = [
  {
    title: 'Garden of Floating Stars',
    sources: [
      { src: `${import.meta.env.BASE_URL}assets/music/garden-of-floating-stars.ogg`, type: 'audio/ogg; codecs=opus' },
      { src: `${import.meta.env.BASE_URL}assets/music/garden-of-floating-stars.m4a`, type: 'audio/mp4' }
    ]
  }
];
