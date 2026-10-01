import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NotificationService } from '@d3-polytree/core';
import { Editor } from './index';

describe('@d3-polytree/editor lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('history API is safe before a diagram is loaded', () => {
    const editor = new Editor({ container: document.body });
    expect(() => editor.undo()).not.toThrow();
    expect(() => editor.redo()).not.toThrow();
    expect(() => editor.markSaved()).not.toThrow();
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);
    expect(editor.isDirty()).toBe(false);
  });

  it('destroy() leaves no DOM and no document keydown listener behind', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = new Editor({ container: host });
    await editor.createDiagram();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    // an open confirm dialog (the palette's New) is the riskiest case
    const confirmed = vi.fn();
    editor.get<NotificationService>('notifications').warning({ title: 'Sure?' }, confirmed);

    editor.destroy();

    expect(host.innerHTML).toBe('');
    const added = add.mock.calls.filter(([type]) => type === 'keydown').length;
    const removed = remove.mock.calls.filter(([type]) => type === 'keydown').length;
    expect(added - removed).toBe(0);
    expect(confirmed).toHaveBeenCalledWith(false); // settled as cancelled, never confirmed
    add.mockRestore();
    remove.mockRestore();
  });
});
