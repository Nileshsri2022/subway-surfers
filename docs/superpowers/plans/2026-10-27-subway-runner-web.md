# Subway Runner Web Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an original 3D endless-runner game that runs in the browser on phones and desktops, with the Subway Surfers feel: three lanes, jump/roll, trains and barriers, coins, power-ups, rising speed, and a PWA install.

**Architecture:** Code-first PlayCanvas Engine 2.x application. A pure TypeScript gameplay core (lane math, player state machine, pattern generation, collision, scoring, power-ups) is kept separate from rendering and DOM UI so it can be unit-tested without WebGL. The track is a deterministic sequence of 30 m chunks with pooled obstacle/coin entities; the camera follows the player, and an HTML/CSS overlay draws menus and the HUD.

**Tech Stack:** TypeScript, PlayCanvas Engine 2.x (`playcanvas`), Vite, Vitest, Playwright, vite-plugin-pwa.

**Spec:** `docs/superpowers/specs/2026-10-27-subway-surfer-web-design.md`

## Global Constraints

- Project root is `subway-runner/` with its own git repository. The APK and extracted analysis files stay outside it.
- TypeScript `strict: true`; no `any` in exported interfaces.
- PlayCanvas Engine 2.x, imported as an ES module: `import * as pc from 'playcanvas'`.
- No copied Subway Surfers assets, code, names, or branding. Any third-party asset must be CC0 and recorded in `CREDITS.md`.
- Static hosting only: no backend, accounts, ads, or purchases.
- Target Chrome/Edge/Firefox/Safari desktop, iOS Safari, Android Chrome.
- 60 fps target on a mid-range phone; cap device pixel ratio at 2; pool entities and avoid per-frame allocations.
- All gameplay constants live in `src/config/tuning.ts`.
- Every task ends with `npm run typecheck`, `npm test`, and a commit. Browser tasks also run `npm run test:e2e`.

## Review Focus

These are the failure modes most likely to hurt a player and are not fully exercised by ordinary happy-path tests. Each is pinned to a test in the owning task.

1. **Collision tunneling at top speed** — at 30 m/s the player moves 0.5 m per 60 Hz frame; a thin barrier must not be skipped. Test: swept collision in Task 5.
2. **Rapid or conflicting input** — swiping during a lane change, jumping while rolling, or fast-falling. Test: player state transitions in Task 3 and input buffering in Task 12.
3. **Mobile browser chrome and safe areas** — the HUD and game-over buttons must stay visible under notches and dynamic browser toolbars, and swipes must not scroll the page. Test: mobile viewport and `touch-action` check in Task 15.
4. **Jetpack expiry over an obstacle** — the player must never drop into a train because the timer ran out. Test: descent invulnerability in Task 6 and collision bypass in Task 5.
5. **Unavailable `localStorage`** — private mode or quota errors must not crash score saving or loading. Test: storage failure path in Task 6.

---

## File Structure

```
subway-runner/
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  playwright.config.ts
  index.html
  public/icons/icon-192.png
  public/icons/icon-512.png
  src/
    main.ts
    global.d.ts
    config/tuning.ts
    game/types.ts
    game/rng.ts
    game/lanes.ts
    game/player.ts
    game/patterns.ts
    game/track.ts
    game/collision.ts
    game/score.ts
    game/powerups.ts
    game/input.ts
    game/audio.ts
    game/difficulty.ts
    game/game.ts
    game/scene.ts
    render/meshes.ts
    render/pool.ts
    render/character.ts
    render/city.ts
    render/props.ts
    render/fx.ts
    ui/screens.ts
    ui/styles.css
  tests/
    smoke.test.ts
    lanes.test.ts
    rng.test.ts
    player.test.ts
    patterns.test.ts
    track.test.ts
    collision.test.ts
    score.test.ts
    powerups.test.ts
    input.test.ts
    difficulty.test.ts
    pool.test.ts
    e2e/smoke.spec.ts
    e2e/game.spec.ts
    e2e/input.spec.ts
    e2e/pwa.spec.ts
  README.md
  CREDITS.md
```

Responsibilities:

- `config/tuning.ts` — every gameplay number in one place.
- `game/types.ts` — shared types (`Lane`, `Pattern`, `ObstacleSpec`, `CoinSpec`, `PowerUpSpec`, `GamePhase`).
- `game/rng.ts` — deterministic seeded RNG.
- `game/lanes.ts` — lane ⇄ x conversion and clamping.
- `game/player.ts` — pure player state machine (lane transition, jump, roll, jetpack descent, timers).
- `game/patterns.ts` — authored obstacle/coin patterns and the survivability validator.
- `game/track.ts` — chunk generator and `TrackManager` lifecycle.
- `game/collision.ts` — lane-space boxes, swept tests, coin/pickup distance.
- `game/score.ts` — distance/coins/multiplier math and best-score persistence.
- `game/powerups.ts` — independent power-up timers, hoverboard shield.
- `game/input.ts` — `InputBuffer`, keyboard mapping, pointer swipe detection.
- `game/audio.ts` — synthesized Web Audio SFX and mute persistence.
- `game/difficulty.ts` — speed and difficulty curves.
- `game/game.ts` — phase machine, update loop, orchestration, test hooks.
- `game/scene.ts` — PlayCanvas app, camera, lights, fog, ground, sky.
- `render/meshes.ts` — primitive/material factories.
- `render/pool.ts` — reusable entity pool.
- `render/character.ts` — procedural character rig and animation.
- `render/city.ts` — modular city/environment chunks.
- `render/props.ts` — obstacle, coin, and power-up entity factories.
- `render/fx.ts` — pooled particles, coin sparkle, crash burst.
- `ui/screens.ts` — DOM screens, HUD, buttons.
- `ui/styles.css` — layout, safe-area handling, touch behavior.

---

## Task 1: Scaffold the project and test runner

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `tests/smoke.test.ts`, `.gitignore`, `README.md`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `typecheck`, `test:e2e`; Vite entry `index.html` → `src/main.ts`; Vitest discovers `tests/**/*.test.ts`.

- [ ] **Step 1: Create the repository and ignore build output**

Run in `subway-runner/`:

```bash
git init
```

`.gitignore` contains `node_modules/`, `dist/`, `.vite/`, `test-results/`, `playwright-report/`.

- [ ] **Step 2: Write the failing smoke test**

