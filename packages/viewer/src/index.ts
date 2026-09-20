/**
 * @d3-polytree/viewer — static polytree viewer.
 *
 * Composes the ported core engine into a working read-only viewer: it boots the
 * canvas + draw layer against a loaded model and renders the diagram. Pan/zoom
 * and the other interactive features are layered on by `@d3-polytree/interactive-viewer`
 * and `@d3-polytree/editor`.
 */
import type EventEmitter from 'eventemitter3';
import {
  Diagram,
  emptyModel,
  loadModel,
  labelsModule,
  zonesModule,
  linksModule,
  nodesModule,
  type DiagramModule,
  type DiagramEventMap,
  type ModelHost
} from '@d3-polytree/core';

/**
 * The engine events a component subscription survives a diagram reboot for.
 * Scoped to the post-boot events (they fire *after* `new Diagram` builds and the
 * drawers have replayed the initial model), so a subscriber never misses the
 * boot-time `*.created` storm — those fire synchronously during construction,
 * before the re-attach in {@link Viewer._boot}, and are out of scope here.
 */
export type ReboundEvent = 'document.changed' | 'selection.changed' | 'commandStack.changed';

interface HandlerEntry {
  event: ReboundEvent;
  handler: (...args: never[]) => void;
}

type ModelDefinitions = ModelHost['definitions'];
type ModelModdle = ModelHost['moddle'];

/** The minimal canvas surface the viewer uses for SVG export. */
interface CanvasLike {
  getSVGStr(): string;
}

export interface ViewerOptions {
  /** Host element the diagram is rendered into. */
  container?: HTMLElement;
  /**
   * Extra didi modules composed on top of the component's own. They are added
   * *after* {@link Viewer.getModules}, so a token they redefine wins (last
   * definition wins) — the same seam the icon packs use — and any `__init__`
   * they declare runs once the engine boots. Use this to layer in a custom
   * feature, drawer, or service without subclassing.
   */
  modules?: readonly DiagramModule[];
  [key: string]: unknown;
}

export class Viewer {
  /** The draw-layer modules a static viewer boots with. */
  static readonly modules: readonly DiagramModule[] = [
    labelsModule as DiagramModule,
    zonesModule as DiagramModule,
    linksModule as DiagramModule,
    nodesModule as DiagramModule
  ];

  readonly options: ViewerOptions;
  /** The loaded diagram root — exposed so this instance is the `d3polytree` host. */
  definitions: ModelDefinitions | null = null;
  /** The moddle instance backing {@link definitions}. */
  moddle: ModelModdle | null = null;
  private _diagram: Diagram | null = null;
  private _host: ModelHost | null = null;
  /** The currently-bound eventBus (recreated on every boot); held so we can
   * detach from it during teardown without calling `get()` (which throws once
   * `_diagram` is null). */
  private _bus: EventEmitter<DiagramEventMap> | null = null;
  /** Consumer subscriptions, re-attached to each new bus across reboots. */
  private readonly _handlers = new Set<HandlerEntry>();

  constructor(options: ViewerOptions = {}) {
    this.options = options;
  }

  /**
   * Subscribe to a post-boot engine event. Unlike a raw `get('eventBus').on(…)`,
   * a subscription taken here **survives `importDiagram`/`createEmpty` reboots**
   * (which rebuild the injector and mint a fresh eventBus): the component
   * re-attaches every registered handler to the new bus on each boot. This is the
   * seam the custom-element and React adapters (and Track D) bridge through.
   */
  on<K extends ReboundEvent>(event: K, handler: (...args: DiagramEventMap[K]) => void): void {
    const entry: HandlerEntry = {
      event,
      handler: handler as unknown as (...args: never[]) => void
    };
    this._handlers.add(entry);
    this._bus?.on(event, handler as never);
  }

  /** Remove a subscription added with {@link on}. Safe to call after destroy. */
  off<K extends ReboundEvent>(event: K, handler: (...args: DiagramEventMap[K]) => void): void {
    const target = handler as unknown as (...args: never[]) => void;
    for (const entry of this._handlers) {
      if (entry.event === event && entry.handler === target) {
        this._handlers.delete(entry);
        break;
      }
    }
    this._bus?.off(event, handler as never);
  }

  /** The modules this instance boots with (overridable by subclasses). */
  getModules(): readonly DiagramModule[] {
    return Viewer.modules;
  }

  /** Parse a `.pfdn` document and render it. */
  async importDiagram(xml: string): Promise<void> {
    this._boot(await loadModel(xml));
  }

  /** Render a fresh, empty diagram. */
  createEmpty(): void {
    this._boot(emptyModel());
  }

  /** The loaded model host (definitions + moddle), once a diagram is open. */
  getHost(): ModelHost | null {
    return this._host;
  }

  /** Serialize the current diagram to a `.pfdn` XML string. */
  exportDiagram(): string {
    if (!this.moddle || !this.definitions) {
      throw new Error('no diagram loaded');
    }
    return this.moddle.toXML(this.definitions);
  }

  /** The current rendered SVG as a string. */
  exportSVG(): string {
    return this.get<CanvasLike>('canvas').getSVGStr();
  }

  /** Resolve a service from the running engine. */
  get<T>(name: string, strict?: boolean): T {
    if (!this._diagram) {
      throw new Error('no diagram loaded');
    }
    return this._diagram.get<T>(name, strict);
  }

  /** Tear down the current diagram and forget all subscriptions. */
  destroy(): void {
    this._teardown();
    this._handlers.clear();
  }

  /**
   * Destroy the current diagram and detach subscriptions from its (dying) bus,
   * but KEEP the registry so a following boot can re-attach. Used by both
   * {@link destroy} (which then clears the registry) and {@link _boot} (which
   * re-attaches) — routing reboot through this non-virtual method (instead of the
   * virtual `destroy()`) also preserves subclass DOM bindings across a reboot
   * (e.g. the editor's undo/redo keydown listener).
   */
  private _teardown(): void {
    // Destroy the Diagram first (so teardown-observing handlers still fire on the
    // live bus), then detach our handlers from that bus.
    this._diagram?.destroy();
    if (this._bus) {
      for (const { event, handler } of this._handlers) {
        this._bus.off(event, handler as never);
      }
      this._bus = null;
    }
    this._diagram = null;
    this._host = null;
    this.definitions = null;
    this.moddle = null;
  }

  private _boot(host: ModelHost): void {
    if (this._diagram) {
      this._teardown();
    }
    this._host = host;
    this.definitions = host.definitions;
    this.moddle = host.moddle;
    // Register this instance as the `d3polytree` host: didi's property-path
    // resolution then supplies `d3polytree.definitions[.settings…]` and
    // `d3polytree.moddle` to the drawers/modelling, and the IO methods above to
    // the file-ops features.
    this._diagram = new Diagram({
      container: this.options.container,
      // component modules first, then any caller-supplied modules (last wins),
      // then the `d3polytree` host value the drawers/modelling resolve against.
      modules: [
        ...this.getModules(),
        ...(this.options.modules ?? []),
        { d3polytree: ['value', this] } as DiagramModule
      ]
    });
    // Bind the (fresh) eventBus and re-attach every consumer subscription, so an
    // `on(...)` taken before or across a reboot keeps firing. The drawers have
    // already replayed the initial model synchronously inside `new Diagram`, so
    // only post-boot events (ReboundEvent) are re-attached here — by design.
    this._bus = this.get<EventEmitter<DiagramEventMap>>('eventBus');
    for (const { event, handler } of this._handlers) {
      this._bus.on(event, handler as never);
    }
  }
}

export default Viewer;
