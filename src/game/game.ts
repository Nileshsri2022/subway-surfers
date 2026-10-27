import * as pc from 'playcanvas';
import { createScene, type SceneHandle } from './scene';
import { TrackGenerator, TrackManager, defaultPopulate } from './track';
import { Rng } from './rng';
import { createPlayerState, updatePlayer, requestLane, requestJump, requestRoll, startJetpack, endJetpack, playerLaneX, type PlayerState } from './player';
import { createScoreState, tickScore, addCoin, totalScore, loadBestScore, saveBestScore, type ScoreState } from './score';
import { createPowerUps, activatePowerUp, tickPowerUps, consumeHoverboard, type ActivePowerUps } from './powerups';
import { hitsObstacle, coinDistanceSq, COIN_PICKUP_RADIUS } from './collision';
import { MAGNET_RADIUS, START_SPEED } from '../config/tuning';
import { speedAt, difficultyAt } from './difficulty';
import { AudioEngine, type SoundName } from './audio';
import type { PowerUpKind, CoinSpec, ObstacleSpec, PowerUpSpec } from './types';
import { type InputBuffer } from './input';
import { FxPool } from '../render/fx';
import type { UiHandle, GameSnapshot } from '../ui/screens';

export type GamePhase = 'menu' | 'running' | 'paused' | 'gameover';

const FIXED_DT = 1 / 60;