`tests/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { APP_NAME } from '../src/main';

describe('scaffold', () => {
  it('exposes the app name', () => {
    expect(APP_NAME).toBe('Subway Runner');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL because `src/main.ts` does not exist.

- [ ] **Step 4: Create the project files**

`package.json` dependencies: `playcanvas@^2.22.2`; devDependencies: `typescript@^5`, `vite@^7`, `vitest@^3`, `@playwright/test@^1`, `vite-plugin-pwa@^1`, `@types/node@^24`. Scripts: `dev: "vite"`, `build: "tsc --noEmit && vite build"`, `preview: "vite preview"`, `test: "vitest run"`, `typecheck: "tsc --noEmit"`, `test:e2e: "playwright test"`.

`tsconfig.json`: `strict: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `types: ["vite/client"]`, `noEmit: true`.

`index.html` contains `<canvas id="game-canvas"></canvas>`, `<div id="ui-root"></div>`, and `<script type="module" src="/src/main.ts"></script>`.

`src/main.ts` exports `APP_NAME = 'Subway Runner'` and sets `document.title`.

- [ ] **Step 5: Install and verify**

Run: `npm install`
Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold subway runner project"
```

---

## Task 2: Tuning constants, shared types, RNG, and lane math

**Files:**
- Create: `src/config/tuning.ts`, `src/game/types.ts`, `src/game/rng.ts`, `src/game/lanes.ts`
- Test: `tests/lanes.test.ts`, `tests/rng.test.ts`

**Interfaces:**
- Produces:
  - `LANE_WIDTH = 2.5`, `LANE_X: readonly [number, number, number] = [-2.5, 0, 2.5]`
  - `TRACK_CHUNK_LENGTH = 30`, `START_SPEED = 12`, `MAX_SPEED = 30`, `SPEED_RAMP_SECONDS = 180`
  - `JUMP_VELOCITY = 14`, `GRAVITY = -55`, `ROLL_SECONDS = 0.6`, `LANE_CHANGE_SECONDS = 0.12`
  - `PLAYER_HEIGHT = 1.8`, `PLAYER_ROLL_HEIGHT = 0.9`, `PLAYER_HALF_WIDTH = 0.4`
  - `COIN_RADIUS = 0.45`, `MAGNET_RADIUS = 6`, `MAGNET_SECONDS = 10`, `JETPACK_SECONDS = 8`, `MULTIPLIER_SECONDS = 15`
  - `JETPACK_ALTITUDE = 4.5`, `JETPACK_DESCENT_SECONDS = 0.6`, `HOVERBOARD_INVULN_SECONDS = 1.5`
  - `SPAWN_AHEAD = 120`, `DESPAWN_BEHIND = 20`
  - `type Lane = -1 | 0 | 1`
  - `interface ObstacleSpec { kind: 'train' | 'lowBarrier' | 'overhead'; lane: Lane; z: number; length: number }`
  - `interface CoinSpec { lane: Lane; z: number; y: number }`
  - `interface PowerUpSpec { kind: PowerUpKind; lane: Lane; z: number }`
  - `type PowerUpKind = 'magnet' | 'jetpack' | 'multiplier'`
  - `interface Pattern { obstacles: ObstacleSpec[]; coins: CoinSpec[]; powerUps: PowerUpSpec[] }`
  - `class Rng { constructor(seed: number); next(): number; int(maxExclusive: number): number; pick<T>(items: readonly T[]): T }`
  - `laneToX(lane: Lane): number`, `nearestLane(x: number): Lane`, `clampLane(value: number): Lane`

- [ ] **Step 1: Write the failing tests**

`tests/lanes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampLane, laneToX, nearestLane } from '../src/game/lanes';

describe('lanes', () => {
  it('maps lanes to x positions', () => {
    expect(laneToX(-1)).toBe(-2.5);
    expect(laneToX(0)).toBe(0);
    expect(laneToX(1)).toBe(2.5);
  });
  it('snaps x to the nearest lane at the midpoints', () => {
    expect(nearestLane(-1.24)).toBe(0);
    expect(nearestLane(-1.26)).toBe(-1);
    expect(nearestLane(1.24)).toBe(0);
    expect(nearestLane(1.26)).toBe(1);
  });
  it('clamps out-of-range lanes', () => {
    expect(clampLane(-4)).toBe(-1);
    expect(clampLane(3)).toBe(1);
  });
});
```

`tests/rng.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/game/rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
  it('stays in range', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = r.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(r.int(3)).toBeGreaterThanOrEqual(0);
      expect(r.int(3)).toBeLessThan(3);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/lanes.test.ts tests/rng.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the constants, types, RNG, and lane helpers**

Use a mulberry32-style 32-bit PRNG in `Rng`. `nearestLane` compares `x` to `LANE_X` and returns the closest index mapped to `-1 | 0 | 1`. `clampLane` rounds and clamps to `[-1, 1]`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/lanes.test.ts tests/rng.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/tuning.ts src/game/types.ts src/game/rng.ts src/game/lanes.ts tests/lanes.test.ts tests/rng.test.ts
git commit -m "feat: add tuning, types, rng and lane math"
```

---

## Task 3: Player state machine

**Files:**
- Create: `src/game/player.ts`
- Test: `tests/player.test.ts`

**Interfaces:**
- Consumes: `Lane`, `clampLane`, `laneToX`, tuning constants.
- Produces:
  - `interface PlayerState { lane: Lane; laneFrom: Lane; laneTo: Lane; laneT: number; y: number; vy: number; rolling: boolean; rollRemaining: number; airborne: boolean; jetpack: boolean; descentRemaining: number; invulnerable: number }`
  - `createPlayerState(): PlayerState`
  - `requestLane(state: PlayerState, dir: -1 | 1): void`
  - `requestJump(state: PlayerState): void`
  - `requestRoll(state: PlayerState): void`
  - `updatePlayer(state: PlayerState, dt: number): void`
  - `playerLaneX(state: PlayerState): number`
  - `playerHalfHeight(state: PlayerState): number`
  - `playerCenterY(state: PlayerState): number`
  - `startJetpack(state: PlayerState): void`
  - `endJetpack(state: PlayerState): void`

Rules:
- `requestLane` is ignored while `laneT < 1`; otherwise it sets `laneFrom = lane`, `laneTo = clampLane(lane + dir)`, `laneT = 0`, and returns without changing `lane` if the target equals the current lane.
- `requestJump` works only when grounded, not rolling, and not jetpacking; it sets `airborne = true`, `vy = JUMP_VELOCITY`.
- `requestRoll` on the ground sets `rolling = true`, `rollRemaining = ROLL_SECONDS`; in the air it sets `vy = -JUMP_VELOCITY` (fast fall) without rolling.
- `updatePlayer` advances `laneT` by `dt / LANE_CHANGE_SECONDS`; on completion sets `lane = laneTo` and `laneT = 1`.
- Gravity applies when airborne and not jetpacking. Landing clamps `y` to 0 and clears `airborne`.
- `startJetpack` sets `jetpack = true`, `y = JETPACK_ALTITUDE`, `vy = 0`, `airborne = false`.
- `endJetpack` sets `jetpack = false`, `descentRemaining = JETPACK_DESCENT_SECONDS`, and `invulnerable = max(invulnerable, JETPACK_DESCENT_SECONDS + 0.2)`.
- `playerLaneX` interpolates with smoothstep. `playerCenterY` is `PLAYER_ROLL_HEIGHT / 2` while rolling, `JETPACK_ALTITUDE` while jetpacking, otherwise `y + playerHalfHeight`.

- [ ] **Step 1: Write the failing test**

`tests/player.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createPlayerState, endJetpack, playerHalfHeight, requestJump, requestLane,
  requestRoll, startJetpack, updatePlayer
} from '../src/game/player';

