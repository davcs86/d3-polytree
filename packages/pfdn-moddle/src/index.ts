import pfdnPackage from './pfdn.json';
import { PfdnModdle } from './PfdnModdle';

export { PfdnModdle };
export type { FromXmlOptions, ParseResult } from './PfdnModdle';

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
