import { describe, it, expect } from 'vitest';
import * as pc from 'playcanvas';
import { TrackGenerator, TrackManager } from '../src/game/track';
import { Rng } from '../src/game/rng';

function makeManager() {
  const root = new pc.Entity('root');
  const app = {} as unknown as pc.Application;
  const generator = new TrackGenerator(new Rng(1));
  const populate = (chunk: { index: number }, r: pc.Entity) => {
    const c = new pc.Entity(`chunk-${chunk.index}`);
    r.addChild(c);
  };
  const tm = new TrackManager(app, root, generator, populate as any);
  return { root, tm };
}

describe('TrackManager', () => {
  it('update(0) covers indices 0..4', () => {
    const { tm } = makeManager();
    tm.update(0);
    expect(tm.chunks.map((c) => c.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it('update(200) keeps 6..11 and drops chunks below 180', () => {
    const { tm } = makeManager();
    tm.update(0);
    tm.update(200);
    expect(tm.chunks.map((c) => c.index)).toEqual([6, 7, 8, 9, 10, 11]);
    for (const c of tm.chunks) {
      expect(c.startZ).toBeGreaterThanOrEqual(180);
    }
  });

  it('places each chunk root at z = -startZ', () => {
    const { root, tm } = makeManager();
    tm.update(0);
    const roots = root.children;
    expect(roots.length).toBe(5);
    for (let i = 0; i < tm.chunks.length; i++) {
      const chunk = tm.chunks[i];
      const entity = roots.find((e) => e.getLocalPosition().z === -chunk.startZ);
      expect(entity).toBeDefined();
    }
  });

  it('reuses pooled roots across updates', () => {
    const { tm } = makeManager();
    tm.update(0);
    tm.update(200);
    const freeBefore = (tm as unknown as { pool: { size: number } }).pool.size;
    expect(freeBefore).toBe(5);
    tm.update(0);
    const freeAfter = (tm as unknown as { pool: { size: number } }).pool.size;
    expect(freeAfter).toBe(0);
  });

  it('dispose clears chunks and destroys roots', () => {
    const { tm } = makeManager();
    tm.update(0);
    tm.dispose();
    expect(tm.chunks).toEqual([]);
  });
});