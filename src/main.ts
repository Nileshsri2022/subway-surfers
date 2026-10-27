import { APP_NAME } from './app-info';
import { createScene, type SceneHandle } from './game/scene';

document.title = APP_NAME;

let scene: SceneHandle | undefined;

// Creating a second Application would leak a canvas context and a render loop.
// The global flag keeps repeated imports (and Vite HMR re-execution) idempotent.
if (!window.__SUBWAY_RUNNER__?.ready) {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }

  scene = createScene(canvas);
  window.__SUBWAY_RUNNER__ = { ready: true };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    scene?.dispose();
    scene = undefined;
    window.__SUBWAY_RUNNER__ = undefined;
  });
}

export { APP_NAME } from './app-info';
