import { JSDOM } from 'jsdom';

/**
 * Install a jsdom DOM onto `globalThis` for the duration of one render.
 *
 * The draw layer reads the **global** `document` / `DOMParser` / `XMLSerializer`
 * (there is no seam to pass a `Document`), so a Node renderer must make those
 * globals available. We copy jsdom `window`'s own-property surface, but
 * **add-only** — skipping any key already present — so JS intrinsics (`Object`,
 * `Array`, …) are never clobbered with jsdom-realm versions (which would break
 * cross-realm `instanceof`). The base render path only truly needs `document`,
 * `DOMParser`, and `XMLSerializer`, none of which exists on Node's `globalThis`,
 * so add-only installs all three.
 *
 * NOTE (design open risk): if a future Node exposes one of those DOM globals as
 * a non-DOM value, add-only would skip jsdom's version. None is a Node global
 * today; revisit with a small force-override set if that changes.
 *
 * @returns the keys added, to be handed back to {@link uninstallDom}.
 */
export function installDom(): string[] {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true
  });
  const g = globalThis as Record<string, unknown>;
  const added: string[] = [];
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in g) {
      continue; // preserve host intrinsics / already-present globals
    }
    const desc = Object.getOwnPropertyDescriptor(window, key);
    if (!desc) {
      continue;
    }
    try {
      Object.defineProperty(g, key, desc);
      added.push(key);
    } catch {
      /* non-configurable engine intrinsic — skip */
    }
  }
  return added;
}

/** Remove exactly the globals {@link installDom} added (each was absent before). */
export function uninstallDom(added: string[]): void {
  const g = globalThis as Record<string, unknown>;
  for (const key of added) {
    try {
      delete g[key];
    } catch {
      /* ignore */
    }
  }
}
