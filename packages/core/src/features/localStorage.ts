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
  static readonly $inject = ['d3polytree', 'notifications'];

  private readonly _host: StorageHost;
  private readonly _notifications: NotificationService;

  constructor(host: StorageHost, notifications: NotificationService) {
    this._host = host;
    this._notifications = notifications;
  }

  /** Read the stored (or fallback) document and import it. */
  loadSaved(): void {
    const stored = this._read() ?? this._host.initialDiagram;
    if (stored) {
      void this._host.importDiagram(stored);
    }
  }

  /** Serialize the current diagram and store it. */
  save(): void {
    this._write(this._host.exportDiagram());
    this._notifications.success({ title: 'Success', text: 'Diagram saved' });
  }

  private _read(): string | null {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private _write(xml: string): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, xml);
    } catch {
      this._notifications.error({ title: 'Error', text: 'Could not save the diagram' });
    }
  }
}
