import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas } from '@d3-polytree/canvas';
import { DomNotifications } from './DomNotifications';

function setup() {
  const bus = new EventEmitter<DiagramEventMap>();
  const canvas = new Canvas({ container: document.body }, bus);
  const notifications = new DomNotifications(canvas);
  return { canvas, notifications };
}

describe('@d3-polytree/interactive-viewer DomNotifications', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a transient toast for a plain notification', () => {
    const { canvas, notifications } = setup();
    notifications.success({ title: 'Success', text: 'Diagram saved' });
    const toast = canvas.getContainer().querySelector('.pfdjs-toast.pfdjs-toast-success');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Diagram saved');
  });

  it('shows a confirm dialog and resolves true when confirmed', () => {
    const { canvas, notifications } = setup();
    const cb = vi.fn();
    notifications.warning({ title: 'Are you sure?', text: 'This clears everything' }, cb);

    const dialog = canvas.getContainer().querySelector('.pfdjs-dialog');
    expect(dialog).not.toBeNull();
    expect(cb).not.toHaveBeenCalled(); // not resolved until the user acts

    (canvas.getContainer().querySelector('.pfdjs-dialog-ok') as HTMLButtonElement).click();
    expect(cb).toHaveBeenCalledWith(true);
    // dialog is dismissed after a choice
    expect(canvas.getContainer().querySelector('.pfdjs-dialog')).toBeNull();
  });

  it('resolves false when the confirm dialog is cancelled', () => {
    const { canvas, notifications } = setup();
    const cb = vi.fn();
    notifications.warning({ title: 'Are you sure?' }, cb);

    (canvas.getContainer().querySelector('.pfdjs-dialog-cancel') as HTMLButtonElement).click();
    expect(cb).toHaveBeenCalledWith(false);
  });
});

describe('DomNotifications teardown + keyboard scope', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function setupWithBus() {
    const bus = new EventEmitter<DiagramEventMap>();
    const canvas = new Canvas({ container: document.body }, bus);
    const notifications = new DomNotifications(canvas, bus);
    return { bus, canvas, notifications };
  }

  it('never listens on document: a page-wide Enter does not confirm', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const { canvas, notifications } = setupWithBus();
    const cb = vi.fn();
    notifications.warning({ title: 'Are you sure?' }, cb);
    expect(add.mock.calls.map((c) => c[0])).not.toContain('keydown');

    const hostInput = document.createElement('input');
    document.body.appendChild(hostInput);
    hostInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(cb).not.toHaveBeenCalled();

    // Enter inside the dialog (not on a button) still confirms; Escape cancels
    const dialog = canvas.getContainer().querySelector('.pfdjs-dialog') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(cb).toHaveBeenCalledWith(true);
    add.mockRestore();
  });

  it('Enter on the focused Cancel button does not confirm', () => {
    const { canvas, notifications } = setupWithBus();
    const cb = vi.fn();
    notifications.warning({ title: 'Are you sure?' }, cb);
    const cancel = canvas.getContainer().querySelector('.pfdjs-dialog-cancel') as HTMLElement;
    cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(cb).not.toHaveBeenCalledWith(true);
  });

  it('on d3canvas.destroy cancels open confirmations and stops toast timers', () => {
    vi.useFakeTimers();
    try {
      const { bus, notifications } = setupWithBus();
      const cb = vi.fn();
      notifications.warning({ title: 'Are you sure?' }, cb);
      // timers not owned by the notifications (jsdom's focus handling)
      const baseline = vi.getTimerCount();
      notifications.info({ text: 'hello' });
      expect(vi.getTimerCount()).toBe(baseline + 1); // the toast's auto-dismiss
      bus.emit('d3canvas.destroy');
      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith(false);
      expect(vi.getTimerCount()).toBe(baseline);
    } finally {
      vi.useRealTimers();
    }
  });
});
