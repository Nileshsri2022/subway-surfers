# Subway Runner — Web Game Design

Date: 2026-10-27
Status: Draft for approval
Working title: **Subway Runner** (original game, not a Subway Surfers port)

## 1. Intent and why

Build an original 3D endless-runner game that runs in the browser on phones and
desktops, with the same core feel as Subway Surfers: a character automatically
running down a three-lane track, dodging trains and barriers, collecting coins,
and surviving as the speed ramps up. It must feel native on a phone (swipe
controls, full-screen, installable) and play well with a keyboard on desktop.

The APK in this folder (`subway-surfers-mod_3.70.3-an1.com.apk`) was inspected
and is **not** the source of this project. It is a Unity 2022.3.72f1 IL2CPP
build with Addressables content; there is no Unity project, no C# source, and
no scene data to convert. An exact port of that build is not technically
possible from the APK, and reusing its assets or code would infringe
copyright. This project builds a new game with original assets and the same
genre mechanics.

## 2. Goals

- A playable, polished 3D endless runner in the browser.
- The Subway Surfers *feel*: three lanes, snappy lane changes, jump/roll,
  trains and barriers, coin trails, power-ups, rising speed, crash-and-restart.
- Identical gameplay on phone and desktop, with input adapted per device.
- Installable PWA: offline after first load, full-screen on mobile.
- Fast: first playable in a few seconds on a mid-range phone; 60 fps target.
- Original art, audio, code, and branding. No copied assets.

## 3. Non-goals (v1)

- Characters/boards shop, missions, seasons, leaderboards, friends.
- Accounts, cloud saves, backend services, ads, in-app purchases.
- Multiplayer.
- Curved or elevated tracks, and moving trains (v1 uses a straight, flat track
  with static obstacles).
- A PlayCanvas editor-importable project; v1 is code-first only.
- Native iOS/Android builds.
- Pixel-perfect recreation of Subway Surfers or its branding.
- Music production beyond a simple loop (stretch goal only).

## 4. Anti-goals

- A tech demo that looks like a demo: the game must feel finished on first run.
- Copying or redistributing any Subway Surfers asset, code, or trademark.
- A 100 MB download or a loading screen longer than a few seconds.
- Motion sickness: no uncontrolled camera shake or FOV pumping.
- Impossible obstacle patterns: every pattern must have a survivable path.

## 5. Constraints

- Project root: `subway-runner/`, with its own git repository. The APK and
  extracted analysis files stay outside the repo.
- Engine: **PlayCanvas Engine v2** (npm `playcanvas`), code-first, no cloud
  editor dependency.
- Language: TypeScript. Build: Vite.
- Rendering: WebGL2 (WebGPU optional later, not a v1 requirement).
- Target: Chrome/Edge/Firefox/Safari desktop; iOS Safari and Android Chrome.
- Hosting: static files; deployable to any static host.
- No third-party paid services.

## 6. Approaches considered

### 6.1 Engine

| Approach | Trade-off | Decision |
|---|---|---|
| PlayCanvas Engine, code-first | Same engine as the editor, built-in renderer/asset/math/audio; heavier than a renderer-only library, but full-featured and one dependency | **Chosen** |
| PlayCanvas cloud editor | Visual scene editing, but the agent cannot drive the GUI; every change becomes manual user work | Rejected for v1; editor importability is not a requirement |
| Three.js + custom systems | Smallest and most direct control, but we would hand-build asset/audio/animation plumbing PlayCanvas already provides | Rejected |
| Babylon.js | Strong engine, heavier and more configuration than needed | Rejected |

### 6.2 Physics

| Approach | Trade-off | Decision |
|---|---|---|
| Custom lane-space collision | Tight, deterministic, cheap; exactly matches runner mechanics; no physics engine download | **Chosen** |
| PlayCanvas Ammo/Jolt physics | Realistic but unnecessary; heavier, harder to tune, can fight lane snapping | Rejected |

### 6.3 Art

