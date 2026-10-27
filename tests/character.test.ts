import { describe, expect, it } from 'vitest';
import { runPose } from '../src/render/character';

describe('runPose', () => {
  it('is deterministic and bounded', () => {
    for (let d = 0; d < 50; d += 0.25) {
      const pose = runPose(d);
      expect(Math.abs(pose.armSwing)).toBeLessThanOrEqual(1);
      expect(Math.abs(pose.legSwing)).toBeLessThanOrEqual(1);
      expect(pose.bob).toBeGreaterThanOrEqual(0);
      expect(pose.bob).toBeLessThan(0.1);
    }
  });

  it('matches the expected phase at a quarter turn', () => {
    const pose = runPose(Math.PI / (2 * 2.2));
    expect(pose.armSwing).toBeCloseTo(1, 10);
    expect(pose.legSwing).toBeCloseTo(-1, 10);
    expect(pose.bob).toBeCloseTo(0.05, 10);
  });
});
