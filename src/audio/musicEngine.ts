export interface MusicTrack {
  title: string;
  sources: ReadonlyArray<{ src: string; type: string }>;
}
type AudioPort = Pick<HTMLAudioElement, 'src' | 'preload' | 'loop' | 'volume' | 'paused' | 'play' | 'pause' | 'canPlayType' | 'addEventListener'>;
type Preferences = Pick<Storage, 'getItem' | 'setItem'>;
const ENABLED_KEY = 'slime_music_enabled';
const VOLUME_KEY = 'slime_music_volume';

/** One streamed element, no whole-song decode buffer, no request before a gesture. */
export class MusicEngine {
  private enabled = true;
  private volume = .28;
  private muted = false;
  private visible = true;
  private activated = false;
  private trackIndex = 0;
  private sourceIndex = 0;
  private sources: MusicTrack['sources'] = [];
  private failed = false;

  constructor(
    private tracks: readonly MusicTrack[],
    private media: AudioPort = new Audio(),
    private preferences: Preferences | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
  ) {
    try {
      this.enabled = preferences?.getItem(ENABLED_KEY) !== 'false';
      const stored = preferences?.getItem(VOLUME_KEY);
      if (stored != null && Number.isFinite(Number(stored))) this.volume = Math.max(0, Math.min(1, Number(stored)));
    } catch { /* Storage can be unavailable in private/embedded contexts. */ }
    media.preload = 'none';
    media.volume = this.volume;
    media.loop = tracks.length === 1;
    media.addEventListener('ended', () => {
      this.trackIndex = (this.trackIndex + 1) % Math.max(1, this.tracks.length);
      this.sources = [];
      this.sourceIndex = 0;
      void this.syncPlayback();
    });
    media.addEventListener('error', () => {
      this.sourceIndex++;
      if (this.sourceIndex >= this.sources.length) { this.failed = true; media.pause(); return; }
      media.src = this.sources[this.sourceIndex].src;
      void this.syncPlayback();
    });
  }

  public getEnabled(): boolean { return this.enabled; }
  public getVolume(): number { return this.volume; }
  public activate(): Promise<void> { this.activated = true; return this.syncPlayback(); }
  public setMuted(muted: boolean): void { this.muted = muted; void this.syncPlayback(); }
  public setVisible(visible: boolean): void { this.visible = visible; void this.syncPlayback(); }
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.save(ENABLED_KEY, String(enabled));
    void this.syncPlayback();
  }
  public setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(1, volume));
    this.media.volume = this.volume;
    this.save(VOLUME_KEY, String(this.volume));
  }
  private save(key: string, value: string): void {
    try { this.preferences?.setItem(key, value); } catch { /* Session preferences still work. */ }
  }
  private shouldPlay(): boolean {
    return this.activated && this.enabled && !this.muted && this.visible && !this.failed && this.tracks.length > 0;
  }
  private async syncPlayback(): Promise<void> {
    if (!this.shouldPlay()) { this.media.pause(); return; }
    if (!this.sources.length) {
      const candidates = this.tracks[this.trackIndex].sources;
      // Prefer known supported encodings; retain alternate source as a network/decoder fallback.
      this.sources = [...candidates.filter(s => !!this.media.canPlayType(s.type)), ...candidates.filter(s => !this.media.canPlayType(s.type))];
      if (!this.sources.length) { this.failed = true; return; }
      this.sourceIndex = 0;
      this.media.src = this.sources[0].src;
    }
    try {
      await this.media.play();
      if (!this.shouldPlay()) this.media.pause();
    } catch { /* Autoplay rejection/aborted play is retried on the next user gesture. */ }
  }
}
