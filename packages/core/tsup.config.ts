import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@d3-polytree/canvas',
    '@d3-polytree/pfdn-moddle',
    'eventemitter3',
    'd3-selection',
    'd3-zoom',
    'd3-transition',
    'd3-scale',
    'd3-axis',
    'd3-drag',
    'didi'
  ]
});
