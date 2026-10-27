import { describe, expect, it } from 'vitest';
import { clampLane, laneToX, nearestLane } from '../src/game/lanes';

describe('lanes', () => {
  it('maps lanes to x positions', () => {
    expect(laneToX(-1)).toBe(-2.5);
    expect(laneToX(0)).toBe(0);
    expect(laneToX(1)).toBe(2.5);
  });
  it('snaps x to the nearest lane at the midpoints', () => {
    expect(nearestLane(-1.24)).toBe(0);
    expect(nearestLane(-1.26)).toBe(-1);
    expect(nearestLane(1.24)).toBe(0);
    expect(nearestLane(1.26)).toBe(1);
  });
  it('clamps out-of-range lanes', () => {
    expect(clampLane(-4)).toBe(-1);
    expect(clampLane(3)).toBe(1);
  });
});
