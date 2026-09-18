import { defineConfig } from 'tsup';

export default defineConfig({
  // Two entries: the pure solver (`.`) and the Worker host (`./worker`). Both
  // are dependency-free, so nothing is externalised.
  entry: ['src/index.ts', 'src/worker.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true
});
