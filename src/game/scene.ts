import * as pc from 'playcanvas';
import { PLAYER_HALF_WIDTH, PLAYER_HEIGHT } from '../config/tuning';
import { createBox, createMaterial } from '../render/meshes';

export interface SceneHandle {
  app: pc.Application;
  camera: pc.Entity;
  playerRoot: pc.Entity;
  setCameraTarget(x: number, speed01: number): void;
  dispose(): void;
}

const SKY_COLOR = new pc.Color(0.55, 0.72, 0.9);
const AMBIENT_COLOR = new pc.Color(0.35, 0.4, 0.48);
const ASPHALT_COLOR = new pc.Color(0.16, 0.17, 0.19);
const PLAYER_COLOR = new pc.Color(0.9, 0.32, 0.24);
const KEY_LIGHT_COLOR = new pc.Color(1, 0.95, 0.86);
const FILL_LIGHT_COLOR = new pc.Color(0.72, 0.8, 0.95);

const CAMERA_X = 0;
const CAMERA_Y = 4.2;
const CAMERA_Z = 8;
const CAMERA_TARGET_X = 0;
const CAMERA_TARGET_Y = 1;
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

// Unscaled capsule primitive from the PlayCanvas render component: height 2, radius 0.5.
const CAPSULE_BASE_HEIGHT = 2;
const CAPSULE_BASE_RADIUS = 0.5;

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
  keyLight.addComponent('light', {
    type: 'directional',
    color: KEY_LIGHT_COLOR,
    intensity: 1.2,
    castShadows: false,
  });
  app.root.addChild(keyLight);
  keyLight.setPosition(5, 10, 5);
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

  const playerRoot = new pc.Entity('player-root');
  app.root.addChild(playerRoot);

  const playerPlaceholder = new pc.Entity('player-placeholder');
  const playerRender = playerPlaceholder.addComponent('render', { type: 'capsule' });
  if (!playerRender) {
    throw new Error('Unable to add a render component to "player-placeholder"');
  }
  playerRender.material = createMaterial(PLAYER_COLOR);

  const playerRadiusScale = PLAYER_HALF_WIDTH / CAPSULE_BASE_RADIUS;
  const playerHeightScale = PLAYER_HEIGHT / CAPSULE_BASE_HEIGHT;
  playerPlaceholder.setLocalPosition(0, PLAYER_HEIGHT / 2, 0);
  playerPlaceholder.setLocalScale(playerRadiusScale, playerHeightScale, playerRadiusScale);
  playerRoot.addChild(playerPlaceholder);

  let frameSeconds = 1 / 60;
  const updateHandle = app.on('update', (dt: number) => {
    frameSeconds = dt;
  });

  function setCameraTarget(x: number, speed01: number): void {
    const speed = pc.math.clamp(speed01, 0, 1);
    const alpha = 1 - Math.exp(-CAMERA_DAMPING * frameSeconds);
    const current = camera.getPosition();
    scratchPosition.set(current.x, current.y, current.z);
    scratchPosition.x = pc.math.lerp(scratchPosition.x, x * 0.55, alpha);
    scratchPosition.y = CAMERA_Y;
    scratchPosition.z = CAMERA_Z;
    camera.setPosition(scratchPosition);

    const cameraComponent = camera.camera;
    if (cameraComponent) {
      cameraComponent.fov = pc.math.lerp(CAMERA_FOV, CAMERA_FAST_FOV, speed);
    }
  }

  let disposed = false;
  function dispose(): void {
    if (disposed) {
      return;
    }
    disposed = true;
    window.removeEventListener('resize', onResize);
    updateHandle.off();
    app.destroy();
  }

  app.start();

  return { app, camera, playerRoot, setCameraTarget, dispose };
}
