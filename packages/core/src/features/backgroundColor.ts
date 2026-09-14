import type { Selection } from 'd3-selection';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import type { ModellingModelElement } from '../modelling/types';

/** The `pfdn:Settings` element carrying the diagram background colour. */
interface SettingsModel extends ModellingModelElement {
  backgroundColor?: string;
}

/**
 * Paints the canvas background from `settings.backgroundColor`.
 *
 * Inserts a full-size `<rect>` behind everything on the root layer and keeps it
 * in sync with the model. Ported from `core-v2beta`'s
 * `features/backgroundColor/BackgroundColor.js`.
 */
export class BackgroundColor {
  static readonly $inject = ['canvas', 'd3polytree.definitions.settings', 'eventBus'];

  private readonly _canvas: Canvas;
  private readonly _settings: SettingsModel;
  private readonly _eventBus: EventEmitter;
  private _bgRect: Selection<SVGRectElement, unknown, null, undefined> | null = null;

  constructor(canvas: Canvas, settings: SettingsModel, eventBus: EventEmitter) {
    this._canvas = canvas;
    this._settings = settings;
    this._eventBus = eventBus;
    this._init();
  }

  setColor(color: string): void {
    if (this._bgRect) {
      this._settings.backgroundColor = color;
      this._refill();
    }
  }

  private _refill(): void {
    this._bgRect?.attr('fill', this._settings.backgroundColor ?? '');
  }

  private _init(): void {
    this._bgRect = this._canvas
      .getRootLayer()
      .insert('rect', ':first-child')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', this._settings.backgroundColor ?? '');

    // re-apply the fill on resize (the source stubbed this out; enabling it is
    // harmless — the rect is sized in percentages — and keeps the hook honest)
    this._eventBus.on('canvas.resized', () => this._refill());
  }
}
