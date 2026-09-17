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
  position: { x: number; y: number };
  label?: Def;
  get(name: string): unknown;
  set(name: string, value: unknown): void;
}
interface AppendHandler {
  append(parameters?: { position?: { x: number; y: number } }): Def;
}

/** Build an element.move item (node only) mirroring the drag dispatcher. */
function nodeMove(def: Def, to: { x: number; y: number }) {
  return {
    def,
    className: 'node' as const,
    from: { position: { x: def.position.x, y: def.position.y }, status: Number(def.get('status') ?? 0) },
    to: { position: to, status: 2 }
  };
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

  it('element.resize round-trips through undo', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    const node = addNode.append({ position: { x: 0, y: 0 } }) as unknown as {
      id: string;
      size: number;
      position: { x: number; y: number };
    };
    const before = editor.exportDiagram();

    // Drive the element.resize command as the resize dispatcher does on commit:
    // capture `from` from the model, mutate live, then execute with `from`/`to`.
    const from = { size: Number(node.size), position: { x: node.position.x, y: node.position.y } };
    node.size = 60;
    node.position.y = -35;
    cs.execute('element.resize', {
      def: node,
      className: 'node',
      from,
      to: { size: 60, position: { x: node.position.x, y: -35 } }
    });
    expect(editor.exportDiagram()).not.toBe(before);

    cs.undo();
    expect(editor.exportDiagram()).toBe(before); // size + position restored
  });

  it('element.move restores incident-link waypoints on undo (both endpoints moved)', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    const a = addNode.append({ position: { x: 0, y: 0 } });
    const b = addNode.append({ position: { x: 120, y: 120 } });
    // connect a -> b through the create command, so the link has waypoints
    cs.execute('element.create', { className: 'link', parameters: [a, b] });
    const before = editor.exportDiagram(); // includes the link's waypoints

    // move BOTH endpoints in one batched command (the shared-link fixture)
    assertGestureRoundTrip(editor, cs, () =>
      cs.execute('element.move', {
        items: [nodeMove(a, { x: 40, y: 30 }), nodeMove(b, { x: 220, y: 200 })]
      })
    );
    // waypoints were recomputed from restored positions, byte-identical
    expect(editor.exportDiagram()).toBe(before);
  });

  it('element.move restores a node AND its associated label on undo', () => {
    const addNode = editor.get<AppendHandler>('addNodeHandler');
    const n = addNode.append({ position: { x: 10, y: 10 } });
    const label = n.label!;
    const before = editor.exportDiagram();

    cs.execute('element.move', {
      items: [
        {
          ...nodeMove(n, { x: 90, y: 70 }),
          label: {
            def: label,
            from: {
              position: { x: label.position.x, y: label.position.y },
              status: Number(label.get('status') ?? 0)
            },
            to: { position: { x: 90, y: 110 }, status: 2 }
          }
        }
      ]
    });
    expect(editor.exportDiagram()).not.toBe(before);

    cs.undo();
    expect(editor.exportDiagram()).toBe(before); // node + label position/status restored
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
