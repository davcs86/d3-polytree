import { DrawingRegistry } from './DrawingRegistry';

export { BaseElement } from './BaseElement';
export { DrawingRegistry } from './DrawingRegistry';
export type { ContainerSelection, DiagramElement, DrawingSelection } from './types';

/** didi module contributing the drawing registry service. */
export const drawingRegistryModule = {
  __init__: ['drawingRegistry'],
  drawingRegistry: ['type', DrawingRegistry]
};
