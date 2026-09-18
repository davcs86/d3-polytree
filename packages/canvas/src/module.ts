import EventEmitter from 'eventemitter3';
import { Canvas } from './Canvas';
import { ElementBuilder } from './ElementBuilder';
import { ElementRegistry } from './ElementRegistry';
import { IdsIdGenerator } from './IdGenerator';

/**
 * didi module descriptor wiring the canvas services. Consumed by the higher-level
 * packages (core/viewer/editor) when they assemble their injector.
 *
 * `idGenerator` defaults to the random {@link IdsIdGenerator}; a consumer wanting
 * reproducible ids overrides the token in a later module (last-definition-wins).
 */
export const canvasModule = {
  __init__: ['canvas'],
  canvas: ['type', Canvas],
  idGenerator: ['type', IdsIdGenerator],
  elementRegistry: ['type', ElementRegistry],
  elementBuilder: ['type', ElementBuilder],
  eventBus: ['type', EventEmitter]
};
