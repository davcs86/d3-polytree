import { Moddle } from 'moddle';
import type { ModdleElement } from 'moddle';
import { Reader, Writer } from 'moddle-xml';
import type { ParseResult } from 'moddle-xml';

export type { ParseResult };

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
    return reader.fromXML(xml, typeName);
  }

  /** Serialize a PFDN model tree (typically a `pfdn:Diagram`) to XML. */
  toXML(element: ModdleElement, options: Record<string, unknown> = {}): string {
    return new Writer(options).toXML(element);
  }
}
