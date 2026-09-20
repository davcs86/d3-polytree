import { defineConfig } from 'tsup';

/**
 * ESM + CJS + d.ts only — no UMD. React and the workspace engine are kept
 * external (React is a peer the consumer provides; a UMD React build needs React
 * as an external global and is materially more fragile — skipped by design).
 */
export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@d3-polytree/editor',
    '@d3-polytree/viewer',
    '@d3-polytree/core',
    '@d3-polytree/canvas',
    '@d3-polytree/pfdn-moddle',
    'd3-selection'
  ]
});
