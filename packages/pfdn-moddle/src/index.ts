import pfdnPackage from './pfdn.json';
import { PfdnModdle } from './PfdnModdle';

export { PfdnModdle };
export type { FromXmlOptions, ModelElement, ParseResult } from './PfdnModdle';

// JSON adapter + validator (C11) — an additive path over the same moddle model.
export { toJson, fromJson, validate, assertValid, PfdnValidationError } from './json';
export type { Result, ValidationError, ValidatedPfdnDocument } from './json';
export type {
  PfdnDocument,
  PfdnElement,
  PfdnProperty,
  PfdnPropertiesSet,
  PfdnCoordinates,
  PfdnZoom,
  PfdnGrid,
  PfdnSettings,
  PfdnLabel,
  PfdnNode,
  PfdnBorder,
  PfdnZone,
  PfdnLink,
  PfdnDiagram
} from './pfdn.generated';

const packages: Record<string, unknown> = { pfdn: pfdnPackage };

/**
 * Create a {@link PfdnModdle} instance, optionally extended with additional
 * moddle packages.
 */
export function createPfdnModdle(
  additionalPackages: Record<string, unknown> = {},
  options?: Record<string, unknown>
): PfdnModdle {
  return new PfdnModdle({ ...packages, ...additionalPackages }, options);
}

export default createPfdnModdle;
