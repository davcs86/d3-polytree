// Minimal ambient types for the (untyped) moddle + moddle-xml runtime packages,
// covering only the surface @d3-polytree/pfdn-moddle uses.
declare module 'moddle' {
  export interface ModdleElement {
    $type: string;
    $model: Moddle;
    [key: string]: unknown;
  }
  export class Moddle {
    constructor(packages: unknown, config?: unknown);
    create(descriptor: string, attrs?: Record<string, unknown>): ModdleElement;
    getType(descriptor: string): unknown;
  }
}

declare module 'moddle-xml' {
  import type { Moddle, ModdleElement } from 'moddle';

  export interface ParseResult {
    rootElement: ModdleElement;
    references: unknown[];
    warnings: Error[];
    elementsById: Record<string, ModdleElement>;
  }

  export class Reader {
    constructor(options: Moddle | ({ model: Moddle; lax?: boolean } & Record<string, unknown>));
    handler(typeName: string): unknown;
    fromXML(xml: string, options?: string | Record<string, unknown>): Promise<ParseResult>;
  }

  export class Writer {
    constructor(options?: { format?: boolean; preamble?: boolean } & Record<string, unknown>);
    toXML(element: ModdleElement): string;
  }
}
