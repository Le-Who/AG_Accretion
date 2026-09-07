import { describe, it, expect } from 'vitest';
import { MusicEngine } from '../src/audio/musicEngine.js';

class AudioPort extends EventTarget {
  src=''; preload=''; loop=false; volume=1; paused=true; plays=0; currentTime=0;
  canPlayType(type: string) { return type.includes('ogg') ? 'probably' : ''; }
  async play() { this.plays++; this.paused=false; }
  pause() { this.paused=true; }
}
const tracks=[{title:'First', sources:[{src:'/first.ogg',type:'audio/ogg; codecs=opus'},{src:'/first.m4a',type:'audio/mp4'}]}, {title:'Second', sources:[{src:'/second.ogg',type:'audio/ogg; codecs=opus'}]}];
function setup() {
  const media=new AudioPort(); const saved=new Map<string,string>();
  const storage={getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>{saved.set(k,v);}};
  return {media, saved, storage, music:new MusicEngine(tracks,media,storage)};
}
describe('Streaming music', () => {
  it('does not load before interaction, chooses supported format and pauses under master mute', async () => {
    const {music,media}=setup();
    expect(media.src).toBe(''); expect(media.plays).toBe(0);
    await music.activate();
    expect(media.src).toBe('/first.ogg'); expect(media.paused).toBe(false);
    music.setMuted(true); expect(media.paused).toBe(true);
    media.currentTime=12; music.setMuted(false); await Promise.resolve();
    expect(media.paused).toBe(false); expect(media.currentTime).toBe(12);
  });
  it('persists independent music preference and volume without loading while disabled', async () => {
    const {music,media,storage}=setup();
    music.setEnabled(false); music.setVolume(.17); await music.activate();
    expect(media.src).toBe(''); expect(media.plays).toBe(0);
    const restored=new MusicEngine(tracks,new AudioPort(),storage);
    expect(restored.getEnabled()).toBe(false); expect(restored.getVolume()).toBeCloseTo(.17);
    music.setVolume(NaN); expect(music.getVolume()).toBeCloseTo(.17);
  });
  it('advances the playlist and loops back, pausing when the tab is hidden', async () => {
    const {music,media}=setup(); await music.activate();
    media.dispatchEvent(new Event('ended')); await Promise.resolve();
    expect(media.src).toBe('/second.ogg');
    media.dispatchEvent(new Event('ended')); await Promise.resolve();
    expect(media.src).toBe('/first.ogg');
    music.setVisible(false); expect(media.paused).toBe(true);
    music.setVisible(true); await Promise.resolve(); expect(media.paused).toBe(false);
  });
  it('falls back once on decoder/network error without an infinite retry loop', async () => {
    const {music,media}=setup(); await music.activate();
    media.dispatchEvent(new Event('error')); await Promise.resolve();
    expect(media.src).toBe('/first.m4a');
    media.dispatchEvent(new Event('error')); await Promise.resolve();
    const plays=media.plays;
    media.dispatchEvent(new Event('error')); await music.activate();
    expect(media.plays).toBe(plays);
  });
});
