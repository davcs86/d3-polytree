import { describe, it, expect } from 'vitest';
import { DrawingRegistry } from './DrawingRegistry';
import type { DrawingSelection } from './types';

describe('DrawingRegistry', () => {
  it('sets, gets, removes and lists drawings', () => {
    const reg = new DrawingRegistry();
    const a = { id: 'a' } as unknown as DrawingSelection;
    reg.set('a', a);
    expect(reg.get('a')).toBe(a);
    expect(reg.getAll()).toEqual([a]);
    reg.remove('a');
    expect(reg.get('a')).toBe(false);
    expect(reg.getAll()).toEqual([]);
  });
});
