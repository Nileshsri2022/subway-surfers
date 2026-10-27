import * as pc from 'playcanvas';
import { playerCenterY, playerHalfHeight, playerLaneX, type PlayerState } from '../game/player';
import { createBox, createMaterial } from './meshes';

export interface CharacterRig {
  root: pc.Entity;
  update(state: PlayerState, distance: number, dt: number): void;
  dispose(): void;
}

export interface RunPose {
  armSwing: number;
  legSwing: number;
  bob: number;
}

// Reused by the rig's per-frame path so that update allocates nothing.
const scratchPose: RunPose = { armSwing: 0, legSwing: 0, bob: 0 };

// Pure run cycle shared by the rig, later gameplay work and audio.
export function runPose(distance: number): RunPose {
  return writeRunPose(distance, { armSwing: 0, legSwing: 0, bob: 0 });
}

// Module-private scratch-writing variant so the rig's update path allocates nothing.
function writeRunPose(distance: number, out: RunPose): RunPose {
  const armSwing = Math.sin(distance * 2.2);
  out.armSwing = armSwing;
  out.legSwing = -armSwing;
  out.bob = Math.abs(armSwing) * 0.05;
  return out;
}

// Rig proportions, in metres, with the root at the runner's feet.
const TORSO_Y = 1.0;
const TORSO_SIZE: [number, number, number] = [0.58, 0.86, 0.36];
const HEAD_Y = 1.65;
const HEAD_DIAMETER = 0.38;
const CAP_Y = 1.79;
const CAP_SIZE: [number, number, number] = [0.46, 0.1, 0.46];
const BACKPACK_Y = 1.12;
const BACKPACK_Z = 0.28;
const BACKPACK_SIZE: [number, number, number] = [0.34, 0.44, 0.18];

const HIP_Y = 0.9;
const SHOULDER_Y = 1.4;
const ARM_X = 0.37;
const ARM_LENGTH = 0.62;
const ARM_SIZE: [number, number, number] = [0.16, ARM_LENGTH, 0.18];
const LEG_X = 0.17;
const LEG_Y = 0.82;
const LEG_LENGTH = 0.8;
const LEG_SIZE: [number, number, number] = [0.2, LEG_LENGTH, 0.22];

const ARM_SWING_DEGREES = 55;
const LEG_SWING_DEGREES = 50;

const JUMP_ARM_DEGREES = -130;
const JUMP_LEG_DEGREES = 75;

const ROLL_HEIGHT_SCALE = 0.55;
const ROLL_TORSO_DEGREES = -55;
// Squashed and tilted -55°, the lowest torso corner sits near y = 0.31 in root
// space, so lower the body group by that amount to keep the roll on the track.
const ROLL_BODY_DROP = -0.31;
const ROLL_ARM_DEGREES = 60;
const ROLL_LEG_DEGREES = 105;

const JETPACK_ARM_OUT_DEGREES = 75;
const JETPACK_ARM_FORWARD_DEGREES = -10;
const JETPACK_LEG_X = 0.1;
const JETPACK_LEG_DEGREES = -8;

const SHIRT_COLOR = new pc.Color(0.2, 0.55, 0.62);
const PANTS_COLOR = new pc.Color(0.16, 0.2, 0.3);
const SKIN_COLOR = new pc.Color(0.78, 0.58, 0.44);
const ACCENT_COLOR = new pc.Color(0.9, 0.45, 0.2);

// Scratch position: `update` runs every frame and must not create PlayCanvas objects.
const scratchPosition = new pc.Vec3();

function createSphere(
  parent: pc.Entity,
  name: string,
  diameter: number,
  material: pc.StandardMaterial
): pc.Entity {
  const entity = new pc.Entity(name);
  const render = entity.addComponent('render', { type: 'sphere' });
  if (!render) {
    throw new Error(`Unable to add a render component to "${name}"`);
  }
  render.material = material;
  entity.setLocalScale(diameter, diameter, diameter);
  parent.addChild(entity);
  return entity;
}

