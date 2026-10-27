import { describe, expect, it } from 'vitest';
import { activatePowerUp, consumeHoverboard, createPowerUps, tickPowerUps } from '../src/game/powerups';

describe('power-ups', () => {
  it('stacks independent timers', () => {
    const p = createPowerUps();
    activatePowerUp(p, 'magnet');
    activatePowerUp(p, 'jetpack');
    activatePowerUp(p, 'multiplier');
    expect(p.magnet).toBe(10);
    expect(p.jetpack).toBe(8);
    expect(p.multiplier).toBe(15);
    tickPowerUps(p, 1);
    expect(p.magnet).toBe(9);
    expect(p.jetpack).toBe(7);
  });

  it('reports the jetpack ending once', () => {
    const p = createPowerUps();
    activatePowerUp(p, 'jetpack');
    expect(tickPowerUps(p, 8).jetpackEnded).toBe(true);
    expect(tickPowerUps(p, 1).jetpackEnded).toBe(false);
  });

  it('consumes the hoverboard once and grants invulnerability', () => {
    const p = createPowerUps();
    p.hoverboard = true;
    expect(consumeHoverboard(p)).toBe(true);
    expect(consumeHoverboard(p)).toBe(false);
    expect(p.invulnerable).toBeGreaterThan(0);
  });

  it('resets only the re-activated timer', () => {
    const p = createPowerUps();
    activatePowerUp(p, 'magnet');
    activatePowerUp(p, 'jetpack');
    activatePowerUp(p, 'multiplier');
    tickPowerUps(p, 5);
    activatePowerUp(p, 'magnet');
    expect(p.magnet).toBe(10);
    expect(p.jetpack).toBe(3);
    expect(p.multiplier).toBe(10);
  });
});
