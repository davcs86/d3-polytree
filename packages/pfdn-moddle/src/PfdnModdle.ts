import { Moddle } from 'moddle';
import type { ModdleElement } from 'moddle';
import { Reader, Writer } from 'moddle-xml';

/**
 * A PFDN model element. The public shape is defined here (not re-exported from
 * the untyped `moddle` package) so consumers get a self-contained type surface.
 */
export interface ModelElement {
  $type: string;
  id?: string;
  [key: string]: unknown;
}

/** Result of {@link PfdnModdle.fromXML}. */
export interface ParseResult {
  rootElement: ModelElement;
  references: unknown[];
  warnings: Error[];
  elementsById: Record<string, ModelElement>;
}

export interface FromXmlOptions {
  lax?: boolean;
  [key: string]: unknown;
}

/**
 * A {@link Moddle} subclass that reads and writes Process Flow Diagram Notation
 * (`.pfdn`) documents.
 */
export class PfdnModdle extends Moddle {
  /**
   * Instantiate a PFDN model element. Inherited from `Moddle` at runtime;
   * declared here so the public type surface does not depend on `moddle`
   * (which ships no types).
   */
  declare create: (descriptor: string, attrs?: Record<string, unknown>) => ModelElement;

  /**
   * Parse a PFDN XML string into a model tree.
   *
   * @param xml       the document
   * @param typeName  root element type (default `pfdn:Diagram`)
   * @param options   forwarded to the moddle-xml Reader (e.g. `lax`)
   */
  async fromXML(
    xml: string,
    typeName = 'pfdn:Diagram',
    options: FromXmlOptions = {}
  ): Promise<ParseResult> {
    const reader = new Reader({ model: this, lax: true, ...options });
    return reader.fromXML(xml, typeName) as unknown as Promise<ParseResult>;
  }

  /** Serialize a PFDN model tree (typically a `pfdn:Diagram`) to XML. */
  toXML(element: ModelElement, options: Record<string, unknown> = {}): string {
    return new Writer(options).toXML(element as unknown as ModdleElement);
  }
}
