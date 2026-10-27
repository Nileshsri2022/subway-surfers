import { describe, expect, it } from 'vitest';
import { createPlayerState, requestJump, requestRoll, startJetpack, updatePlayer } from '../src/game/player';
import {
  boxesOverlap,
  coinDistanceSq,
  COIN_PICKUP_RADIUS,
  hitsObstacle,
  obstacleBox,
  playerBox,
  sweepsOverlap,
} from '../src/game/collision';
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
    const flying = createPlayerState();
    startJetpack(flying);
    expect(hitsObstacle(flying, -4, -3.5, train(0), -4)).toBe(false);

    const invulnerable = createPlayerState();
    invulnerable.invulnerable = 1;
    expect(hitsObstacle(invulnerable, -4, -3.5, train(0), -4)).toBe(false);
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

  it('exports the coin pickup radius and includes a coin exactly at the threshold', () => {
    const s = createPlayerState();
    const thresholdSq = COIN_PICKUP_RADIUS ** 2;
    expect(COIN_PICKUP_RADIUS).toBeCloseTo(0.85, 12);

    const atThreshold = coinDistanceSq(s, -4, { lane: 0, z: 0, y: 0.9 - COIN_PICKUP_RADIUS }, -4);
    expect(atThreshold).toBe(thresholdSq);
    expect(atThreshold).toBeLessThanOrEqual(thresholdSq);

    const beyond = coinDistanceSq(s, -4, { lane: 0, z: 0, y: 0.9 - COIN_PICKUP_RADIUS - 1e-6 }, -4);
    expect(beyond).toBeGreaterThan(thresholdSq);
  });

  it('hits a train while jumping', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.3);
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(true);
  });

  it('hits an overhead barrier while jumping', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.3);
    expect(hitsObstacle(s, -4, -3.5, overhead(0), -4)).toBe(true);
  });

  it('hits a train while rolling', () => {
    const s = createPlayerState();
    requestRoll(s);
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(true);
  });

  it('hits a low barrier while rolling', () => {
    const s = createPlayerState();
    requestRoll(s);
    expect(hitsObstacle(s, -4, -3.5, low(0), -4)).toBe(true);
  });

  it('reports a near miss up to one full step early under symmetric expansion', () => {
    const s = createPlayerState();
    const z = -4;
    const previousZ = -3.5; // 0.5 m in one 60 Hz frame at 30 m/s
    const spec = low(0);
    const worldZ = -4.6; // near edge sits just beyond the end-of-step player box

    // Deliberately conservative: symmetric expansion can register a hit up to one full
    // step early (0.5 m at 30 m/s, i.e. a single 60 Hz frame) rather than a pass-through.
    expect(boxesOverlap(playerBox(s, z), obstacleBox(spec, worldZ))).toBe(false);
    expect(hitsObstacle(s, z, previousZ, spec, worldZ)).toBe(true);
  });

  it('catches a barrier crossed entirely between two samples (tunneling regression)', () => {
    const s = createPlayerState();
    const previousZ = 2.0;
    const z = -1.5;
    const spec = low(0);
    const worldZ = 1; // barrier box [0, 1]

    // Start player box [1.5, 2.5] and end player box [-2, -1] are both disjoint
    // from the barrier; the 3.5 m step passes over it entirely.
    expect(boxesOverlap(playerBox(s, previousZ), obstacleBox(spec, worldZ))).toBe(false);
    expect(boxesOverlap(playerBox(s, z), obstacleBox(spec, worldZ))).toBe(false);
    expect(hitsObstacle(s, z, previousZ, spec, worldZ)).toBe(true);
  });
});
