import { select } from 'd3-selection';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingRegistry, Point } from '../../draw';
import type { GroupSelection } from '@d3-polytree/canvas';
import type { Modelling } from '../../modelling';
import type { CreateContext } from '../../modelling/commands';
import type { CommandStack } from '../../command';
import type { CreateParameters, ModellingModelElement } from '../../modelling/types';
import type { Selection } from '../selection';

/**
 * Base for the palette "add element" handlers: computes a drop position at the
 * viewport centre, creates the element through the modelling orchestrator, and
 * selects it. Ported from `core-v2beta`'s
 * `paletteProvider/handlers/baseAddHandler`.
 */
export abstract class BaseAddHandler {
  protected constructor(
    protected readonly _className: 'node' | 'label',
    protected readonly _drawingRegistry: DrawingRegistry,
    protected readonly _selection: Selection,
    protected readonly _canvas: Canvas,
    protected readonly _modelling: Modelling,
    protected readonly _commandStack: CommandStack
  ) {}

  private _getElemOfReference(): GroupSelection {
    const elements = this._drawingRegistry.getAll();
    if (elements.length > 0) {
      return select<SVGGElement, unknown>(elements[0].node() as SVGGElement);
    }
    return this._canvas.getDrawingLayer();
  }

  protected _calculatePosition(): Point {
    const elemOfRef = this._getElemOfReference();
    const container = this._canvas.getContainer().getBoundingClientRect();
    const refRect = elemOfRef.node()!.getBoundingClientRect();
    const refTransform = this._canvas.getTransform(elemOfRef);
    const canvasTransform = this._canvas.getTransform();
    const translateX = refTransform.e;
    const translateY = refTransform.f;
    const scale = canvasTransform.a || 1;

    return {
      x:
        (-1.0 * (refRect.left - translateX * scale - (container.left + container.width / 2))) /
        scale,
      y:
        (-1.0 * (refRect.top - translateY * scale - (container.top + container.height / 2))) / scale
    };
  }

  protected _create(parameters: CreateParameters): ModellingModelElement {
    // Route creation through the command stack so it is undoable; `execute`
    // populates `ctx.created` (the memento) with the minted element.
    const ctx: CreateContext = { className: this._className, parameters: [parameters] };
    this._commandStack.execute('element.create', ctx);
    return ctx.created as ModellingModelElement;
  }

  /** Create an element at the viewport centre and select it. */
  append(parameters: CreateParameters = {}): ModellingModelElement {
    parameters.position = this._calculatePosition();
    const definition = this._create(parameters);
    const element = this._drawingRegistry.get(definition.id as string);
    if (element) {
      this._selection.select(element, definition, {});
    }
    return definition;
  }
}
