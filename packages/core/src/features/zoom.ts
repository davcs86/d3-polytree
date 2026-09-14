import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';
// side-effect import: augments d3-selection with `.transition()`
import 'd3-transition';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import { getLocalName } from '../utils/localName';
import type { CalculateCenter } from '../utils/calculateCenter';
import type { Point } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

/** Zoom limits: min/max scale. */
const SCALE_EXTENT: [number, number] = [0.1, 15];
/** Scale applied when zooming to a specific element. */
const ZOOM_TO_SCALE = 1.2;
/** Duration (ms) of the animated zoom-to-element. */
const ZOOM_TO_DURATION = 1800;

/** The `pfdn:Zoom` settings element: an offset point and a scale. */
interface ZoomModel extends ModellingModelElement {
  scale?: number;
  offset?: Point;
}

/**
 * Pan/zoom behaviour on the canvas drawing layer.
 *
 * Wraps `d3-zoom`, persists the transform back to the model's `settings.zoom`,
 * emits `background.click` for empty-space clicks, and animates a
 * `zoom.to.element` request. Ported from `core-v2beta`'s `features/zoom/Zoom.js`
 * — moved off the removed `d3.event` global and the module-level zoom singleton
 * onto d3's event-argument listeners and a per-instance behaviour.
 */
export class Zoom {
  static readonly $inject = [
    'd3polytree.definitions.settings.zoom',
    'canvas',
    'eventBus',
    'calculateCenter'
  ];

  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter;
  private readonly _options: ZoomModel;
  private readonly _calculateCenter: CalculateCenter;
  private _isZoomable = false;
  private _zoom!: ZoomBehavior<SVGGElement, unknown>;

  constructor(
    options: ZoomModel,
    canvas: Canvas,
    eventBus: EventEmitter,
    calculateCenter: CalculateCenter
  ) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._options = options;
    this._calculateCenter = calculateCenter;

    const offset = options.get('offset') as ModellingModelElement;
    const tX = offset.get('x') as number;
    const tY = offset.get('y') as number;
    const s = options.get('scale') as number;

    this._init();

    this.setZoomable(true);
    this.setInitialZoom(tX, tY, s);
    this.setZoomable(false);
  }

  setZoom(translateX?: number, translateY?: number, scale?: number): void {
    this._eventBus.emit('zoom.preZoom', translateX, translateY, scale);

    if (this._isZoomable) {
      // Only read the current transform to fill in any omitted argument; the
      // interactive and programmatic paths supply all three.
      const needsCurrent = translateX === undefined || translateY === undefined || scale === undefined;
      const current = needsCurrent ? this._canvas.getTransform() : null;
      const tx = translateX ?? current!.e;
      const ty = translateY ?? current!.f;
      const s = scale ?? current!.a;

      this._canvas.getDrawingLayer().attr('transform', `translate(${tx}, ${ty}) scale(${s})`);

      // persist the transform back onto the model
      this._options.scale = s;
      if (this._options.offset) {
        this._options.offset.x = tx;
        this._options.offset.y = ty;
      }

      this._eventBus.emit('canvas.zoomed');
    }
  }

  setZoomable(isZoomable: boolean): void {
    this._isZoomable = isZoomable;
  }

  setInitialZoom(tX: number, tY: number, s: number, duration?: number): void {
    const drawingLayer = this._canvas.getDrawingLayer();
    const parent = drawingLayer.node()!.parentNode as SVGGElement;
    const selection = select<SVGGElement, unknown>(parent);
    const transform = zoomIdentity.translate(tX, tY).scale(s);
    if (duration) {
      selection.transition().duration(duration).call(this._zoom.transform, transform);
    } else {
      selection.call(this._zoom.transform, transform);
    }
  }

  private _init(): void {
    let drawingLayer = this._canvas.getDrawingLayer();

    this._zoom = d3zoom<SVGGElement, unknown>()
      .scaleExtent(SCALE_EXTENT)
      // Derive the viewport extent explicitly from the canvas size instead of
      // letting d3-zoom read SVG layout (`width.baseVal`), which keeps the
      // behaviour correct headlessly as well as in the browser.
      .extent((): [[number, number], [number, number]] => {
        const { width, height } = this._canvas.getSize();
        return [
          [0, 0],
          [width, height]
        ];
      })
      .on('start', () => this._eventBus.emit('zoom.start'))
      .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
        if (!this._isZoomable) {
          return;
        }
        const { x, y, k } = event.transform;
        this.setZoom(x, y, k);
      })
      .on('end', () => this._eventBus.emit('zoom.end'));

    drawingLayer.on('click', (event: Event) => {
      const isOutline = select(event.target as Element).classed('element-outline');
      if (!isOutline) {
        this._eventBus.emit('background.click');
      }
    });

    drawingLayer = drawingLayer.call(this._zoom).append('g');
    this._canvas.setDrawingLayer(drawingLayer);

    this._eventBus.on('zoom.to.element', (_element: unknown, definition: ModellingModelElement) => {
      const wasZoomable = this._isZoomable;
      const localName = getLocalName(definition);
      const center = this._calculateCenter.getCenterPosition();
      const centralPoint: Point = { x: 0, y: 0 };

      this.setZoomable(true);
      if (localName === 'node') {
        const position = definition.position as Point;
        const size = (definition.size as number) ?? 0;
        centralPoint.x = 1.5 + position.x + size / 2;
        centralPoint.y = 1.5 + position.y + size / 2;
      } else if (localName === 'link') {
        const waypoint = definition.waypoint as Point[];
        const last = waypoint.length - 1;
        if (last >= 0) {
          centralPoint.x = waypoint[last].x;
          centralPoint.y = waypoint[last].y;
        }
      }
      this.setInitialZoom(
        center.x - centralPoint.x * ZOOM_TO_SCALE,
        center.y - centralPoint.y * ZOOM_TO_SCALE,
        ZOOM_TO_SCALE,
        ZOOM_TO_DURATION
      );
      this.setZoomable(wasZoomable);
    });

    this._eventBus.emit('zoom.init');
  }
}
