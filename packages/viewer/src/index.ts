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
  createModelModule,
  emptyModel,
  loadModel,
  labelsModule,
  zonesModule,
  linksModule,
  nodesModule,
  type DiagramModule,
  type ModelHost
} from '@d3-polytree/core';

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
  }

  private _boot(host: ModelHost): void {
    if (this._diagram) {
      this.destroy();
    }
    this._host = host;
    this._diagram = new Diagram({
      container: this.options.container,
      modules: [...this.getModules(), createModelModule(host)]
    });
  }
}

export default Viewer;
