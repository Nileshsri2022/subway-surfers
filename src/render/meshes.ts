import * as pc from 'playcanvas';

export function createMaterial(color: pc.Color, options?: { emissive?: pc.Color }): pc.StandardMaterial {
  const material = new pc.StandardMaterial();
  material.diffuse = color;
  if (options?.emissive) {
    material.emissive = options.emissive;
  }
  material.update();
  return material;
}

export function createBox(
  parent: pc.Entity,
  name: string,
  size: [number, number, number],
  material: pc.StandardMaterial
): pc.Entity {
  const entity = new pc.Entity(name);
  const render = entity.addComponent('render', { type: 'box' });
  if (!render) {
    throw new Error(`Unable to add a render component to "${name}"`);
  }
  render.material = material;
  entity.setLocalScale(size[0], size[1], size[2]);
  parent.addChild(entity);
  return entity;
}

type Shadowable = {
  render?: { meshInstances: Array<{ castShadow: boolean; receiveShadow: boolean }> };
};

// Shadow flags for one entity's own render component. PlayCanvas only casts
// or receives where these are set, so every visual opts in explicitly.
export function setShadows(entity: pc.Entity, cast: boolean, receive: boolean): void {
  const render = (entity as unknown as Shadowable).render;
  if (!render) return;
  for (const mi of render.meshInstances) {
    mi.castShadow = cast;
    mi.receiveShadow = receive;
  }
}

// Same flags for a whole subtree (character rig, obstacle group, ...).
export function setSubtreeShadows(root: pc.Entity, cast: boolean, receive: boolean): void {
  setShadows(root, cast, receive);
  for (const child of root.children) {
    // Children here are always entities; GraphNode is the static type.
    setSubtreeShadows(child as pc.Entity, cast, receive);
  }
}
