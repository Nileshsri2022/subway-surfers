import * as pc from 'playcanvas';
import { Rng } from '../game/rng';
import { createBox, createMaterial } from './meshes';

const PALETTE = [0x556677, 0x778899, 0x334455, 0x99aabb, 0x445566];

export function createCityChunk(app: pc.Application, chunk: { index: number }): pc.Entity {
  const root = new pc.Entity(`city-${chunk.index}`);
  const rng = new Rng(chunk.index * 9973 + 1);
  // ballast strip
  const ballastMat = createMaterial(new pc.Color(0.25, 0.25, 0.28));
  const ballast = createBox(root, 'ballast', [6, 0.1, 30], ballastMat);
  ballast.setPosition(0, -0.05, -15);
  // buildings
  const count = 3 + rng.int(4);
  for (let i = 0; i < count; i++) {
    const side = rng.next() < 0.5 ? -1 : 1;
    const h = 5 + rng.next() * 15;
    const ci = rng.int(PALETTE.length);
    const color = new pc.Color(
      ((PALETTE[ci] >> 16) & 255) / 255,
      ((PALETTE[ci] >> 8) & 255) / 255,
      (PALETTE[ci] & 255) / 255
    );
    const mat = createMaterial(color);
    const b = createBox(root, `building-${i}`, [2 + rng.next() * 3, h, 2 + rng.next() * 3], mat);
    b.setPosition(side * (8 + rng.next() * 6), h / 2, rng.next() * -30);
  }
  // gantry every few chunks
  if (chunk.index % 3 === 0) {
    const gantryMat = createMaterial(new pc.Color(0.6, 0.6, 0.6));
    const beam = createBox(root, 'gantry-beam', [14, 0.4, 0.4], gantryMat);
    beam.setPosition(0, 4, -15);
  }
  // graffiti panels
  for (let i = 0; i < 2; i++) {
    const pm = createMaterial(new pc.Color(rng.next(), rng.next(), rng.next()));
    const p = createBox(root, `graffiti-${i}`, [1.5, 1, 0.1], pm);
    p.setPosition((rng.next() - 0.5) * 10, 1, rng.next() * -30);
  }
  return root;
}
