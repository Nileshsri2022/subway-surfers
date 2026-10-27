import * as pc from 'playcanvas';
import { START_SPEED } from '../config/tuning';
import { createCharacter, type CharacterRig } from '../render/character';
import { createBox, createMaterial, setShadows } from '../render/meshes';
import { createPlayerState } from './player';

export interface SceneHandle {
  app: pc.Application;
  camera: pc.Entity;
  playerRoot: pc.Entity;
  character: CharacterRig;
  setCameraTarget(x: number, speed01: number): void;
  shake(intensity: number): void;
  dispose(): void;
}

// Warm sunset palette (was flat midday blue): the sky, fog, and sun all
// pull warm so the scene reads as golden-hour, not overcast noon.
const SKY_COLOR = new pc.Color(0.98, 0.72, 0.45);
const AMBIENT_COLOR = new pc.Color(0.45, 0.4, 0.36);
const ASPHALT_COLOR = new pc.Color(0.18, 0.17, 0.16);
const KEY_LIGHT_COLOR = new pc.Color(1, 0.85, 0.62);
const FILL_LIGHT_COLOR = new pc.Color(0.72, 0.8, 0.95);

// Camera closer and lower (was y 4.2 / z 8): the runner was ~12% of frame
// height; at y 3.1 / z 6.2 it fills ~25%, like the reference game.
const CAMERA_X = 0;
const CAMERA_Y = 3.1;
const CAMERA_Z = 6.2;
const CAMERA_TARGET_X = 0;
const CAMERA_TARGET_Y = 1.15;
const CAMERA_TARGET_Z = -12;
const CAMERA_FOV = 60;
const CAMERA_FAST_FOV = 68;
const CAMERA_NEAR_CLIP = 0.1;
const CAMERA_FAR_CLIP = 180;
const CAMERA_DAMPING = 10;

const FOG_START = 45;
const FOG_END = 120;

const GROUND_WIDTH = 220;
const GROUND_DEPTH = 320;
const GROUND_CENTER_Z = -60;

// Module-scope scratch values: the camera update runs every frame and must not allocate.
const scratchPosition = new pc.Vec3();
const scratchTarget = new pc.Vec3();
const scratchColor = new pc.Color();

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const app = new pc.Application(canvas);
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);

  const onResize = (): void => {
    app.resizeCanvas();
  };
  window.addEventListener('resize', onResize);

  app.scene.ambientLight = AMBIENT_COLOR;
  app.scene.fog.type = pc.FOG_LINEAR;
  app.scene.fog.color.copy(SKY_COLOR);
  app.scene.fog.start = FOG_START;
  app.scene.fog.end = FOG_END;

  const camera = new pc.Entity('camera');
  scratchColor.copy(SKY_COLOR);
  camera.addComponent('camera', {
    clearColor: scratchColor,
    fov: CAMERA_FOV,
    nearClip: CAMERA_NEAR_CLIP,
    farClip: CAMERA_FAR_CLIP,
  });
  app.root.addChild(camera);
  camera.setPosition(CAMERA_X, CAMERA_Y, CAMERA_Z);
  scratchTarget.set(CAMERA_TARGET_X, CAMERA_TARGET_Y, CAMERA_TARGET_Z);
  camera.lookAt(scratchTarget);

  const keyLight = new pc.Entity('key-light');
  const keyComp = keyLight.addComponent('light', {
    type: 'directional',
    color: KEY_LIGHT_COLOR,
    intensity: 1.3,
    castShadows: true,
    shadowBias: -0.0005,
    shadowDistance: 70,
  });
  if (keyComp) {
    keyComp.shadowResolution = 1024;
  }
  app.root.addChild(keyLight);
  keyLight.setPosition(6, 9, 4);
  keyLight.lookAt(0, 0, 0);

  const fillLight = new pc.Entity('fill-light');
  fillLight.addComponent('light', {
    type: 'directional',
    color: FILL_LIGHT_COLOR,
    intensity: 0.35,
    castShadows: false,
  });
  app.root.addChild(fillLight);
  fillLight.setPosition(-5, 6, 4);
  fillLight.lookAt(0, 1, -10);

  const ground = createBox(
    app.root,
    'ground',
    [GROUND_WIDTH, 0.1, GROUND_DEPTH],
    createMaterial(ASPHALT_COLOR)
  );
  ground.setPosition(0, -0.05, GROUND_CENTER_Z);
  setShadows(ground, false, true);

  const character = createCharacter(app);
  const playerRoot = character.root;

  let frameSeconds = 1 / 60;
  let shakeIntensity = 0;
  let shakeTimer = 0;
  const updateHandle = app.on('update', (dt: number) => {
    frameSeconds = dt;
    if (shakeTimer > 0) {
      shakeTimer = Math.max(0, shakeTimer - dt);
      if (shakeTimer === 0) shakeIntensity = 0;
    }
  });

  function setCameraTarget(x: number, speed01: number): void {
    const speed = pc.math.clamp(speed01, 0, 1);
    const alpha = 1 - Math.exp(-CAMERA_DAMPING * frameSeconds);
    const current = camera.getPosition();
    scratchPosition.set(current.x, current.y, current.z);
    scratchPosition.x = pc.math.lerp(scratchPosition.x, x * 0.55, alpha);
    scratchPosition.y = CAMERA_Y;
    scratchPosition.z = CAMERA_Z;
    if (shakeTimer > 0) {
      const decay = shakeTimer / 0.25;
      scratchPosition.x += (Math.random() - 0.5) * shakeIntensity * decay;
      scratchPosition.y += (Math.random() - 0.5) * shakeIntensity * decay;
    }
    camera.setPosition(scratchPosition);

    const cameraComponent = camera.camera;
    if (cameraComponent) {
      cameraComponent.fov = pc.math.lerp(CAMERA_FOV, CAMERA_FAST_FOV, speed);
    }
    camera.setEulerAngles(0, 0, -x * 2);
  }

  function shake(intensity: number): void {
    shakeIntensity = intensity;
    shakeTimer = 0.25;
  }

  let disposed = false;
  function dispose(): void {
    if (disposed) {
      return;
    }
    disposed = true;
    window.removeEventListener('resize', onResize);
    updateHandle.off();
    character.dispose();
    app.destroy();
  }

  app.start();

  return { app, camera, playerRoot, character, setCameraTarget, shake, dispose };
}
