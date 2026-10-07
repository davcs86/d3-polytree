import { Editor } from '@d3-polytree/editor';
import {
  InteractiveViewer,
  searchPanelModule,
  sideTabsModule
} from '@d3-polytree/interactive-viewer';
import type { DiagramModule } from '@d3-polytree/core';
import { deterministicModules } from '../deterministic';
import { LARGE, SMALL, generateFixtureSpec } from './fixture.data';
import { fixtureToXml } from './fixture.xml';
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

/** Story args shared by the culling (small) and perf (large) harnesses. */
export interface HarnessArgs {
  /** The `culling` viewer option; the baseline ("off") arm passes `false`. */
  culling: boolean;
  /** Which component to boot: the read-mostly interactive viewer or the full editor. */
  viewer: 'interactive' | 'editor';
}

export type HarnessKind = 'culling' | 'perf';

type AnyViewer = InteractiveViewer<never> | Editor;

declare global {
  interface Window {
    __polytreeCullingViewer?: AnyViewer;
    __polytreeCullingReady?: Promise<void>;
    __polytreePerfViewer?: AnyViewer;
    __polytreePerfReady?: Promise<void>;
  }
}

/**
 * The folded `searchPanel` re-renders its whole list on every element event
 * (`SearchPanel._render`, O(N² log N) at boot), which makes a ~23k-element fixture
 * unbootable. It is dropped here ONLY so the fixture boots — a recorded non-goal of C10,
 * not a fix. `sideTabs` is kept for the Editor: `PropertiesPanel` injects its
 * `sideTabsProvider`, so removing it would break the Editor's boot.
 */
class FixtureInteractiveViewer extends InteractiveViewer {
  override getModules(): readonly DiagramModule[] {
    return super
      .getModules()
      .filter((m) => m !== (searchPanelModule as unknown) && m !== (sideTabsModule as unknown));
  }
}

class FixtureEditor extends Editor {
  override getModules(): readonly DiagramModule[] {
    return super.getModules().filter((m) => m !== (searchPanelModule as unknown));
  }
}

/** Mount the fixture harness; parks the viewer and its `importDiagram` promise on `window`. */
export function mountFixtureHarness(kind: HarnessKind, args: HarnessArgs): HTMLElement {
  const host = document.createElement('div');
  host.dataset.testid = 'harness-host';
  host.style.cssText = 'position:relative;width:1000px;height:700px;border:1px solid #ccc';
  host.tabIndex = 0;

  // Declared args may arrive as the string form via the URL; coerce defensively because the
  // viewer test is `options.culling !== false`.
  const culling = !(args.culling === false || (args.culling as unknown) === 'false');
  const Ctor = args.viewer === 'editor' ? FixtureEditor : FixtureInteractiveViewer;
  const viewer = new Ctor({
    container: host,
    modules: deterministicModules(),
    culling
  }) as AnyViewer;

  const xml = fixtureToXml(generateFixtureSpec(kind === 'perf' ? LARGE : SMALL));
  const ready = viewer.importDiagram(xml);
  if (kind === 'perf') {
    window.__polytreePerfViewer = viewer;
    window.__polytreePerfReady = ready;
  } else {
    window.__polytreeCullingViewer = viewer;
    window.__polytreeCullingReady = ready;
  }
  return host;
}
