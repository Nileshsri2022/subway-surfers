import { describe, it, expect } from 'vitest';
import * as pc from 'playcanvas';
import { EntityPool } from '../src/render/pool';

describe('EntityPool', () => {
  it('acquire returns an entity', () => {
    const pool = new EntityPool(() => new pc.Entity('e'), (e) => {});
    const e = pool.acquire();
    expect(e).toBeInstanceOf(pc.Entity);
    // `enabled` getter also requires _enabledInHierarchy, which is false for a
    // detached entity; the pool toggles the underlying _enabled flag.
    expect((e as unknown as { _enabled: boolean })._enabled).toBe(true);
    expect(pool.size).toBe(0);
  });

  it('release puts it back', () => {
    const pool = new EntityPool(() => new pc.Entity('e'), (e) => {});
    const e = pool.acquire();
    pool.release(e);
    expect(pool.size).toBe(1);
    expect((e as unknown as { _enabled: boolean })._enabled).toBe(false);
  });

  it('a second acquire reuses the same entity', () => {
    const pool = new EntityPool(() => new pc.Entity('e'), (e) => {});
    const a = pool.acquire();
    pool.release(a);
    const b = pool.acquire();
    expect(b).toBe(a);
    expect(pool.size).toBe(0);
  });

  it('double release is safe', () => {
    const pool = new EntityPool(() => new pc.Entity('e'), (e) => {});
    const e = pool.acquire();
    pool.release(e);
    pool.release(e);
    expect(pool.size).toBe(1);
  });

  it('reset runs on acquire', () => {
    let resets = 0;
    const pool = new EntityPool(() => new pc.Entity('e'), () => {
      resets += 1;
    });
    const e = pool.acquire();
    pool.release(e);
    pool.acquire();
    expect(resets).toBe(2);
  });

  it('destroy empties the pool', () => {
    const pool = new EntityPool(() => new pc.Entity('e'), (e) => {});
    const e = pool.acquire();
    pool.release(e);
    pool.destroy();
    expect(pool.size).toBe(0);
  });
});