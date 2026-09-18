/**
 * Minimal ambient typing for the single slice of `jsdom` this package uses.
 *
 * We deliberately do **not** depend on `@types/jsdom`: the renderer touches
 * exactly one class (`JSDOM`) and one property (`.window`), so a hand-scoped
 * declaration is both leaner (no `@types/node`/`@types/tough-cookie` fan-out)
 * and immune to registry availability for a types-only package. If a future
 * change needs more of jsdom's surface, promote this to the real `@types/jsdom`
 * dependency rather than growing this shim.
 */
declare module 'jsdom' {
  export interface ConstructorOptions {
    pretendToBeVisual?: boolean;
    url?: string;
    runScripts?: 'dangerously' | 'outside-only';
  }

  /** The jsdom `window` is a DOM `Window`; we only ever read globals off it. */
  export class JSDOM {
    constructor(html?: string, options?: ConstructorOptions);
    readonly window: Window & typeof globalThis;
  }
}
