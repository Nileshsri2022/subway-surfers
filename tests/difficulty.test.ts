import { describe, expect, it } from 'vitest';
import { difficultyAt, speedAt } from '../src/game/difficulty';

describe('difficulty', () => {
  it('ramps speed monotonically and clamps', () => {
    expect(speedAt(0)).toBe(12);
    expect(speedAt(180)).toBe(30);
    expect(speedAt(999)).toBe(30);
    for (let t = 0; t < 200; t += 5) expect(speedAt(t + 5)).toBeGreaterThanOrEqual(speedAt(t));
  });
  it('normalizes difficulty to 0..1', () => {
    expect(difficultyAt(0)).toBe(0);
    expect(difficultyAt(180)).toBe(1);
  });
});