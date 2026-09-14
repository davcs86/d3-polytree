import { describe, it, expect } from 'vitest';
import { Viewer } from './index';

describe('@d3-polytree/viewer', () => {
  it('constructs and exposes core modules', () => {
    const viewer = new Viewer({});
    expect(viewer).toBeInstanceOf(Viewer);
    expect(viewer.getModules().length).toBeGreaterThan(0);
  });
});
