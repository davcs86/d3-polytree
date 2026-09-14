/**
 * A palette tool: a stateful, activatable palette action (e.g. the link tool),
 * as opposed to a one-shot click handler. Ported from `core-v2beta`'s
 * `paletteProvider/handlers/ITool`.
 */
export interface Tool {
  active?: boolean;
  activate(): void;
  deactivate(): void;
}
