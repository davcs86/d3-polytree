import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingRegistry } from '../../draw';
import type { Modelling } from '../../modelling';
import type { Selection } from '../selection';
import { BaseAddHandler } from './BaseAddHandler';

/** Palette handler that adds a free-floating label. */
export class AddLabelHandler extends BaseAddHandler {
  static readonly $inject = ['drawingRegistry', 'selection', 'canvas', 'modelling'];

  constructor(
    drawingRegistry: DrawingRegistry,
    selection: Selection,
    canvas: Canvas,
    modelling: Modelling
  ) {
    super('label', drawingRegistry, selection, canvas, modelling);
  }
}
