export interface GameSnapshot { phase: string; score: number; coins: number; best: number; distance: number; powerUps: Array<{ kind: string; remaining: number }>; }
export type GamePhase = 'menu'|'running'|'paused'|'gameover';

export interface UiCallbacks { onPlay(): void; onRestart(): void; onPause(): void; onResume(): void; }
export interface UiHandle { show(screen: 'start'|'hud'|'pause'|'gameover'): void; update(snapshot: GameSnapshot): void; }

export function mountUi(root: HTMLElement, callbacks: UiCallbacks): UiHandle {
  root.innerHTML = '';
  const start = document.createElement('div'); start.className = 'screen start';
  start.innerHTML = `<h1>Subway Runner</h1><p class="best">Best: <span data-best>0</span></p><button>Play</button>`;
  const hud = document.createElement('div'); hud.className = 'hud'; hud.setAttribute('data-testid','hud');
  hud.innerHTML = `<span class="score">Score: <span data-score>0</span></span><span class="coins">Coins: <span data-coins>0</span></span><button>Pause</button>`;
  const pause = document.createElement('div'); pause.className = 'screen pause'; pause.innerHTML = `<h2>Paused</h2><button>Resume</button>`;
  const gameover = document.createElement('div'); gameover.className = 'screen gameover';
  gameover.innerHTML = `<h2>Game Over</h2><p>Score: <span data-score>0</span></p><p>Best: <span data-best>0</span></p><button>Restart</button>`;
  root.append(start, hud, pause, gameover);

  const playBtn = start.querySelector('button')!;
  const pauseBtn = hud.querySelector('button')!;
  const resumeBtn = pause.querySelector('button')!;
  const restartBtn = gameover.querySelector('button')!;
  playBtn.textContent = 'Play';
  pauseBtn.textContent = 'Pause';
  resumeBtn.textContent = 'Resume';
  restartBtn.textContent = 'Restart';
  playBtn.addEventListener('click', callbacks.onPlay);
  restartBtn.addEventListener('click', callbacks.onRestart);
  pauseBtn.addEventListener('click', callbacks.onPause);
  resumeBtn.addEventListener('click', callbacks.onResume);

  const show = (screen: 'start'|'hud'|'pause'|'gameover') => {
    start.style.display = screen === 'start' ? 'flex' : 'none';
    hud.style.display = screen === 'hud' || screen === 'pause' || screen === 'gameover' ? 'flex' : 'none';
    // HUD visible during gameplay; hide on start
    if (screen === 'start') hud.style.display = 'none';
    pause.style.display = screen === 'pause' ? 'flex' : 'none';
    gameover.style.display = screen === 'gameover' ? 'flex' : 'none';
  };
  const update = (snap: GameSnapshot) => {
    root.querySelectorAll('[data-score]').forEach(el => el.textContent = String(snap.score));
    root.querySelectorAll('[data-coins]').forEach(el => el.textContent = String(snap.coins));
    root.querySelectorAll('[data-best]').forEach(el => el.textContent = String(snap.best));
  };
  show('start');
  return { show, update };
}