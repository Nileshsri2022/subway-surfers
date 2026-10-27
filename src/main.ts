import type * as pc from 'playcanvas';
import { APP_NAME } from './app-info';
import { createScene, type SceneHandle } from './game/scene';

document.title = APP_NAME;

let scene: SceneHandle | undefined;

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
  window.__SUBWAY_RUNNER__ = {
    ready: true,
    characterParts: countEntities(scene.character.root),
  };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    scene?.dispose();
    scene = undefined;
    window.__SUBWAY_RUNNER__ = undefined;
  });
}

export { APP_NAME } from './app-info';
