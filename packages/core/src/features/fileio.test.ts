import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';
import { LocalStorage, type StorageHost } from './localStorage';
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
});

describe('@d3-polytree/core Upload', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('inserts a hidden file input and opens it on demand', () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter());
    const host: UploadHost = { importDiagram: vi.fn() };
    const upload = new Upload(canvas, host);

    const input = canvas.getContainer().querySelector('input[type=file]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    upload.openDialog();
    expect(click).toHaveBeenCalled();
  });

  it('imports the chosen file contents', async () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter());
    const importDiagram = vi.fn().mockResolvedValue(undefined);
    new Upload(canvas, { importDiagram });

    const input = canvas.getContainer().querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['<pfdn:diagram uploaded="1"/>'], 'd.pfdn', { type: 'application/xml' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    // FileReader is async; wait a tick
    await vi.waitFor(() => expect(importDiagram).toHaveBeenCalledWith('<pfdn:diagram uploaded="1"/>'));
  });
});
