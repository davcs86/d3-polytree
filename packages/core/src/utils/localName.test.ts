import { describe, it, expect } from 'vitest';
import { getLocalName } from './localName';

describe('getLocalName', () => {
  it('lower-cases the descriptor local name', () => {
    const el = { $descriptor: { ns: { localName: 'Node' } } };
    expect(getLocalName(el)).toBe('node');
  });
});
