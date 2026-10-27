import * as pc from 'playcanvas';

export class EntityPool {
  private readonly factory: () => pc.Entity;
  private readonly reset: (e: pc.Entity) => void;
  private free: pc.Entity[] = [];
  private acquired = new Set<pc.Entity>();

  constructor(factory: () => pc.Entity, reset: (e: pc.Entity) => void) {
    this.factory = factory;
    this.reset = reset;
  }

  acquire(): pc.Entity {
    let e = this.free.pop();
    if (!e) e = this.factory();
    this.reset(e);
    e.enabled = true;
    this.acquired.add(e);
    return e;
  }

  release(e: pc.Entity): void {
    if (!this.acquired.has(e)) return;
    this.acquired.delete(e);
    e.enabled = false;
    this.free.push(e);
  }

  get size(): number {
    return this.free.length;
  }

  destroy(): void {
    for (const e of [...this.free, ...this.acquired]) e.destroy();
    this.free = [];
    this.acquired.clear();
  }
}
