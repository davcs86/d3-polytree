import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas } from '@d3-polytree/canvas';
import { LocalStorage, readSavedDiagram, type StorageHost } from './localStorage';
import { Upload, type UploadHost } from './upload';
import type { NotificationService } from './notifications';

const noopNotifications = {
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  notify: vi.fn()
} satisfies NotificationService;

describe('@d3-polytree/core LocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('saves the exported diagram and notifies success', () => {
    const host: StorageHost = { exportDiagram: () => '<pfdn:diagram/>', importDiagram: vi.fn() };
    const ls = new LocalStorage(host, noopNotifications);

    ls.save();

    expect(window.localStorage.getItem('diagram')).toBe('<pfdn:diagram/>');
    expect(noopNotifications.success).toHaveBeenCalled();
  });

  it('loads the stored diagram, falling back to the initial one', () => {
    const importDiagram = vi.fn().mockResolvedValue(undefined);
    const host: StorageHost = {
      exportDiagram: () => '',
      importDiagram,
      initialDiagram: '<pfdn:diagram initial="1"/>'
    };
    const ls = new LocalStorage(host, noopNotifications);

    // nothing stored → uses the fallback
    ls.loadSaved();
    expect(importDiagram).toHaveBeenLastCalledWith('<pfdn:diagram initial="1"/>');

    // stored value wins
    window.localStorage.setItem('diagram', '<pfdn:diagram stored="1"/>');
    ls.loadSaved();
    expect(importDiagram).toHaveBeenLastCalledWith('<pfdn:diagram stored="1"/>');
  });

  it('emits document.saved only when the write succeeds', () => {
    const bus = new EventEmitter<DiagramEventMap>();
    const saved = vi.fn();
    bus.on('document.saved', saved);
    const host: StorageHost = { exportDiagram: () => '<pfdn:diagram/>', importDiagram: vi.fn() };
    const ls = new LocalStorage(host, noopNotifications, bus);

    ls.save();
    expect(saved).toHaveBeenCalledTimes(1);
    expect(readSavedDiagram()).toBe('<pfdn:diagram/>');

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      ls.save();
    } finally {
      setItem.mockRestore();
    }
    expect(saved).toHaveBeenCalledTimes(1); // no save point for a failed write
    expect(noopNotifications.error).toHaveBeenCalled();
    expect(noopNotifications.success).toHaveBeenCalledTimes(1);
  });

  it('restore() imports the stored diagram and resolves true', async () => {
    window.localStorage.setItem('diagram', '<pfdn:diagram stored="1"/>');
    const importDiagram = vi.fn().mockResolvedValue(undefined);
    const ls = new LocalStorage({ exportDiagram: () => '', importDiagram }, noopNotifications);

    await expect(ls.restore()).resolves.toBe(true);
    expect(importDiagram).toHaveBeenCalledWith('<pfdn:diagram stored="1"/>');
  });

  it('restore() notifies and resolves false when nothing is stored', async () => {
    const importDiagram = vi.fn();
    const ls = new LocalStorage(
      { exportDiagram: () => '', importDiagram, initialDiagram: '<pfdn:diagram/>' },
      noopNotifications
    );

    await expect(ls.restore()).resolves.toBe(false);
    expect(importDiagram).not.toHaveBeenCalled(); // never falls back to the initial
    expect(noopNotifications.info).toHaveBeenCalled();
  });

  it('restore() notifies and resolves false when the stored document is invalid', async () => {
    window.localStorage.setItem('diagram', 'not xml');
    const importDiagram = vi.fn().mockRejectedValue(new Error('unparsable'));
    const ls = new LocalStorage({ exportDiagram: () => '', importDiagram }, noopNotifications);

    await expect(ls.restore()).resolves.toBe(false);
    expect(noopNotifications.error).toHaveBeenCalled();
  });
});

describe('@d3-polytree/core Upload', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('inserts a hidden file input and opens it on demand', () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter<DiagramEventMap>());
    const host: UploadHost = { importDiagram: vi.fn() };
    const upload = new Upload(canvas, host);

    const input = canvas.getContainer().querySelector('input[type=file]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    upload.openDialog();
    expect(click).toHaveBeenCalled();
  });

  it('imports the chosen file contents', async () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter<DiagramEventMap>());
    const importDiagram = vi.fn().mockResolvedValue(undefined);
    new Upload(canvas, { importDiagram });

    const input = canvas.getContainer().querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['<pfdn:diagram uploaded="1"/>'], 'd.pfdn', { type: 'application/xml' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    // FileReader is async; wait a tick
    await vi.waitFor(() =>
      expect(importDiagram).toHaveBeenCalledWith('<pfdn:diagram uploaded="1"/>')
    );
  });

  it('notifies (and keeps the current diagram) when the chosen file fails to import', async () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter<DiagramEventMap>());
    const importDiagram = vi.fn().mockRejectedValue(new Error('not xml'));
    const notifications = { error: vi.fn() };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    new Upload(canvas, { importDiagram }, notifications as never);

    const input = canvas.getContainer().querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['garbage'], 'd.pfdn', { type: 'application/xml' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect(notifications.error).toHaveBeenCalledOnce());
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