describe('player state', () => {
  it('completes a lane change in 0.12 seconds', () => {
    const s = createPlayerState();
    requestLane(s, 1);
    updatePlayer(s, 0.06);
    expect(s.laneT).toBeCloseTo(0.5);
    updatePlayer(s, 0.06);
    expect(s.lane).toBe(1);
    expect(s.laneT).toBe(1);
  });

  it('ignores a second lane request during a transition', () => {
    const s = createPlayerState();
    requestLane(s, 1);
    requestLane(s, -1);
    updatePlayer(s, 0.12);
    expect(s.lane).toBe(1);
  });

  it('jumps and lands', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.2);
    expect(s.y).toBeGreaterThan(0);
    updatePlayer(s, 0.4);
    expect(s.y).toBe(0);
    expect(s.airborne).toBe(false);
  });

  it('rolls for 0.6 seconds and lowers the hitbox', () => {
    const s = createPlayerState();
    const standing = playerHalfHeight(s);
    requestRoll(s);
    expect(playerHalfHeight(s)).toBeLessThan(standing);
    updatePlayer(s, 0.61);
    expect(s.rolling).toBe(false);
  });

  it('fast-falls when rolling in the air', () => {
    const s = createPlayerState();
    requestJump(s);
    updatePlayer(s, 0.1);
    requestRoll(s);
    expect(s.vy).toBeLessThan(0);
    expect(s.rolling).toBe(false);
  });

  it('descends safely after the jetpack ends', () => {
    const s = createPlayerState();
    startJetpack(s);
    expect(s.y).toBe(4.5);
    endJetpack(s);
    updatePlayer(s, 0.3);
    expect(s.y).toBeGreaterThan(0);
    expect(s.invulnerable).toBeGreaterThan(0);
    updatePlayer(s, 0.31);
    expect(s.y).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/player.test.ts`
Expected: FAIL because `player.ts` does not exist.

- [ ] **Step 3: Implement `src/game/player.ts`**

Implement the state machine exactly as described above. Keep it pure: no PlayCanvas imports and no DOM access.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/player.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/player.ts tests/player.test.ts
git commit -m "feat: add player state machine"
```

---

## Task 4: Patterns, track generator, and fairness validation

**Files:**
- Create: `src/game/patterns.ts`, `src/game/track.ts`
- Test: `tests/patterns.test.ts`, `tests/track.test.ts`

**Interfaces:**
- Consumes: `Pattern`, `ObstacleSpec`, `CoinSpec`, `PowerUpSpec`, `Lane`, `Rng`, `TRACK_CHUNK_LENGTH`.
- Produces:
  - `PATTERNS: readonly Pattern[]`
  - `isPatternSurvivable(pattern: Pattern): boolean`
  - `interface Chunk { index: number; startZ: number; pattern: Pattern }`
  - `class TrackGenerator { constructor(rng: Rng); nextChunk(index: number): Chunk }`

Pattern rules:
- Patterns are 30 m long and use `z` in `[0, 30)`.
- Train length 8 m; low and overhead barriers 1 m.
- At least one authored pattern must be trivially safe (empty or single-lane) so the generator has a fallback.

Fairness algorithm:
- Sample the chunk at 1 m steps.
- At each step, compute blocked lanes from obstacle intervals.
- Keep a set of reachable lanes; start with all three.
- Remove blocked lanes; if the set becomes empty, the pattern is not survivable.
- Between steps, a player may move at most one lane, so expand reachability to lanes within 1 of the previous set.

- [ ] **Step 1: Write the failing tests**

`tests/patterns.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PATTERNS, isPatternSurvivable } from '../src/game/patterns';
import type { Pattern } from '../src/game/types';

describe('patterns', () => {
  it('marks every authored pattern survivable', () => {
    for (const pattern of PATTERNS) {
      expect(isPatternSurvivable(pattern), JSON.stringify(pattern)).toBe(true);
    }
  });

  it('rejects a pattern that blocks all three lanes', () => {
    const impossible: Pattern = {
      obstacles: [-1, 0, 1].map((lane) => ({
        kind: 'train', lane: lane as -1 | 0 | 1, z: 5, length: 8
      })),
      coins: [], powerUps: []
    };
    expect(isPatternSurvivable(impossible)).toBe(false);
  });

  it('accepts an empty pattern', () => {
    expect(isPatternSurvivable({ obstacles: [], coins: [], powerUps: [] })).toBe(true);
  });
});
```

`tests/track.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/game/rng';
import { TrackGenerator } from '../src/game/track';
import { isPatternSurvivable } from '../src/game/patterns';

describe('TrackGenerator', () => {
  it('starts each chunk at index times 30', () => {
    const gen = new TrackGenerator(new Rng(1));
    expect(gen.nextChunk(0).startZ).toBe(0);
    expect(gen.nextChunk(3).startZ).toBe(90);
  });

  it('is deterministic for a seed', () => {
    const a = new TrackGenerator(new Rng(9));
    const b = new TrackGenerator(new Rng(9));
    expect(a.nextChunk(0)).toEqual(b.nextChunk(0));
  });

  it('generates only survivable chunks across 10,000 seeds', () => {
    for (let seed = 0; seed < 10_000; seed += 1) {
      const gen = new TrackGenerator(new Rng(seed));
      const chunk = gen.nextChunk(0);
      expect(isPatternSurvivable(chunk.pattern), `seed ${seed}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/patterns.test.ts tests/track.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the pattern library and generator**

Author at least eight patterns with a mix of trains, low barriers, overhead barriers, coin lines/arcs, and one power-up. `TrackGenerator.nextChunk` picks a random pattern, validates it, retries up to 20 times, then falls back to the first safe pattern.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/patterns.test.ts tests/track.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/patterns.ts src/game/track.ts tests/patterns.test.ts tests/track.test.ts
git commit -m "feat: add patterns, track generator and fairness validation"
```

---

## Task 5: Collision and pickup tests

**Files:**
- Create: `src/game/collision.ts`
- Test: `tests/collision.test.ts`

**Interfaces:**
- Consumes: `PlayerState`, `playerLaneX`, `playerCenterY`, `playerHalfHeight`, `ObstacleSpec`, `CoinSpec`, tuning constants.
- Produces:
  - `interface Box { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number }`
  - `playerBox(state: PlayerState, z: number): Box`
  - `obstacleBox(spec: ObstacleSpec, worldZ: number): Box`
  - `boxesOverlap(a: Box, b: Box): boolean`
  - `sweepsOverlap(a: Box, previousZ: number, b: Box): boolean`
  - `hitsObstacle(state: PlayerState, z: number, previousZ: number, spec: ObstacleSpec, obstacleWorldZ: number): boolean`
  - `coinDistanceSq(state: PlayerState, z: number, coin: CoinSpec, coinWorldZ: number): number`

Box rules:
- Player: `hx = PLAYER_HALF_WIDTH`, `hy = playerHalfHeight(state)`, `hz = 0.5`, `cx = playerLaneX(state)`, `cy = playerCenterY(state)`.
- Train: `hx = 0.9`, `hy = 1.8`, `hz = 4`, base at ground.
- Low barrier: `hx = 0.9`, `hy = 0.5`, `hz = 0.5`, center at `y = 0.5`.
- Overhead barrier: `hx = 0.9`, `hy = 0.4`, `hz = 0.5`, center at `y = 1.6`.
- `sweepsOverlap` expands the obstacle's z half-depth by `abs(z - previousZ)`.
- `hitsObstacle` returns false when `state.invulnerable > 0` or `state.jetpack` is true.
- `coinDistanceSq` uses the player center and the coin position; the pickup threshold is `COIN_RADIUS + PLAYER_HALF_WIDTH`.

- [ ] **Step 1: Write the failing test**

`tests/collision.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPlayerState, requestJump, requestRoll, startJetpack, updatePlayer } from '../src/game/player';
import { coinDistanceSq, hitsObstacle, sweepsOverlap, playerBox, obstacleBox } from '../src/game/collision';
import type { ObstacleSpec } from '../src/game/types';

const train = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'train', lane, z: 0, length: 8 });
const low = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'lowBarrier', lane, z: 0, length: 1 });
const overhead = (lane: 0 | 1 | -1): ObstacleSpec => ({ kind: 'overhead', lane, z: 0, length: 1 });

