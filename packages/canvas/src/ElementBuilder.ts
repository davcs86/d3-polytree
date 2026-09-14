import type { ElementRegistry } from './ElementRegistry';
import type { RegisteredElement } from './types';

export type ElementBuildFn = (this: unknown, definition: RegisteredElement) => void;

/** Assigns an id to a definition and runs a builder callback for it. */
export class ElementBuilder {
  static readonly $inject = ['elementRegistry'];

  constructor(private readonly _elementRegistry: ElementRegistry) {}

  create(
    definition: RegisteredElement,
    prefix: string,
    builder: ElementBuildFn,
    builderContext?: unknown
  ): void {
    if (prefix !== '') {
      this._elementRegistry.claimId(definition, prefix);
      builder.call(builderContext, definition);
    }
  }
}
