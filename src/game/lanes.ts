// Lane helpers. Pure math: no PlayCanvas, no DOM, no window.

import { LANE_WIDTH, LANE_X } from '../config/tuning';
import type { Lane } from './types';

export function laneToX(lane: Lane): number {
  return LANE_X[lane + 1];
}

export function nearestLane(x: number): Lane {
  const index = Math.round(x / LANE_WIDTH) + 0; // `+ 0` normalizes -0 to 0
  return Math.max(-1, Math.min(1, index)) as Lane;
}

export function clampLane(value: number): Lane {
  const index = Math.round(value) + 0; // `+ 0` normalizes -0 to 0
  return Math.max(-1, Math.min(1, index)) as Lane;
}
