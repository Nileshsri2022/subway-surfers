import { describe, it, expect } from 'vitest';
import * as pc from 'playcanvas';
import { FxPool } from '../src/render/fx';

describe('FxPool', () => {
  it('burst increases active count', () => {
    const app = {} as any;
    const root = new pc.Entity('root');
    const pool = new FxPool(app, root);
    pool.burst('coin', 0, 0, 0);
    expect(pool.active).toBe(12);
    expect(pool.created).toBe(12);
  });

  it('update reduces active over time', () => {
    const app = {} as any;
    const root = new pc.Entity('root');
    const pool = new FxPool(app, root);
    pool.burst('crash', 0, 0, 0);
    pool.update(10);
    expect(pool.active).toBe(0);
  });

  it('does not allocate after warm', () => {
    const app = {} as any;
    const root = new pc.Entity('root');
    const pool = new FxPool(app, root);
    pool.burst('dust', 0, 0, 0);
    const before = pool.created;
    pool.update(10);
    pool.burst('dust', 0, 0, 0);
    expect(pool.created).toBe(before);
  });
});