| Approach | Trade-off | Decision |
|---|---|---|
| Procedural low-poly geometry + code animation | Fully original, tiny download, consistent style, no licensing risk; requires craft in palette/lighting to look good | **Chosen** |
| CC0 asset packs (Kenney/Quaternius/Poly Pizza) | Faster rich assets; inconsistent style, extra integration, license bookkeeping | Allowed only as a documented supplement |
| Commissioned/AI-generated models | Best fidelity; cost, pipeline, and licensing overhead | Out of scope |

### 6.4 UI

| Approach | Trade-off | Decision |
|---|---|---|
| HTML/CSS overlay | Crisp text, responsive layout, safe-area handling, easy accessibility, fast iteration | **Chosen** |
| In-engine UI | Everything in one canvas; more work for text/layout and worse accessibility | Rejected |

## 7. Game design

### 7.1 Core loop

1. Start screen: title, best score, Play button, sound toggle.
2. Run starts at a moderate speed; the character runs forward automatically.
3. Player switches lanes, jumps, and rolls to avoid obstacles and collect coins.
4. Speed and obstacle density rise over time.
5. A collision ends the run (unless a hoverboard is active).
6. Game-over screen shows distance, coins, score, best; Restart returns to a
   fresh run in one tap.

### 7.2 Controls

| Action | Touch | Keyboard |
|---|---|---|
| Lane left | Swipe left | Left arrow / A |
| Lane right | Swipe right | Right arrow / D |
| Jump | Swipe up | Up arrow / W / Space |
| Roll / fast-fall | Swipe down | Down arrow / S / Shift |
| Pause | Pause button | Esc / P |
| Restart | Tap Restart | Enter |

- Swipe threshold: ~24 px; horizontal vs vertical decided by dominant axis.
- Inputs are buffered (~150 ms) so a swipe during a jump lands when possible.
- Mobile: `touch-action: none`, no page scroll/zoom, no text selection.
- Haptics on crash and power-up where `navigator.vibrate` is available.

### 7.3 Player states

- `Running` — grounded, can switch lanes, jump, roll.
- `Jumping` — airborne arc; can switch lanes; cannot roll.
- `Rolling` — low hitbox for a fixed duration; can switch lanes.
- `Crashing` — input disabled, short camera/particle hit, then game over.
- `Dead` — game-over UI.

Lane changes are a smooth 0.12 s ease with a slight lean; the character never
leaves the lane center except during the transition.

### 7.4 Track and obstacles

- **Track shape: straight and flat for all of v1.** No curves, elevation, or
  branching. This matches the original game's linear track and keeps lane-space
  collision, chunk recycling, and the camera simple.
- Three lanes, lane width 2.5 m, track chunk length 30 m.
- Chunks are generated ahead and recycled behind; the visible distance is
  hidden with fog.
- Obstacle types:
  - **Train** — blocks one lane completely; must change lanes.
  - **Low barrier** — jump over.
  - **Overhead barrier** — roll under.
  - **Ramp** — jump pad that launches the player (optional stretch).
- **All obstacles are static in track space in v1.** Moving trains and other
  dynamic hazards are out of scope; they would require relative-speed collision
  and a different fairness model.
- Patterns are authored as small tile sets (e.g., "train left + coins center",
  "barrier center + overhead left") and chosen with a seeded RNG.
- Fairness rule: every generated tile must leave at least one lane passable,
  and the safe lane must be reachable from the previous tile. The generator
  validates and retries; a fuzz test runs 10,000 seeds.
- Minimum spacing scales with speed so reaction time stays roughly constant.

### 7.5 Coins and power-ups

- Coins appear in lines, arcs, and around obstacles; each coin is worth 1
  currency and 10 score.
- Power-ups:
  - **Magnet** (10 s) — pulls nearby coins.
  - **Jetpack** (8 s) — flies above obstacles; no collisions.
  - **2x multiplier** (15 s) — doubles coin and distance score.
  - **Hoverboard** (one hit) — absorbs a crash and breaks.
- Power-ups use **independent timers and stack**. Picking up the same type
  refreshes its timer; different types run simultaneously. The HUD shows a row
  of active power-up chips, each with its own countdown.
- **Jetpack rules:** the player flies at a fixed altitude, can still switch
  lanes, and collects coins by lane at flight height. On expiry the player
  descends over ~0.6 s with brief invulnerability, and the spawner guarantees a
  clear landing zone; the jetpack never ends inside an obstacle.
