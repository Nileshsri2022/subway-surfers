import type * as pc from 'playcanvas';
import { APP_NAME } from './app-info';
import { Game } from './game/game';
import { InputBuffer, attachInput } from './game/input';
import { mountUi } from './ui/screens';
import './ui/styles.css';

document.title = APP_NAME;

let game: Game | undefined;

// Count the rig as built, so the e2e assertion cannot drift from the scene graph.
function countEntities(root: pc.GraphNode): number {
  let count = 1;
  for (const child of root.children) {
    count += countEntities(child);
  }
  return count;
}

if (!window.__SUBWAY_RUNNER__?.ready) {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  const uiRoot = document.querySelector<HTMLElement>('#ui-root');
  if (!canvas) throw new Error('Missing #game-canvas element');
  if (!uiRoot) throw new Error('Missing #ui-root element');

  const ui = mountUi(uiRoot, {
    onPlay: () => game?.start(),
    onRestart: () => game?.restart(),
    onPause: () => game?.pause(),
    onResume: () => game?.resume(),
  });
  const buffer = new InputBuffer();
  attachInput(canvas, buffer, () => performance.now());
  game = new Game(canvas, ui, buffer);

  window.__SUBWAY_RUNNER__ = {
    ready: true,
    characterParts: countEntities(game.scene.character.root),
    chunkCount: game.track.chunks.length,
  };
  window.__game = game;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game?.dispose();
    game = undefined;
    window.__SUBWAY_RUNNER__ = undefined;
    window.__game = undefined;
  });
}

export { APP_NAME } from './app-info';