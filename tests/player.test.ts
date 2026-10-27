import { describe, expect, it } from 'vitest';
import {
  createPlayerState, endJetpack, playerHalfHeight, requestJump, requestLane,
  requestRoll, startJetpack, updatePlayer
} from '../src/game/player';

describe('player state', () => {
  it('completes a lane change in 0.12 seconds', () => {
    const s = createPlayerState();
    requestLane(s, 1);
    updatePlayer(s, 0.06);
    expect(s.laneT).toBeCloseTo(0.5);
    updatePlayer(s, 0.06);
    expect(s.lane).toBe(1);
    expect(s.laneT).toBe(1);
  });

  it('ignores a second lane request during a transition', () => {
    const s = createPlayerState();
    requestLane(s, 1);
    requestLane(s, -1);
    updatePlayer(s, 0.12);
    expect(s.lane).toBe(1);
  });

  it('jumps and lands', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.2);
    expect(s.y).toBeGreaterThan(0);
    updatePlayer(s, 0.4);
    expect(s.y).toBe(0);
    expect(s.airborne).toBe(false);
  });

  it('rolls for 0.6 seconds and lowers the hitbox', () => {
    const s = createPlayerState();
    const standing = playerHalfHeight(s);
    requestRoll(s);
    expect(playerHalfHeight(s)).toBeLessThan(standing);
    updatePlayer(s, 0.61);
    expect(s.rolling).toBe(false);
  });

  it('fast-falls when rolling in the air', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.1);
    requestRoll(s);
    expect(s.vy).toBeLessThan(0);
    expect(s.rolling).toBe(false);
  });

  it('descends safely after the jetpack ends', () => {
    const s = createPlayerState();
    startJetpack(s);
    expect(s.y).toBe(4.5);
    endJetpack(s);
    updatePlayer(s, 0.3);
    expect(s.y).toBeGreaterThan(0);
    expect(s.invulnerable).toBeGreaterThan(0);
    updatePlayer(s, 0.31);
    expect(s.y).toBe(0);
  });
});