describe('collision', () => {
  it('hits a train in the same lane and misses the adjacent lane', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(true);
    expect(hitsObstacle(s, -4, -3.5, train(1), -4)).toBe(false);
  });

  it('requires a jump for a low barrier', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, low(0), -4)).toBe(true);
    requestJump(s);
    updatePlayer(s, 0.3);
    expect(hitsObstacle(s, -4, -3.5, low(0), -4)).toBe(false);
  });

  it('requires a roll for an overhead barrier', () => {
    const s = createPlayerState();
    expect(hitsObstacle(s, -4, -3.5, overhead(0), -4)).toBe(true);
    requestRoll(s);
    expect(hitsObstacle(s, -4, -3.5, overhead(0), -4)).toBe(false);
  });

  it('ignores collisions during jetpack and invulnerability', () => {
    const s = createPlayerState();
    startJetpack(s);
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(false);
    s.jetpack = false;
    s.invulnerable = 1;
    expect(hitsObstacle(s, -4, -3.5, train(0), -4)).toBe(false);
  });

  it('sweeps thin obstacles at 0.5 metres per frame', () => {
    const a = playerBox(createPlayerState(), -1);
    const b = obstacleBox(low(0), -0.6);
    expect(sweepsOverlap(a, -0.1, b)).toBe(true);
  });

  it('measures coin pickup distance', () => {
    const s = createPlayerState();
    expect(coinDistanceSq(s, -4, { lane: 0, z: 0, y: 0.9 }, -4)).toBe(0);
    expect(coinDistanceSq(s, -4, { lane: 1, z: 0, y: 0.9 }, -4)).toBeGreaterThan(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/collision.test.ts`
Expected: FAIL because `collision.ts` does not exist.

- [ ] **Step 3: Implement `src/game/collision.ts`**

Use AABB overlap with inclusive bounds. Convert lane to `x` for obstacle boxes. Keep the module pure and allocation-light.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/collision.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/collision.ts tests/collision.test.ts
git commit -m "feat: add collision and pickup detection"
```

---

## Task 6: Score, best score, and power-up timers

**Files:**
- Create: `src/game/score.ts`, `src/game/powerups.ts`
- Test: `tests/score.test.ts`, `tests/powerups.test.ts`

**Interfaces:**
- Consumes: `PowerUpKind`, tuning constants.
- Produces:
  - `interface ScoreState { distance: number; coins: number; multiplier: number }`
  - `createScoreState(): ScoreState`
  - `tickScore(state: ScoreState, meters: number): void`
  - `addCoin(state: ScoreState): void`
  - `totalScore(state: ScoreState): number`
  - `loadBestScore(): number`
  - `saveBestScore(score: number): void`
  - `interface ActivePowerUps { magnet: number; jetpack: number; multiplier: number; invulnerable: number; hoverboard: boolean }`
  - `createPowerUps(): ActivePowerUps`
  - `activatePowerUp(state: ActivePowerUps, kind: PowerUpKind): void`
  - `tickPowerUps(state: ActivePowerUps, dt: number): { jetpackEnded: boolean }`
  - `consumeHoverboard(state: ActivePowerUps): boolean`

Rules:
- `totalScore = Math.floor((distance + coins * 10) * multiplier)`.
- `saveBestScore` writes only when the new score is higher. Both storage functions catch exceptions and degrade to `0` / no-op.
- Power-up timers are independent and stack. Re-activating a type resets its timer.
- `tickPowerUps` returns `jetpackEnded: true` exactly on the tick where the jetpack timer crosses from positive to zero.
- `consumeHoverboard` returns `true` once, clears the board, and sets `invulnerable = max(invulnerable, HOVERBOARD_INVULN_SECONDS)`.

- [ ] **Step 1: Write the failing tests**

`tests/score.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addCoin, createScoreState, loadBestScore, saveBestScore, tickScore, totalScore } from '../src/game/score';

afterEach(() => vi.unstubAllGlobals());

describe('score', () => {
  it('adds distance and coins with the multiplier', () => {
    const s = createScoreState();
    tickScore(s, 100);
    addCoin(s);
    addCoin(s);
    s.multiplier = 2;
    expect(totalScore(s)).toBe(240);
  });

  it('persists only a higher best score', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    });
    saveBestScore(50);
    saveBestScore(10);
    expect(loadBestScore()).toBe(50);
  });

  it('degrades when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); }
    });
    expect(loadBestScore()).toBe(0);
    expect(() => saveBestScore(99)).not.toThrow();
  });
});
```

`tests/powerups.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { activatePowerUp, consumeHoverboard, createPowerUps, tickPowerUps } from '../src/game/powerups';

describe('power-ups', () => {
  it('stacks independent timers', () => {
    const p = createPowerUps();
    activatePowerUp(p, 'magnet');
    activatePowerUp(p, 'jetpack');
    activatePowerUp(p, 'multiplier');
    expect(p.magnet).toBe(10);
    expect(p.jetpack).toBe(8);
    expect(p.multiplier).toBe(15);
    tickPowerUps(p, 1);
    expect(p.magnet).toBe(9);
    expect(p.jetpack).toBe(7);
  });

  it('reports the jetpack ending once', () => {
    const p = createPowerUps();
    activatePowerUp(p, 'jetpack');
    expect(tickPowerUps(p, 8).jetpackEnded).toBe(true);
    expect(tickPowerUps(p, 1).jetpackEnded).toBe(false);
  });

  it('consumes the hoverboard once and grants invulnerability', () => {
    const p = createPowerUps();
    p.hoverboard = true;
    expect(consumeHoverboard(p)).toBe(true);
    expect(consumeHoverboard(p)).toBe(false);
    expect(p.invulnerable).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/score.test.ts tests/powerups.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement `src/game/score.ts` and `src/game/powerups.ts`**

Guard every `localStorage` access with `try/catch`. Keep the power-up module free of rendering and player imports.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/score.test.ts tests/powerups.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/score.ts src/game/powerups.ts tests/score.test.ts tests/powerups.test.ts
git commit -m "feat: add score, best score and power-up timers"
```

---

## Task 7: PlayCanvas scene bootstrap

**Files:**
- Create: `src/game/scene.ts`, `src/render/meshes.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `src/main.ts`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: PlayCanvas Engine 2.x.
- Produces:
  - `interface SceneHandle { app: pc.Application; camera: pc.Entity; playerRoot: pc.Entity; setCameraTarget(x: number, speed01: number): void; dispose(): void }`
  - `createScene(canvas: HTMLCanvasElement): SceneHandle`
  - `createMaterial(color: pc.Color, options?: { emissive?: pc.Color }): pc.StandardMaterial`
  - `createBox(parent: pc.Entity, name: string, size: [number, number, number], material: pc.StandardMaterial): pc.Entity`

Scene contents:
- `new pc.Application(canvas)`; `setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)`; `setCanvasResolution(pc.RESOLUTION_AUTO)`; resize on `window.resize`.
- Camera at `(0, 4.2, 8)`, looking at `(0, 1, -12)`, `fov = 60`, `nearClip = 0.1`, `farClip = 180`.
- Directional light at `(5, 10, 5)` with a warm color; ambient via `pc.StandardMaterial` + scene ambient? Use a `pc.LightComponent` directional plus a low-intensity fill light.
- Sky: camera clear color `(0.55, 0.72, 0.9)`.
- Fog: `app.scene.fog.type = pc.FOG_LINEAR`, color matching the sky, start 45, end 120.
- Ground: a large box or plane at `y = -0.05` with a dark asphalt material.
- Player placeholder: a capsule at `(0, 0.9, 0)`.
- `src/main.ts` creates the scene, sets `window.__SUBWAY_RUNNER__ = { ready: true }`, and starts the app.

- [ ] **Step 1: Write the failing browser smoke test**

`playwright.config.ts`: `webServer` runs `npm run dev -- --port 5173`, `baseURL: 'http://localhost:5173'`, project `chromium`, `use: { headless: true }`.

`tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('loads the scene without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__SUBWAY_RUNNER__?.ready));
  await expect(page.locator('#game-canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright install chromium` once.
Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL because the scene and ready flag do not exist.

- [ ] **Step 3: Implement the scene and mesh factories**

Use `Application` from `playcanvas`. Add entities with `addComponent('render', { type: 'box' | 'capsule' | 'plane' })` and assign `entity.render.material`. Add the camera and lights to `app.root`. Start the app at the end of `createScene`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/scene.ts src/render/meshes.ts src/main.ts playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "feat: bootstrap playcanvas scene"
```

---

## Task 8: Character rig, run animation, and camera follow

**Files:**
- Create: `src/render/character.ts`
- Modify: `src/game/scene.ts` (camera target method)
- Test: `tests/character.test.ts`, `tests/e2e/character.spec.ts`

**Interfaces:**
- Consumes: `PlayerState`, `playerLaneX`, `playerCenterY`, `playerHalfHeight`.
- Produces:
  - `interface CharacterRig { root: pc.Entity; update(state: PlayerState, distance: number, dt: number): void; dispose(): void }`
  - `createCharacter(app: pc.Application): CharacterRig`
  - `runPose(distance: number): { armSwing: number; legSwing: number; bob: number }`

Rig:
- Body: capsule or box at `y = 1.0`, head sphere at `y = 1.65`, cap box, backpack box.
- Arms and legs are child entities with pivots at the shoulders/hips; rotate them around X.
- Run cycle: `armSwing = sin(distance * 2.2)`, `legSwing = -armSwing`, `bob = abs(sin(distance * 2.2)) * 0.05`.
- Jumping: tuck legs, raise arms; rolling: squash the body to 55% height and rotate forward; jetpack: legs together, arms out.
- `update` sets the root position from `playerLaneX` and the player y, and applies the pose.

Camera:
- `setCameraTarget(x, speed01)` moves the camera x toward `x * 0.55` with damping, keeps `y = 4.2`, `z = 8`, and lerps `fov` from 60 to 68 as `speed01` rises.

- [ ] **Step 1: Write the failing tests**

`tests/character.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { runPose } from '../src/render/character';

describe('runPose', () => {
  it('is deterministic and bounded', () => {
    for (let d = 0; d < 50; d += 0.25) {
      const pose = runPose(d);
      expect(Math.abs(pose.armSwing)).toBeLessThanOrEqual(1);
      expect(Math.abs(pose.legSwing)).toBeLessThanOrEqual(1);
      expect(pose.bob).toBeGreaterThanOrEqual(0);
      expect(pose.bob).toBeLessThan(0.1);
    }
  });
});
```

`tests/e2e/character.spec.ts`: load the page, wait for ready, assert no console errors and that the canvas is visible.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/character.test.ts`
Expected: FAIL because `runPose` does not exist.

- [ ] **Step 3: Implement the character rig and camera follow**

Use only primitives; no external models. Keep `runPose` pure and import it in the rig. Reuse scratch vectors/colors at module scope.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/character.test.ts`
Run: `npm run test:e2e -- tests/e2e/character.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/character.ts src/game/scene.ts tests/character.test.ts tests/e2e/character.spec.ts
git commit -m "feat: add character rig, run animation and camera follow"
```

---

## Task 9: Track manager, city chunks, props, and entity pooling

**Files:**
- Create: `src/render/pool.ts`, `src/render/city.ts`, `src/render/props.ts`
- Modify: `src/game/track.ts` (add `TrackManager`)
- Test: `tests/pool.test.ts`, `tests/track-manager.test.ts`, `tests/e2e/track.spec.ts`

**Interfaces:**
- Consumes: `Chunk`, `TrackGenerator`, `ObstacleSpec`, `CoinSpec`, `PowerUpSpec`, `createBox`, `createMaterial`.
- Produces:
  - `class EntityPool { constructor(factory: () => pc.Entity, reset: (e: pc.Entity) => void); acquire(): pc.Entity; release(e: pc.Entity): void; get size(): number }`
  - `class TrackManager { constructor(app: pc.Application, root: pc.Entity, generator: TrackGenerator); update(distance: number): void; readonly chunks: readonly Chunk[]; dispose(): void }`
  - `createCityChunk(app: pc.Application, chunk: Chunk): pc.Entity`
  - `createObstacle(app: pc.Application, spec: ObstacleSpec): pc.Entity`
  - `createCoin(app: pc.Application): pc.Entity`
  - `createPowerUp(app: pc.Application, kind: PowerUpSpec['kind']): pc.Entity`

Rules:
- `TrackManager.update(distance)` ensures chunks exist for indices from `floor((distance - DESPAWN_BEHIND) / 30)` through `ceil((distance + SPAWN_AHEAD) / 30)`.
- Chunk entities are placed at `z = -chunk.startZ`.
- Chunks behind `distance - DESPAWN_BEHIND` are released to the pool.
- `EntityPool.release` disables the entity and returns it to the free list; `acquire` re-enables and resets it.

- [ ] **Step 1: Write the failing tests**

`tests/pool.test.ts`: acquire returns an entity, release puts it back, and a second acquire reuses the same entity.

`tests/track-manager.test.ts`: construct a `TrackManager` with a stub app/root (or a factory-injected manager), call `update(0)`, and assert chunks cover `0..120`; call `update(200)`, assert chunks below `180` are gone and chunks up to `320` exist.

`tests/e2e/track.spec.ts`: load the page, wait for ready, assert no console errors.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/pool.test.ts tests/track-manager.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement pooling, city chunks, props, and the track manager**

City: 3–6 buildings per chunk on each side, varying heights and colors from a seeded palette; overhead gantries every few chunks; track ballast strip; graffiti panels as colored boxes. Props: train (long box + windows), low barrier (striped box), overhead barrier (two posts + beam), coin (thin cylinder rotated to face the camera), power-up (box with an emissive color per kind).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/pool.test.ts tests/track-manager.test.ts`
Run: `npm run test:e2e -- tests/e2e/track.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/pool.ts src/render/city.ts src/render/props.ts src/game/track.ts tests/pool.test.ts tests/track-manager.test.ts tests/e2e/track.spec.ts
git commit -m "feat: add track manager, city chunks, props and pooling"
```

---

## Task 10: Game loop, phases, crash, restart, and UI skeleton

**Files:**
- Create: `src/game/difficulty.ts`, `src/game/game.ts`, `src/ui/screens.ts`, `src/ui/styles.css`
- Modify: `src/main.ts`
- Test: `tests/difficulty.test.ts`, `tests/e2e/game.spec.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–9.
- Produces:
  - `speedAt(elapsedSeconds: number): number`
  - `difficultyAt(elapsedSeconds: number): number`
  - `type GamePhase = 'menu' | 'running' | 'paused' | 'gameover'`
  - `interface GameSnapshot { phase: GamePhase; score: number; coins: number; best: number; distance: number; powerUps: Array<{ kind: PowerUpKind; remaining: number }> }`
  - `interface UiCallbacks { onPlay(): void; onRestart(): void; onPause(): void; onResume(): void }`
  - `interface UiHandle { show(screen: 'start' | 'hud' | 'pause' | 'gameover'): void; update(snapshot: GameSnapshot): void }`
  - `mountUi(root: HTMLElement, callbacks: UiCallbacks): UiHandle`
  - `class Game { constructor(canvas: HTMLCanvasElement, ui: UiHandle); start(): void; pause(): void; resume(): void; restart(): void; update(dt: number): void; snapshot(): GameSnapshot; debugAddCoins(n: number): void; debugActivatePowerUp(kind: PowerUpKind): void; debugPlayerLane(): Lane; debugEndRun(): void }`

Rules:
- `speedAt` is monotonic from `START_SPEED` to `MAX_SPEED` over `SPEED_RAMP_SECONDS`, clamped at both ends.
- `difficultyAt` is `(speedAt(t) - START_SPEED) / (MAX_SPEED - START_SPEED)`.
- Game phases: `menu` → `running` → `paused`/`gameover`; restart resets distance, score, coins, power-ups, player, and track manager.
- On crash: phase `gameover`, save best score, show the game-over screen.
- On start: reset the run, show HUD, begin.
- `window.__game = game` in `main.ts` for e2e hooks.
- UI: start screen with title, best score, Play button; HUD with score, coins, pause button; pause overlay with Resume; game-over with score, best, Restart. Use `100dvh`, safe-area insets, and `touch-action: none` on the canvas.

- [ ] **Step 1: Write the failing tests**

`tests/difficulty.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { difficultyAt, speedAt } from '../src/game/difficulty';

describe('difficulty', () => {
  it('ramps speed monotonically and clamps', () => {
    expect(speedAt(0)).toBe(12);
    expect(speedAt(180)).toBe(30);
    expect(speedAt(999)).toBe(30);
    for (let t = 0; t < 200; t += 5) expect(speedAt(t + 5)).toBeGreaterThanOrEqual(speedAt(t));
  });
  it('normalizes difficulty to 0..1', () => {
    expect(difficultyAt(0)).toBe(0);
    expect(difficultyAt(180)).toBe(1);
  });
});
```

`tests/e2e/game.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('starts, ends, and restarts a run', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByTestId('hud')).toBeVisible();
  await page.evaluate(() => (window as any).__game.debugEndRun());
  await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByTestId('hud')).toBeVisible();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/difficulty.test.ts`
Run: `npm run test:e2e -- tests/e2e/game.spec.ts`
Expected: FAIL because the modules and UI do not exist.

- [ ] **Step 3: Implement difficulty, game loop, and UI skeleton**

The game owns the scene, player state, character rig, track manager, score, power-ups, and UI. Use a fixed-step accumulator (`1/60`) for gameplay updates and render on PlayCanvas's `app.on('update')`. Reset all mutable state in `restart()`. The UI is plain DOM created in `mountUi`; use `data-testid` on the HUD.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/difficulty.test.ts`
Run: `npm run test:e2e -- tests/e2e/game.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/difficulty.ts src/game/game.ts src/ui/screens.ts src/ui/styles.css src/main.ts tests/difficulty.test.ts tests/e2e/game.spec.ts
git commit -m "feat: add game loop, phases, crash, restart and UI skeleton"
```

---

## Task 11: Coins, pickups, power-up effects, and HUD

**Files:**
- Modify: `src/game/game.ts`, `src/ui/screens.ts`, `src/render/props.ts`
- Test: `tests/e2e/pickups.spec.ts`

**Interfaces:**
- Consumes: `TrackManager`, `coinDistanceSq`, `hitsObstacle`, `ActivePowerUps`, `ScoreState`.
- Produces: HUD updates for score, coins, best, and one chip per active power-up. `Game.debugAddCoins(n)` and `Game.debugActivatePowerUp(kind)` are the e2e hooks.

Rules:
- Each frame, test visible coins against the player; on pickup release the coin entity, `addCoin`, play the coin sound.
- Magnet: while active, coins within `MAGNET_RADIUS` move toward the player at 12 m/s before the normal pickup check.
- Power-up pickup: activate the timer, update the HUD chip, play a sound.
- When the jetpack ends: call `endJetpack`, and the player descends safely.
- Hoverboard: on a collision, `consumeHoverboard` grants invulnerability and the obstacle is passed; otherwise crash.
- HUD chips show kind and remaining seconds; chips disappear at zero.

- [ ] **Step 1: Write the failing test**

`tests/e2e/pickups.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('updates the HUD for coins and power-ups', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await page.getByRole('button', { name: 'Play' }).click();
  await page.evaluate(() => (window as any).__game.debugAddCoins(5));
  await expect(page.getByTestId('coin-count')).toHaveText('5');
  await page.evaluate(() => (window as any).__game.debugActivatePowerUp('magnet'));
  await expect(page.getByTestId('powerup-magnet')).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/pickups.spec.ts`
Expected: FAIL because the HUD hooks do not exist.

- [ ] **Step 3: Implement pickup handling and HUD updates**

Keep pickup loops over the visible chunk list only. Use `sweepsOverlap` for obstacles and `coinDistanceSq` for coins. Do not allocate arrays per frame.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/pickups.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/game.ts src/ui/screens.ts src/render/props.ts tests/e2e/pickups.spec.ts
git commit -m "feat: add coins, pickups, power-up effects and HUD"
```

---

## Task 12: Input system — keyboard, swipe, and buffering

**Files:**
- Create: `src/game/input.ts`
- Modify: `src/main.ts`, `src/game/game.ts`
- Test: `tests/input.test.ts`, `tests/e2e/input.spec.ts`

**Interfaces:**
- Produces:
  - `type Action = 'left' | 'right' | 'jump' | 'roll'`
  - `class InputBuffer { push(action: Action, now: number): void; consume(now: number): Action | null }`
  - `attachInput(element: HTMLElement, buffer: InputBuffer, now: () => number): () => void`
- `InputBuffer` drops actions older than 150 ms.
- `attachInput` maps ArrowLeft/A, ArrowRight/D, ArrowUp/W/Space, ArrowDown/S/Shift, and pointer swipes with a 24 px threshold. Horizontal vs vertical is decided by the dominant axis. It calls `preventDefault` on handled keys and prevents scrolling on touch.

- [ ] **Step 1: Write the failing test**

`tests/input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { InputBuffer } from '../src/game/input';

describe('InputBuffer', () => {
  it('returns the newest buffered action within 150 ms', () => {
    const b = new InputBuffer();
    b.push('left', 1000);
    expect(b.consume(1100)).toBe('left');
    expect(b.consume(1200)).toBeNull();
  });
  it('drops stale actions', () => {
    const b = new InputBuffer();
    b.push('jump', 0);
    expect(b.consume(151)).toBeNull();
  });
});
```

`tests/e2e/input.spec.ts`: start a run, press ArrowRight, wait, assert `__game.debugPlayerLane() === 1`; press ArrowLeft twice, assert lane `-1`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/input.test.ts`
Run: `npm run test:e2e -- tests/e2e/input.spec.ts`
Expected: FAIL because `input.ts` does not exist.

- [ ] **Step 3: Implement `src/game/input.ts` and wire it**

In `main.ts`, create an `InputBuffer`, call `attachInput(canvas, buffer, () => performance.now())`, and pass the buffer to `Game`. In the game update, consume at most one action per frame and dispatch it to the player.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/input.test.ts`
Run: `npm run test:e2e -- tests/e2e/input.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/input.ts src/main.ts src/game/game.ts tests/input.test.ts tests/e2e/input.spec.ts
git commit -m "feat: add keyboard and swipe input with buffering"
```

---

## Task 13: Synthesized audio and mute persistence

**Files:**
- Create: `src/game/audio.ts`
- Modify: `src/main.ts`, `src/ui/screens.ts`
- Test: `tests/audio.test.ts`

**Interfaces:**
- Produces:
  - `type SoundName = 'coin' | 'jump' | 'roll' | 'crash' | 'powerup' | 'click'`
  - `class AudioEngine { unlock(): void; play(name: SoundName): void; setMuted(muted: boolean): void; isMuted(): boolean }`

Rules:
- Use a single `AudioContext`; create oscillators and gain envelopes per sound.
- `unlock` resumes the context on the first user gesture.
- `play` before `unlock` is a no-op.
- Mute persists in `localStorage` under `subway-runner.muted`; failures are ignored.
- No external audio files in v1.

- [ ] **Step 1: Write the failing test**

`tests/audio.test.ts`: mock `AudioContext` with `createOscillator`/`createGain` spies; assert `play('coin')` before unlock creates no oscillator, after unlock creates one; assert mute persists and `isMuted()` returns it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/audio.test.ts`
Expected: FAIL because `audio.ts` does not exist.

- [ ] **Step 3: Implement the audio engine and wire it**

Wire the mute button in the UI, play `click` on buttons, `jump`/`roll` on actions, `coin` on pickup, `powerup` on pickup, `crash` on game over.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/audio.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/audio.ts src/main.ts src/ui/screens.ts tests/audio.test.ts
git commit -m "feat: add synthesized audio and mute persistence"
```

---

## Task 14: Difficulty curve, camera feel, and particle FX

**Files:**
- Create: `src/render/fx.ts`
- Modify: `src/game/game.ts`, `src/game/scene.ts`, `src/render/character.ts`
- Test: `tests/fx.test.ts`, `tests/e2e/fx.spec.ts`

**Interfaces:**
- Produces:
  - `class FxPool { constructor(app: pc.Application, root: pc.Entity); burst(kind: 'coin' | 'crash' | 'dust', x: number, y: number, z: number): void; update(dt: number): void }`
- Effects: coin sparkle (small yellow quads), crash burst (orange/red quads), dust (grey quads); all pooled and gravity-affected.
- Camera: shake on crash (0.25 s, decaying), FOV lerp with speed, slight roll into lane changes.

- [ ] **Step 1: Write the failing test**

`tests/fx.test.ts`: `burst` increases the active count; `update` reduces it over time; no allocation per burst after the pool is warm (assert `pool.created` stays constant after the first N bursts).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/fx.test.ts`
Expected: FAIL because `fx.ts` does not exist.

- [ ] **Step 3: Implement the FX pool and camera feel**

Use simple quad meshes with emissive materials, not the PlayCanvas particle system, so the pool is easy to control. Keep effects optional behind a quality flag.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/fx.test.ts`
Run: `npm run test:e2e -- tests/e2e/fx.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/fx.ts src/game/game.ts src/game/scene.ts src/render/character.ts tests/fx.test.ts tests/e2e/fx.spec.ts
git commit -m "feat: add particle fx, camera shake and speed feel"
```

---

## Task 15: PWA, offline, icons, README, and final QA

**Files:**
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `README.md`, `CREDITS.md`, `tests/e2e/pwa.spec.ts`
- Modify: `vite.config.ts`, `index.html`, `src/ui/styles.css`
- Test: `tests/e2e/pwa.spec.ts`

**Interfaces:**
- Produces: a built PWA with a manifest, service worker precache, and offline play after the first load.

Rules:
- `vite-plugin-pwa` with `registerType: 'autoUpdate'`, `includeAssets: ['icons/*.png']`.
- Manifest: `name: 'Subway Runner'`, `short_name: 'Subway Runner'`, `theme_color: '#1b2440'`, `background_color: '#0e1526'`, `display: 'standalone'`, `orientation: 'portrait'`, icons 192 and 512.
- CSS: `html, body, #ui-root { height: 100%; }`, HUD padding uses `env(safe-area-inset-*)`, canvas `touch-action: none`, `overscroll-behavior: none`, `user-select: none`.
- README: install, dev, test, build, preview, deploy, controls, and browser support.
- CREDITS: list the engine (MIT) and any CC0 assets; if none, say "All art and audio are generated procedurally."

- [ ] **Step 1: Write the failing test**

`tests/e2e/pwa.spec.ts`: load the page, wait for ready, assert the manifest link exists and the service worker registers; then `context.setOffline(true)`, reload, and assert the page still loads and the canvas is visible.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/pwa.spec.ts`
Expected: FAIL because the manifest/service worker do not exist.

- [ ] **Step 3: Implement the PWA and documentation**

Add the plugin config, icons, metadata, safe-area CSS, README, and CREDITS. Ensure `npm run build` emits `dist/` with the manifest and service worker.

- [ ] **Step 4: Run the full verification**

Run: `npm run typecheck`
Run: `npm test`
Run: `npm run build`
Run: `npm run test:e2e`
Expected: all PASS.

Manual checks: install the PWA on a phone, play with swipes, rotate the device, background/foreground the app, and confirm the HUD respects safe areas.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html src/ui/styles.css public/icons README.md CREDITS.md tests/e2e/pwa.spec.ts
git commit -m "feat: add pwa, offline support, documentation and final polish"
```

---

## Self-Review Notes

- **Spec coverage:** engine, controls, obstacles, coins, power-ups, scoring, PWA, audio, performance, accessibility, and tests all map to tasks above. The shop/missions/leaderboards are explicitly out of scope.
- **Type consistency:** `PlayerState` fields, `playerLaneX`, `playerCenterY`, `playerHalfHeight`, `hitsObstacle`, `TrackManager`, `GameSnapshot`, and `UiHandle` are defined once and reused by name.
- **Review Focus mapping:** tunneling → Task 5; rapid input → Tasks 3 and 12; mobile safe areas → Task 15; jetpack expiry → Tasks 5 and 6; storage failure → Task 6.
