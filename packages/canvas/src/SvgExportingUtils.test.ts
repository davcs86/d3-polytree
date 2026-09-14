import { describe, it, expect } from 'vitest';
import { getSvgString } from './SvgExportingUtils';

describe('getSvgString', () => {
  it('serializes an svg node and normalizes the xlink namespace', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'diagram');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    svg.appendChild(rect);

    const out = getSvgString(svg);
    expect(out).toContain('<svg');
    expect(out).toContain('xmlns:xlink=');
    expect(out).toContain('<rect');
  });
});
