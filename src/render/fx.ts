import * as pc from 'playcanvas';

const POOL_SIZE_PER_BURST = 12;
const GRAVITY = 9.8;
const PARTICLE_LIFE = 0.6;

interface Particle {
  entity: pc.Entity;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  alive: boolean;
}

export class FxPool {
  app: pc.Application;
  root: pc.Entity;
  created = 0;
  active = 0;
  private particles: Particle[] = [];

  constructor(app: pc.Application, root: pc.Entity) {
    this.app = app;
    this.root = root;
  }

  burst(kind: 'coin' | 'crash' | 'dust', x: number, y: number, z: number): void {
    for (let i = 0; i < POOL_SIZE_PER_BURST; i++) {
      let p = this.particles.find((pp) => !pp.alive);
      if (!p) {
        const e = new pc.Entity('fx');
        this.created += 1;
        p = { entity: e, vx: 0, vy: 0, vz: 0, life: 0, alive: false };
        this.particles.push(p);
      }
      const speed = kind === 'crash' ? 4 : 2.5;
      p.vx = (Math.random() - 0.5) * speed;
      p.vy = Math.random() * speed + 1;
      p.vz = (Math.random() - 0.5) * speed;
      p.life = PARTICLE_LIFE + Math.random() * 0.3;
      p.alive = true;
      this.active += 1;
    }
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.life -= dt;
      p.vy -= GRAVITY * dt;
      if (p.life <= 0) {
        p.alive = false;
        this.active = Math.max(0, this.active - 1);
      }
    }
  }
}