// Chunk generation over the authored pattern library.
// Pure: no PlayCanvas, no DOM, no window.

import * as pc from 'playcanvas';
import { TRACK_CHUNK_LENGTH, SPAWN_AHEAD, DESPAWN_BEHIND } from '../config/tuning';
import { PATTERNS, isPatternSurvivable } from './patterns';
import type { Rng } from './rng';
import type { Pattern, ObstacleSpec, CoinSpec, PowerUpSpec, Lane } from './types';
import { laneToX } from './lanes';
import { EntityPool } from '../render/pool';
import { createCityChunk } from '../render/city';
import { createObstacle, createCoin, createPowerUp } from '../render/props';

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

export function defaultPopulate(chunk: Chunk, root: pc.Entity): void {
  defaultPopulateCity(chunk, root);
}

export class TrackManager {
  private readonly app: pc.Application;
  private readonly root: pc.Entity;
  private readonly generator: TrackGenerator;
  private readonly createChunk: (chunk: Chunk, root: pc.Entity) => void;
  private readonly pool: EntityPool;
  private readonly live = new Map<number, pc.Entity>();
  private _chunks: Chunk[] = [];

  constructor(app: pc.Application, root: pc.Entity, generator: TrackGenerator, createChunk: (chunk: Chunk, root: pc.Entity) => void = defaultPopulate) {
    this.app = app;
    this.root = root;
    this.generator = generator;
    this.createChunk = createChunk;
    this.pool = new EntityPool(
      () => {
        const e = new pc.Entity('chunk-root');
        return e;
      },
      (e) => {
        // reset: destroy children
        while (e.children.length) {
          const c = e.children[0];
          e.removeChild(c);
          c.destroy();
        }
      }
    );
  }

  get chunks(): readonly Chunk[] {
    return this._chunks;
  }

  // Coins spin around the vertical axis; static discs read as flat tokens.
  // Coins are direct children of live chunk roots, named 'coin'.
  updateCoins(time: number): void {
    const angle = (time * 150) % 360;
    for (const root of this.live.values()) {
      for (const child of root.children) {
        if (child.name === 'coin') {
          child.setLocalEulerAngles(90, angle, 0);
        }
      }
    }
  }

  update(distance: number): void {
    const startIdx = Math.floor((distance - DESPAWN_BEHIND - TRACK_CHUNK_LENGTH) / TRACK_CHUNK_LENGTH);
    const clampedStart = Math.max(0, startIdx);
    const endIdx = Math.ceil((distance + SPAWN_AHEAD) / TRACK_CHUNK_LENGTH);

    // spawn
    for (let i = clampedStart; i <= endIdx; i++) {
      if (!this.live.has(i)) {
        const chunk = this.generator.nextChunk(i);
        const root = this.pool.acquire();
        root.enabled = true;
        this.createChunk(chunk, root);
        this.root.addChild(root);
        this.live.set(i, root);
        if (!this._chunks.find(c => c.index === i)) this._chunks.push(chunk);
      }
    }
    // despawn behind: only once the chunk's far edge (30 m past its
    // start) is behind the player by the margin, or its tail would pop
    // out while still ahead of the camera.
    for (const [idx, root] of [...this.live.entries()]) {
      const chunk = this._chunks.find(c => c.index === idx);
      const startZ = chunk ? chunk.startZ : idx * TRACK_CHUNK_LENGTH;
      if (startZ + TRACK_CHUNK_LENGTH < distance - DESPAWN_BEHIND - 0.001) {
        this.pool.release(root);
        root.parent?.removeChild(root);
        this.live.delete(idx);
        this._chunks = this._chunks.filter(c => c.index !== idx);
      }
    }
    // Scroll: the player stays at z = 0 and the world rides toward the
    // camera. The old code positioned each chunk once at -startZ, so the
    // whole world stood still and the runner ran in place. With the
    // +distance offset an obstacle's visual z hits 0 exactly when the
    // logical collision fires (worldZ = -(startZ + z)).
    for (const [idx, root] of this.live.entries()) {
      const chunk = this._chunks.find(c => c.index === idx);
      const startZ = chunk ? chunk.startZ : idx * TRACK_CHUNK_LENGTH;
      root.setPosition(0, 0, distance - startZ);
    }
    // ensure sorted
    this._chunks.sort((a, b) => a.index - b.index);
  }

  // Hide one collected/pickup/consumed child entity by name + lane + z, so
  // it vanishes at pickup instead of scrolling past the player untouched.
  hideAt(chunkIndex: number, name: string, lane: Lane, z: number): void {
    const root = this.live.get(chunkIndex);
    if (!root) return;
    const x = laneToX(lane);
    for (const child of root.children) {
      if (child.name !== name) continue;
      const p = child.getLocalPosition();
      if (Math.abs(p.x - x) < 0.01 && Math.abs(p.z + z) < 0.01) {
        child.enabled = false;
        return;
      }
    }
  }

  dispose(): void {
    for (const root of this.live.values()) {
      this.pool.release(root);
      root.destroy();
    }
    this.live.clear();
    this._chunks = [];
    this.pool.destroy();
  }
}

function defaultPopulateCity(chunk: Chunk, root: pc.Entity): void {
  // city visuals as children of root? We'll attach city root's children by creating city and moving? 
  const city = createCityChunk(null as unknown as pc.Application, chunk);
  // move children
  while (city.children.length) {
    const c = city.children[0];
    city.removeChild(c);
    root.addChild(c);
  }
  city.destroy();
  // props from chunk.pattern
  const p = chunk.pattern;
  for (const o of p.obstacles) {
    const e = createObstacle(null as unknown as pc.Application, o);
    e.setPosition(laneToX(o.lane), 0, -o.z);
    root.addChild(e);
  }
  for (const c of p.coins) {
    const e = createCoin(null as unknown as pc.Application);
    e.setPosition(laneToX(c.lane), c.y, -c.z);
    root.addChild(e);
  }
  for (const pu of p.powerUps) {
    const e = createPowerUp(null as unknown as pc.Application, pu.kind);
    e.setPosition(laneToX(pu.lane), 1.2, -pu.z);
    root.addChild(e);
  }
}
