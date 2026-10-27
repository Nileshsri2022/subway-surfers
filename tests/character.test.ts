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
});
