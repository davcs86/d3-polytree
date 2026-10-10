import type EventEmitter from 'eventemitter3';
import { pointer } from 'd3-selection';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { TRANSIENT_ATTR, type Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { FlatIndex } from '../spatial/FlatIndex';
import { markResolved } from './resolvedEvents';
import { elementBounds } from '../spatial/elementBounds';
import {
  CULL_MIN_ELEMENTS,
  CULL_PAD,
  HIDE_BUDGET,
  LOD_CLICK_TOL_PX,
  LOD_EXEMPT_CAP,
  LOD_SCALE_OFF,
  LOD_SCALE_ON,
  type Bounds
} from '../spatial/types';

/** The persisted `settings.zoom` fields culling reads (direct property reads, never `.get()`). */
interface ZoomModel {
  scale?: number;
  offset?: { x?: number; y?: number };
}

type Kind = 'node' | 'link' | 'zone' | 'label';
const KINDS: readonly Kind[] = ['node', 'label', 'zone', 'link'];
const CULLED = 'culled';
const IDLE_ATTR = 'data-pfd-culling-idle';
const LOD_ATTR = 'data-pfd-lod';
/** Per-slot element class (0 = free slot). */
const K_NODE = 1;
const K_LINK = 2;
const K_LABEL = 3;
const K_ZONE = 4;
const KIND_CODE: Record<Kind, number> = {
  node: K_NODE,
  link: K_LINK,
  label: K_LABEL,
  zone: K_ZONE
};
/** Exemption flags: a node/link carrying any of these is never held by LOD. */
const F_SEL = 1;
const F_FOCUS = 2;
const F_FRESH = 4;
const F_EXEMPT = F_SEL | F_FOCUS | F_FRESH;

/** Diagnostic snapshot of the index ⇄ DOM state (tests / debugging; read-only). */
export interface CullingInspect {
  active: boolean;
  pad: number;
  slots: ReadonlyArray<{
    id: string;
    bounds: Bounds;
    culled: boolean;
    node: SVGGElement | null;
    /** 'node' | 'link' | 'label' | 'zone'. */
    kind: Kind;
    /** Carries a selection / focus / fresh exemption flag. */
    exempt: boolean;
    /** Would be hidden by LOD right now (LOD on, node/link, not exempt). */
    hold: boolean;
  }>;
  /** `off` | `entering` | `on`, or null while inert. */
  lod: string | null;
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
  private readonly _bus: EventEmitter<DiagramEventMap>;
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
  private _kind = new Uint8Array(64);
  private _flags = new Uint8Array(64);
  private _defs: (ModellingModelElement | null)[] = [];
  private _els: (DrawingSelection | null)[] = [];

  // ---- LOD (zoom-out) state
  private readonly _lodEnabled: boolean;
  private _lod = false;
  private _inGesture = false;
  private _lodAttr: string | null = null;
  /** Selected slots admitted to the exempt set (sticky, at most {@link LOD_EXEMPT_CAP}). */
  private readonly _admitted = new Set<number>();
  private _fresh: number[] = [];
  private _focusSlot = -1;
  private _lastView = '';
  private readonly _onFocusIn = (e: Event): void => this._focusChanged(e, true);
  private readonly _onFocusOut = (e: Event): void => this._focusChanged(e, false);
  private readonly _onPointer = (e: Event): void => this._resolvePointer(e as MouseEvent);

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
    this._bus = eventBus;
    this._zoom = zoom;
    const options = (d3polytree as { options?: { culling?: boolean; lod?: boolean } } | undefined)
      ?.options;
    this._enabled = options?.culling !== false;
    // `@internal` harness-only kill switch (never a public option): `lod === false` keeps culling on
    // but never holds nodes/links.
    this._lodEnabled = this._enabled && options?.lod !== false;

    for (const cls of KINDS) {
      eventBus.on(`${cls}.created`, this._onCreated(cls), this);
      eventBus.on(`${cls}.updated`, this._onUpdated(cls), this);
      eventBus.on(`${cls}.moving`, this._onUpdated(cls), this);
      eventBus.on(`${cls}.removed`, this._onRemoved, this);
    }
    eventBus.on('canvas.zoomed', this._onZoomed, this);
    eventBus.on('zoom.start', this._onZoomStart, this);
    eventBus.on('zoom.end', this._onZoomEnd, this);
    eventBus.on('selection.changed', this._onSelectionChanged, this);
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
    if (this._lodEnabled) {
      const container = canvas.getContainer();
      container.addEventListener('focusin', this._onFocusIn);
      container.addEventListener('focusout', this._onFocusOut);
      // Capture: runs before the root-layer bubble handlers and below d3-drag's window capture, so
      // a post-drag click (suppressed there) never reaches it.
      container.addEventListener('click', this._onPointer, true);
      container.addEventListener('dblclick', this._onPointer, true);
    }
  }

  // ---- element lifecycle -------------------------------------------------------------------

  private _onCreated(cls: Kind) {
    return (element: DrawingSelection, def: ModellingModelElement): void => {
      const id = def.id as string;
      const bounds = elementBounds(cls, def);
      const existed = this._slots.has(id);
      const slot = this._index.upsert(id, bounds);
      if (slot >= this._culled.length) this._growSlots(slot);
      // A fresh slot (possibly a reused one) never inherits another element's state.
      if (!existed) this._clearSlotState(slot);
      this._kind[slot] = KIND_CODE[cls];
      this._defs[slot] = def;
      this._els[slot] = element;
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
      // Created while LOD is ON (palette add, undo of a delete): stay painted until the viewport
      // next changes, so the user can see what they just made.
      if (this._lod && (cls === 'node' || cls === 'link')) this._markFresh(slot);
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
      this._defs[slot] = def;
      this._els[slot] = element;
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
    this._clearSlotState(slot);
    this._markDirty();
  }

  private _growSlots(slot: number): void {
    const size = Math.max(this._culled.length * 2, slot + 1);
    const grow = (a: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> => {
      const next = new Uint8Array(size);
      next.set(a);
      return next;
    };
    this._culled = grow(this._culled);
    this._kind = grow(this._kind);
    this._flags = grow(this._flags);
  }

  /** Everything that must not outlive an element in a (reusable) slot. */
  private _clearSlotState(slot: number): void {
    this._kind[slot] = 0;
    this._flags[slot] = 0;
    this._defs[slot] = null;
    this._els[slot] = null;
    this._admitted.delete(slot);
    if (this._focusSlot === slot) this._focusSlot = -1;
    const i = this._fresh.indexOf(slot);
    if (i >= 0) this._fresh.splice(i, 1);
  }

  /** LOD holds (hides) a node/link only while ON and only when it carries no exemption. */
  private _hold(slot: number): boolean {
    const k = this._kind[slot];
    return this._lod && (k === K_NODE || k === K_LINK) && (this._flags[slot] & F_EXEMPT) === 0;
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

  private _setLod(value: string | null): void {
    if (this._lodAttr === value) return;
    this._lodAttr = value;
    const el = this._canvas.getContainer();
    if (value === null) el.removeAttribute(LOD_ATTR);
    else el.setAttribute(LOD_ATTR, value);
  }

  /** The current zoom scale from the persisted settings, or null when unknown. */
  private _scale(): number | null {
    const s = this._zoom?.scale;
    return typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : null;
  }

  private _onZoomStart(): void {
    this._inGesture = true;
  }

  private _onZoomEnd(): void {
    this._inGesture = false;
    if (this._mayRun()) {
      this._setIdle('false');
      this._request();
    }
  }

  private _onZoomed(): void {
    if (this._destroyed) return;
    this._viewChanged();
    // LOD exit is synchronous and runs before the inert early return: zooming in must never leave
    // a held element hidden, with or without an active culling pass.
    if (this._lod) {
      const scale = this._scale();
      if (scale !== null && scale > LOD_SCALE_OFF) {
        this._lod = false;
        this._setLod(this._mayRun() ? 'off' : null);
        if (!this._mayRun()) this._revealAll();
      }
    }
    if (!this._mayRun()) {
      this._markDirty();
      return;
    }
    const vp = this._viewport();
    if (vp && this._culledCount > 0) {
      // Synchronous SHOW with the same padded rect the hide pass uses: never late.
      this._index.scan(vp, (slot, inside) => {
        if (inside && !this._hold(slot)) this._reveal(slot);
      });
    }
    this._markDirty();
  }

  /** A changed (scale, tx, ty) ends every "fresh" exemption. */
  private _viewChanged(): void {
    const z = this._zoom;
    const key = `${z?.scale}|${z?.offset?.x}|${z?.offset?.y}`;
    if (key === this._lastView) return;
    this._lastView = key;
    if (this._fresh.length === 0) return;
    for (const slot of this._fresh) this._flags[slot] &= ~F_FRESH;
    this._fresh = [];
  }

  // ---- LOD click resolver ------------------------------------------------------------------

  /**
   * A held node/link has no hit area (its children are `display:none`), so a pointer click on it
   * would fall through to the background. Resolve it through the spatial index instead and hand it
   * to the bus exactly as `mouseEvents` would. Pick order: a visible node/label/link wins (native);
   * zones are transparent; otherwise nearest hidden node, then nearest hidden link; a miss is left
   * to native dispatch. Nothing stops propagation, so d3-zoom's double-click zoom still runs.
   */
  private _resolvePointer(event: MouseEvent): void {
    if (this._destroyed || !this._lod || !this._mayRun()) return;
    // Synthesised clicks (keyboard activation, `.click()`) have detail 0: leave them native.
    if (!(event.detail > 0)) return;
    if (typeof PointerEvent === 'function' && event instanceof PointerEvent && !event.pointerType) {
      return;
    }
    const root = this._canvas.getRootLayer() as unknown as {
      classed(name: string): boolean;
    };
    if (root.classed('cursor-add-link')) return; // the link tool owns clicks while active
    const svg = this._canvas.getSVG().node() as SVGSVGElement | null;
    const target = event.target as Element | null;
    if (!svg || !target || !svg.contains(target)) return;
    const onElement = target.closest?.('.element, .element-outline');
    if (onElement) {
      const cls = onElement.closest?.('.element') ?? onElement;
      const isZone = cls.classList?.contains('zoneItem');
      if (!isZone) return; // a visible node/label/link (or a held <g>): native wins
    }
    const z = this._zoom;
    const s = this._scale();
    const tx = z?.offset?.x;
    const ty = z?.offset?.y;
    if (s === null || typeof tx !== 'number' || typeof ty !== 'number') return;
    const [px, py] = pointer(event, svg);
    const wx = (px - tx) / s;
    const wy = (py - ty) / s;
    const tol = LOD_CLICK_TOL_PX / s;
    const hit = this._pick(wx, wy, tol);
    if (hit === null) return;
    markResolved(event);
    const cls = this._kind[hit] === K_NODE ? 'node' : 'link';
    // `<class>.<type>` keys are only weakly typed on the bus (mirrors `mouseEvents`).
    (this._bus as unknown as { emit(e: string, ...a: unknown[]): void }).emit(
      `${cls}.${event.type}`,
      this._els[hit],
      this._defs[hit],
      event
    );
  }

  /** Nearest held node containing the point, else nearest held link within tolerance; or null. */
  private _pick(wx: number, wy: number, tol: number): number | null {
    let bestNode = -1;
    let bestNodeD = Infinity;
    let bestLink = -1;
    let bestLinkD = Infinity;
    this._index.scan({ x0: wx - tol, y0: wy - tol, x1: wx + tol, y1: wy + tol }, (slot, inside) => {
      if (!inside || !this._hold(slot)) return;
      const def = this._defs[slot] as unknown as {
        position?: { x?: number; y?: number };
        size?: number;
        waypoint?: Array<{ x?: number; y?: number } | undefined>;
        lineWidth?: number;
      } | null;
      if (!def) return;
      if (this._kind[slot] === K_NODE) {
        const x = def.position?.x;
        const y = def.position?.y;
        const size = def.size ?? 0;
        if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x + y + size))
          return;
        if (wx < x - tol || wx > x + size + tol || wy < y - tol || wy > y + size + tol) return;
        const d = Math.hypot(wx - (x + size / 2), wy - (y + size / 2));
        if (d < bestNodeD) {
          bestNodeD = d;
          bestNode = slot;
        }
      } else {
        const pts = def.waypoint;
        if (!pts || pts.length === 0) return;
        const d = polylineDistance(pts, wx, wy);
        if (d <= (def.lineWidth ?? 0) / 2 + tol && d < bestLinkD) {
          bestLinkD = d;
          bestLink = slot;
        }
      }
    });
    if (bestNode >= 0) return bestNode;
    return bestLink >= 0 ? bestLink : null;
  }

  // ---- LOD exemptions ----------------------------------------------------------------------

  private _markFresh(slot: number): void {
    if ((this._flags[slot] & F_FRESH) !== 0 || this._fresh.length >= LOD_EXEMPT_CAP) return;
    this._flags[slot] |= F_FRESH;
    this._fresh.push(slot);
  }

  /** O(1) synchronous reveal of one slot that just became exempt, when it is in view. */
  private _showSlotIfInView(slot: number): void {
    if (!this._culled[slot]) return;
    const vp = this._mayRun() ? this._viewport() : null;
    const b = this._bounds[slot];
    if (!vp || !b) return;
    if (b.x1 >= vp.x0 && b.x0 <= vp.x1 && b.y1 >= vp.y0 && b.y0 <= vp.y1) this._reveal(slot);
  }

  private _onSelectionChanged(
    _prev: unknown,
    snapshot: ReadonlyArray<{ definition?: { id?: unknown } } | undefined>
  ): void {
    if (this._destroyed || !this._lodEnabled) return;
    const want: number[] = [];
    for (const entry of snapshot ?? []) {
      const id = entry?.definition?.id;
      const slot = typeof id === 'string' ? this._slots.get(id) : undefined;
      if (slot !== undefined) want.push(slot);
    }
    want.sort((a, b) => a - b);
    const wanted = new Set(want);
    let released = false;
    for (const slot of this._admitted) {
      if (wanted.has(slot)) continue;
      this._admitted.delete(slot);
      this._flags[slot] &= ~F_SEL;
      released = true;
    }
    for (const slot of want) {
      if (this._admitted.has(slot)) continue;
      if (this._admitted.size >= LOD_EXEMPT_CAP) break;
      this._admitted.add(slot);
      this._flags[slot] |= F_SEL;
      this._showSlotIfInView(slot);
    }
    // Released slots are re-held by the next budgeted frame.
    if (released) this._markDirty();
  }

  private _focusChanged(event: Event, gained: boolean): void {
    if (this._destroyed) return;
    const target = event.target as Element | null;
    const g = target?.closest?.('.element[element-id]');
    const id = g?.getAttribute('element-id');
    const slot = id ? this._slots.get(id) : undefined;
    if (!gained) {
      if (slot !== undefined && this._focusSlot === slot) {
        this._flags[slot] &= ~F_FOCUS;
        this._focusSlot = -1;
        this._markDirty();
      }
      return;
    }
    if (slot === undefined || this._focusSlot === slot) return;
    if (this._focusSlot >= 0) this._flags[this._focusSlot] &= ~F_FOCUS;
    this._focusSlot = slot;
    this._flags[slot] |= F_FOCUS;
    this._showSlotIfInView(slot);
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
      this._lod = false;
      this._revealAll();
      this._setIdle(null);
      this._setLod(null);
      return;
    }

    // ON is stateless and only evaluated outside a gesture; OFF (synchronous) lives in `_onZoomed`,
    // repeated here defensively for a frame that races a programmatic zoom.
    const scale = this._scale();
    if (scale !== null) {
      if (!this._lod && this._lodEnabled && !this._inGesture && scale <= LOD_SCALE_ON) {
        this._lod = true;
      } else if (this._lod && scale > LOD_SCALE_OFF) {
        this._lod = false;
      }
    }

    let hides = 0;
    let backlog = false;
    let holdBacklog = false;
    this._index.scan(vp, (slot, inside) => {
      const hold = inside && this._hold(slot);
      if (inside && !hold) {
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
          if (hold) holdBacklog = true;
        }
      }
    });
    this._setLod(this._lod ? (holdBacklog ? 'entering' : 'on') : 'off');

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
    const container = this._canvas.getContainer();
    container.removeAttribute(IDLE_ATTR);
    container.removeAttribute(LOD_ATTR);
    container.removeEventListener('focusin', this._onFocusIn);
    container.removeEventListener('focusout', this._onFocusOut);
    container.removeEventListener('click', this._onPointer, true);
    container.removeEventListener('dblclick', this._onPointer, true);
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
        node: this._nodes[slot],
        kind: (KINDS.find((k) => KIND_CODE[k] === this._kind[slot]) ?? 'node') as Kind,
        exempt: (this._flags[slot] & F_EXEMPT) !== 0,
        hold: this._hold(slot)
      });
    }
    return {
      active: this._mayRun() && this._viewport() !== null,
      pad: CULL_PAD,
      lod: this._lodAttr,
      slots,
      stats: { ...this._stats }
    };
  }
}

/** Minimum distance from (x, y) to a polyline; Infinity when it has no finite point. */
function polylineDistance(
  pts: ReadonlyArray<{ x?: number; y?: number } | undefined>,
  x: number,
  y: number
): number {
  let best = Infinity;
  let prev: { x: number; y: number } | null = null;
  for (const p of pts) {
    const px = p?.x;
    const py = p?.y;
    if (typeof px !== 'number' || typeof py !== 'number' || !Number.isFinite(px + py)) {
      prev = null;
      continue;
    }
    if (prev) {
      const dx = px - prev.x;
      const dy = py - prev.y;
      const len2 = dx * dx + dy * dy;
      const t =
        len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - prev.x) * dx + (y - prev.y) * dy) / len2));
      best = Math.min(best, Math.hypot(x - (prev.x + t * dx), y - (prev.y + t * dy)));
    } else {
      best = Math.min(best, Math.hypot(x - px, y - py));
    }
    prev = { x: px, y: py };
  }
  return best;
}
