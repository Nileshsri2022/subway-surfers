// Power-up timers. Pure: no PlayCanvas, no DOM, no player imports.

import {
  HOVERBOARD_INVULN_SECONDS,
  JETPACK_SECONDS,
  MAGNET_SECONDS,
  MULTIPLIER_SECONDS,
} from '../config/tuning';
import type { PowerUpKind } from './types';

export interface ActivePowerUps {
  magnet: number;
  jetpack: number;
  multiplier: number;
  invulnerable: number;
  hoverboard: boolean;
}

const DURATION_SECONDS: Record<PowerUpKind, number> = {
  magnet: MAGNET_SECONDS,
  jetpack: JETPACK_SECONDS,
  multiplier: MULTIPLIER_SECONDS,
};

export function createPowerUps(): ActivePowerUps {
  return {
    magnet: 0,
    jetpack: 0,
    multiplier: 0,
    invulnerable: 0,
    hoverboard: false,
  };
}

// Re-activation restarts the timer at its full duration; kinds stack independently.
export function activatePowerUp(state: ActivePowerUps, kind: PowerUpKind): void {
  state[kind] = DURATION_SECONDS[kind];
}

export function tickPowerUps(state: ActivePowerUps, dt: number): { jetpackEnded: boolean } {
  const jetpackBefore = state.jetpack;
  state.magnet = Math.max(0, state.magnet - dt);
  state.jetpack = Math.max(0, state.jetpack - dt);
  state.multiplier = Math.max(0, state.multiplier - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  return { jetpackEnded: jetpackBefore > 0 && state.jetpack === 0 };
}

export function consumeHoverboard(state: ActivePowerUps): boolean {
  if (!state.hoverboard) {
    return false;
  }
  state.hoverboard = false;
  state.invulnerable = Math.max(state.invulnerable, HOVERBOARD_INVULN_SECONDS);
  return true;
}
