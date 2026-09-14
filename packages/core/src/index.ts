/**
 * @d3-polytree/core — the diagram engine.
 *
 * B3 carves `core-v2beta`'s `draw` / `features` / `modelling` layers into this
 * package incrementally. This first slice wires the foundation: the base canvas
 * services and the PFDN model, composed into the `coreModules` didi stack that
 * the higher-level packages (viewer/interactive-viewer/editor) build on.
 */
import { canvasModule } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';

export { canvasModule } from '@d3-polytree/canvas';
export { createPfdnModdle, PfdnModdle } from '@d3-polytree/pfdn-moddle';

/** didi modules that make up the core engine (extended as B3 lands draw/features). */
export const coreModules: unknown[] = [canvasModule];

/** Convenience factory for the PFDN model used by the engine. */
export const createModel = createPfdnModdle;
