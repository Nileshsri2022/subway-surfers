import { MAX_SPEED, SPEED_RAMP_SECONDS, START_SPEED } from '../config/tuning';

export function speedAt(elapsedSeconds: number): number {
  const t = Math.max(0, Math.min(SPEED_RAMP_SECONDS, elapsedSeconds));
  return START_SPEED + (MAX_SPEED - START_SPEED) * (t / SPEED_RAMP_SECONDS);
}

export function difficultyAt(elapsedSeconds: number): number {
  return (speedAt(elapsedSeconds) - START_SPEED) / (MAX_SPEED - START_SPEED);
}