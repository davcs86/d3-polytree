import type { Meta, StoryObj } from '@storybook/html';
import { Viewer } from '@d3-polytree/viewer';
import { SAMPLE_DIAGRAM } from './sample';

/** A sized host the component renders into; the import populates it a tick later. */
function mount(render: (host: HTMLElement) => Promise<void>): HTMLElement {
  const host = document.createElement('div');
  host.style.position = 'relative';
  host.style.width = '640px';
  host.style.height = '420px';
  host.style.border = '1px solid #dddddd';
  void render(host);
  return host;
}

const meta: Meta = {
  title: 'Components/Viewer',
  parameters: {
    docs: {
      description: {
        component:
          'The static, read-only viewer: boots the canvas + draw layer against a ' +
          'loaded `.pfdn` document. No pan/zoom or interaction.'
      }
    }
  }
};

export default meta;

/** Renders the sample two-node, one-link diagram. */
export const SampleDiagram: StoryObj = {
  render: () =>
    mount(async (host) => {
      const viewer = new Viewer({ container: host });
      await viewer.importDiagram(SAMPLE_DIAGRAM);
    })
};