- **Hoverboard rules:** it is a separate one-hit shield, not a timed power-up.
  On impact it absorbs the hit, breaks, destroys/fades the obstacle hit, and
  grants ~1.5 s invulnerability so the same obstacle cannot kill on the next
  frame. Only one hoverboard can be held at a time.

### 7.6 Difficulty and scoring

- Forward speed: 12 m/s at start, rising on a smooth curve to 30 m/s over
  roughly three minutes.
- Obstacle density and pattern complexity rise with speed.
- Score: `floor(distance) + coins * 10`, multiplied by the active multiplier.
- Best score and total coins persist in `localStorage`.
- No difficulty selection in v1; the curve is the difficulty.

### 7.7 Camera

- Third-person, behind and slightly above the character.
- Follows the player's lane with a damped horizontal offset; never fully
  leaves the track.
- Slight FOV widening with speed, capped to avoid motion sickness.
- Crash: short shake and pull-back; no long unskippable animation.

## 8. Technical design

### 8.1 Stack

- `playcanvas` v2 (engine), TypeScript, Vite.
- `vite-plugin-pwa` for manifest/service worker; static deploy.
- `vitest` for unit tests; Playwright for a browser smoke test.
- No UI framework: small DOM store + CSS.

### 8.2 Module layout

```
src/
  main.ts                 bootstrap, game state machine
  game/
    Game.ts               lifecycle, update loop, state transitions
    Scene.ts              app, camera, lights, fog, environment
    Player.ts             character entity, states, lane/jump/roll
    Input.ts              keyboard + pointer swipe, buffering
    Track.ts              chunk lifecycle, recycling
    Patterns.ts           obstacle tile definitions + fairness validation
    Spawner.ts            deterministic RNG, spawn ahead
    Collision.ts          lane-space AABB/sphere tests, swept
    Coins.ts              coin entities, pooling, magnet
    PowerUps.ts           pickup entities, timers, effects
    Score.ts              distance, coins, multiplier, persistence
    Audio.ts              synthesized SFX, mute, unlock on first input
    Quality.ts            pixel-ratio cap, adaptive effects
  render/
    Meshes.ts             procedural geometry factories
    Character.ts          rig + run/jump/roll animation
    City.ts               buildings, props, graffiti panels
    Fx.ts                 particles, coin sparkle, crash burst
  ui/
    screens.ts            start, HUD, pause, game over
    styles.css
  config/
    tuning.ts             all gameplay constants in one place
```

### 8.3 Rendering and art direction

- Flat-shaded low-poly, chunky silhouettes, strong color blocking.
- Palette: warm sunset sky, teal/blue city, yellow coins, red/orange trains;
  accessible contrast for obstacles.
- Environment: modular buildings, overhead gantries, track ballast, distant
  skyline, graffiti panels as colored geometry (original designs only).
- Character: capsule/box construction with a cap and backpack; procedural run
  cycle (arm/leg swing), jump tuck, roll squash.
- Lighting: directional sun + ambient/hemisphere; cheap blob shadow under the
  player; real shadows optional and disabled on low-end devices.
- Fog hides chunk spawn/despawn.
- Optional post: bloom on coins/emissive, subtle vignette. Degrades first.

### 8.4 Performance

- Object pooling for coins, obstacles, and particles; no per-frame allocation
  in the hot loop.
- Instanced rendering for repeated props where practical.
- Pixel ratio capped at 2 (1.5 on low-end); render scale reduction on
  sustained low FPS.
- Draw distance and fog tuned so the whole track does not render at once.
- Budget: initial JS+assets under ~5 MB gzipped; 60 fps on a mid-range phone;
  graceful 30 fps fallback.

### 8.5 Collision

- Player represented as a capsule/AABB in lane space; obstacles as AABBs.
- Swept test along the forward axis to prevent tunneling at 30 m/s.
- Coins and power-ups use distance checks with generous pickup radii.
- Collision runs after movement in the fixed-step update.

### 8.6 Game loop

- Fixed timestep (1/60 s) for gameplay, interpolated rendering.
- Pause on tab blur; resume on focus (never auto-resume into a crash).
- Deterministic seeded RNG per run; seed shown only in debug mode.

