import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap, SvgSelection } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection, Point } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import type { Selection } from './selection';
import { buildModelGraph } from '../model/graph';

/** The model host surface keyboard-nav reads (topological roving order). */
interface ModelHostLike {
  definitions: { node?: unknown; link?: unknown };
}

interface NavEntry {
  g: DrawingSelection;
  def: ModellingModelElement;
  cls: string;
}

const CLASSES = ['node', 'link', 'label', 'zone'] as const;
const DIRECTIONS: Record<string, Point> = {
  ArrowRight: { x: 1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }
};
/** cos(45°): a candidate is "in the arrow direction" when the cosine exceeds this. */
const CONE_COS = Math.SQRT1_2;

/**
 * Keyboard-first navigation (C2). Makes the diagram an ARIA `application`, gives
 * the `<svg>` a labelled tab stop, and lets a keyboard user move a roving focus
 * across elements by **arrow-key direction cone** (over model `position`, so it
 * is jsdom-safe — no `getBBox`), driving the shared {@link Selection}. Draws an
 * in-SVG focus ring per element and provides an Escape hatch out of application
 * mode. Registered ahead of the drawers so it observes the initial
 * `<class>.created` storm.
 *
 * TODO(C2.a): AT forms-mode navigation is verified structurally (axe) and
 * behaviourally (Playwright), but a manual real-AT pass (NVDA/JAWS/VoiceOver) is
 * not CI-gateable — see ROADMAP C2.a. Do not claim a certified AA AT audit.
 */
export class KeyboardNav {
  static readonly $inject = ['canvas', 'eventBus', 'd3polytree', 'selection'];

  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private readonly _model: ModelHostLike;
  private readonly _selection: Selection;
  private readonly _entries = new Map<string, NavEntry>();
  private _svg: SvgSelection | null = null;
  private _current: string | null = null;

