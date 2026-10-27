import { describe, expect, it } from 'vitest';
import { TRACK_CHUNK_LENGTH } from '../src/config/tuning';
import { PATTERNS, isPatternSurvivable } from '../src/game/patterns';
import type { Pattern } from '../src/game/types';

describe('patterns', () => {
  it('marks every authored pattern survivable', () => {
    for (const pattern of PATTERNS) {
      expect(isPatternSurvivable(pattern), JSON.stringify(pattern)).toBe(true);
    }
  });

  it('rejects a pattern that blocks all three lanes', () => {
    const impossible: Pattern = {
      obstacles: [-1, 0, 1].map((lane) => ({
        kind: 'train', lane: lane as -1 | 0 | 1, z: 5, length: 8
      })),
      coins: [], powerUps: []
    };
    expect(isPatternSurvivable(impossible)).toBe(false);
  });

  it('accepts an empty pattern', () => {
    expect(isPatternSurvivable({ obstacles: [], coins: [], powerUps: [] })).toBe(true);
  });
});

describe('fairness edge cases', () => {
  it('lets a player leave a lane that closes at the next metre', () => {
    const squeezing: Pattern = {
      obstacles: [
        { kind: 'lowBarrier', lane: -1, z: 0, length: 1 },
        { kind: 'lowBarrier', lane: 1, z: 0, length: 1 },
        { kind: 'lowBarrier', lane: 0, z: 1, length: 1 }
      ],
      coins: [],
      powerUps: []
    };
    expect(isPatternSurvivable(squeezing)).toBe(true);
  });

  it('rejects a corridor that needs two lane changes in one metre', () => {
    const tooTight: Pattern = {
      obstacles: [
        { kind: 'lowBarrier', lane: -1, z: 0, length: 1 },
        { kind: 'lowBarrier', lane: 0, z: 0, length: 1 },
        { kind: 'lowBarrier', lane: 0, z: 1, length: 1 },
        { kind: 'lowBarrier', lane: 1, z: 1, length: 1 }
      ],
      coins: [],
      powerUps: []
    };
    expect(isPatternSurvivable(tooTight)).toBe(false);
  });
});

describe('authored pattern invariants', () => {
  it('has at least eight patterns with a trivially safe fallback first', () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(8);
    expect(PATTERNS[0].obstacles).toHaveLength(0);
  });

  it('keeps every obstacle fully inside its chunk with an authored length', () => {
    for (const pattern of PATTERNS) {
      for (const obstacle of pattern.obstacles) {
        const label = JSON.stringify(obstacle);
        expect(obstacle.z, label).toBeGreaterThanOrEqual(0);
        expect(obstacle.z + obstacle.length, label).toBeLessThanOrEqual(TRACK_CHUNK_LENGTH);
        expect(obstacle.length, label).toBe(obstacle.kind === 'train' ? 8 : 1);
        expect([-1, 0, 1], label).toContain(obstacle.lane);
      }
    }
  });

  it('keeps coins out of obstacle lanes and intervals', () => {
    for (const pattern of PATTERNS) {
      for (const coin of pattern.coins) {
        const label = JSON.stringify(coin);
        expect(coin.z, label).toBeGreaterThanOrEqual(0);
        expect(coin.z, label).toBeLessThan(TRACK_CHUNK_LENGTH);
        for (const obstacle of pattern.obstacles) {
          const inside =
            coin.lane === obstacle.lane &&
            coin.z >= obstacle.z &&
            coin.z < obstacle.z + obstacle.length;
          expect(inside, `coin ${label} overlaps ${JSON.stringify(obstacle)}`).toBe(false);
        }
      }
    }
  });

  it('places power-ups on lanes that are clear at their z', () => {
    for (const pattern of PATTERNS) {
      for (const powerUp of pattern.powerUps) {
        const label = JSON.stringify(powerUp);
        expect(powerUp.z, label).toBeGreaterThanOrEqual(0);
        expect(powerUp.z, label).toBeLessThan(TRACK_CHUNK_LENGTH);
        for (const obstacle of pattern.obstacles) {
          const inside =
            powerUp.lane === obstacle.lane &&
            powerUp.z >= obstacle.z &&
            powerUp.z < obstacle.z + obstacle.length;
          expect(inside, `power-up ${label} overlaps ${JSON.stringify(obstacle)}`).toBe(false);
        }
      }
    }
  });

  it('includes the required obstacle mix', () => {
    const withTrain = PATTERNS.filter((pattern) =>
      pattern.obstacles.some((obstacle) => obstacle.kind === 'train')
    );
    const withLowBarrier = PATTERNS.filter((pattern) =>
      pattern.obstacles.some((obstacle) => obstacle.kind === 'lowBarrier')
    );
    const withOverhead = PATTERNS.filter((pattern) =>
      pattern.obstacles.some((obstacle) => obstacle.kind === 'overhead')
    );

    expect(withTrain.length).toBeGreaterThanOrEqual(3);
    expect(withLowBarrier.length).toBeGreaterThanOrEqual(2);
    expect(withOverhead.length).toBeGreaterThanOrEqual(2);
    expect(withTrain.some((pattern) =>
      pattern.obstacles.some((obstacle) => obstacle.kind === 'train' && obstacle.lane === 0)
    )).toBe(true);
    expect(withTrain.some((pattern) => {
      const trainLanes = new Set(
        pattern.obstacles.filter((obstacle) => obstacle.kind === 'train').map((obstacle) => obstacle.lane)
      );
      return trainLanes.size >= 2;
    })).toBe(true);
    expect(PATTERNS.some((pattern) =>
      pattern.obstacles.some((obstacle) => obstacle.kind === 'train') &&
      pattern.obstacles.some((obstacle) => obstacle.kind !== 'train')
    )).toBe(true);
  });

  it('spreads power-ups across all kinds and at least four patterns', () => {
    const kinds = new Set(
      PATTERNS.flatMap((pattern) => pattern.powerUps.map((powerUp) => powerUp.kind))
    );
    expect(kinds).toEqual(new Set(['magnet', 'jetpack', 'multiplier']));
    expect(PATTERNS.filter((pattern) => pattern.powerUps.length > 0).length).toBeGreaterThanOrEqual(4);
  });

  it('has straight coin runs, a jump arc and a duck arc', () => {
    const hasStraightRun = PATTERNS.some((pattern) => {
      const rows = new Map<number, number>();
      for (const coin of pattern.coins) {
        if (coin.y === 0.9) rows.set(coin.lane, (rows.get(coin.lane) ?? 0) + 1);
      }
      return [...rows.values()].some((count) => count >= 5);
    });
    expect(hasStraightRun).toBe(true);
    expect(PATTERNS.some((pattern) => pattern.coins.some((coin) => coin.y >= 1.7))).toBe(true);
    expect(PATTERNS.some((pattern) => pattern.coins.some((coin) => coin.y <= 0.5))).toBe(true);
  });
});
