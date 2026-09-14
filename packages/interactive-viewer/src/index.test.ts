import { describe, it, expect } from 'vitest';
import { InteractiveViewer } from './index';
import { Viewer } from '@d3-polytree/viewer';

describe('@d3-polytree/interactive-viewer', () => {
  it('extends the base Viewer', () => {
    expect(new InteractiveViewer()).toBeInstanceOf(Viewer);
  });
});
