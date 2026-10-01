import { describe, it, expect, beforeEach } from 'vitest';
import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap, LocalStorage } from '@d3-polytree/core';
import { Editor } from './index';

/**
 * Save / restore / save-point (feature-gap P0 "Save has no restore", P1 "dirty
 * flag never resets on save") end-to-end through the real Editor.
 */
describe('@d3-polytree/editor save, restore and save point', () => {
  let editor: Editor;

  beforeEach(async () => {
    window.localStorage.clear();
    document.body.innerHTML = '';
    editor = new Editor({ container: document.body });
    await editor.createDiagram();
  });

  it('palette Save marks the document clean; a later edit is dirty again', () => {
    const dirty: boolean[] = [];
    editor.on('document.changed', (p) => dirty.push(p.dirty));

    editor.createNode({ position: { x: 100, y: 100 } });
    expect(editor.isDirty()).toBe(true);

    editor.get<LocalStorage>('localStorage').save();
    expect(editor.isDirty()).toBe(false);
    expect(dirty.at(-1)).toBe(false);

    editor.createNode({ position: { x: 200, y: 100 } });
    expect(dirty.at(-1)).toBe(true);
    editor.undo(); // back to exactly the saved state
    expect(dirty.at(-1)).toBe(false);
  });

  it('markSaved() is the host-side save point', () => {
    editor.createNode();
    editor.markSaved();
    expect(editor.isDirty()).toBe(false);
    expect(editor.canUndo()).toBe(true); // history survives the save
  });

  it('restoreSaved() re-opens the stored diagram', async () => {
    editor.createNode({ position: { x: 300, y: 300 } });
    editor.get<LocalStorage>('localStorage').save();
    const saved = editor.exportDiagram();

    await editor.createDiagram(); // palette New → back to the initial diagram
    expect(editor.exportDiagram()).not.toBe(saved);

    await expect(editor.restoreSaved()).resolves.toBe(true);
    expect(editor.exportDiagram()).toBe(saved);
    expect(editor.isDirty()).toBe(false);
  });

  it('restoreSaved() leaves the current diagram untouched when nothing is stored', async () => {
    const before = editor.exportDiagram();
    await expect(editor.restoreSaved()).resolves.toBe(false);
    expect(editor.exportDiagram()).toBe(before);
  });

  describe('restoreSaved boot option', () => {
    async function bootWith(restoreSaved: boolean): Promise<Editor> {
      document.body.innerHTML = '';
      const e = new Editor({ container: document.body, restoreSaved });
      await e.createDiagram();
      return e;
    }

    it('opens the saved diagram at boot', async () => {
      editor.createNode({ position: { x: 300, y: 300 } });
      editor.get<LocalStorage>('localStorage').save();
      const saved = editor.exportDiagram();
      editor.destroy();

      const restored = await bootWith(true);
      expect(restored.exportDiagram()).toBe(saved);
      // ...but the palette's New (a later createDiagram) still opens the initial one
      await restored.createDiagram();
      expect(restored.exportDiagram()).not.toBe(saved);
    });

    it('falls back to the initial diagram when nothing (or garbage) is stored', async () => {
      const initial = editor.exportDiagram();
      editor.destroy();
      expect((await bootWith(true)).exportDiagram()).toBe(initial);

      window.localStorage.setItem('diagram', 'not a pfdn document');
      expect((await bootWith(true)).exportDiagram()).toBe(initial);
    });

    it('is off by default', async () => {
      editor.createNode({ position: { x: 300, y: 300 } });
      editor.get<LocalStorage>('localStorage').save();
      const saved = editor.exportDiagram();
      editor.destroy();
      expect((await bootWith(false)).exportDiagram()).not.toBe(saved);
    });
  });

  it('a failed localStorage write does not mark the document clean', () => {
    editor.createNode();
    const bus = editor.get<EventEmitter<DiagramEventMap>>('eventBus');
    let saved = 0;
    bus.on('document.saved', () => (saved += 1));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      editor.get<LocalStorage>('localStorage').save();
    } finally {
      Storage.prototype.setItem = original;
    }
    expect(saved).toBe(0);
    expect(editor.isDirty()).toBe(true);
  });
});
