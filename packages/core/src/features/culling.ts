import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { TRANSIENT_ATTR, type Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { FlatIndex } from '../spatial/FlatIndex';
import { elementBounds } from '../spatial/elementBounds';
import { CULL_MIN_ELEMENTS, CULL_PAD, HIDE_BUDGET, type Bounds } from '../spatial/types';

/** The persisted `settings.zoom` fields culling reads (direct property reads, never `.get()`). */
interface ZoomModel {
  scale?: number;
  offset?: { x?: number; y?: number };
}

type Kind = 'node' | 'link' | 'zone' | 'label';
const KINDS: readonly Kind[] = ['node', 'label', 'zone', 'link'];
const CULLED = 'culled';
const IDLE_ATTR = 'data-pfd-culling-idle';

/** Diagnostic snapshot of the index ⇄ DOM state (tests / debugging; read-only). */
export interface CullingInspect {
  active: boolean;
  pad: number;
  slots: ReadonlyArray<{ id: string; bounds: Bounds; culled: boolean; node: SVGGElement | null }>;
  stats: { passes: number; maxHides: number };
}

/**
 * Viewport culling (C10): elements whose painted bounds fall outside the (padded) viewport get
 * `data-pfd-transient="culled"` on their `<g>`; one CSS rule then hides everything but the
 * `<title>`/`<desc>`, so the `<g>` — and its accessible name and focusability — survives.
 *
 * SHOW is synchronous in `canvas.zoomed` (a revealed element is never late); hides are
 * deferred to a stateless, hide-budgeted rAF pass. Inert below {@link CULL_MIN_ELEMENTS}, while
 * the container size is unknown, and with `options.culling === false`.
 */
export class Culling {
  static readonly $inject = [
    'canvas',
    'eventBus',
    'd3polytree',
    'd3polytree.definitions.settings.zoom'
  ];

  private readonly _canvas: Canvas;
  private readonly _zoom: ZoomModel | undefined;
  private readonly _enabled: boolean;

  private readonly _index = new FlatIndex();
  /** id → slot; lookup only (PLAT-06). */
  private readonly _slots = new Map<string, number>();
  private _ids: string[] = [];
  private _bounds: Bounds[] = [];
  private _nodes: (SVGGElement | null)[] = [];
  private _culled = new Uint8Array(64);
  private _culledCount = 0;

  private _ro: ResizeObserver | null = null;
  private _roSize: { width: number; height: number } | null = null;
  private _raf = 0;
  private _cancelRaf: ((id: number) => void) | null = null;
  private _destroyed = false;
  private _idle: string | null = null;
  private _cssChecked = false;
  private _cssRetry = false;
  private _cssLoadHandler: (() => void) | null = null;
  private _disabledByCss = false;
  private _stats = { passes: 0, maxHides: 0 };

  constructor(
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    d3polytree: unknown,
    zoom: ZoomModel | undefined
  ) {
    this._canvas = canvas;
    this._zoom = zoom;
    this._enabled =
      (d3polytree as { options?: { culling?: boolean } } | undefined)?.options?.culling !== false;

    for (const cls of KINDS) {
      eventBus.on(`${cls}.created`, this._onCreated(cls), this);
      eventBus.on(`${cls}.updated`, this._onUpdated(cls), this);
      eventBus.on(`${cls}.moving`, this._onUpdated(cls), this);
      eventBus.on(`${cls}.removed`, this._onRemoved, this);
    }
    eventBus.on('canvas.zoomed', this._onZoomed, this);
    eventBus.on('canvas.resized', this._onResized, this);
    eventBus.on('d3canvas.destroy', this._destroy, this);

    if (this._enabled && typeof ResizeObserver === 'function') {
      this._ro = new ResizeObserver((entries) => {
        const r = entries[entries.length - 1]?.contentRect;
        if (!r || this._destroyed) return;
        this._roSize = { width: r.width, height: r.height };
        this._onResized();
      });
      this._ro.observe(canvas.getContainer());
    }
  }

  // ---- element lifecycle -------------------------------------------------------------------

  private _onCreated(cls: Kind) {
    return (element: DrawingSelection, def: ModellingModelElement): void => {
      const id = def.id as string;
      const bounds = elementBounds(cls, def);
      const slot = this._index.upsert(id, bounds);
      if (slot >= this._culled.length) this._growCulled(slot);
      this._slots.set(id, slot);
      this._ids[slot] = id;
      this._bounds[slot] = bounds;
      const node = element.node() as SVGGElement | null;
      this._nodes[slot] = node;
      if (this._culled[slot]) {
        this._culled[slot] = 0;
        this._culledCount--;
      }
      node?.removeAttribute(TRANSIENT_ATTR);
      this._markDirty();
    };
  }

  private _onUpdated(cls: Kind) {
    return (element: DrawingSelection, def: ModellingModelElement): void => {
      const slot = this._slots.get(def.id as string);
      if (slot === undefined) return;
      const bounds = elementBounds(cls, def);
      this._index.upsert(def.id as string, bounds);
      this._bounds[slot] = bounds;
      const node = element.node() as SVGGElement | null;
      this._nodes[slot] = node;
      // Outline measures a label's `.innerElement` with getBBox on `label.updated`; a hidden
      // subtree measures 0×0, so reveal first — the next pass re-hides it if still off-screen.
      if (cls === 'label') this._reveal(slot);
      this._markDirty();
    };
  }

  private _onRemoved(_element: unknown, def: { id?: unknown }): void {
    const id = def?.id as string | undefined;
    const slot = id === undefined ? undefined : this._slots.get(id);
    if (slot === undefined) return;
    this._index.remove(id as string);
    this._slots.delete(id as string);
    this._nodes[slot] = null;
    if (this._culled[slot]) {
      this._culled[slot] = 0;
      this._culledCount--;
    }
    this._markDirty();
  }

  private _growCulled(slot: number): void {
    const next = new Uint8Array(Math.max(this._culled.length * 2, slot + 1));
    next.set(this._culled);
    this._culled = next;
  }

  private _reveal(slot: number): void {
    if (!this._culled[slot]) return;
    this._nodes[slot]?.removeAttribute(TRANSIENT_ATTR);
    this._culled[slot] = 0;
    this._culledCount--;
  }

  // ---- activation --------------------------------------------------------------------------

  /** Cheap check usable from hot handlers: never reads layout. */
  private _mayRun(): boolean {
    return (
      this._enabled &&
      !this._disabledByCss &&
      !this._destroyed &&
      this._slots.size >= CULL_MIN_ELEMENTS &&
      (this._ro ? !!this._roSize && this._roSize.width > 0 : true)
    );
  }

  private _size(): { width: number; height: number } {
    if (this._roSize) return this._roSize;
    if (this._ro) return { width: 0, height: 0 };
    return this._canvas.getSize();
  }

  /** The padded viewport in world units from the persisted zoom settings, or null (fail open). */
  private _viewport(): Bounds | null {
    const z = this._zoom;
    const s = z?.scale;
    const tx = z?.offset?.x;
    const ty = z?.offset?.y;
    if (
      typeof s !== 'number' ||
      typeof tx !== 'number' ||
      typeof ty !== 'number' ||
      !Number.isFinite(s) ||
      !Number.isFinite(tx) ||
      !Number.isFinite(ty) ||
      s <= 0
    ) {
      return null;
    }
    const { width, height } = this._size();
    if (!(width > 0) || !(height > 0)) return null;
    return {
      x0: -tx / s - CULL_PAD,
      y0: -ty / s - CULL_PAD,
      x1: (width - tx) / s + CULL_PAD,
      y1: (height - ty) / s + CULL_PAD
    };
  }

  // ---- scheduling --------------------------------------------------------------------------

  private _markDirty(): void {
    // Inert checks run before requesting a frame; a pending reveal-all still needs one.
    if (!this._mayRun() && this._culledCount === 0) return;
    if (this._mayRun()) this._setIdle('false');
    this._request();
  }

  private _request(): void {
    if (this._raf || this._destroyed || typeof requestAnimationFrame !== 'function') return;
    this._cancelRaf = globalThis.cancelAnimationFrame.bind(globalThis);
    this._raf = requestAnimationFrame(() => this._frame());
  }

  private _setIdle(value: string | null): void {
    if (this._idle === value) return;
    this._idle = value;
    const el = this._canvas.getContainer();
    if (value === null) el.removeAttribute(IDLE_ATTR);
    else el.setAttribute(IDLE_ATTR, value);
  }

  private _onZoomed(): void {
    if (this._destroyed) return;
    if (!this._mayRun()) {
      this._markDirty();
      return;
    }
    const vp = this._viewport();
    if (vp && this._culledCount > 0) {
      // Synchronous SHOW with the same padded rect the hide pass uses: never late.
      this._index.scan(vp, (slot, inside) => {
        if (inside) this._reveal(slot);
      });
    }
    this._markDirty();
  }

  private _onResized(): void {
    if (this._destroyed) return;
    this._onZoomed();
  }

  private _frame(): void {
    this._raf = 0;
    if (this._destroyed) return;
    const vp = this._mayRun() ? this._viewport() : null;
    if (!vp) {
      this._revealAll();
      this._setIdle(null);
      return;
    }

    let hides = 0;
    let backlog = false;
    this._index.scan(vp, (slot, inside) => {
      if (inside) {
        this._reveal(slot);
      } else if (!this._culled[slot]) {
        if (hides < HIDE_BUDGET) {
          const node = this._nodes[slot];
          if (node) {
            node.setAttribute(TRANSIENT_ATTR, CULLED);
            this._culled[slot] = 1;
            this._culledCount++;
            hides++;
          }
        } else {
          backlog = true;
        }
      }
    });

    this._stats.passes++;
    if (hides > this._stats.maxHides) this._stats.maxHides = hides;
    if (hides > 0 || this._cssRetry) this._checkCss();
    if (backlog || this._cssRetry) {
      this._request();
      return;
    }
    this._setIdle('true');
  }

  private _revealAll(): void {
    if (this._culledCount === 0) return;
    for (let slot = 0; slot < this._ids.length; slot++) this._reveal(slot);
  }

  // ---- CSS fail-open -----------------------------------------------------------------------

  /** The first hidden element's paint child must compute `display:none`, else the CSS is missing. */
  private _checkCss(): void {
    if (this._cssChecked || this._disabledByCss) return;
    let child: Element | null = null;
    for (let slot = 0; slot < this._nodes.length && !child; slot++) {
      if (!this._culled[slot]) continue;
      const kids = this._nodes[slot]?.children;
      for (let i = 0; kids && i < kids.length; i++) {
        const k = kids[i];
        if (k.localName !== 'title' && k.localName !== 'desc') {
          child = k;
          break;
        }
      }
    }
    if (!child) {
      this._cssRetry = false;
      return;
    }
    if (getComputedStyle(child).display === 'none') {
      this._cssChecked = true;
      this._cssRetry = false;
      return;
    }
    if (document.readyState !== 'complete') {
      // The stylesheet may still be loading: keep the attributes and re-check on load.
      if (!this._cssLoadHandler) {
        this._cssLoadHandler = () => {
          this._cssLoadHandler = null;
          if (!this._destroyed) this._checkCss();
        };
        window.addEventListener('load', this._cssLoadHandler, { once: true });
      }
      return;
    }
    if (!this._cssRetry) {
      // One extra frame of grace for a stylesheet applied just after `complete`.
      this._cssRetry = true;
      return;
    }
    this._cssRetry = false;
    this._cssChecked = true;
    this._disabledByCss = true;
    this._revealAll();
    console.warn('culling CSS not loaded; culling disabled');
  }

  // ---- lifecycle / diagnostics -------------------------------------------------------------

  private _destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this._raf && this._cancelRaf) this._cancelRaf(this._raf);
    this._raf = 0;
    this._ro?.disconnect();
    if (this._cssLoadHandler) window.removeEventListener('load', this._cssLoadHandler);
    this._cssLoadHandler = null;
    this._canvas.getContainer().removeAttribute(IDLE_ATTR);
  }

  /** @internal Read-only snapshot for tests and diagnostics. */
  inspect(): CullingInspect {
    const slots: CullingInspect['slots'][number][] = [];
    for (let slot = 0; slot < this._ids.length; slot++) {
      const id = this._ids[slot];
      if (this._slots.get(id) !== slot) continue;
      slots.push({
        id,
        bounds: this._bounds[slot],
        culled: this._culled[slot] === 1,
        node: this._nodes[slot]
      });
    }
    return {
      active: this._mayRun() && this._viewport() !== null,
      pad: CULL_PAD,
      slots,
      stats: { ...this._stats }
    };
  }
}
