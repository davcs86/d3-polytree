import { defineConfig } from 'tsup';

/**
 * Two build passes:
 *  1. The library bundles (ESM + CJS) with the D3 slices and workspace packages
 *     kept external, for consumers who resolve their own peers.
 *  2. A self-contained UMD/IIFE bundle with everything — D3 and the workspace
 *     engine — inlined, exposing the global `d3PolytreeInteractiveViewer` for a
 *     plain `<script>` drop-in (decision O8). A catch-all `noExternal` regex
 *     forces esbuild to inline every import; `clean` is left to the first pass
 *     so this one does not wipe the freshly emitted `.d.ts`/library artifacts.
 */
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: [
      '@d3-polytree/viewer',
      '@d3-polytree/core',
      '@d3-polytree/canvas',
      '@d3-polytree/pfdn-moddle',
      'd3-selection'
    ]
  },
  {
    entry: { 'interactive-viewer': 'src/index.ts' },
    format: ['iife'],
    globalName: 'd3PolytreeInteractiveViewer',
    outExtension: () => ({ js: '.umd.js' }),
    dts: false,
    clean: false,
    sourcemap: true,
    minify: true,
    noExternal: [/.*/]
  }
]);
