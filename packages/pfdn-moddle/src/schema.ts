/**
 * Runtime schema subpath (`@d3-polytree/pfdn-moddle/schema`).
 *
 * Re-exports the generated `SCHEMA`/`CONCRETE_TYPES` descriptor tables and their
 * `PropInfo`/`TypeInfo` types from the pure, dependency-free `pfdn.generated.ts`
 * — so a consumer (e.g. `@d3-polytree/diff`) can drive enumeration/classification
 * off the single generated source of truth WITHOUT pulling `moddle`/`moddle-xml`
 * into its runtime graph (the main `.` entry imports those). The generated file
 * is never hand-edited; this is a thin re-export barrel.
 */
export { SCHEMA, CONCRETE_TYPES } from './pfdn.generated';
export type { PropInfo, TypeInfo } from './pfdn.generated';