### 8.7 UI and accessibility

- DOM overlay with safe-area insets; portrait-first on phones, responsive on
  desktop.
- HUD: score, coins, active power-up + timer, pause button.
- Start/game-over screens are keyboard and screen-reader accessible.
- Mute toggle persisted; reduced-motion option disables camera shake and
  strong flashes.
- Color is never the only signal for an obstacle: shape and position differ.

### 8.8 Audio

- Synthesized SFX via Web Audio: coin, jump, roll, crash, power-up, UI tap.
- Audio context unlocked on first user gesture.
- Optional CC0 music loop, credited in `CREDITS.md`; not a v1 blocker.

### 8.9 PWA and hosting

- Manifest: name, icons, theme color, `display: standalone`, portrait
  orientation on phones.
- Service worker precaches the app shell and assets; offline play after first
  load.
- Deploy as static files; include a simple `README` with build/deploy steps.

### 8.10 Tests

- Unit: lane math, jump/roll state transitions, collision sweeps, score math,
  pattern fairness fuzz (10,000 seeds).
- Browser smoke (Playwright): load, start, simulate inputs, crash, restart,
  score persists; no console errors.
- Manual: iOS Safari and Android Chrome on real devices; verify swipe, safe
  areas, audio unlock, PWA install, and 60 fps target.

## 9. Milestones

1. **M1 — Skeleton:** Vite + PlayCanvas boot, scene, camera, track, player
   movement, keyboard input. Playable movement with no obstacles.
2. **M2 — Run loop:** obstacles, spawning, collision, crash, game over,
   restart. First complete playable loop.
3. **M3 — Rewards:** coins, magnet/jetpack/multiplier/hoverboard, score, best
   score persistence, HUD.
4. **M4 — Feel:** mobile swipe input, audio, camera tuning, difficulty curve,
   particles, animation polish.
5. **M5 — Ship:** PWA, offline, performance pass, tests, deploy docs,
   cross-browser/device checks.

## 10. Definition of done

- Start → run → crash → restart works on phone and desktop.
- All controls work with touch, mouse drag (optional), and keyboard.
- Score, coins, and best score behave correctly and persist.
- Every generated pattern is survivable (fuzz test passes).
- 60 fps on a mid-range Android phone; no sustained jank on iPhone Safari.
- PWA installs and plays offline after first load.
- No copied assets; all third-party assets are CC0 and credited.
- Unit tests and Playwright smoke test pass.
- README documents build, run, and deploy.

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Procedural art looks generic | Strong palette, silhouettes, lighting, VFX; iterate on screenshots |
| Mobile performance | Pixel-ratio cap, pooling, adaptive effects, fog, early profiling |
| PlayCanvas API learning curve | Use documented core APIs; keep engine usage shallow; test early |
| Scope creep (shop, missions) | v1 scope fixed above; extras only after ship |
| Asset licensing | Prefer procedural; any CC0 asset recorded in `CREDITS.md` |
| Swipe conflicts with browser gestures | `touch-action: none`, full-screen PWA, pointer events |

## 12. Resolved design calls

These were open during review and are now settled:

- Track is straight and flat; no curves or elevation in v1.
- Power-ups stack on independent timers; the HUD shows one chip per active type.
- Jetpack allows lane changes, collects coins at flight height, and ends with a
  safe, invulnerable descent.
- Hoverboard is a separate one-hit shield with ~1.5 s post-hit invulnerability.
- Obstacles are static in v1; moving trains are out of scope.
- PlayCanvas editor compatibility is not required; the architecture is plain
  TypeScript classes.

## 13. Decisions left to the builder

- Exact palette values, character silhouette, and city prop mix.
- Whether to add a ramp/jump-pad obstacle in v1 if time allows.
- Music source (CC0) or shipping SFX-only.
- Bloom/vignette implementation details and quality tiers.
- Deployment target (GitHub Pages, Netlify, Vercel, or local static server).

## 14. What the user has decided

- PlayCanvas as the engine family.
- Code-first engine route (option A), not the cloud editor.
- 3D behind-the-back view, matching the Subway Surfers feel.
- Original assets, not extracted game content.
- Browser target for both mobile and desktop.
