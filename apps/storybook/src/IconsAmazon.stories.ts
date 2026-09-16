import type { Meta, StoryObj } from '@storybook/html';
import type { DiagramModule } from '@d3-polytree/core';
import { Editor } from '@d3-polytree/editor';
import { awsIconsModule } from '@d3-polytree/icons-amazon';
import { AWS_DIAGRAM } from './sample';
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

/**
 * The icon-pack convention in practice: an editor whose module list is extended
 * with `awsIconsModule`. Because the pack's `icons` factory is composed last, it
 * spreads the engine defaults and then its own, so AWS-typed nodes resolve to the
 * pack's SVG symbols while the default fallback stays intact.
 */
class AwsEditor extends Editor {
  getModules(): readonly DiagramModule[] {
    return [...super.getModules(), awsIconsModule as DiagramModule];
  }
}

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
  title: 'Icon packs/Amazon',
  parameters: {
    docs: {
      description: {
        component:
          'Composing `@d3-polytree/icons-amazon` into the editor. The nodes are ' +
          'typed to AWS icon keys (API Gateway → ECS → S3); the pack supplies the ' +
          'matching symbols on top of the engine defaults.'
      }
    }
  }
};

export default meta;

/** An editor with the AWS pack composed, rendering an API Gateway → ECS → S3 topology. */
export const AwsTopology: StoryObj = {
  render: () =>
    mount(async (host) => {
      const editor = new AwsEditor({ container: host });
      await editor.importDiagram(AWS_DIAGRAM);
    })
};
