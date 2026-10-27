import { describe, expect, it } from 'vitest';
import { Rng } from '../src/game/rng';
import { TrackGenerator } from '../src/game/track';
import { isPatternSurvivable } from '../src/game/patterns';
import type { Pattern } from '../src/game/types';

describe('TrackGenerator', () => {
  it('starts each chunk at index times 30', () => {
    const gen = new TrackGenerator(new Rng(1));
    expect(gen.nextChunk(0).startZ).toBe(0);
    expect(gen.nextChunk(3).startZ).toBe(90);
  });

  it('is deterministic for a seed', () => {
    const a = new TrackGenerator(new Rng(9));
    const b = new TrackGenerator(new Rng(9));
    expect(a.nextChunk(0)).toEqual(b.nextChunk(0));
  });

  it('generates only survivable chunks across 10,000 seeds', () => {
    for (let seed = 0; seed < 10_000; seed += 1) {
      const gen = new TrackGenerator(new Rng(seed));
      const chunk = gen.nextChunk(0);
      expect(isPatternSurvivable(chunk.pattern), `seed ${seed}`).toBe(true);
    }
  });
});

describe('TrackGenerator chunk metadata', () => {
  it('reports the requested chunk index', () => {
    const gen = new TrackGenerator(new Rng(4));
    expect(gen.nextChunk(7).index).toBe(7);
  });

  it('varies the pattern across seeds', () => {
    const seen = new Set<Pattern>();
    for (let seed = 0; seed < 50; seed += 1) {
      seen.add(new TrackGenerator(new Rng(seed)).nextChunk(0).pattern);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
