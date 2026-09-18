import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingRegistry } from '../../draw';
import type { Modelling } from '../../modelling';
import type { CommandStack } from '../../command';
import type { Selection } from '../selection';
import { BaseAddHandler } from './BaseAddHandler';

/** Palette handler that adds a node. */
export class AddNodeHandler extends BaseAddHandler {
  static readonly $inject = ['drawingRegistry', 'selection', 'canvas', 'modelling', 'commandStack'];

  constructor(
    drawingRegistry: DrawingRegistry,
    selection: Selection,
    canvas: Canvas,
    modelling: Modelling,
    commandStack: CommandStack
  ) {
    super('node', drawingRegistry, selection, canvas, modelling, commandStack);
  }
}
