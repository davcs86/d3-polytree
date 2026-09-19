import { scaleLinear, type ScaleLinear } from 'd3-scale';
import { axisBottom, axisRight, type Axis } from 'd3-axis';
import { zoomIdentity } from 'd3-zoom';
import type { Selection } from 'd3-selection';
import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import type { ModellingModelElement } from '../modelling/types';
import type { Zoom } from './zoom';

/** The `pfdn:Grid` settings element. */
interface GridModel extends ModellingModelElement {
  show?: boolean;
  size?: number;
  lineColor?: string;
  lineWidth?: number;
}

type LinearScale = ScaleLinear<number, number>;
type NumberAxis = Axis<number>;
type GSelection = Selection<SVGGElement, unknown, null, undefined>;

/**
 * Draws the background grid (two crossed axes) and keeps it aligned with the
 * canvas zoom transform. Hidden during interactive zoom, redrawn on zoom end.
 *
 * Ported from `core-v2beta`'s `features/axes/Axes.js` — the module-level scale/
 * axis singletons (a latent cross-instance bug) become instance fields, and the
 * d3 sub-modules are imported slim (`d3-scale`, `d3-axis`, `d3-zoom`).
 */
export class Axes {
  static readonly $inject = ['d3polytree.definitions.settings.grid', 'canvas', 'eventBus', 'zoom'];

  private readonly _options: GridModel;
  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private readonly _zoom: Zoom;
  private _isVisible: boolean;

  private _svg: GSelection | null = null;
  private _x: LinearScale | null = null;
  private _y: LinearScale | null = null;
  private _xAxis: NumberAxis | null = null;
  private _yAxis: NumberAxis | null = null;
  private _gX: GSelection | null = null;
  private _gY: GSelection | null = null;

  constructor(
    options: GridModel,
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    zoom: Zoom
  ) {
    this._options = options;
    this._isVisible = options.show ?? true;
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._zoom = zoom;
    this._init();
  }

  setVisible(visible: boolean): void {
    if (this._svg) {
      this._isVisible = visible;
      this._svg.style('display', visible ? 'inline' : 'none');
    }
  }

  toggleVisible(): void {
    if (this._svg) {
      this.setVisible(!this._isVisible);
    }
  }

  private _init(): void {
    let wasVisible = false;

    this._eventBus.on('zoom.start', () => {
      if (this._zoom && !this._zoom.isZoomable()) {
        return;
      }
      wasVisible = this._isVisible;
      this.setVisible(false);
    });
    this._eventBus.on('zoom.end', () => {
      if (wasVisible) {
        this.setVisible(true);
        this._rescale();
      }
    });

    this._draw();
    this._rescale();
    this.setVisible(this._options.show ?? true);
  }

  private _rescale(): void {
    if (!this._x || !this._y || !this._xAxis || !this._yAxis || !this._gX || !this._gY) {
      return;
    }
    const { width, height } = this._canvas.getSize();
    const transform = this._canvas.getTransform();
    const scale = transform.a;
    const size = this._options.size ?? 1;
    const zoomTransform = zoomIdentity.translate(transform.e, transform.f).scale(scale);

    this._x.domain([-1, width - 1]).range([-1, width - 1]);
    this._y.domain([-1, height - 1]).range([-1, height - 1]);

    this._gX.call(
      this._xAxis
        .scale(zoomTransform.rescaleX(this._x))
        .ticks(width / scale / size)
        .tickSize(height)
    );
    this._gY.call(
      this._yAxis
        .scale(zoomTransform.rescaleY(this._y))
        .ticks(height / scale / size)
        .tickSize(width)
    );

    for (const g of [this._gX, this._gY]) {
      g.selectAll<SVGElement, unknown>('line, path')
        .style('stroke-width', String(this._options.lineWidth ?? 1))
        .style('stroke', this._options.lineColor ?? '')
        .style('stroke-dasharray', '2');
    }
  }

  private _draw(): void {
    if (this._svg) {
      this._svg.remove();
    }

    const root = this._canvas.getRootLayer();
    // Sit just ABOVE the background-colour rect (so the grid paints over the
    // fill) but below the diagram content. Both this feature and BackgroundColor
    // used `:first-child`; because BackgroundColor boots first, the grid ended up
    // *beneath* the opaque background rect and was never visible. Insert after the
    // background rect when present, otherwise fall back to the back of the layer.
    const firstChild = (root.node() as Element | null)?.firstElementChild ?? null;
    const before: Element | null =
      firstChild && firstChild.tagName.toLowerCase() === 'rect'
        ? (firstChild.nextElementSibling as Element | null)
        : firstChild;
    // `insert(type, before)` inserts before the node the function returns, or
    // appends when it returns null.
    this._svg = root.insert('g', () => before as never).attr('class', 'axis');

    const { width, height } = this._canvas.getSize();

    this._x = scaleLinear()
      .domain([-1, width - 1])
      .range([-1, width - 1]);
    this._y = scaleLinear()
      .domain([-1, height - 1])
      .range([-1, height - 1]);

    this._xAxis = axisBottom<number>(this._x)
      .tickFormat(() => '')
      .tickSize(height);
    this._yAxis = axisRight<number>(this._y)
      .tickFormat(() => '')
      .tickSize(width);

    this._gX = this._svg.append('g').call(this._xAxis);
    this._gY = this._svg.append('g').call(this._yAxis);
  }
}
