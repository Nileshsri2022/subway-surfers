// Player state machine. Pure motion: no PlayCanvas, no DOM, no window.

import {
  GRAVITY,
  JETPACK_ALTITUDE,
  JETPACK_DESCENT_SECONDS,
  JUMP_VELOCITY,
  LANE_CHANGE_SECONDS,
  PLAYER_HEIGHT,
  PLAYER_ROLL_HEIGHT,
  ROLL_SECONDS,
} from '../config/tuning';
import { clampLane, laneToX } from './lanes';
import type { Lane } from './types';

export interface PlayerState {
  lane: Lane;
  laneFrom: Lane;
  laneTo: Lane;
  laneT: number;
  y: number;
  vy: number;
  rolling: boolean;
  rollRemaining: number;
  airborne: boolean;
  jetpack: boolean;
  descentRemaining: number;
  invulnerable: number;
}

export function createPlayerState(): PlayerState {
  return {
    lane: 0,
    laneFrom: 0,
    laneTo: 0,
    laneT: 1,
    y: 0,
    vy: 0,
    rolling: false,
    rollRemaining: 0,
    airborne: false,
    jetpack: false,
    descentRemaining: 0,
    invulnerable: 0,
  };
}

export function requestLane(state: PlayerState, dir: -1 | 1): void {
  const target = clampLane(state.lane + dir);
  if (target === state.lane) {
    return;
  }
  if (state.laneT < 1) {
    return;
  }
  state.laneFrom = state.lane;
  state.laneTo = target;
  state.laneT = 0;
}

export function requestJump(state: PlayerState): void {
  if (state.airborne || state.rolling || state.jetpack || state.y > 0) {
    return;
  }
  state.airborne = true;
  state.vy = JUMP_VELOCITY;
}

export function requestRoll(state: PlayerState): void {
  const grounded = !state.airborne && !state.jetpack && state.y <= 0;
  if (grounded) {
    state.rolling = true;
    state.rollRemaining = ROLL_SECONDS;
    return;
  }
  state.vy = -JUMP_VELOCITY;
}

export function updatePlayer(state: PlayerState, dt: number): void {
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  if (state.rollRemaining > 0) {
    state.rollRemaining = Math.max(0, state.rollRemaining - dt);
    if (state.rollRemaining === 0) {
      state.rolling = false;
    }
  }

  if (state.laneT < 1) {
    state.laneT += dt / LANE_CHANGE_SECONDS;
    if (state.laneT >= 1) {
      state.lane = state.laneTo;
      state.laneT = 1;
    }
  }

  if (state.jetpack) {
    state.y = JETPACK_ALTITUDE;
  } else if (state.descentRemaining > 0) {
    state.descentRemaining = Math.max(0, state.descentRemaining - dt);
    state.y = ((JETPACK_ALTITUDE - PLAYER_HEIGHT / 2) * state.descentRemaining) / JETPACK_DESCENT_SECONDS;
  } else if (state.airborne) {
    state.y += state.vy * dt + (GRAVITY * dt * dt) / 2;
    state.vy += GRAVITY * dt;
    if (state.y <= 0) {
      state.y = 0;
      state.vy = 0;
      state.airborne = false;
    }
  }
}

export function playerLaneX(state: PlayerState): number {
  const eased = state.laneT * state.laneT * (3 - 2 * state.laneT);
  const fromX = laneToX(state.laneFrom);
  return fromX + (laneToX(state.laneTo) - fromX) * eased;
}

export function playerHalfHeight(state: PlayerState): number {
  return state.rolling ? PLAYER_ROLL_HEIGHT / 2 : PLAYER_HEIGHT / 2;
}

export function playerCenterY(state: PlayerState): number {
  if (state.jetpack) {
    return JETPACK_ALTITUDE;
  }
  if (state.rolling) {
    return PLAYER_ROLL_HEIGHT / 2;
  }
  return state.y + playerHalfHeight(state);
}

export function startJetpack(state: PlayerState): void {
  state.jetpack = true;
  state.y = JETPACK_ALTITUDE;
  state.vy = 0;
  state.airborne = false;
}

export function endJetpack(state: PlayerState): void {
  state.jetpack = false;
  state.y = JETPACK_ALTITUDE - PLAYER_HEIGHT / 2;
  state.descentRemaining = JETPACK_DESCENT_SECONDS;
  state.invulnerable = Math.max(state.invulnerable, JETPACK_DESCENT_SECONDS + 0.2);
}
