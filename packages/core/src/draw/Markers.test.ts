import { describe, it, expect, beforeEach } from 'vitest';
import { Markers } from './Markers';
import { createDefs } from './Defs';
import { makeServices } from './drawerTestUtils';

describe('Markers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a marker def and returns its id', () => {
    const s = makeServices();
    const markers = new Markers(createDefs(s.canvas));
    const id = markers.getMarker('l1', '#f00', '#00f');
    expect(id).toBe('l1_markerEnd');
    const marker = s.canvas.getSVG().select('#l1_markerEnd');
    expect(marker.empty()).toBe(false);
    expect(marker.attr('stroke')).toBe('#f00');
    expect(marker.select('path').empty()).toBe(false);
  });

  it('reuses and updates an existing marker', () => {
    const s = makeServices();
    const markers = new Markers(createDefs(s.canvas));
    markers.getMarker('l1', '#f00', '#00f');
    markers.getMarker('l1', '#0f0', '#000');
    const found = s.canvas.getSVG().selectAll('#l1_markerEnd');
    expect(found.size()).toBe(1);
    expect(s.canvas.getSVG().select('#l1_markerEnd').attr('stroke')).toBe('#0f0');
  });

  it('is instance-scoped (no shared module-level state)', () => {
    const s1 = makeServices();
    const m1 = new Markers(createDefs(s1.canvas));
    const s2 = makeServices();
    const m2 = new Markers(createDefs(s2.canvas));
    m1.getMarker('l1', '#f00', '#00f');
    m2.getMarker('l1', '#0f0', '#000');
    expect(s2.canvas.getSVG().select('#l1_markerEnd').attr('stroke')).toBe('#0f0');
  });
});
