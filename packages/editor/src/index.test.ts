import { describe, it, expect } from 'vitest';
import { Editor } from './index';
import { Viewer } from '@d3-polytree/viewer';

describe('@d3-polytree/editor', () => {
  it('extends the base Viewer', () => {
    expect(new Editor()).toBeInstanceOf(Viewer);
  });
});
