import type * as pc from 'playcanvas';
import { APP_NAME } from './app-info';
import { createScene, type SceneHandle } from './game/scene';
import { TrackGenerator, TrackManager, defaultPopulate } from './game/track';
import { Rng } from './game/rng';
import { START_SPEED } from './config/tuning';

document.title = APP_NAME;

let scene: SceneHandle | undefined;
let track: TrackManager | undefined;
let distance = 0;
let updateHandle: { off(): void } | undefined;

// Count the rig as built, so the e2e assertion cannot drift from the scene graph.
function countEntities(root: pc.GraphNode): number {
  let count = 1;
  for (const child of root.children) {
    count += countEntities(child);
  }
  return count;
}

// Creating a second Application would leak a canvas context and a render loop.
// The global flag keeps repeated imports (and Vite HMR re-execution) idempotent.
if (!window.__SUBWAY_RUNNER__?.ready) {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }

  scene = createScene(canvas);
  const generator = new TrackGenerator(new Rng(1));
  track = new TrackManager(scene.app, scene.app.root, generator, defaultPopulate);
  track.update(0);

  window.__SUBWAY_RUNNER__ = {
    ready: true,
    characterParts: countEntities(scene.character.root),
    chunkCount: track.chunks.length,
  };

  updateHandle = scene.app.on('update', (dt: number) => {
    distance += START_SPEED * dt;
    track?.update(distance);
    const hook = window.__SUBWAY_RUNNER__;
    if (hook && track) {
      hook.chunkCount = track.chunks.length;
    }
  });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    updateHandle?.off();
    updateHandle = undefined;
    track?.dispose();
    track = undefined;
    scene?.dispose();
    scene = undefined;
    window.__SUBWAY_RUNNER__ = undefined;
  });
}

export { APP_NAME } from './app-info';