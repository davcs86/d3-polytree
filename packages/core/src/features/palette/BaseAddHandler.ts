import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingRegistry, Point } from '../../draw';
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

  /**
   * The viewport centre in world coordinates. Derived from the canvas size and transform only —
   * never from a drawn element's rect, which is empty while that element is culled (C10).
   */
  protected _calculatePosition(): Point {
    const { width, height } = this._canvas.getSize();
    const t = this._canvas.getTransform();
    const k = t.a || 1;
    return { x: (width / 2 - t.e) / k, y: (height / 2 - t.f) / k };
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
