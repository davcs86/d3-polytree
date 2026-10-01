import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { NotificationService } from './notifications';

/** The `d3polytree` host surface local storage needs (provided by the viewer). */
export interface StorageHost {
  exportDiagram(): string;
  importDiagram(xml: string): Promise<void>;
  /** Fallback document used when nothing is stored (e.g. the editor's initial). */
  initialDiagram?: string;
}

/** Key the diagram is stored under. */
const STORAGE_KEY = 'diagram';

/**
 * The diagram last saved with {@link LocalStorage.save}, or `null` when nothing
 * is stored (or storage is unavailable). Usable before any engine exists — e.g.
 * to pick the document a component boots with.
 */
export function readSavedDiagram(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the diagram to the browser's `localStorage`.
 *
 * Ported from `core-v2beta`'s `features/localStorage/LocalStorage.js`,
 * modernised off the `local-storage` package onto `window.localStorage`.
 *
 * The source auto-loaded on a `diagram.ready` event using a module-level guard;
 * because loading re-boots the engine (and would re-fire the event), that guard
 * had to be global. Here `loadSaved()` is an explicit operation instead — no
 * hidden global state, no re-boot loop.
 */
export class LocalStorage {
  static readonly $inject = ['d3polytree', 'notifications', 'eventBus'];

  private readonly _host: StorageHost;
  private readonly _notifications: NotificationService;
  private readonly _eventBus?: EventEmitter<DiagramEventMap>;

  constructor(
    host: StorageHost,
    notifications: NotificationService,
    eventBus?: EventEmitter<DiagramEventMap>
  ) {
    this._host = host;
    this._notifications = notifications;
    this._eventBus = eventBus;
  }

  /** Read the stored (or fallback) document and import it. */
  loadSaved(): void {
    const stored = readSavedDiagram() ?? this._host.initialDiagram;
    if (stored) {
      void this._host.importDiagram(stored);
    }
  }

  /**
   * Re-open the diagram last stored with {@link save} (the palette's "Restore
   * saved diagram"). Resolves `true` once it is imported; `false` — with a
   * notification, and the current diagram left untouched — when nothing is
   * stored or the stored document fails to import.
   */
  async restore(): Promise<boolean> {
    const stored = readSavedDiagram();
    if (!stored) {
      this._notifications.info({ title: 'Nothing to restore', text: 'No saved diagram found' });
      return false;
    }
    try {
      await this._host.importDiagram(stored);
      return true;
    } catch {
      this._notifications.error({
        title: 'Error',
        text: 'The saved diagram could not be restored'
      });
      return false;
    }
  }

  /**
   * Serialize the current diagram and store it. On success, emits
   * `document.saved` so the command stack records a clean save point.
   */
  save(): void {
    if (!this._write(this._host.exportDiagram())) {
      return;
    }
    this._eventBus?.emit('document.saved');
    this._notifications.success({ title: 'Success', text: 'Diagram saved' });
  }

  private _write(xml: string): boolean {
    try {
      window.localStorage.setItem(STORAGE_KEY, xml);
      return true;
    } catch {
      this._notifications.error({ title: 'Error', text: 'Could not save the diagram' });
      return false;
    }
  }
}
