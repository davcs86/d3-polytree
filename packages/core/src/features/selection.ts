import type EventEmitter from 'eventemitter3';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

/** A currently-selected element: its drawing and its model definition. */
export interface SelectionEntry {
  element: DrawingSelection;
  definition: ModellingModelElement;
}

/**
 * Tracks the set of selected elements and emits `selection.changed`.
 *
 * Listens for `<class>.click` (from {@link MouseEvents}) to select, and
 * `background.click` to clear. `deleteSelected` clears the selection and emits
 * `<localName>.deleted` for each, which the modelling orchestrator turns into a
 * model delete. Ported from `core-v2beta`'s `features/selection/Selection.js`
 * (object map → typed `Map`).
 */
export class Selection {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter;
  private readonly _currentSelection = new Map<string, SelectionEntry>();

  constructor(eventBus: EventEmitter) {
    this._eventBus = eventBus;
    this._init();
  }

  private _snapshot(): SelectionEntry[] {
    return [...this._currentSelection.values()];
  }

  private _unSelectElement(
    element: DrawingSelection,
    definition: ModellingModelElement,
    emitChange?: boolean
  ): void {
    const prevSelection = this._snapshot();
    this._currentSelection.delete(definition.id as string);
    element.classed('selected', false);
    if (emitChange) {
      this._eventBus.emit('selection.changed', prevSelection, this._snapshot());
    }
  }

  private _selectElement(
    element: DrawingSelection,
    definition: ModellingModelElement,
    event?: { ctrlKey?: boolean }
  ): void {
    if (!event || !event.ctrlKey) {
      // replace the selection with the clicked element
      this._unSelectAllElements(true);
    }
    element.classed('selected', true);
    const prevSelection = this._snapshot();
    this._currentSelection.set(definition.id as string, { element, definition });
    this._eventBus.emit('selection.changed', prevSelection, this._snapshot());
  }

  private _unSelectAllElements(cancelEmitChange?: boolean): void {
    this._snapshot().forEach((v) => {
      this._unSelectElement(v.element, v.definition, !cancelEmitChange);
    });
  }

  deleteSelected(): void {
    const snapshot = this._snapshot();
    if (snapshot.length === 0) {
      return;
    }
    snapshot.forEach((v) => this._unSelectElement(v.element, v.definition));
    // Emit one delete intent for the whole selection; the modelling orchestrator
    // (which owns the command stack) turns it into a single undoable transaction.
    // Decoupled from the stack on purpose: a viewer without modelling simply has
    // no subscriber, so the gesture is inert there (as it was before).
    this._eventBus.emit('elements.delete', snapshot);
  }

  getSelectedElements(): SelectionEntry[] {
    return this._snapshot();
  }

  /** Public entry point to select an element (used by the drag feature). */
  select(
    element: DrawingSelection,
    definition: ModellingModelElement,
    event?: { ctrlKey?: boolean }
  ): void {
    this._selectElement(element, definition, event);
  }

  private _init(): void {
    (['label', 'link', 'node', 'zone'] as const).forEach((cls) => {
      this._eventBus.on(`${cls}.click`, this._selectElement, this);
    });
    this._eventBus.on('background.click', this._unSelectAllElements, this);
  }
}
