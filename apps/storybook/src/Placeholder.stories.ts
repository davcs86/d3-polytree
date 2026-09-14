import type { Meta, StoryObj } from '@storybook/html';
import { createSvg } from '@d3-polytree/canvas';

interface CanvasArgs {
  width: number;
  height: number;
}

const meta: Meta<CanvasArgs> = {
  title: 'Scaffold/Canvas',
  argTypes: {
    width: { control: { type: 'number' } },
    height: { control: { type: 'number' } }
  },
  args: { width: 320, height: 200 },
  render: ({ width, height }) => {
    const svg = createSvg({ width, height });
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', '#e8f0fe');
    rect.setAttribute('stroke', '#4c8bf5');
    svg.appendChild(rect);
    return svg;
  }
};

export default meta;

type Story = StoryObj<CanvasArgs>;

export const Default: Story = {};
