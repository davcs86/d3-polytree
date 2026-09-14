import { describe, it, expect, vi } from 'vitest';
import { ElementBuilder } from './ElementBuilder';
import { ElementRegistry } from './ElementRegistry';

describe('ElementBuilder', () => {
  it('claims an id and runs the builder for a non-empty prefix', () => {
    const builder = new ElementBuilder(new ElementRegistry());
    const def: { id?: string } = {};
    const fn = vi.fn();
    builder.create(def, 'node', fn);
    expect(def.id).toMatch(/^node_/);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(def);
  });

  it('does nothing for an empty prefix', () => {
    const builder = new ElementBuilder(new ElementRegistry());
    const def: { id?: string } = {};
    const fn = vi.fn();
    builder.create(def, '', fn);
    expect(def.id).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });
});
