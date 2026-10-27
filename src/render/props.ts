import * as pc from 'playcanvas';
import { createBox, createMaterial } from './meshes';

export function createObstacle(app: pc.Application, spec: { kind: string; lane: number; z: number; length: number }): pc.Entity {
  const laneToX = (l: number) => [-2.5, 0, 2.5][l + 1];
  const x = laneToX(spec.lane);
  const e = new pc.Entity(`obstacle-${spec.kind}`);
  if (spec.kind === 'train') {
    const mat = createMaterial(new pc.Color(0.8, 0.2, 0.2));
    const body = createBox(e, 'body', [1.8, 1.8, spec.length], mat);
    body.setPosition(0, 0.9, 0);
    const winMat = createMaterial(new pc.Color(0.9, 0.9, 1));
    const win = createBox(e, 'window', [1.6, 0.4, spec.length], winMat);
    win.setPosition(0, 1.2, 0);
  } else if (spec.kind === 'lowBarrier') {
    const mat = createMaterial(new pc.Color(1, 0.8, 0));
    const b = createBox(e, 'barrier', [1.8, 0.5, spec.length], mat);
    b.setPosition(0, 0.25, 0);
  } else {
    const mat = createMaterial(new pc.Color(0.5, 0.5, 0.5));
    const post1 = createBox(e, 'post1', [0.2, 1.6, 0.2], mat);
    post1.setPosition(-0.8, 0.8, 0);
    const post2 = createBox(e, 'post2', [0.2, 1.6, 0.2], mat);
    post2.setPosition(0.8, 0.8, 0);
    const beam = createBox(e, 'beam', [1.8, 0.4, 0.2], mat);
    beam.setPosition(0, 1.6, 0);
  }
  e.setPosition(x, 0, 0);
  return e;
}

export function createCoin(app: pc.Application): pc.Entity {
  const e = new pc.Entity('coin');
  const mat = createMaterial(new pc.Color(1, 0.85, 0.1), { emissive: new pc.Color(0.6, 0.5, 0) });
  const render = e.addComponent('render', { type: 'cylinder' });
  if (render) render.material = mat;
  e.setLocalScale(0.9, 0.1, 0.9);
  e.setLocalEulerAngles(90, 0, 0);
  return e;
}

export function createPowerUp(app: pc.Application, kind: 'magnet' | 'jetpack' | 'multiplier'): pc.Entity {
  const colors: Record<string, pc.Color> = {
    magnet: new pc.Color(0.2, 0.4, 1),
    jetpack: new pc.Color(1, 0.4, 0.1),
    multiplier: new pc.Color(0.2, 0.9, 0.3),
  };
  const e = new pc.Entity(`powerup-${kind}`);
  const mat = createMaterial(colors[kind], { emissive: colors[kind] });
  const b = createBox(e, 'box', [0.8, 0.8, 0.8], mat);
  b.setPosition(0, 0, 0);
  return e;
}
