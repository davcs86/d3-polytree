import type { Meta, StoryObj } from '@storybook/html';
import type { LayoutDirection } from '@d3-polytree/core';
import { Editor } from '@d3-polytree/editor';
import { LAYOUT_DIAGRAM } from './sample';
import { deterministicModules } from './deterministic';
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

/**
 * The C3 layered auto-layout (the `@d3-polytree/layout` solver, reached here via
 * `@d3-polytree/core` / `editor` — not a direct Storybook dependency) wired into the editor.
 *
 * Each story loads the same deliberately-overlapping DAG and calls
 * `editor.autoLayout({ direction })` on mount — one undoable command that
 * re-places every node into tidy layers (deterministic, so the snapshot is
 * stable). In the running editor the same action is on the palette
 * ("Auto-layout diagram") and undoes in a single Ctrl+Z.
 */
function mount(direction: LayoutDirection): HTMLElement {
  const host = document.createElement('div');
  host.style.position = 'relative';
  host.style.width = '820px';
  host.style.height = '520px';
  host.style.border = '1px solid #dddddd';
  void (async (): Promise<void> => {
    const editor = new Editor({ container: host, modules: deterministicModules() });
    await editor.importDiagram(LAYOUT_DIAGRAM);
    await editor.autoLayout({ direction });
  })();
  return host;
}

const meta: Meta = {
  title: 'Features/Auto-layout',
  parameters: {
    docs: {
      description: {
        component:
          'Layered (Sugiyama) auto-layout: a pure, deterministic solver that ' +
          're-places nodes into layers and commits the result as one undoable ' +
          'move. Shown top-to-bottom and left-to-right.'
      }
    }
  }
};

export default meta;

/** Top-to-bottom layering of the sample DAG. */
export const TopToBottom: StoryObj = { render: () => mount('TB') };

/** Left-to-right layering of the same DAG. */
export const LeftToRight: StoryObj = { render: () => mount('LR') };
