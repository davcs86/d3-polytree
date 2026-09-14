import { describe, it, expect } from 'vitest';
import { canvasModule, coreModules, createPfdnModdle, emptyModel } from './index';

describe('@d3-polytree/core wiring', () => {
  it('composes the canvas module into the core stack', () => {
    expect(coreModules).toContain(canvasModule);
  });

  it('exposes a working PFDN model factory', () => {
    const model = createPfdnModdle();
    const diagram = model.create('pfdn:Diagram', { id: 'D1' });
    expect(diagram.$type).toBe('pfdn:Diagram');
  });

  it('provides an empty-model helper', () => {
    expect(emptyModel().definitions.$type).toBe('pfdn:Diagram');
  });
});
