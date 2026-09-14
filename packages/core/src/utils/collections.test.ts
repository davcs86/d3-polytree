import { describe, it, expect } from 'vitest';
import { add, remove, indexOf } from './collections';

describe('collections', () => {
  it('adds to the end and avoids duplicates', () => {
    const c: string[] = [];
    add(c, 'a');
    add(c, 'b');
    add(c, 'a'); // duplicate, no-op
    expect(c).toEqual(['a', 'b']);
  });

  it('inserts at an index and moves existing elements', () => {
    const c = ['a', 'b', 'c'];
    add(c, 'c', 0); // move c to front
    expect(c).toEqual(['c', 'a', 'b']);
  });

  it('removes and reports the previous index', () => {
    const c = ['a', 'b', 'c'];
    expect(remove(c, 'b')).toBe(1);
    expect(c).toEqual(['a', 'c']);
    expect(remove(c, 'x')).toBe(-1);
  });

  it('is fail-safe on missing args', () => {
    expect(indexOf(undefined, 'a')).toBe(-1);
    expect(remove(['a'], undefined)).toBe(-1);
    expect(indexOf(['a', 'b'], 'b')).toBe(1);
  });
});
