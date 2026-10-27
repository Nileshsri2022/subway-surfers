// Authored track patterns and the fairness check that gates them.
// Pure data and integer math: no PlayCanvas, no DOM, no window.

import { TRACK_CHUNK_LENGTH } from '../config/tuning';
import type { CoinSpec, Lane, ObstacleSpec, Pattern, PowerUpSpec } from './types';

// Pattern geometry is authoring data: trains are 8 m long, both barrier
// kinds are 1 m deep. Lane spacing itself lives in tuning.ts.
const TRAIN_LENGTH = 8;
const BARRIER_LENGTH = 1;
const STRAIGHT_COIN_Y = 0.9;
const ARC_APEX_Y = 1.8;
const DUCK_Y = 0.5;

// Three lanes as a bitmask: lane -1 is bit 0, lane 0 is bit 1, lane 1 is bit 2.
const ALL_LANES = 0b111;

function train(lane: Lane, z: number): ObstacleSpec {
  return { kind: 'train', lane, z, length: TRAIN_LENGTH };
}

function lowBarrier(lane: Lane, z: number): ObstacleSpec {
  return { kind: 'lowBarrier', lane, z, length: BARRIER_LENGTH };
}

function overhead(lane: Lane, z: number): ObstacleSpec {
  return { kind: 'overhead', lane, z, length: BARRIER_LENGTH };
}

function coinRow(lane: Lane, fromZ: number, toZ: number): CoinSpec[] {
  const coins: CoinSpec[] = [];
  for (let z = fromZ; z <= toZ; z += 2) {
    coins.push({ lane, z, y: STRAIGHT_COIN_Y });
  }
  return coins;
}

function powerUp(kind: PowerUpSpec['kind'], lane: Lane, z: number): PowerUpSpec {
  return { kind, lane, z };
}

/**
 * Returns whether a player who may move at most one lane per metre can always
 * find a free lane while travelling through the chunk. Every authored pattern
 * must pass this; TrackGenerator also uses it to vet random picks.
 *
 * Obstacles are conservatively treated as blocking their whole lane interval,
 * including jump/roll gates: a pattern must always offer an exit lane, not just
 * a possible jump. The reachable set is expanded before blocked lanes are
 * removed, so a player can leave a lane that becomes blocked on the next metre.
 */
export function isPatternSurvivable(pattern: Pattern): boolean {
  const { obstacles } = pattern;
  let reachable = ALL_LANES;

  // Samples at 0 m, 1 m, ... 29 m. Each obstacle must lie fully inside the
  // chunk, so no interval is validated against the wrong chunk.
  for (let z = 0; z < TRACK_CHUNK_LENGTH; z += 1) {
    let blocked = 0;
    for (let i = 0; i < obstacles.length; i += 1) {
      const obstacle = obstacles[i];
      if (obstacle.z <= z && z < obstacle.z + obstacle.length) {
        blocked |= 1 << (obstacle.lane + 1);
      }
    }

    // Move at most one lane, then reject lanes occupied at this metre.
    const expanded = (reachable | (reachable << 1) | (reachable >> 1)) & ALL_LANES;
    reachable = expanded & ~blocked & ALL_LANES;
    if (reachable === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Authored chunk layouts. Entries are immutable: consumers must never mutate
 * a pattern or its arrays. Index 0 is the trivially safe fallback.
 */
export const PATTERNS: readonly Pattern[] = [
  // 0: A clean opening lane with a centre coin run. Trivially safe fallback.
  {
    obstacles: [],
    coins: coinRow(0, 2, 28),
    powerUps: [],
  },

  // 1: Centre train; side lanes stay open, with a magnet on the quiet left.
  {
    obstacles: [train(0, 6)],
    coins: coinRow(1, 2, 28),
    powerUps: [powerUp('magnet', -1, 16)],
  },

  // 2: Trains on both sides; thread the centre for a multiplier.
  {
    obstacles: [train(-1, 8), train(1, 8)],
    coins: coinRow(0, 2, 28),
    powerUps: [powerUp('multiplier', 0, 24)],
  },

  // 3: Left train, then a low barrier on the right. Centre coins lead into a
  // jump arc over the barrier and a jetpack on the now-clear right lane.
  {
    obstacles: [train(-1, 6), lowBarrier(1, 18)],
    coins: [
      ...coinRow(0, 2, 14),
      { lane: 1, z: 15, y: STRAIGHT_COIN_Y },
      { lane: 1, z: 16, y: 1.35 },
      { lane: 1, z: 17, y: ARC_APEX_Y },
      { lane: 1, z: 19, y: 1.35 },
      { lane: 1, z: 20, y: STRAIGHT_COIN_Y },
    ],
    powerUps: [powerUp('jetpack', 1, 24)],
  },

  // 4: Twin low-barrier gates in opposite side lanes; the centre is always
  // open, and a left-lane jump arc rewards a detour.
  {
    obstacles: [lowBarrier(-1, 8), lowBarrier(1, 20)],
    coins: [
      ...coinRow(0, 2, 28),
      { lane: -1, z: 6, y: STRAIGHT_COIN_Y },
      { lane: -1, z: 7, y: ARC_APEX_Y },
      { lane: -1, z: 9, y: 1.35 },
      { lane: -1, z: 10, y: STRAIGHT_COIN_Y },
    ],
    powerUps: [],
  },

  // 5: Centre overhead gate. Low coins on the gate lane telegraph the roll;
  // right-lane coins stay at running height, and a magnet waits on the left.
  {
    obstacles: [overhead(0, 14)],
    coins: [
      ...coinRow(1, 2, 28),
      { lane: 0, z: 12, y: DUCK_Y },
      { lane: 0, z: 13, y: DUCK_Y },
      { lane: 0, z: 15, y: DUCK_Y },
      { lane: 0, z: 16, y: DUCK_Y },
    ],
    powerUps: [powerUp('magnet', -1, 18)],
  },

  // 6: Right train, centre low barrier, left overhead gate. Left coins run
  // past the train, a jump arc clears the barrier, then low coins duck the gate.
  {
    obstacles: [train(1, 4), lowBarrier(0, 16), overhead(-1, 22)],
    coins: [
      ...coinRow(-1, 2, 14),
      { lane: 0, z: 15, y: ARC_APEX_Y },
      { lane: 0, z: 17, y: 1.35 },
      { lane: 0, z: 18, y: STRAIGHT_COIN_Y },
      { lane: -1, z: 20, y: DUCK_Y },
      { lane: -1, z: 21, y: DUCK_Y },
      { lane: -1, z: 23, y: DUCK_Y },
      { lane: -1, z: 24, y: DUCK_Y },
    ],
    powerUps: [],
  },

  // 7: Centre train, later a left train, then a low barrier on the right.
  // The right lane stays clear of trains; the closing barrier is a jump gate,
  // and a jetpack sits in the reopened centre.
  {
    obstacles: [train(0, 2), train(-1, 14), lowBarrier(1, 26)],
    coins: coinRow(1, 2, 24),
    powerUps: [powerUp('jetpack', 0, 12)],
  },
];
