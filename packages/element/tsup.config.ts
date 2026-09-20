import { defineConfig } from 'tsup';

/**
 * Two build passes (mirroring the components):
 *  1. ESM + CJS library bundles with the workspace engine packages kept external
 *     (consumers resolve their own copies); the compiled shadow CSS
 *     (`src/styles.generated.ts`) is bundled in as a string.
 *  2. A self-contained UMD/IIFE bundle with everything inlined — including the
 *     engine — exposing the global `d3PolytreeElement` and self-registering the
 *     `<d3-polytree-editor>` tag for a plain `<script>` drop-in (decision O8).
 */
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: [
      '@d3-polytree/editor',
      '@d3-polytree/interactive-viewer',
      '@d3-polytree/viewer',
      '@d3-polytree/core',
      '@d3-polytree/canvas',
      '@d3-polytree/pfdn-moddle',
      'd3-selection'
    ]
  },
  {
    entry: { element: 'src/index.ts' },
    format: ['iife'],
    globalName: 'd3PolytreeElement',
    outExtension: () => ({ js: '.umd.js' }),
    dts: false,
    clean: false,
    sourcemap: true,
    minify: true,
    noExternal: [/.*/]
  }
]);
