/**
 * @d3-polytree/viewer — static polytree viewer.
 *
 * B3 skeleton: wires the core engine modules; rendering (the ported `draw`
 * layer) is filled in by subsequent B3 PRs.
 */
import { coreModules } from '@d3-polytree/core';

export interface ViewerOptions {
  /** Host element the diagram is rendered into. */
  container?: HTMLElement;
}

export class Viewer {
  /** didi modules this viewer boots with. */
  static readonly modules: readonly unknown[] = [...coreModules];

  readonly options: ViewerOptions;

  constructor(options: ViewerOptions = {}) {
    this.options = options;
  }

  /** The modules this instance boots with (overridable by subclasses). */
  getModules(): readonly unknown[] {
    return Viewer.modules;
  }
}

export default Viewer;
