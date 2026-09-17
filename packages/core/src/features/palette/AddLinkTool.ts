import { pointer, type Selection } from 'd3-selection';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection, Point } from '../../draw';
import type { CommandStack } from '../../command';
import type { CreateContext } from '../../modelling/commands';
import type { ModellingModelElement } from '../../modelling/types';
import type { Tool } from './Tool';

interface PickedNode {
  element: DrawingSelection;
  definition: ModellingModelElement;
}

/**
 * Two-click link tool: click a source node, then a target node, to connect
 * them. A "fake" preview path follows the pointer between the two clicks.
 *
 * Ported from `core-v2beta`'s `paletteProvider/handlers/addLinkTool`, moved off
 * `d3.mouse` onto d3's `pointer(event, node)`.
 */
export class AddLinkTool implements Tool {
  static readonly $inject = ['eventBus', 'canvas', 'commandStack'];

  active = false;

  private readonly _eventBus: EventEmitter;
  private readonly _canvas: Canvas;
  private readonly _commandStack: CommandStack;
  private readonly _fakeLink: Selection<SVGPathElement, unknown, null, undefined>;
  private _selectedNodes: PickedNode[] = [];

  constructor(eventBus: EventEmitter, canvas: Canvas, commandStack: CommandStack) {
    this._eventBus = eventBus;
    this._canvas = canvas;
    this._commandStack = commandStack;

    this._fakeLink = this._canvas
      .getDrawingLayer()
      .insert('path', '.node-group') // under the node layer
      .attr('class', 'fake-link')
      .attr('d', 'M0,0L0,0')
      .style('stroke', 'black')
      .style('fill', 'none');
  }

  activate(): void {
    this.active = true;
    this._selectedNodes = [];
    this._canvas.getRootLayer().classed('no-drag', true).classed('cursor-add-link', true);
    this._registerMouseMove();
    this._registerNodeClick();
  }

  deactivate(): void {
    this.active = false;
    this._canvas.getRootLayer().classed('no-drag', false).classed('cursor-add-link', false);
    this._resetFakeLink();
  }

  private _registerNodeClick(): void {
    this._eventBus.once(
      'node.click',
      (element: DrawingSelection, definition: ModellingModelElement, event: Event) => {
        if (!this.active) {
          return;
        }
        event.stopImmediatePropagation();

        const picked = this._selectedNodes;
        if (picked.length === 0 || (picked.length === 1 && picked[0].element !== element)) {
          picked.push({ element, definition });
        }

        if (picked.length === 2) {
          this._appendLink();
          this.deactivate();
        } else {
          if (picked.length === 1) {
            this._showFakeLink();
          }
          this._registerNodeClick();
        }
      }
    );
  }

  private _registerMouseMove(): void {
    this._canvas.getRootLayer().on('mousemove', (event: Event) => {
      if (!this.active || this._selectedNodes.length !== 1) {
        return;
      }
      const sourceDef = this._selectedNodes[0].definition;
      const position = sourceDef.position as Point;
      const size = (sourceDef.size as number) ?? 0;
      const drawingLayer = this._canvas.getDrawingLayer().node();
      const [x1, y1] = pointer(event, drawingLayer);
      const x = position.x + size / 2;
      const y = position.y + size / 2;
      this._fakeLink.attr('d', `M${x},${y}L${x1},${y1}`);
    });
  }

  private _showFakeLink(): void {
    const position = this._selectedNodes[0].definition.position as Point;
    this._fakeLink.attr('d', `M${position.x},${position.y}L${position.x},${position.y}`);
  }

  private _resetFakeLink(): void {
    this._fakeLink.attr('d', 'M0,0L0,0');
  }

  private _appendLink(): void {
    const ctx: CreateContext = {
      className: 'link',
      parameters: [this._selectedNodes[0].definition, this._selectedNodes[1].definition]
    };
    this._commandStack.execute('element.create', ctx);
  }
}
