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
