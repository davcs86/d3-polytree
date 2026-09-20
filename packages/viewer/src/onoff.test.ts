import { describe, it, expect, beforeEach, vi } from 'vitest';
import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/core';
import { Viewer } from './index';

/**
 * The C7 stable event surface: a subscription taken via `viewer.on(...)` must
 * survive a diagram reboot (`importDiagram`/`createEmpty` rebuild the injector
 * and mint a fresh eventBus), and `off()`/`destroy()` must be safe.
 */
describe('@d3-polytree/viewer on/off (reboot-surviving)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('re-attaches a subscription to the new bus across a reboot', () => {
    const viewer = new Viewer({ container: document.body });
    viewer.createEmpty();

    const spy = vi.fn();
    viewer.on('document.changed', spy);

    // fires on the current bus
    viewer.get<EventEmitter<DiagramEventMap>>('eventBus').emit('document.changed', { dirty: true });
    expect(spy).toHaveBeenCalledTimes(1);

    // reboot: new injector, new eventBus
    viewer.createEmpty();
    viewer
      .get<EventEmitter<DiagramEventMap>>('eventBus')
      .emit('document.changed', { dirty: false });
    expect(spy).toHaveBeenCalledTimes(2); // subscription survived the reboot
  });

  it('off() detaches and is safe after destroy()', () => {
    const viewer = new Viewer({ container: document.body });
    viewer.createEmpty();
    const spy = vi.fn();
    viewer.on('document.changed', spy);
    viewer.off('document.changed', spy);

    viewer.get<EventEmitter<DiagramEventMap>>('eventBus').emit('document.changed', { dirty: true });
    expect(spy).not.toHaveBeenCalled();

    viewer.destroy();
    expect(() => viewer.off('document.changed', spy)).not.toThrow();
  });
});
