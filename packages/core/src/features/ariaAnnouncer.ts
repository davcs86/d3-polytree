import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import type { SelectionEntry } from './selection';

/**
 * Announces selection and structural mutations to assistive tech (C2) via a
 * visually-hidden container-level `aria-live="polite"` region. Boot-latched on
 * `canvas.init` (the region is created there, after the drawers' initial
 * `<class>.created` storm), so opening a document does not flood a screen reader.
 * Reads only existing bus events — `selection.changed` and post-boot
 * `<class>.created`/`.removed`, never the per-frame `.updated`/`.moving`.
 */
export class AriaAnnouncer {
  static readonly $inject = ['canvas', 'eventBus'];

  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private _region: HTMLElement | null = null;

  constructor(canvas: Canvas, eventBus: EventEmitter<DiagramEventMap>) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._init();
  }

  /**
   * A short label for `def`, safe on a **bare `{ id }`** — the shape a
   * `.removed` event carries when a reconcile removes by id (e.g. undoing a
   * create). Prefers `name`/`text`, else the local type name, else the id.
   */
  private _name(def: ModellingModelElement): string {
    const name = def.get?.('name');
    if (typeof name === 'string' && name) return name;
    const text = def.get?.('text');
    if (typeof text === 'string' && text) return text;
    const type = (def as { $type?: string }).$type;
    if (typeof type === 'string') return type.replace(/^[^:]*:/, '').toLowerCase();
    return typeof def.id === 'string' ? def.id : 'element';
  }

  /** Announce `message` (clears first so identical successive text still speaks). */
  private _say(message: string): void {
    if (!this._region) {
      return; // pre-boot: no region yet, so the boot storm is silent
    }
    this._region.textContent = '';
    this._region.textContent = message;
  }

  private _onSelectionChanged(_prev: SelectionEntry[], next: SelectionEntry[]): void {
    if (next.length === 0) {
      this._say('selection cleared');
    } else if (next.length === 1) {
      this._say(`${this._name(next[0].definition)} selected`);
    } else {
      this._say(`${next.length} selected`);
    }
  }

  private _init(): void {
    this._eventBus.on('selection.changed', this._onSelectionChanged, this);
    (['node', 'link', 'label', 'zone'] as const).forEach((cls) => {
      this._eventBus.on(
        `${cls}.created`,
        (_g: DrawingSelection, def: ModellingModelElement) => this._say(`${this._name(def)} added`),
        this
      );
      this._eventBus.on(
        `${cls}.removed`,
        (_g: DrawingSelection, def: ModellingModelElement) =>
          this._say(`${this._name(def)} removed`),
        this
      );
    });
    this._eventBus.on('canvas.init', () => this._onCanvasInit(), this);
  }

  private _onCanvasInit(): void {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'pfd-a11y-live';
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
      border: '0',
      padding: '0',
      margin: '-1px'
    });
    this._canvas.getContainer().appendChild(region);
    this._region = region;
  }
}
