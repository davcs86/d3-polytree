import { defineConfig } from 'tsup';

export default defineConfig({
  // `.` is the model + XML/JSON adapters; `./schema` is the pure generated
  // descriptor tables (moddle-free), consumed by @d3-polytree/diff.
  entry: ['src/index.ts', 'src/schema.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['moddle', 'moddle-xml']
});
