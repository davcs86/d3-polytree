import type { Meta, StoryObj } from '@storybook/html';
import { InteractiveViewer } from '@d3-polytree/interactive-viewer';
import { SAMPLE_DIAGRAM } from './sample';
// Ship the panel styling compiled from each package (decision: dart-sass CSS).
import '@d3-polytree/side-tabs/style.css';
import '@d3-polytree/search-panel/style.css';

function mount(render: (host: HTMLElement) => Promise<void>): HTMLElement {
  const host = document.createElement('div');
  host.style.position = 'relative';
  host.style.width = '720px';
  host.style.height = '460px';
  host.style.border = '1px solid #dddddd';
  void render(host);
  return host;
}

const meta: Meta = {
  title: 'Components/InteractiveViewer',
  parameters: {
    docs: {
      description: {
        component:
          'The viewer plus interaction: pan/zoom, the background grid, ' +
          'pointer selection/outline, and the side-tabs host with the ' +
          'searchable element index. Scroll to zoom, drag to pan.'
      }
    }
  }
};

export default meta;

/** The interactive viewer over the sample diagram, with the search side-panel mounted. */
export const SampleDiagram: StoryObj = {
  render: () =>
    mount(async (host) => {
      const viewer = new InteractiveViewer({ container: host });
      await viewer.importDiagram(SAMPLE_DIAGRAM);
    })
};
