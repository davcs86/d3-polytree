import { IdsIdGenerator, type IdGenerator } from './IdGenerator';
import type { RegisteredElement } from './types';

/**
 * Tracks diagram elements by id and hands out collision-free ids.
 *
 * Ported from the original `d3-canvas` ElementRegistry: elements are kept in an
 * owned `Map` rather than reaching into the id generator's internals, which
 * makes the store robust and fully typed. The id generator is injected (default
 * {@link IdsIdGenerator} — random, unchanged behavior); SSR/tests supply a
 * deterministic one via the `idGenerator` DI token (last-definition-wins).
 */
export class ElementRegistry {
  static readonly $inject = ['idGenerator'];

  private readonly _elements = new Map<string, RegisteredElement>();

  constructor(private readonly _ids: IdGenerator = new IdsIdGenerator()) {}

  /** Register `element` under an explicit `id`. */
  claim(id: string, element: RegisteredElement): void {
    this._ids.claim(id, element);
    this._elements.set(id, element);
  }

  /** Assign `element` a `prefix_`-scoped id if it has none, then register it. */
  claimId(element: RegisteredElement, prefix: string): void {
    element.id = element.id || this._ids.nextPrefixed(`${prefix}_`, element);
    this._ids.claim(element.id, element);
    this._elements.set(element.id, element);
  }

  /** Release the id held by `element`. */
  unClaim(element: RegisteredElement): void {
    if (element.id) {
      this._ids.unclaim(element.id);
      this._elements.delete(element.id);
    }
  }

  removeElement(element: RegisteredElement): void {
    this.unClaim(element);
  }

  removeElementById(id: string): void {
    this._ids.unclaim(id);
    this._elements.delete(id);
  }

  /** Look up an element by id, or `false` when unknown. */
  get(id: string): RegisteredElement | false {
    return this._elements.get(id) ?? false;
  }

  /** Snapshot of all registered elements keyed by id. */
  getAll(): Record<string, RegisteredElement> {
    return Object.fromEntries(this._elements);
  }
}
