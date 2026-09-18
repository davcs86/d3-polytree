import type { Meta, StoryObj } from '@storybook/html';
import type { ModellingModelElement } from '@d3-polytree/core';
import { Editor } from '@d3-polytree/editor';
import { SAMPLE_DIAGRAM } from './sample';
import { deterministicModules } from './deterministic';
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

/**
 * A fixed harness for the Playwright *interaction* net (C8) — not documentation.
 *
 * It boots a real {@link Editor} over the shared deterministic sample and parks
 * the live instance on `window` so the interaction spec can drive the genuine
 * engine (selection → command-stack delete → keyboard undo/redo) in a browser,
 * closing H7's "CI verifies it builds, not that it works" gap. The host div is
 * made focusable (`tabindex`) so `page.keyboard` reaches the editor's
 * container-scoped keydown handler — the real wired shortcut, not a shim.
 */

/** The live editor the interaction spec reaches for. */
declare global {
  interface Window {
    __polytreeEditor?: Editor;
    /** Resolves once `importDiagram` has rendered the initial model. */
    __polytreeReady?: Promise<void>;
    /**
     * Select a node by its model id through the public API — the drag-free
     * selection path, so the command stack stays clean for round-trip assertions
     * (a pointer click currently also commits a zero-delta `element.move`).
     */
    __polytreeSelectNodeById?: (id: string) => boolean;
  }
}

function mount(): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('data-testid', 'editor-host');
  host.style.position = 'relative';
  host.style.width = '820px';
  host.style.height = '520px';
  host.style.border = '1px solid #dddddd';
  // Focusable so the container-scoped keydown handler (Ctrl+Z / Ctrl+Shift+Z)
  // receives real keyboard events dispatched by Playwright.
  host.tabIndex = 0;

  const editor = new Editor({ container: host, modules: deterministicModules() });
  window.__polytreeEditor = editor;
  window.__polytreeReady = editor.importDiagram(SAMPLE_DIAGRAM);
  window.__polytreeSelectNodeById = (id: string): boolean => {
    const nodes = (editor.getHost()?.definitions.node ?? []) as ModellingModelElement[];
    const def = nodes.find((n) => n.id === id);
    if (!def) {
      return false;
    }
    editor.select(def);
    return true;
  };
  return host;
}

const meta: Meta = {
  title: 'Tests/Interaction Harness',
  // Excluded from the docs/autodocs surface — this exists for the e2e net.
  tags: ['!autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Internal fixture for the Playwright interaction net. Boots a live ' +
          'editor over the deterministic sample and exposes it on `window`.'
      }
    }
  }
};

export default meta;

/** The editor harness over the two-node sample, ready for scripted interaction. */
export const EditorHarness: StoryObj = {
  render: () => mount()
};
