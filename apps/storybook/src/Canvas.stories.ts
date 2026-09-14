import type { Meta, StoryObj } from '@storybook/html';
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';

interface CanvasArgs {
  width: number;
  height: number;
}

const meta: Meta<CanvasArgs> = {
  title: 'Canvas/Base',
  argTypes: {
    width: { control: { type: 'number' } },
    height: { control: { type: 'number' } }
  },
  args: { width: 400, height: 300 },
  render: ({ width, height }) => {
    const host = document.createElement('div');
    host.style.position = 'relative';
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;

    const bus = new EventEmitter();
    const canvas = new Canvas({ container: host, width, height }, bus);
    canvas
      .getRootLayer()
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#e8f0fe')
      .attr('stroke', '#4c8bf5');
    bus.emit('d3canvas.init');

    return host;
  }
};

export default meta;

export const Default: StoryObj<CanvasArgs> = {};
