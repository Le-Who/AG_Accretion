import { expect, it } from 'vitest';
import { GameState } from '../src/core/gameState.js';
import { PhysicsSimulation } from '../src/physics/simulation.js';
import { CORE_TIERS } from '../src/entities/coreTiers.js';
import type { MergeEvent } from '../src/types.js';
const state = () => new GameState({onScoreChange(){},onFluxChange(){},onIntegrityChange(){},onNextCoreChange(){},onCentralCoreChange(){},onStatusChange(){},onGameOver(){}},1);
const event = (bloom=false): MergeEvent => ({entityA:{} as any,entityB:{} as any,resultTier:2,resultPolarity:1,fusionType:'RESONANT',scoreGained:100,comboMultiplier:1,x:0,y:0,pairBloom:bloom});
it('requires ten resonant merges and Bloom cannot recharge itself',()=>{
  const s=state(); for(let i=0;i<9;i++) s.handleMergeEvent(event());
  expect(s.getFluxCharge()).toBe(90); expect(s.canTriggerFluxPulse()).toBe(false);
  s.handleMergeEvent(event()); s.consumeFluxPulse();
  for(let i=0;i<20;i++) s.handleMergeEvent(event(true));
  expect(s.getFluxCharge()).toBe(0);
});
it('ascension adds a persistent half multiplier, resets with the run',()=>{
  const s=state(); s.handleAscension(); expect(s.getRunMultiplier()).toBe(1.5);
  s.update(2000); s.handleMergeEvent(event()); expect(s.getScore()).toBe(225);
  s.reset(); expect(s.getRunMultiplier()).toBe(1);
});
it('Bloom reserves nonoverlapping results and never changes bystander positions',()=>{
  const s=new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){},onHazardStateChange(){}});
  const blocker=s.spawnCore(320,260,5,1);
  s.spawnCore(200,280,2,1);s.spawnCore(440,280,2,1);
  s.spawnCore(220,280,3,1);s.spawnCore(420,280,3,1);
  const before={...s.getBodies().get(blocker.bodyId)!.position};
  expect(s.startPairBloom()).toBeGreaterThan(0);
  for(let i=0;i<39;i++) s.step(1000/60);
  const p=s.getBodies().get(blocker.bodyId)!.position;
  expect(p.x).toBe(before.x); expect(p.y).toBe(before.y);
  const results=[...s.getEntities().values()].filter(e=>e.mergeBorn);
  expect(results.length).toBeGreaterThan(0);
  for(const result of results) {
    const pos=s.getBodies().get(result.bodyId)!.position;
    expect(Math.hypot(pos.x-320,pos.y-320)+result.radius).toBeLessThanOrEqual(255);
    for(const other of s.getEntities().values()) if(other!==result && !other.isMerging) {
      const q=s.getBodies().get(other.bodyId)!.position;
      expect(Math.hypot(pos.x-q.x,pos.y-q.y)).toBeGreaterThanOrEqual(result.radius+other.radius);
    }
  }
});
it('absorbs exactly one Titan into a max queen per Bloom without growing it',()=>{
  let ascensions=0;
  const s=new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){},onHazardStateChange(){},onAscension(){ascensions++;}});
  for(let t=1;t<11;t++){s.spawnCore(320,320,t,-1);s.step(100);}
  s.spawnCore(150,320,11,1);s.spawnCore(490,320,11,-1);
  expect(s.startPairBloom()).toBe(1);
  for(let i=0;i<40;i++) s.step(1000/60);
  expect(ascensions).toBe(1);expect(s.getCentralEntity().radius).toBe(CORE_TIERS[11].radius);
  expect([...s.getEntities().values()].filter(e=>!e.isCentralCore&&e.tier===11)).toHaveLength(1);
});
it('defers a blocked pair without leaving ghost/static bodies',()=>{
  const s=new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){},onHazardStateChange(){}});
  for(let i=0;i<20;i++) s.spawnCore(320+Math.cos(i)*160,320+Math.sin(i)*160,11,1);
  const a=s.spawnCore(250,250,10,1), b=s.spawnCore(390,250,10,1);
  expect(s.startPairBloom()).toBe(0);
  expect(a.isMerging).toBe(false);expect(b.isMerging).toBe(false);
  expect(s.getBodies().get(a.bodyId)!.isStatic).toBe(false);
});
it('still detects overflow instead of granting a blanket Bloom shield',()=>{
  let hazard=false;
  const s=new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){},onHazardStateChange:h=>{hazard=h;}});
  const outside=s.spawnCore(560,320,9,1);outside.spawnTime=performance.now()-2000;
  s.spawnCore(160,320,2,1);s.spawnCore(320,160,2,-1);
  s.startPairBloom();s.step(1000/60);expect(hazard).toBe(true);
});
it('holds danger time during atomic Bloom and resumes the remaining time afterwards',()=>{
  const s=state();s.setHazardState(true);s.update(2500);
  const remaining=s.getIntegrityPercent();s.update(650,true);
  expect(s.getIntegrityPercent()).toBe(remaining);expect(s.getStatus()).not.toBe('GAMEOVER');
  s.update(500);expect(s.getStatus()).toBe('GAMEOVER');
});
