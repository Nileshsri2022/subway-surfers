// Gameplay tuning constants. Pure data: no PlayCanvas, no DOM, no window.

export const LANE_WIDTH = 2.5;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH] as const satisfies readonly [number, number, number];

export const TRACK_CHUNK_LENGTH = 30;
export const START_SPEED = 12;
export const MAX_SPEED = 30;
export const SPEED_RAMP_SECONDS = 180;

export const JUMP_VELOCITY = 14;
export const GRAVITY = -55;
export const ROLL_SECONDS = 0.6;
export const LANE_CHANGE_SECONDS = 0.12;

export const PLAYER_HEIGHT = 1.8;
export const PLAYER_ROLL_HEIGHT = 0.9;
export const PLAYER_HALF_WIDTH = 0.4;

export const COIN_RADIUS = 0.45;
export const MAGNET_RADIUS = 6;
export const MAGNET_SECONDS = 10;
export const JETPACK_SECONDS = 8;
export const MULTIPLIER_SECONDS = 15;

export const JETPACK_ALTITUDE = 4.5;
export const JETPACK_DESCENT_SECONDS = 0.6;
export const HOVERBOARD_INVULN_SECONDS = 1.5;

export const SPAWN_AHEAD = 120;
export const DESPAWN_BEHIND = 20;
