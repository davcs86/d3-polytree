/**
 * @d3-polytree/viewer — static polytree viewer.
 *
 * Composes the ported core engine into a working read-only viewer: it boots the
 * canvas + draw layer against a loaded model and renders the diagram. Pan/zoom
 * and the other interactive features are layered on by `@d3-polytree/interactive-viewer`
 * and `@d3-polytree/editor`.
 */
import {
  Diagram,
  emptyModel,
  loadModel,
  labelsModule,
  zonesModule,
  linksModule,
  nodesModule,
  type DiagramModule,
  type ModelHost
} from '@d3-polytree/core';

type ModelDefinitions = ModelHost['definitions'];
type ModelModdle = ModelHost['moddle'];

/** The minimal canvas surface the viewer uses for SVG export. */
interface CanvasLike {
  getSVGStr(): string;
}

export interface ViewerOptions {
  /** Host element the diagram is rendered into. */
  container?: HTMLElement;
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

  constructor(options: ViewerOptions = {}) {
    this.options = options;
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

  /** Tear down the current diagram. */
  destroy(): void {
    this._diagram?.destroy();
    this._diagram = null;
    this._host = null;
    this.definitions = null;
    this.moddle = null;
  }

  private _boot(host: ModelHost): void {
    if (this._diagram) {
      this.destroy();
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
      modules: [...this.getModules(), { d3polytree: ['value', this] } as DiagramModule]
    });
  }
}

export default Viewer;
