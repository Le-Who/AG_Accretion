import { expect, it, vi } from 'vitest';
import { ParticleSystem } from '../src/render/particleSystem.js';
import type { Particle } from '../src/types.js';
const particles = (p: ParticleSystem) => (p as unknown as {particles: Particle[]}).particles;
it('never exceeds the particle budget even during stacked bursts and hearts', () => {
  const p = new ParticleSystem();
  for(let i=0;i<50;i++) { p.emitMerge(0,0,'#fff',true); p.emitHearts(0,0); p.emitFluxPulseWave(0,0); }
  expect(particles(p).length).toBeLessThanOrEqual(280);
});
it('moves and damps particles consistently at 60Hz and 120Hz', () => {
  const random=vi.spyOn(Math,'random').mockReturnValue(.5);
  try {
    const a=new ParticleSystem(); const b=new ParticleSystem();
    a.emitMerge(100,100,'#fff',true); b.emitMerge(100,100,'#fff',true);
    for(let i=0;i<12;i++) a.update(1000/60);
    for(let i=0;i<24;i++) b.update(1000/120);
    expect(particles(a)[0].x).toBeCloseTo(particles(b)[0].x,5);
    expect(particles(a)[0].y).toBeCloseTo(particles(b)[0].y,5);
    expect(particles(a)[0].vx).toBeCloseTo(particles(b)[0].vx,5);
  } finally { random.mockRestore(); }
});
it('uses distinct confetti and heart particles and reclaims expired effects', () => {
  const p=new ParticleSystem(); p.emitMerge(0,0,'#fff',true); p.emitHearts(0,0);
  expect(particles(p).some(x=>x.type==='CONFETTI')).toBe(true);
  expect(particles(p).some(x=>x.type==='HEART')).toBe(true);
  p.update(2000); expect(particles(p)).toHaveLength(0);
});
