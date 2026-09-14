import { describe, it, expect } from 'vitest';
import { ElementRegistry } from './ElementRegistry';

describe('ElementRegistry', () => {
  it('claimId assigns a prefixed id and registers the element', () => {
    const reg = new ElementRegistry();
    const el: { id?: string; label: string } = { label: 'a' };
    reg.claimId(el, 'node');
    expect(el.id).toMatch(/^node_/);
    expect(reg.get(el.id as string)).toBe(el);
  });

  it('keeps an explicit id via claim and lists all elements', () => {
    const reg = new ElementRegistry();
    const el = { id: 'x1' };
    reg.claim('x1', el);
    expect(reg.get('x1')).toBe(el);
    expect(reg.getAll()).toEqual({ x1: el });
  });

  it('returns false for unknown ids and after removal', () => {
    const reg = new ElementRegistry();
    const el = { id: 'x1' };
    reg.claim('x1', el);
    reg.removeElement(el);
    expect(reg.get('x1')).toBe(false);
    expect(reg.get('nope')).toBe(false);
  });
});
