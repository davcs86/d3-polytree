import { describe, it, expect, beforeEach } from 'vitest';
import type { CommandStack } from '@d3-polytree/core';
import { Editor } from './index';

/**
 * The B10 fidelity harness (design-buddy plan Step 3), exercised end-to-end
 * through the real dispatchers: snapshot `toXML`, run a gesture that dispatches
 * command(s), assert the model changed, `undo()`, and assert `toXML` is restored
 * byte-for-byte. Lives in `editor` because it is the only package that assembles
 * the full engine (core cannot import the component it composes).
 */
function assertGestureRoundTrip(editor: Editor, cs: CommandStack, gesture: () => void): void {
  const before = editor.exportDiagram();
  gesture();
  expect(editor.exportDiagram()).not.toBe(before); // the gesture mutated the model
  cs.undo();
  expect(editor.exportDiagram()).toBe(before); // execute → revert is byte-identical
}

interface Def {
  id: string;
}
interface AppendHandler {
  append(parameters?: { position?: { x: number; y: number } }): Def;
}
interface SelectionService {
  select(element: unknown, definition: Def, event: { ctrlKey?: boolean }): void;
}
interface Registry {
  get(id: string): unknown;
}

describe('@d3-polytree/editor command round-trips', () => {
  let editor: Editor;
  let cs: CommandStack;

  beforeEach(() => {
    document.body.innerHTML = '';
    editor = new Editor({ container: document.body });
    editor.createEmpty();
    cs = editor.get<CommandStack>('commandStack');
  });

  it('boots with an empty, non-dirty undo stack (boot latch)', () => {
    expect(cs.canUndo()).toBe(false);
    expect(cs.canRedo()).toBe(false);
  });

  it('element.create (palette add-node) round-trips through undo', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    assertGestureRoundTrip(editor, cs, () => addNode.append({ position: { x: 10, y: 20 } }));
    expect(cs.canRedo()).toBe(true); // undo left a redo entry
  });

  it('creating a node via the palette makes canUndo() true, and redo re-adds it', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    addNode.append({ position: { x: 5, y: 5 } });
    expect(cs.canUndo()).toBe(true);

    const withNode = editor.exportDiagram();
    cs.undo();
    const empty = editor.exportDiagram();
    expect(empty).not.toBe(withNode);

    cs.redo();
    expect(editor.exportDiagram()).toBe(withNode); // redo restores the created node + label
  });

  it('removes both the node and its associated label on undo', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    addNode.append({ position: { x: 0, y: 0 } });
    const defs = editor.getHost()!.definitions as { node?: unknown[]; label?: unknown[] };
    expect((defs.node ?? []).length).toBe(1);
    expect((defs.label ?? []).length).toBe(1);

    cs.undo();
    expect((defs.node ?? []).length).toBe(0);
    expect((defs.label ?? []).length).toBe(0);
  });

  it('element.delete (deleteSelected) round-trips through undo', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    const node = addNode.append({ position: { x: 0, y: 0 } });
    const afterCreate = editor.exportDiagram();

    editor.select(node);
    assertGestureRoundTrip(editor, cs, () => editor.deleteSelected());
    expect(editor.exportDiagram()).toBe(afterCreate); // delete undone; create remains
  });

  it('a multi-select delete is a SINGLE undo entry restoring the whole selection', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    const n1 = addNode.append({ position: { x: 0, y: 0 } });
    const n2 = addNode.append({ position: { x: 60, y: 60 } });
    const before = editor.exportDiagram();

    const selection = editor.get<SelectionService>('selection');
    const registry = editor.get<Registry>('drawingRegistry');
    selection.select(registry.get(n1.id), n1, {});
    selection.select(registry.get(n2.id), n2, { ctrlKey: true });

    editor.deleteSelected();
    expect(editor.exportDiagram()).not.toBe(before);

    cs.undo(); // ONE undo restores BOTH nodes (one transaction)
    expect(editor.exportDiagram()).toBe(before);
  });
});
