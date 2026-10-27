// Lane-space collision and pickup math. Pure: no PlayCanvas, no DOM, no window.

import { COIN_RADIUS, PLAYER_HALF_WIDTH } from '../config/tuning';
import { laneToX } from './lanes';
import { playerCenterY, playerHalfHeight, playerLaneX } from './player';
import type { PlayerState } from './player';
import type { CoinSpec, ObstacleSpec } from './types';

export interface Box {
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
}

export const COIN_PICKUP_RADIUS = COIN_RADIUS + PLAYER_HALF_WIDTH;

const PLAYER_HALF_DEPTH = 0.5;
const OBSTACLE_HALF_WIDTH = 0.9;

// Obstacle vertical geometry. `cy` is the box centre and `hy` its half-height.
const OBSTACLE_VERTICAL: Record<ObstacleSpec['kind'], { cy: number; hy: number }> = {
  train: { cy: 1.8, hy: 1.8 },
  lowBarrier: { cy: 0.5, hy: 0.5 },
  overhead: { cy: 1.6, hy: 0.4 },
};

function newBox(): Box {
  return { cx: 0, cy: 0, cz: 0, hx: 0, hy: 0, hz: 0 };
}

function fillPlayerBox(target: Box, state: PlayerState, z: number): void {
  target.cx = playerLaneX(state);
  target.cy = playerCenterY(state);
  target.cz = z;
  target.hx = PLAYER_HALF_WIDTH;
  target.hy = playerHalfHeight(state);
  target.hz = PLAYER_HALF_DEPTH;
}

// `worldZ` is the obstacle's near (player-facing) edge; forward is -Z.
function fillObstacleBox(target: Box, spec: ObstacleSpec, worldZ: number): void {
  const { cy, hy } = OBSTACLE_VERTICAL[spec.kind];
  target.cx = laneToX(spec.lane);
  target.cy = cy;
  target.cz = worldZ - spec.length / 2;
  target.hx = OBSTACLE_HALF_WIDTH;
  target.hy = hy;
  target.hz = spec.length / 2;
}

export function playerBox(state: PlayerState, z: number): Box {
  const box = newBox();
  fillPlayerBox(box, state, z);
  return box;
}

export function obstacleBox(spec: ObstacleSpec, worldZ: number): Box {
  const box = newBox();
  fillObstacleBox(box, spec, worldZ);
  return box;
}

// Inclusive AABB test, with optional padding applied to the second box's depth.
function overlaps(a: Box, b: Box, zPadding: number): boolean {
  return (
    Math.abs(a.cx - b.cx) <= a.hx + b.hx &&
    Math.abs(a.cy - b.cy) <= a.hy + b.hy &&
    Math.abs(a.cz - b.cz) <= a.hz + b.hz + zPadding
  );
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return overlaps(a, b, 0);
}

// Anti-tunneling: widen the obstacle by the distance the player moved this step.
export function sweepsOverlap(player: Box, previousZ: number, obstacle: Box): boolean {
  return overlaps(player, obstacle, Math.abs(player.cz - previousZ));
}

const playerScratch = newBox();
const obstacleScratch = newBox();

export function hitsObstacle(
  state: PlayerState,
  z: number,
  previousZ: number,
  spec: ObstacleSpec,
  obstacleWorldZ: number,
): boolean {
  if (state.invulnerable > 0 || state.jetpack) {
    return false;
  }
  fillPlayerBox(playerScratch, state, z);
  fillObstacleBox(obstacleScratch, spec, obstacleWorldZ);
  return sweepsOverlap(playerScratch, previousZ, obstacleScratch);
}

// `coinWorldZ` is authoritative; `coin.z` is the chunk-local spawn value (R17).
export function coinDistanceSq(
  state: PlayerState,
  z: number,
  coin: CoinSpec,
  coinWorldZ: number,
): number {
  const dx = playerLaneX(state) - laneToX(coin.lane);
  const dy = playerCenterY(state) - coin.y;
  const dz = z - coinWorldZ;
  return dx * dx + dy * dy + dz * dz;
}