export class Game {
  canvas: HTMLCanvasElement;
  ui: UiHandle;
  input?: InputBuffer;
  audio: AudioEngine;
  scene: SceneHandle;
  fx: FxPool;
  player: PlayerState;
  powerUps: ActivePowerUps;
  score: ScoreState;
  track: TrackManager;
  distance = 0;
  elapsed = 0;
  best = 0;
  phase: GamePhase = 'menu';
  collected = new Set<string>();
  private acc = 0;
  private unsubs: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, ui: UiHandle, input?: InputBuffer, audio?: AudioEngine) {
    this.canvas = canvas;
    this.ui = ui;
    this.input = input;
    this.audio = audio ?? new AudioEngine();
    this.scene = createScene(canvas);
    this.fx = new FxPool(this.scene.app, this.scene.app.root);
    this.player = createPlayerState();
    this.powerUps = createPowerUps();
    this.score = createScoreState();
    this.best = loadBestScore();
    const gen = new TrackGenerator(new Rng(1));
    this.track = new TrackManager(this.scene.app, this.scene.app.root, gen, defaultPopulate);
    this.track.update(0);
    const h = this.scene.app.on('update', (dt: number) => this.update(dt));
    this.unsubs.push(() => h.off());
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    this.unsubs.push(() => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    });
  }

  start(): void {
    this.resetRun();
    this.phase = 'running';
    this.ui.show('hud');
    this.ui.update(this.snapshot());
  }

  pause(): void {
    if (this.phase === 'running') { this.phase = 'paused'; this.ui.show('pause'); }
  }
  resume(): void {
    if (this.phase === 'paused') { this.phase = 'running'; this.ui.show('hud'); }
  }
  restart(): void {
    this.track.dispose();
    const gen = new TrackGenerator(new Rng(1));
    this.track = new TrackManager(this.scene.app, this.scene.app.root, gen, defaultPopulate);
    this.resetRun();
    this.phase = 'running';
    this.ui.show('hud');
    this.ui.update(this.snapshot());
  }

  private resetRun(): void {
    this.distance = 0;
    this.elapsed = 0;
    this.acc = 0;
    this.player = createPlayerState();
    this.powerUps = createPowerUps();
    this.score = createScoreState();
    this.collected.clear();
    this.best = loadBestScore();
    this.track.update(0);
  }

  update(dt: number): void {
    if (this.phase === 'running' && this.input) {
      const action = this.input.consume(performance.now());
      if (action === 'left') requestLane(this.player, -1);
      else if (action === 'right') requestLane(this.player, 1);
      else if (action === 'jump') { requestJump(this.player); this.audio.play('jump'); }
      else if (action === 'roll') { requestRoll(this.player); this.audio.play('roll'); }
    }
    if (this.phase === 'running') {
      this.acc += dt;
      while (this.acc >= FIXED_DT) {
        this.step(FIXED_DT);
        this.acc -= FIXED_DT;
        if (this.phase !== 'running') break;
      }
    }
    this.scene.character.update(this.player, this.distance, dt);
    this.scene.setCameraTarget(playerLaneX(this.player), difficultyAt(this.elapsed));
    this.fx.update(dt);
  }

  private step(dt: number): void {
    const speed = speedAt(this.elapsed);
    const prevZ = -this.distance;
    const jp = tickPowerUps(this.powerUps, dt);
    if (jp.jetpackEnded) {
      endJetpack(this.player);
    }
    if (this.powerUps.jetpack > 0 && !this.player.jetpack) {
      startJetpack(this.player);
    }
    this.player.invulnerable = Math.max(this.player.invulnerable, this.powerUps.invulnerable);

    updatePlayer(this.player, dt);
    this.track.update(this.distance);

    const playerZ = -this.distance;
    const previousPlayerZ = prevZ;

    for (const chunk of this.track.chunks) {
      const pattern = chunk.pattern;
      for (const obs of pattern.obstacles) {
        const key = `o:${chunk.index}:${obs.z}`;
        if (this.collected.has(key)) continue;
        const worldZ = -(chunk.startZ + obs.z);
        if (hitsObstacle(this.player, playerZ, previousPlayerZ, obs, worldZ)) {
          if (this.powerUps.hoverboard && consumeHoverboard(this.powerUps)) {
            this.collected.add(key);
            continue;
          }
          this.crash();
          return;
        }
      }
      for (const coin of pattern.coins) {
        const key = `c:${chunk.index}:${coin.z}:${coin.lane}`;
        if (this.collected.has(key)) continue;
        const coinWorldZ = -(chunk.startZ + coin.z);
        const r = this.powerUps.magnet > 0 ? MAGNET_RADIUS : COIN_PICKUP_RADIUS;
        const d2 = coinDistanceSq(this.player, playerZ, coin, coinWorldZ);
        if (d2 <= r * r) {
          this.collected.add(key);
          this.score.coins += 1;
          addCoin(this.score);
          this.audio.play('coin');
this.fx.burst('coin', playerLaneX(this.player), 1, -this.distance);
        }
      }
      for (const pu of pattern.powerUps) {
        const key = `p:${chunk.index}:${pu.z}:${pu.kind}`;
        if (this.collected.has(key)) continue;
        const puWorldZ = -(chunk.startZ + pu.z);
        const puX = pu.lane * 2.5;
        const dx = playerLaneX(this.player) - puX;
        const dz = playerZ - puWorldZ;
        if (Math.hypot(dx, dz) <= 2) {
          this.collected.add(key);
          activatePowerUp(this.powerUps, pu.kind);
          if (pu.kind === 'jetpack') {
            startJetpack(this.player);
          }
          this.audio.play('powerup');
        }
      }
    }

    this.score.multiplier = this.powerUps.multiplier > 0 ? 2 : 1;
    tickScore(this.score, speed * dt);
    this.distance += speed * dt;
    this.elapsed += dt;

    this.ui.update(this.snapshot());
  }

  private crash(): void {
    this.phase = 'gameover';
    saveBestScore(totalScore(this.score));
    this.best = loadBestScore();
    this.audio.play('crash');
    this.scene.shake(0.5);
    this.fx.burst('crash', playerLaneX(this.player), 1, -this.distance);
    this.ui.show('gameover');
    this.ui.update(this.snapshot());
  }

  snapshot(): GameSnapshot {
    const active: Array<{ kind: PowerUpKind; remaining: number }> = [];
    if (this.powerUps.magnet > 0) active.push({ kind: 'magnet', remaining: this.powerUps.magnet });
    if (this.powerUps.jetpack > 0) active.push({ kind: 'jetpack', remaining: this.powerUps.jetpack });
    if (this.powerUps.multiplier > 0) active.push({ kind: 'multiplier', remaining: this.powerUps.multiplier });
    return {
      phase: this.phase,
      score: totalScore(this.score),
      coins: this.score.coins,
      best: this.best,
      distance: this.distance,
      powerUps: active,
    };
  }

  debugAddCoins(n: number): void { this.score.coins += n; this.ui.update(this.snapshot()); }
  debugActivatePowerUp(kind: PowerUpKind): void { activatePowerUp(this.powerUps, kind); if (kind === 'jetpack') startJetpack(this.player); this.ui.update(this.snapshot()); }
  debugPlayerLane(): number { return this.player.lane; }
  debugEndRun(): void {
    this.phase = 'gameover';
    saveBestScore(totalScore(this.score));
    this.best = loadBestScore();
    this.ui.show('gameover');
    this.ui.update(this.snapshot());
  }

  dispose(): void {
    this.unsubs.forEach(u => u());
  }
}