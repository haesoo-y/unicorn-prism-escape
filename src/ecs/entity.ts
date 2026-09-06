declare const entityBrand: unique symbol;

export type Entity = number & {
  readonly [entityBrand]: true;
};

export function entityFrom(id: number): Entity {
  return id as Entity;
}
