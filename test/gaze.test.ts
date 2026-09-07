import { expect, it } from 'vitest';
import { gazeOffset } from '../src/render/gaze.js';
it('returns neutral gaze when disabled or no pointer exists', () => {
  expect(gazeOffset(0, 0, 1, null)).toEqual({ x: 0, y: 0 });
});
it('tracks in local coordinates and clamps far-away cursor motion', () => {
  const gaze = gazeOffset(0, 0, Math.PI / 2, { x: 1000, y: 0 });
  expect(gaze.x).toBeCloseTo(0);
  expect(gaze.y).toBeCloseTo(-1);
  expect(gazeOffset(0, 0, 0, { x: 10, y: 0 }).x).toBeCloseTo(.1);
});
