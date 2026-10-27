// Shared gameplay data types. Pure data: no PlayCanvas, no DOM, no window.

export type Lane = -1 | 0 | 1;

export interface ObstacleSpec {
  kind: 'train' | 'lowBarrier' | 'overhead';
  lane: Lane;
  z: number;
  length: number;
}

export interface CoinSpec {
  lane: Lane;
  z: number;
  y: number;
}

export type PowerUpKind = 'magnet' | 'jetpack' | 'multiplier';

export interface PowerUpSpec {
  kind: PowerUpKind;
  lane: Lane;
  z: number;
}

export interface Pattern {
  obstacles: ObstacleSpec[];
  coins: CoinSpec[];
  powerUps: PowerUpSpec[];
}
