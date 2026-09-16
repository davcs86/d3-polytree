import type { Meta, StoryObj } from '@storybook/html';
import { Editor } from '@d3-polytree/editor';
import { SAMPLE_DIAGRAM } from './sample';
// Panel styling now ships with the components: side-tabs + search-panel with
// the interactive viewer, properties panel with the editor.
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

function mount(render: (host: HTMLElement) => Promise<void>): HTMLElement {
  const host = document.createElement('div');
  host.style.position = 'relative';
  host.style.width = '820px';
  host.style.height = '520px';
  host.style.border = '1px solid #dddddd';
  void render(host);
  return host;
}

const meta: Meta = {
  title: 'Components/Editor',
  parameters: {
    docs: {
      description: {
        component:
          'The full editor: interaction plus the editing layer (drag, modelling ' +
          'create/save/delete, palette) and the side-tabs, search, and properties ' +
          'panels. Select an element to populate the Properties tab.'
      }
    }
  }
};

export default meta;

/** A fresh editor opened on its built-in initial diagram. */
export const InitialDiagram: StoryObj = {
  render: () =>
    mount(async (host) => {
      const editor = new Editor({ container: host });
      await editor.createDiagram();
    })
};

/** The editor opened on the shared two-node sample. */
export const SampleDiagram: StoryObj = {
  render: () =>
    mount(async (host) => {
      const editor = new Editor({ container: host });
      await editor.importDiagram(SAMPLE_DIAGRAM);
    })
};
