import type {ComponentStore, TagStore} from './component';
import {entityFrom, type Entity} from './entity';

export interface Position {x: number; y: number}
export interface Velocity {x: number; y: number}
export interface Radius {value: number}
export interface PrismColor {index: number}
export interface Facing {x: number; y: number}
export interface Enemy {type: number; health: number}
export interface Projectile {friendly: boolean; life: number}
export interface Cooldown {value: number}

export class World {
  private nextEntityId = 0;
  private readonly componentStores: ComponentStore<unknown>[] = [];
  private readonly tagStores: TagStore[] = [];
  readonly entities = new Set<Entity>();
  readonly positions = this.createComponentStore<Position>();
  readonly velocities = this.createComponentStore<Velocity>();
  readonly radii = this.createComponentStore<Radius>();
  readonly prismColors = this.createComponentStore<PrismColor>();
  readonly facings = this.createComponentStore<Facing>();
  readonly enemies = this.createComponentStore<Enemy>();
  readonly projectiles = this.createComponentStore<Projectile>();
  readonly cooldowns = this.createComponentStore<Cooldown>();
  readonly players = this.createTagStore();
  readonly prisms = this.createTagStore();
  readonly gates = this.createTagStore();
  readonly consumed = this.createTagStore();

  createEntity(): Entity {const entity = entityFrom(this.nextEntityId++); this.entities.add(entity); return entity}
  createComponentStore<T>(): ComponentStore<T> {const store = new Map<Entity, T>(); this.componentStores.push(store as ComponentStore<unknown>); return store}
  createTagStore(): TagStore {const store = new Set<Entity>(); this.tagStores.push(store); return store}
  destroyEntity(entity: Entity): void {this.entities.delete(entity); for (const store of this.componentStores) store.delete(entity); for (const store of this.tagStores) store.delete(entity)}
  clear(): void {this.nextEntityId = 0; this.entities.clear(); for (const store of this.componentStores) store.clear(); for (const store of this.tagStores) store.clear()}
}
