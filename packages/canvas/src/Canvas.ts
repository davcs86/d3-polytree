import { select } from 'd3-selection';
import type EventEmitter from 'eventemitter3';
import { getSvgString } from './SvgExportingUtils';
import type { DiagramEventMap } from './events';
import type { CanvasConfig, CanvasSize, GroupSelection, SvgSelection, TransformMatrix } from './types';

function ensurePx(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function createContainer(options: CanvasConfig): HTMLElement {
  const container = options.container ?? document.body;
  const parent = document.createElement('div');
  parent.setAttribute('class', 'pfdjs-container');
  Object.assign(parent.style, {
    position: 'absolute',
    overflow: 'hidden',
    width: ensurePx(options.width ?? '100%'),
    height: ensurePx(options.height ?? '100%')
  });
  container.appendChild(parent);
  return parent;
}

/**
 * The main drawing canvas: a `<div>`-wrapped `<svg>` with a root `<g>` layer.
 *
 * Emits `canvas.init` (once `d3canvas.init` is received), `canvas.resized` and
 * `canvas.destroy` on the injected event bus.
 */
export class Canvas {
  static readonly $inject = ['config', 'eventBus'];

  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private _container!: HTMLElement;
  private _svg!: SvgSelection;
  private _rootLayer!: GroupSelection;
  private _drawingLayer!: GroupSelection;

  constructor(config: CanvasConfig | undefined, eventBus: EventEmitter<DiagramEventMap>) {
    this._eventBus = eventBus;
    this._init(config ?? {});
  }

  private _init(config: CanvasConfig): void {
    const eventBus = this._eventBus;

    this._container = createContainer(config);
    this._svg = select(this._container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('pointer-events', 'all');
    this._rootLayer = this._drawingLayer = this._svg.append('g').attr('class', 'full-group');

    eventBus.on('d3canvas.init', () => {
      eventBus.emit('canvas.init', { svg: this._svg });
      this.resized();
    });
    eventBus.on('d3canvas.destroy', () => this._destroy());
  }

  private _destroy(): void {
    this._eventBus.emit('canvas.destroy', { svg: this._svg });
    const parent = this._container?.parentNode;
    if (parent) {
      parent.removeChild(this._container);
    }
  }

  /** The `<div>` that encloses the drawing canvas. */
  getContainer(): HTMLElement {
    return this._container;
  }

  /** The `<svg>` selection. */
  getSVG(): SvgSelection {
    return this._svg;
  }

  /** The serialized `<svg>` string with applicable CSS inlined. */
  getSVGStr(): string {
    return getSvgString(this._svg.node() as SVGSVGElement);
  }

  getRootLayer(): GroupSelection {
    return this._rootLayer;
  }

  getDrawingLayer(): GroupSelection {
    return this._drawingLayer;
  }

  setDrawingLayer(drawingLayer: GroupSelection): void {
    this._drawingLayer = drawingLayer;
  }

  /** Normalized transform of `element` (defaults to the drawing layer). */
  getTransform(element?: GroupSelection): TransformMatrix {
    const target = element ?? this._drawingLayer;
    const transform = target.attr('transform');
    const identity: TransformMatrix = { a: 1, d: 1, e: 0, f: 0 };
    if (!transform) {
      return identity;
    }
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttributeNS(null, 'transform', transform);
    // `SVGGraphicsElement.transform` is not implemented in every environment
    // (e.g. jsdom); fall back to identity rather than throwing.
    const baseVal = (g as SVGGraphicsElement).transform?.baseVal;
    const matrix = baseVal?.consolidate?.()?.matrix;
    return matrix ? { a: matrix.a, d: matrix.d, e: matrix.e, f: matrix.f } : identity;
  }

  getSize(): CanvasSize {
    return {
      width: this._container.clientWidth,
      height: this._container.clientHeight
    };
  }

  resized(): void {
    this._eventBus.emit('canvas.resized');
  }
}
