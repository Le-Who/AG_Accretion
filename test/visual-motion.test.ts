import { describe, expect, it } from 'vitest';
import { PhysicsSimulation } from '../src/physics/simulation.js';
import { SquishSystem } from '../src/render/squishSystem.js';

const sim = () => new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){},onHazardStateChange(){}});

describe('Visual motion without slower physics', () => {
  it('reports impacts between different tiers so surviving slimes visibly squish', () => {
    let impacts=0;
    const s=new PhysicsSimulation({onMerge(){},onCentralCoreLevelUp(){},onCollisionImpact(){impacts++;},onHazardStateChange(){}});
    s.spawnCore(100,100,2,1,4,0);
    s.spawnCore(150,100,3,1,-4,0);
    s.step(1000/60);
    expect(impacts).toBeGreaterThan(0);
  });
  it('interpolates between fixed steps without changing physical position', () => {
    const s=sim(); const e=s.spawnCore(130,320,4,1,3,0);
    s.step(1000/60);
    const body=s.getBodies().get(e.bodyId)!;
    const physical=body.position.x;
    const first=s.getRenderPose(e.bodyId)!;
    s.step(1000/120);
    const middle=s.getRenderPose(e.bodyId)!;
    expect(body.position.x).toBe(physical);
    expect(first.x).toBeCloseTo(130);
    expect(middle.x).toBeCloseTo((130+physical)/2);
    s.reset(); expect(s.getRenderPose(e.bodyId)).toBeUndefined();
  });
  it('turns collision spring displacement into bounded volume-preserving visual squish', () => {
    const squish=new SquishSystem(30);
    squish.getOrCreateMesh(1,30);
    squish.onCollisionImpact(1,2,{x:1,y:0},18);
    const s=sim(); const e=s.spawnCore(130,320,4,1);
    squish.getOrCreateMesh(e.bodyId,36);
    squish.onCollisionImpact(e.bodyId,2,{x:1,y:0},18);
    squish.step(.03,s.getEntities(),s.getCentralEntity(),s.getBodies());
    const expr=squish.getExpression(e.bodyId);
    expect(expr.squishScaleX).toBeLessThan(1);
    expect(expr.squishScaleY).toBeGreaterThan(1);
    expect(expr.squishScaleX*expr.squishScaleY).toBeCloseTo(1,4);
    expect(expr.squishScaleX).toBeGreaterThanOrEqual(.88);
  });
});
