import * as pc from 'playcanvas';
import { Rng } from '../game/rng';
import { createBox, createMaterial, setShadows } from './meshes';

const LANE_X = [-2.5, 0, 2.5];
const RAIL_OFFSET = 0.7;
const SLEEPER_SPACING = 1.5;
const CHUNK_LENGTH = 30;

// Warm, varied facades: the old palette was all cold blue-gray slabs.
const BUILDING_PALETTE: Array<[number, number, number]> = [
  [0.85, 0.72, 0.55], // cream
  [0.62, 0.35, 0.3], // brick
  [0.3, 0.55, 0.58], // teal
  [0.82, 0.62, 0.25], // mustard
  [0.45, 0.55, 0.68], // dusty blue
  [0.55, 0.42, 0.55], // plum
];

// Curated graffiti colors; random RGB produced muddy browns and grays.
const GRAFFITI_PALETTE: Array<[number, number, number]> = [
  [0.9, 0.2, 0.6], // magenta
  [0.2, 0.8, 0.9], // cyan
  [0.5, 0.9, 0.2], // lime
  [0.95, 0.5, 0.1], // orange
  [0.95, 0.45, 0.7], // pink
];

export function createCityChunk(app: pc.Application, chunk: { index: number }): pc.Entity {
  const root = new pc.Entity(`city-${chunk.index}`);
  const rng = new Rng(chunk.index * 9973 + 1);

  // Ballast strip, widened to cover all three lanes plus train width.
  const ballastMat = createMaterial(new pc.Color(0.32, 0.29, 0.27));
  const ballast = createBox(root, 'ballast', [8, 0.1, 30], ballastMat);
  ballast.setPosition(0, -0.05, -15);
  setShadows(ballast, false, true);

  // Rails and sleepers per lane: without these the track reads as a gray
  // road, not a subway. Sleepers stay shadow-free (tiny, numerous).
  const railMat = createMaterial(new pc.Color(0.55, 0.57, 0.6));
  const sleeperMat = createMaterial(new pc.Color(0.23, 0.2, 0.18));
  for (const lx of LANE_X) {
    for (const side of [-1, 1]) {
      const rail = createBox(root, 'rail', [0.09, 0.12, 30], railMat);
      rail.setPosition(lx + side * RAIL_OFFSET, 0.14, -15);
      setShadows(rail, false, true);
    }
    for (let z = 0; z < CHUNK_LENGTH; z += SLEEPER_SPACING) {
      const sleeper = createBox(root, 'sleeper', [1.9, 0.08, 0.34], sleeperMat);
      sleeper.setPosition(lx, 0.04, -z);
      setShadows(sleeper, false, true);
    }
  }

  // Buildings: warm palette, roof cap, and a lit window strip on the
  // track-facing side so they read as buildings, not slabs.
  const count = 3 + rng.int(4);
  for (let i = 0; i < count; i++) {
    const side = rng.next() < 0.5 ? -1 : 1;
    const h = 5 + rng.next() * 15;
    const w = 2 + rng.next() * 3;
    const d = 2 + rng.next() * 3;
    const bx = side * (8 + rng.next() * 6);
    const bz = rng.next() * -30;
    const [r, g, b] = BUILDING_PALETTE[rng.int(BUILDING_PALETTE.length)];
    const mat = createMaterial(new pc.Color(r, g, b));
    const building = createBox(root, `building-${i}`, [w, h, d], mat);
    building.setPosition(bx, h / 2, bz);
    setShadows(building, true, false);
    const capMat = createMaterial(new pc.Color(r * 0.7, g * 0.7, b * 0.7));
    const cap = createBox(root, `roof-${i}`, [w + 0.3, 0.25, d + 0.3], capMat);
    cap.setPosition(bx, h + 0.12, bz);
    setShadows(cap, true, false);
    const winMat = createMaterial(new pc.Color(1, 0.85, 0.5), {
      emissive: new pc.Color(0.9, 0.7, 0.25),
    });
    const strip = createBox(root, `windows-${i}`, [0.06, h * 0.6, d * 0.7], winMat);
    strip.setPosition(bx - side * (w / 2 + 0.04), h * 0.5, bz);
    setShadows(strip, false, false);
  }

  // Gantry: the old beam floated with no supports.
  if (chunk.index % 3 === 0) {
    const gantryMat = createMaterial(new pc.Color(0.45, 0.45, 0.48));
    const beam = createBox(root, 'gantry-beam', [14, 0.4, 0.4], gantryMat);
    beam.setPosition(0, 4, -15);
    setShadows(beam, true, false);
    for (const side of [-1, 1]) {
      const post = createBox(root, `gantry-post-${side}`, [0.35, 4, 0.35], gantryMat);
      post.setPosition(side * 7, 2, -15);
      setShadows(post, true, false);
    }
  }

  // Graffiti as trackside wall panels, not floating panels in the lanes.
  for (let i = 0; i < 2; i++) {
    const side = rng.next() < 0.5 ? -1 : 1;
    const [r, g, b] = GRAFFITI_PALETTE[rng.int(GRAFFITI_PALETTE.length)];
    const pm = createMaterial(new pc.Color(r, g, b));
    const p = createBox(root, `graffiti-${i}`, [0.1, 1.2, 1.8], pm);
    p.setPosition(side * 5.0, 1.2, rng.next() * -30);
    setShadows(p, false, false);
  }
  return root;
}