  constructor(
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    d3polytree: ModelHostLike,
    selection: Selection
  ) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._model = d3polytree;
    this._selection = selection;
    this._init();
  }

  private _init(): void {
    for (const cls of CLASSES) {
      this._eventBus.on(
        `${cls}.created`,
        (g: DrawingSelection, def: ModellingModelElement) => this._onCreated(cls, g, def),
        this
      );
      this._eventBus.on(`${cls}.updated`, (g: DrawingSelection) => this._ensureRing(g), this);
      this._eventBus.on(
        `${cls}.removed`,
        (_g: DrawingSelection, def: ModellingModelElement) => this._onRemoved(def),
        this
      );
    }
    this._eventBus.on('canvas.init', () => this._onCanvasInit(), this);
  }

  private _onCreated(cls: string, g: DrawingSelection, def: ModellingModelElement): void {
    const id = def.id as string;
    this._ensureRing(g);
    g.attr('tabindex', -1);
    this._entries.set(id, { g, def, cls });
  }

  private _onRemoved(def: ModellingModelElement): void {
    const id = def.id as string;
    this._entries.delete(id);
    if (this._current === id) {
      this._current = null;
    }
  }

  /** Append (or re-assert) the focus-ring rect as the LAST child of the element `<g>`. */
  private _ensureRing(g: DrawingSelection): void {
    if (g.select('.element-focus-ring').empty()) {
      g.append('rect').attr('class', 'element-focus-ring').attr('fill', 'none');
    }
  }

  private _onCanvasInit(): void {
    const svg = this._canvas.getSVG();
    this._svg = svg;
    svg.attr('role', 'application').attr('aria-label', 'Process flow diagram').attr('tabindex', 0);
    svg.on('keydown', (event: KeyboardEvent) => this._onKeydown(event));
  }

  private _onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this._escape();
      return;
    }
    const dir = DIRECTIONS[event.key];
    if (!dir) {
      return;
    }
    event.preventDefault(); // arrows drive navigation, not scroll
    this._move(dir);
  }

  /** The roving order: nodes in topological order, then other elements by id. */
  private _rovingOrder(): string[] {
    const nodes = (this._model.definitions.node ?? []) as ModellingModelElement[];
    const links = (this._model.definitions.link ?? []) as ModellingModelElement[];
    const graph = buildModelGraph({
      nodes: nodes.filter((n) => n.id != null && this._entries.has(n.id as string)),
      links,
      isLive: (id) => this._entries.has(id)
    });
    const ordered = graph.nodes.map((n) => n.id).filter((id) => this._entries.has(id));
    const seen = new Set(ordered);
    for (const id of this._entries.keys()) {
      if (!seen.has(id)) {
        ordered.push(id);
      }
    }
    return ordered;
  }

  private _center(entry: NavEntry): Point | null {
    const pos = entry.def.position as Point | undefined;
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
      return { x: pos.x, y: pos.y };
    }
    const wp = entry.def.waypoint as Point[] | undefined;
    if (wp && wp.length > 0) {
      const a = wp[0];
      const b = wp[wp.length - 1];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    return null;
  }

  private _move(dir: Point): void {
    const order = this._rovingOrder();
    if (order.length === 0) {
      return;
    }
    // No focus yet → enter at the first element in roving order.
    if (this._current === null || !this._entries.has(this._current)) {
      this._focus(order[0]);
      return;
    }
    const fromEntry = this._entries.get(this._current);
    const from = fromEntry ? this._center(fromEntry) : null;
    if (!from) {
      const idx = order.indexOf(this._current);
      this._focus(order[(idx + 1) % order.length]);
      return;
    }
    let best: string | null = null;
    let bestDist = Infinity;
    for (const id of order) {
      if (id === this._current) {
        continue;
      }
      const entry = this._entries.get(id);
      const c = entry ? this._center(entry) : null;
      if (!c) {
        continue;
      }
      const vx = c.x - from.x;
      const vy = c.y - from.y;
      const dist = Math.hypot(vx, vy);
      if (dist === 0) {
        continue;
      }
      const cos = (vx * dir.x + vy * dir.y) / dist;
      if (cos > CONE_COS && dist < bestDist) {
        best = id;
        bestDist = dist;
      }
    }
    if (best) {
      this._focus(best);
    }
  }

  private _focus(id: string): void {
    const entry = this._entries.get(id);
    if (!entry) {
      return;
    }
    // Roving tabindex: only the focused element is in the tab order.
    const prev = this._current ? this._entries.get(this._current) : undefined;
    if (prev) {
      prev.g.attr('tabindex', -1).classed('pfd-focus', false);
    }
    entry.g.attr('tabindex', 0).classed('pfd-focus', true);
    this._sizeRing(entry);
    (entry.g.node() as SVGGElement | null)?.focus?.();
    this._current = id;
    this._selection.select(entry.g, entry.def);
  }

  /**
   * Size the focus ring to match the element's already-computed `.element-outline`
   * box (the Outline feature runs before this one and sizes that rect per element),
   * so the ring tracks the element without duplicating the box computation.
   */
  private _sizeRing(entry: NavEntry): void {
    const ring = entry.g.select('.element-focus-ring');
    const outline = entry.g.select('.element-outline');
    if (ring.empty() || outline.empty()) {
      return;
    }
    ring
      .attr('x', outline.attr('x'))
      .attr('y', outline.attr('y'))
      .attr('width', outline.attr('width'))
      .attr('height', outline.attr('height'));
  }

  /** Escape hatch out of application mode: drop the roving focus back to the svg, then blur it. */
  private _escape(): void {
    if (this._current) {
      this._entries.get(this._current)?.g.attr('tabindex', -1).classed('pfd-focus', false);
      this._current = null;
    }
    const svgNode = this._svg?.node() as SVGSVGElement | null;
    svgNode?.focus?.();
    // Leave the application region entirely so AT returns to browse mode and the
    // next Tab follows normal document order.
    svgNode?.blur?.();
  }
}
