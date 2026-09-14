import EventEmitter from 'eventemitter3';
import { Canvas } from './Canvas';
import { ElementBuilder } from './ElementBuilder';
import { ElementRegistry } from './ElementRegistry';

/**
 * didi module descriptor wiring the canvas services. Consumed by the higher-level
 * packages (core/viewer/editor) when they assemble their injector.
 */
export const canvasModule = {
  __init__: ['canvas'],
  canvas: ['type', Canvas],
  elementRegistry: ['type', ElementRegistry],
  elementBuilder: ['type', ElementBuilder],
  eventBus: ['type', EventEmitter]
};
