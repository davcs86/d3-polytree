import { describe, it, expect, beforeEach } from 'vitest';
import { InteractiveViewer } from '@d3-polytree/interactive-viewer';
import { Viewer } from '@d3-polytree/viewer';
import { Editor } from './index';

describe('@d3-polytree/editor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extends the InteractiveViewer with editing modules', () => {
    const editor = new Editor();
    expect(editor).toBeInstanceOf(InteractiveViewer);
    expect(editor.getModules().length).toBeGreaterThan(
      InteractiveViewer.interactionModules.length + Viewer.modules.length
    );
  });

  it('creates a node (with associated label) into the model and the DOM', () => {
    const editor = new Editor({ container: document.body });
    editor.createEmpty();

    const node = editor.createNode({ position: { x: 10, y: 20 } });

    expect(node.$type).toBe('pfdn:Node');
    // rendered
    expect(document.body.querySelector(`[element-id="${node.id}"]`)).not.toBeNull();
    // persisted through the modelling orchestrator (saveToModel)
    const defs = editor.getHost()!.definitions as { node?: unknown[]; label?: unknown[] };
    expect(defs.node).toContain(node);
    // the create flow also minted a read-only associated label
    expect((defs.label ?? []).length).toBe(1);
    expect((node.label as { isReadOnly?: boolean }).isReadOnly).toBe(true);
  });

  it('opens its initial diagram and can save it to localStorage', async () => {
    window.localStorage.clear();
    const editor = new Editor({ container: document.body });
    await editor.createDiagram();

    // the initial document rendered
    expect(document.body.querySelector('[element-id="node_1"]')).not.toBeNull();

    editor.get<{ save(): void }>('localStorage').save();
    expect(window.localStorage.getItem('diagram')).toContain('node_1');
  });

  it('imports a diagram with an empty undo stack (boot render never enters it)', async () => {
    const editor = new Editor({ container: document.body });
    await editor.createDiagram();
    // the boot latch means the initial render recorded nothing
    expect(editor.canUndo()).toBe(false);

    // and a subsequent edit is undoable back to that clean baseline
    const before = editor.exportDiagram();
    editor.createNode({ position: { x: 200, y: 200 } });
    expect(editor.canUndo()).toBe(true);
    editor.undo();
    expect(editor.exportDiagram()).toBe(before);
    expect(editor.canUndo()).toBe(false);
  });

  it('renders the palette toolbar and creates a node from the new-node button', () => {
    const editor = new Editor({ container: document.body });
    editor.createEmpty();

    const button = document.body.querySelector('[data-action="new-node"]');
    expect(document.body.querySelector('.pfdjs-palette')).not.toBeNull();
    expect(button).not.toBeNull();

    const before = document.body.querySelectorAll('.nodeItem').length;
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const after = document.body.querySelectorAll('.nodeItem').length;
    expect(after).toBe(before + 1);
  });

  it('deletes the selected node, removing its drawing', () => {
    const editor = new Editor({ container: document.body });
    editor.createEmpty();
    const node = editor.createNode({ position: { x: 5, y: 5 } });
    const id = node.id as string;
    expect(document.body.querySelector(`[element-id="${id}"]`)).not.toBeNull();

    editor.select(node);
    editor.deleteSelected();

    // the modelling orchestrator's delete reconciled the drawing away
    expect(document.body.querySelector(`[element-id="${id}"]`)).toBeNull();
    expect(node.get('status')).toBe(3);
  });

  it('mounts the properties panel tab alongside the search tab', () => {
    const editor = new Editor({ container: document.body });
    editor.createEmpty();

    const titles = [...document.body.querySelectorAll('.pfdjs-st-tab')].map((t) =>
      t.getAttribute('title')
    );
    expect(titles).toContain('Search element');
    expect(titles).toContain('Properties');
    expect(editor.get('propertiesPanel')).toBeTruthy();
    expect(editor.get('propertiesProvider')).toBeTruthy();
  });
});
