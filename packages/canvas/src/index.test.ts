import { describe, it, expect } from 'vitest';
import { PACKAGE_NAME, createSvg } from './index';

describe('@d3-polytree/canvas scaffold', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('@d3-polytree/canvas');
  });

  it('createSvg sets width, height and viewBox', () => {
    const svg = createSvg({ width: 320, height: 200 });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('320');
    expect(svg.getAttribute('viewBox')).toBe('0 0 320 200');
  });
});
