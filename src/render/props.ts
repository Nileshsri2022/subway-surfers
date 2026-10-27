import * as pc from 'playcanvas';
import { createBox, createMaterial, setShadows } from './meshes';

export function createObstacle(app: pc.Application, spec: { kind: string; lane: number; z: number; length: number }): pc.Entity {
  const laneToX = (l: number) => [-2.5, 0, 2.5][l + 1];
  const x = laneToX(spec.lane);
  const e = new pc.Entity(`obstacle-${spec.kind}`);
  if (spec.kind === 'train') {
    // Taller than the runner (was 1.8 m vs a ~1.9 m runner: a low red
    // block). Body spans 0.3-2.9 m on a bogie skirt; collision already
    // treats trains as 0-3.6 m, so this only closes the visual gap.
    const mat = createMaterial(new pc.Color(0.8, 0.2, 0.2));
    const body = createBox(e, 'body', [2.2, 2.6, spec.length], mat);
    body.setPosition(0, 1.6, 0);
    setShadows(body, true, false);
    const bogieMat = createMaterial(new pc.Color(0.15, 0.15, 0.17));
    const bogie = createBox(e, 'bogie', [1.9, 0.3, spec.length], bogieMat);
    bogie.setPosition(0, 0.15, 0);
    setShadows(bogie, true, false);
    // Window band and skirt stripe are wider than the body so they sit
    // proud of the sides; the old 1.6 m band was hidden inside the body.
    const winMat = createMaterial(new pc.Color(0.85, 0.92, 1));
    const win = createBox(e, 'window', [2.24, 0.55, spec.length], winMat);
    win.setPosition(0, 2.05, 0);
    setShadows(win, false, false);
    const stripeMat = createMaterial(new pc.Color(0.95, 0.95, 0.95));
    const stripe = createBox(e, 'stripe', [2.24, 0.28, spec.length], stripeMat);
    stripe.setPosition(0, 0.62, 0);
    setShadows(stripe, false, false);
    const roofMat = createMaterial(new pc.Color(0.75, 0.75, 0.78));
    const roof = createBox(e, 'roof', [2.0, 0.12, spec.length], roofMat);
    roof.setPosition(0, 2.96, 0);
    setShadows(roof, true, false);
    // Front face (+z end, player-facing): windshield and headlights.
    const shieldMat = createMaterial(new pc.Color(0.1, 0.13, 0.2));
    const shield = createBox(e, 'windshield', [1.7, 0.6, 0.08], shieldMat);
    shield.setPosition(0, 2.05, spec.length / 2 + 0.02);
    setShadows(shield, false, false);
    const lampMat = createMaterial(new pc.Color(1, 0.9, 0.4), { emissive: new pc.Color(1, 0.85, 0.3) });
    for (const side of [-1, 1]) {
      const lamp = createBox(e, `headlight-${side}`, [0.24, 0.24, 0.06], lampMat);
      lamp.setPosition(side * 0.7, 0.75, spec.length / 2 + 0.02);
      setShadows(lamp, false, false);
    }
  } else if (spec.kind === 'lowBarrier') {
    const mat = createMaterial(new pc.Color(1, 0.8, 0));
    const b = createBox(e, 'barrier', [1.8, 0.5, spec.length], mat);
    b.setPosition(0, 0.25, 0);
    setShadows(b, true, false);
  } else {
    const mat = createMaterial(new pc.Color(0.5, 0.5, 0.5));
    const post1 = createBox(e, 'post1', [0.2, 1.6, 0.2], mat);
    post1.setPosition(-0.8, 0.8, 0);
    setShadows(post1, true, false);
    const post2 = createBox(e, 'post2', [0.2, 1.6, 0.2], mat);
    post2.setPosition(0.8, 0.8, 0);
    setShadows(post2, true, false);
    const beamMat = createMaterial(new pc.Color(1, 0.8, 0));
    const beam = createBox(e, 'beam', [1.8, 0.4, 0.2], beamMat);
    beam.setPosition(0, 1.6, 0);
    setShadows(beam, true, false);
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
  setShadows(e, false, false);
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
  setShadows(b, false, false);
  return e;
}
