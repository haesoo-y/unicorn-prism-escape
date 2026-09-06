import type {Entity} from './entity';

export type ComponentStore<T> = Map<Entity, T>;
export type TagStore = Set<Entity>;
