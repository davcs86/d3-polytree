import { Viewer } from '@d3-polytree/viewer';
import { loadModel } from '@d3-polytree/core';
import { SequentialIdGenerator, type IdGenerator } from '@d3-polytree/canvas';
import { installDom, uninstallDom } from './dom';

export type { IdGenerator } from '@d3-polytree/canvas';
export { SequentialIdGenerator, IdsIdGenerator } from '@d3-polytree/canvas';

/** Options for {@link renderToSvg}. */
export interface RenderToSvgOptions {
  /**
   * The id generator to render with. Defaults to a fresh
   * {@link SequentialIdGenerator} — deterministic, reproducible output. Pass an
   * `IdsIdGenerator` to opt back into random ids.
   */
  idGenerator?: IdGenerator;
}

/** Reserve every author-set id before boot so generation can never collide. */
function preclaimIds(definitions: { get(name: string): unknown }, gen: IdGenerator): void {
  for (const prop of ['node', 'link', 'label', 'zone']) {
    const collection = (definitions.get(prop) ?? []) as Array<{ id?: unknown }>;
    for (const el of collection) {
      if (typeof el.id === 'string' && el.id) {
        gen.claim(el.id);
      }
    }
  }
}

// Renders share one `globalThis`, so calls must not overlap. This promise chain
// serializes them: each render awaits the previous before installing the DOM.
let chain: Promise<unknown> = Promise.resolve();

/**
 * Render a `.pfdn` document to a standalone SVG string in Node, without a real
 * browser.
 *
 * Hosts a read-only {@link Viewer} against a jsdom DOM, wired to a deterministic
 * id generator (so the output is reproducible — the basis for golden-file tests
 * and thumbnails), and returns its exported SVG. Serial-only: concurrent calls
 * queue. SVG only; jsdom's geometry is degenerate (zero-box `getBBox`, identity
 * transform — intentional engine shims), so the output is reproducible but
 * geometrically flat.
 */
export function renderToSvg(xml: string, options: RenderToSvgOptions = {}): Promise<string> {
  const run = chain.then(() => render(xml, options));
  // keep the chain alive even if this render rejects, so later calls still run
  chain = run.catch(() => undefined);
  return run;
}

async function render(xml: string, options: RenderToSvgOptions): Promise<string> {
  const gen = options.idGenerator ?? new SequentialIdGenerator();
  const added = installDom();
  try {
    // parse #1: pre-claim the author-set ids (importDiagram re-parses to boot)
    const host = await loadModel(xml);
    preclaimIds(host.definitions as unknown as { get(name: string): unknown }, gen);

    const viewer = new Viewer({
      container: document.body,
      modules: [{ idGenerator: ['value', gen] }]
    });
    try {
      await viewer.importDiagram(xml); // parse #2: boot + render
      return viewer.exportSVG();
    } finally {
      viewer.destroy();
    }
  } finally {
    uninstallDom(added);
  }
}
