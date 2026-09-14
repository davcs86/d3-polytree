import type { DrawingSelection } from './types';

/** Maps element ids to their rendered `<g>` selections. */
export class DrawingRegistry {
  private readonly _drawings = new Map<string, DrawingSelection>();

  set(id: string, drawing: DrawingSelection): void {
    this._drawings.set(id, drawing);
  }

  remove(id: string): void {
    this._drawings.delete(id);
  }

  get(id: string): DrawingSelection | false {
    return this._drawings.get(id) ?? false;
  }

  getAll(): DrawingSelection[] {
    return [...this._drawings.values()];
  }
}
