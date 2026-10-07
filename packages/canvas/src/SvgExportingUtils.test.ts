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

describe('getSvgString transient attribute', () => {
  const NS = 'http://www.w3.org/2000/svg';
  const build = (marked: boolean) => {
    const svg = document.createElementNS(NS, 'svg');
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'element');
    if (marked) g.setAttribute('data-pfd-transient', 'culled');
    svg.appendChild(g);
    return { svg, g };
  };

  it('strips data-pfd-transient from the serialized clone and keeps it on the live node', () => {
    const { svg, g } = build(true);
    expect(getSvgString(svg)).not.toContain('data-pfd-transient');
    expect(g.getAttribute('data-pfd-transient')).toBe('culled');
  });

  it('still inlines a stylesheet rule that mentions the attribute (documented leak, inert after strip)', () => {
    const style = document.createElement('style');
    style.textContent = '.pfdjs-container .element[data-pfd-transient] > rect{display:none}';
    document.head.appendChild(style);
    try {
      const { svg } = build(true);
      document.body.appendChild(svg);
      expect(getSvgString(svg)).toContain('data-pfd-transient]');
    } finally {
      style.remove();
    }
  });

  it('exports an unmarked tree identically to a marked one', () => {
    expect(getSvgString(build(true).svg)).toBe(getSvgString(build(false).svg));
  });
});
