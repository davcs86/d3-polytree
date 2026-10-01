import { describe, it, expect, beforeEach } from 'vitest';
import type { CommandStack, ModellingModelElement } from '@d3-polytree/core';
import { Editor } from './index';

type Def = ModellingModelElement;

interface DragService {
  captureMoveOrigin(): void;
  applyOffsetToSelected(dx: number, dy: number): void;
  notifyMovedSelected(): void;
}

/** Two nodes (one with a label) and a link — no `status` attribute anywhere. */
const STATUSLESS =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">' +
  '<settings author="A" name="N"><zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid /></settings>' +
  '<node id="node_1" label="label_1"><position x="20" y="100" /></node>' +
  '<node id="node_2"><position x="220" y="100" /></node>' +
  '<link id="link_1" source="node_1" target="node_2" />' +
  '<label id="label_1" fontSize="12" isReadOnly="true"><position x="33" y="140" /><text>Node 1</text></label>' +
  '</pfdn:diagram>';

/** The same diagram, every element explicitly `Persisted` (status="1"). */
const PERSISTED = STATUSLESS.replace(/<(node|link|label) id=/g, '<$1 status="1" id=');

function nodeById(editor: Editor, id: string): Def {
  const defs = editor.definitions as unknown as { node: Def[] };
  return defs.node.find((n) => n.id === id)!;
}

/**
 * The element `status` state machine (core `model/status.ts`) end-to-end: the
 * draw layer never writes status, commands own the transitions with a memento,
 * so `execute → revert` is byte-identical for documents with OR without status.
 */
describe('@d3-polytree/editor status state machine', () => {
  let editor: Editor;
  let cs: CommandStack;

  async function boot(xml: string): Promise<void> {
    document.body.innerHTML = '';
    editor = new Editor({ container: document.body });
    await editor.importDiagram(xml);
    cs = editor.get<CommandStack>('commandStack');
  }

  function dragNode(id: string, dx: number, dy: number): void {
    editor.select(nodeById(editor, id));
    const drag = editor.get<DragService>('drag');
    drag.captureMoveOrigin();
    drag.applyOffsetToSelected(dx, dy);
    drag.notifyMovedSelected();
  }

  describe('status-less document', () => {
    beforeEach(() => boot(STATUSLESS));

    it('round-trips import → export with no status residue', () => {
      expect(editor.exportDiagram()).not.toContain('status=');
    });

    it('a drag move + undo is byte-identical (no status="2" residue)', () => {
      const before = editor.exportDiagram();
      dragNode('node_1', 30, 10);
      expect(editor.exportDiagram()).not.toBe(before);
      expect(editor.exportDiagram()).not.toContain('status=');
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });

    it('a resize + undo is byte-identical', () => {
      const node = nodeById(editor, 'node_2') as Def & { size: number };
      const before = editor.exportDiagram();
      cs.execute('element.resize', {
        def: node,
        className: 'node',
        from: { size: Number(node.size), position: { x: 220, y: 100 } },
        to: { size: 60, position: { x: 220, y: 65 } }
      });
      expect(editor.exportDiagram()).not.toBe(before);
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });

    it('a property edit + undo is byte-identical', () => {
      const node = nodeById(editor, 'node_2');
      const before = editor.exportDiagram();
      const scope = { set: (d: Def, props: Record<string, unknown>) => Object.assign(d, props) };
      cs.execute('element.updateProperties', {
        scope,
        definition: node,
        before: { name: undefined },
        after: { name: 'Pump' }
      });
      expect(editor.exportDiagram()).toContain('name="Pump"');
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });

    it('a delete + undo is byte-identical', () => {
      const before = editor.exportDiagram();
      editor.select(nodeById(editor, 'node_2'));
      editor.deleteSelected();
      expect(editor.exportDiagram()).toContain('status="3"');
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });

    it('auto-layout + undo is byte-identical', async () => {
      const before = editor.exportDiagram();
      await editor.autoLayout();
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });
  });

  describe('persisted document', () => {
    beforeEach(() => boot(PERSISTED));

    it('a move marks Persisted → Dirty, undo restores Persisted, redo re-dirties', () => {
      const before = editor.exportDiagram();
      dragNode('node_2', 15, 0);
      expect(nodeById(editor, 'node_2').get('status')).toBe(2);
      cs.undo();
      expect(nodeById(editor, 'node_2').get('status')).toBe(1);
      expect(editor.exportDiagram()).toBe(before);
      cs.redo();
      expect(nodeById(editor, 'node_2').get('status')).toBe(2);
    });

    it('a resize marks Persisted → Dirty and undo restores it byte-identically', () => {
      const node = nodeById(editor, 'node_2') as Def & { size: number };
      const before = editor.exportDiagram();
      cs.execute('element.resize', {
        def: node,
        className: 'node',
        from: { size: Number(node.size), position: { x: 220, y: 100 } },
        to: { size: 60, position: { x: 220, y: 65 } }
      });
      expect(node.get('status')).toBe(2);
      cs.undo();
      expect(editor.exportDiagram()).toBe(before);
    });

    it('a property edit marks Persisted → Dirty', () => {
      const node = nodeById(editor, 'node_2');
      const scope = { set: (d: Def, props: Record<string, unknown>) => Object.assign(d, props) };
      cs.execute('element.updateProperties', {
        scope,
        definition: node,
        before: { name: undefined },
        after: { name: 'Pump' }
      });
      expect(node.get('status')).toBe(2);
    });
  });

  it('creates new elements as New (status not serialized)', async () => {
    await boot(STATUSLESS);
    const created = editor.createNode({ position: { x: 400, y: 400 } });
    expect(created.get('status')).toBe(0);
    expect(editor.exportDiagram()).not.toContain('status=');
  });

  it('does not redraw soft-deleted elements on reload', async () => {
    await boot(STATUSLESS);
    editor.select(nodeById(editor, 'node_2'));
    editor.deleteSelected();
    const saved = editor.exportDiagram();

    await editor.importDiagram(saved);
    expect(document.querySelectorAll('[element-id="node_2"]').length).toBe(0);
    expect(document.querySelectorAll('[element-id="node_1"]').length).toBe(1);
    // the soft-deleted element stays in the model → byte-identical round-trip
    expect(editor.exportDiagram()).toBe(saved);
  });
});
