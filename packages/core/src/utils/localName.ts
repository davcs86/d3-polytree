/** An object carrying a moddle descriptor (as model elements do). */
export interface Descriptored {
  $descriptor: { ns: { localName: string } };
}

/** The lower-cased local name of a model element's descriptor (e.g. `node`). */
export function getLocalName(element: Descriptored): string {
  return element.$descriptor.ns.localName.toLowerCase();
}