export function createCharacter(app: pc.Application): CharacterRig {
  const root = new pc.Entity('character-root');
  app.root.addChild(root);

  const body = new pc.Entity('character-body');
  root.addChild(body);

  const torsoPivot = new pc.Entity('torso-pivot');
  torsoPivot.setLocalPosition(0, HIP_Y, 0);
  body.addChild(torsoPivot);

  const shirtMaterial = createMaterial(SHIRT_COLOR);
  const pantsMaterial = createMaterial(PANTS_COLOR);
  const skinMaterial = createMaterial(SKIN_COLOR);
  const accentMaterial = createMaterial(ACCENT_COLOR);

  const torso = createBox(torsoPivot, 'torso', TORSO_SIZE, shirtMaterial);
  torso.setLocalPosition(0, TORSO_Y - HIP_Y, 0);

  createSphere(torsoPivot, 'head', HEAD_DIAMETER, skinMaterial).setLocalPosition(
    0,
    HEAD_Y - HIP_Y,
    0
  );

  createBox(torsoPivot, 'cap', CAP_SIZE, accentMaterial).setLocalPosition(0, CAP_Y - HIP_Y, 0);

  createBox(torsoPivot, 'backpack', BACKPACK_SIZE, accentMaterial).setLocalPosition(
    0,
    BACKPACK_Y - HIP_Y,
    BACKPACK_Z
  );

  const leftArmPivot = new pc.Entity('arm-pivot-left');
  leftArmPivot.setLocalPosition(-ARM_X, SHOULDER_Y - HIP_Y, 0);
  torsoPivot.addChild(leftArmPivot);
  createBox(leftArmPivot, 'arm-left', ARM_SIZE, skinMaterial).setLocalPosition(
    0,
    -ARM_LENGTH / 2,
    0
  );

  const rightArmPivot = new pc.Entity('arm-pivot-right');
  rightArmPivot.setLocalPosition(ARM_X, SHOULDER_Y - HIP_Y, 0);
  torsoPivot.addChild(rightArmPivot);
  createBox(rightArmPivot, 'arm-right', ARM_SIZE, skinMaterial).setLocalPosition(
    0,
    -ARM_LENGTH / 2,
    0
  );

  const leftLegPivot = new pc.Entity('leg-pivot-left');
  leftLegPivot.setLocalPosition(-LEG_X, LEG_Y, 0);
  body.addChild(leftLegPivot);
  createBox(leftLegPivot, 'leg-left', LEG_SIZE, pantsMaterial).setLocalPosition(
    0,
    -LEG_LENGTH / 2,
    0
  );

  const rightLegPivot = new pc.Entity('leg-pivot-right');
  rightLegPivot.setLocalPosition(LEG_X, LEG_Y, 0);
  body.addChild(rightLegPivot);
  createBox(rightLegPivot, 'leg-right', LEG_SIZE, pantsMaterial).setLocalPosition(
    0,
    -LEG_LENGTH / 2,
    0
  );

  let disposed = false;

  function update(state: PlayerState, distance: number, _dt: number): void {
    if (disposed) {
      return;
    }

    const pose = writeRunPose(distance, scratchPose);
    const descending = state.descentRemaining > 0;
    const grounded =
      !state.airborne && !state.rolling && !state.jetpack && !descending;
    const bob = grounded ? pose.bob : 0;

    scratchPosition.set(
      playerLaneX(state),
      playerCenterY(state) - playerHalfHeight(state) + bob,
      0
    );
    root.setPosition(scratchPosition);

    body.setLocalPosition(0, 0, 0);
    body.setLocalScale(1, 1, 1);
    torsoPivot.setLocalEulerAngles(0, 0, 0);
    leftLegPivot.setLocalPosition(-LEG_X, LEG_Y, 0);
    rightLegPivot.setLocalPosition(LEG_X, LEG_Y, 0);
    leftLegPivot.setLocalEulerAngles(0, 0, 0);
    rightLegPivot.setLocalEulerAngles(0, 0, 0);
    leftArmPivot.setLocalEulerAngles(0, 0, 0);
    rightArmPivot.setLocalEulerAngles(0, 0, 0);

    if (state.jetpack) {
      leftLegPivot.setLocalPosition(-JETPACK_LEG_X, LEG_Y, 0);
      rightLegPivot.setLocalPosition(JETPACK_LEG_X, LEG_Y, 0);
      leftLegPivot.setLocalEulerAngles(JETPACK_LEG_DEGREES, 0, 0);
      rightLegPivot.setLocalEulerAngles(JETPACK_LEG_DEGREES, 0, 0);
      leftArmPivot.setLocalEulerAngles(
        JETPACK_ARM_FORWARD_DEGREES,
        0,
        -JETPACK_ARM_OUT_DEGREES
      );
      rightArmPivot.setLocalEulerAngles(
        JETPACK_ARM_FORWARD_DEGREES,
        0,
        JETPACK_ARM_OUT_DEGREES
      );
      return;
    }

    if (state.rolling) {
      body.setLocalPosition(0, ROLL_BODY_DROP, 0);
      body.setLocalScale(1, ROLL_HEIGHT_SCALE, 1);
      torsoPivot.setLocalEulerAngles(ROLL_TORSO_DEGREES, 0, 0);
      leftArmPivot.setLocalEulerAngles(ROLL_ARM_DEGREES, 0, 0);
      rightArmPivot.setLocalEulerAngles(ROLL_ARM_DEGREES, 0, 0);
      leftLegPivot.setLocalEulerAngles(ROLL_LEG_DEGREES, 0, 0);
      rightLegPivot.setLocalEulerAngles(ROLL_LEG_DEGREES, 0, 0);
      return;
    }

    if (state.airborne || descending) {
      leftArmPivot.setLocalEulerAngles(JUMP_ARM_DEGREES, 0, 0);
      rightArmPivot.setLocalEulerAngles(JUMP_ARM_DEGREES, 0, 0);
      leftLegPivot.setLocalEulerAngles(JUMP_LEG_DEGREES, 0, 0);
      rightLegPivot.setLocalEulerAngles(JUMP_LEG_DEGREES, 0, 0);
      return;
    }

    const armDegrees = pose.armSwing * ARM_SWING_DEGREES;
    const legDegrees = pose.legSwing * LEG_SWING_DEGREES;
    leftArmPivot.setLocalEulerAngles(armDegrees, 0, 0);
    rightArmPivot.setLocalEulerAngles(-armDegrees, 0, 0);
    leftLegPivot.setLocalEulerAngles(legDegrees, 0, 0);
    rightLegPivot.setLocalEulerAngles(-legDegrees, 0, 0);
  }

  function dispose(): void {
    if (disposed) {
      return;
    }
    disposed = true;
    root.destroy();
  }

  return { root, update, dispose };
}
