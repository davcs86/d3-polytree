/**
 * @d3-polytree/core — the diagram engine.
 *
 * B3 carves `core-v2beta`'s `draw` / `features` / `modelling` layers into this
 * package incrementally. Wires the base canvas services, the PFDN model, and the
 * draw layer into the `coreModules` didi stack the higher-level packages build on.
 */
import { canvasModule } from '@d3-polytree/canvas';
import { drawingRegistryModule } from './draw';

export { canvasModule } from '@d3-polytree/canvas';
export { createPfdnModdle, PfdnModdle } from '@d3-polytree/pfdn-moddle';
export * from './draw';
export * as collections from './utils/collections';
export { getLocalName } from './utils/localName';
export type { Descriptored } from './utils/localName';
export * from './features';
export * from './modelling';
export * from './command';
export * from './Diagram';
export * from './model/model';

/** didi modules that make up the core engine (extended as B3 lands more draw/features). */
export const coreModules: unknown[] = [canvasModule, drawingRegistryModule];

