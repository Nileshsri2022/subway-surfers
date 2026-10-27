// Chunk generation over the authored pattern library.
// Pure: no PlayCanvas, no DOM, no window.

import { TRACK_CHUNK_LENGTH } from '../config/tuning';
import { PATTERNS, isPatternSurvivable } from './patterns';
import type { Rng } from './rng';
import type { Pattern } from './types';

export interface Chunk {
  index: number;
  startZ: number;
  pattern: Pattern;
}

const MAX_PATTERN_RETRIES = 20;

export class TrackGenerator {
  private readonly rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  nextChunk(index: number): Chunk {
    return {
      index,
      startZ: index * TRACK_CHUNK_LENGTH,
      pattern: this.selectPattern(),
    };
  }

  private selectPattern(): Pattern {
    // RNG draws happen in call order; TrackManager requests chunks in ascending
    // index order, so a fresh Rng(seed) reproduces the same track on restart.
    // One initial pick, then up to 20 retries.
    for (let attempt = 0; attempt <= MAX_PATTERN_RETRIES; attempt += 1) {
      const candidate = this.rng.pick(PATTERNS);
      if (isPatternSurvivable(candidate)) {
        return candidate;
      }
    }

    // PATTERNS[0] is the authored trivially safe pattern (see patterns.ts).
    return PATTERNS[0];
  }
}
