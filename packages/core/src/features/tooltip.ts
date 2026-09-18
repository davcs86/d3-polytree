import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

/** A tooltip HTML provider: given a node definition, returns tooltip HTML. */
export type TooltipFn = (definition: ModellingModelElement) => string;

/** Below this zoom scale, node labels are too small to read, so show tooltips. */
const TOOLTIP_ZOOM_THRESHOLD = 0.8;

/**
 * Shows a hover tooltip over nodes when zoomed out, using a caller-supplied HTML
 * function (`options.tooltip`). Ported from `core-v2beta`'s
 * `features/tooltip/Tooltip.js`, reimplemented off the unmaintained `d3-tip`
 * onto a plain positioned `<div>`. A no-op unless a tooltip function is given.
 */
export class Tooltip {
  static readonly $inject = ['d3polytree.options.tooltip', 'canvas', 'eventBus'];

  private _tip: HTMLElement | null = null;

  constructor(tooltip: TooltipFn | undefined, canvas: Canvas, eventBus: EventEmitter<DiagramEventMap>) {
    if (typeof tooltip !== 'function') {
      return;
    }

    this._tip = document.createElement('div');
    this._tip.className = 'd3-tip';
    this._tip.style.position = 'absolute';
    this._tip.style.display = 'none';
    document.body.appendChild(this._tip);

    eventBus.on(
      'node.mouseover',
      (_element: DrawingSelection, definition: ModellingModelElement, event: Event) => {
        if (canvas.getTransform().a < TOOLTIP_ZOOM_THRESHOLD) {
          this._show(tooltip(definition), event);
        }
      }
    );
    eventBus.on('node.mouseout', () => this._hide());
  }

  private _show(html: string, event: Event): void {
    if (!this._tip) {
      return;
    }
    this._tip.innerHTML = html;
    this._tip.style.display = 'block';
    const mouse = event as MouseEvent;
    this._tip.style.left = `${mouse.pageX}px`;
    this._tip.style.top = `${mouse.pageY - 10}px`;
  }

  private _hide(): void {
    if (this._tip) {
      this._tip.style.display = 'none';
    }
  }
}
