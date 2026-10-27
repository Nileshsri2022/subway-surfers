// Score accumulation and best-score persistence. Pure except for guarded localStorage access.

export interface ScoreState {
  distance: number;
  coins: number;
  multiplier: number;
}

const BEST_SCORE_KEY = 'subway-runner.best';

// Score design, not tuning: each coin is worth ten points before the multiplier.
const COINS_PER_POINT = 10;

export function createScoreState(): ScoreState {
  return {
    distance: 0,
    coins: 0,
    multiplier: 1,
  };
}

export function tickScore(state: ScoreState, meters: number): void {
  state.distance += meters;
}

export function addCoin(state: ScoreState): void {
  state.coins += 1;
}

export function totalScore(state: ScoreState): number {
  return Math.floor((state.distance + state.coins * COINS_PER_POINT) * state.multiplier);
}

// Best-effort storage: private mode, disabled storage and exhausted quota all degrade quietly.
export function loadBestScore(): number {
  try {
    const raw = globalThis.localStorage?.getItem(BEST_SCORE_KEY);
    if (raw === null || raw === undefined) {
      return 0;
    }
    const stored = Number(raw);
    return Number.isFinite(stored) && stored >= 0 ? stored : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    if (!Number.isFinite(score) || score <= loadBestScore()) {
      return;
    }
    globalThis.localStorage?.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Saving is best effort only; a failed write must never interrupt the game.
  }
}
