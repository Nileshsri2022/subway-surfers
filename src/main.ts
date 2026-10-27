import type * as pc from 'playcanvas';
import { APP_NAME } from './app-info';
import { Game } from './game/game';
import { mountUi } from './ui/screens';
import './ui/styles.css';

document.title = APP_NAME;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) throw new Error('Missing #game-canvas element');

const uiRoot = document.querySelector<HTMLElement>('#ui-root');
if (!uiRoot) throw new Error('Missing #ui-root element');

function countEntities(root: pc.GraphNode): number {
  let count = 1;
  for (const child of root.children) count += countEntities(child);
  return count;
}

let game: Game | undefined;

const ui = mountUi(uiRoot, {
  onPlay: () => game?.start(),
  onRestart: () => game?.restart(),
  onPause: () => game?.pause(),
  onResume: () => game?.resume(),
});

game = new Game(canvas, ui);

window.__SUBWAY_RUNNER__ = {
  ready: true,
  characterParts: countEntities(game.scene.character.root),
  chunkCount: game.track.chunks.length,
};
window.__game = game;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game?.dispose();
    window.__game = undefined;
    window.__SUBWAY_RUNNER__ = undefined;
  });
}

export { APP_NAME } from './app-info';