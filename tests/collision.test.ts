import { describe, expect, it } from 'vitest';
import { createPlayerState, requestJump, requestRoll, startJetpack, updatePlayer } from '../src/game/player';
import { boxesOverlap, coinDistanceSq, hitsObstacle, sweepsOverlap, playerBox, obstacleBox } from '../src/game/collision';
import type { ObstacleSpec } from '../src/game/types';

const train = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'train', lane, z: 0, length: 8 });
const low = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'lowBarrier', lane, z: 0, length: 1 });
const overhead = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'overhead', lane, z: 0, length: 1 });

describe('collision', () => {
  it('hits a train in the same lane and misses the adjacent lane', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(true);
    expect(hitsObstacle(s, -4, -3.5, train(1), -4)).toBe(false);
  });

  it('requires a jump for a low barrier', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, low(0), -4)).toBe(true);
    requestJump(s);
    updatePlayer(s, 0.3);
    expect(hitsObstacle(s, -4, -3.5, low(0), -4)).toBe(false);
  });

  it('requires a roll for an overhead barrier', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, overhead(0), -4)).toBe(true);
    requestRoll(s);
    expect(hitsObstacle(s, -4, -3.5, overhead(0), -4)).toBe(false);
  });

  it('ignores collisions during jetpack and invulnerability', () => {
    const s = createPlayerState();
    startJetpack(s);
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(false);
    s.jetpack = false;
    s.invulnerable = 1;
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(false);
  });

  it('sweeps thin obstacles at 0.5 metres per frame', () => {
    const a = playerBox(createPlayerState(), -1);
    const b = obstacleBox(low(0), -0.6);
    expect(sweepsOverlap(a, -0.1, b)).toBe(true);
  });

  it('measures coin pickup distance', () => {
    const s = createPlayerState();
    expect(coinDistanceSq(s, -4, { lane: 0, z: 0, y: 0.9 }, -4)).toBe(0);
    expect(coinDistanceSq(s, -4, { lane: 1, z: 0, y: 0.9 }, -4)).toBeGreaterThan(4);
  });

  it('catches a 1 m barrier skipped by a 0.5 m max-speed step (tunneling regression)', () => {
    const s = createPlayerState();
    const z = -4;
    const previousZ = -3.5; // 0.5 m in one 60 Hz frame at 30 m/s
    const spec = low(0);
    const worldZ = -4.6; // near edge sits just beyond the end-of-step player box

    expect(boxesOverlap(playerBox(s, z), obstacleBox(spec, worldZ))).toBe(false);
    expect(hitsObstacle(s, z, previousZ, spec, worldZ)).toBe(true);
  });
});
