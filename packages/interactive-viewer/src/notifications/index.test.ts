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
