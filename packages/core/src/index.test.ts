import { describe, it, expect } from 'vitest';
import { canvasModule, coreModules, createModel } from './index';

describe('@d3-polytree/core wiring', () => {
  it('composes the canvas module into the core stack', () => {
    expect(coreModules).toContain(canvasModule);
  });

  it('exposes a working PFDN model factory', () => {
    const model = createModel();
    const diagram = model.create('pfdn:Diagram', { id: 'D1' });
    expect(diagram.$type).toBe('pfdn:Diagram');
  });
});
