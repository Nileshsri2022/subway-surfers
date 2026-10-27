import { describe, expect, it } from 'vitest';
import { Rng } from '../src/game/rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
  it('stays in range', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = r.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(r.int(3)).toBeGreaterThanOrEqual(0);
      expect(r.int(3)).toBeLessThan(3);
    }
  });
});
