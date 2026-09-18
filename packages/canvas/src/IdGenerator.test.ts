import { describe, it, expect } from 'vitest';
import { IdsIdGenerator, SequentialIdGenerator } from './IdGenerator';
import { ElementRegistry } from './ElementRegistry';
import type { RegisteredElement } from './types';

describe('@d3-polytree/canvas IdsIdGenerator (default, random)', () => {
  it('mints distinct prefixed ids', () => {
    const gen = new IdsIdGenerator();
    const a = gen.nextPrefixed('node_');
    const b = gen.nextPrefixed('node_');
    expect(a).toMatch(/^node_/);
    expect(b).toMatch(/^node_/);
    expect(a).not.toBe(b);
  });
});

describe('@d3-polytree/canvas SequentialIdGenerator (deterministic, collision-safe)', () => {
  it('yields sequential per-prefix ids', () => {
    const gen = new SequentialIdGenerator();
    expect(gen.nextPrefixed('node_')).toBe('node_1');
    expect(gen.nextPrefixed('node_')).toBe('node_2');
    expect(gen.nextPrefixed('label_')).toBe('label_1');
  });

  it('never re-emits a claimed id, and unclaim frees it', () => {
    const gen = new SequentialIdGenerator();
    gen.claim('node_2');
    expect(gen.nextPrefixed('node_')).toBe('node_1');
    expect(gen.nextPrefixed('node_')).toBe('node_3'); // skips the claimed node_2
    gen.unclaim('node_5');
    gen.claim('node_5');
    expect(gen.nextPrefixed('node_')).toBe('node_4');
    expect(gen.nextPrefixed('node_')).toBe('node_6'); // skips the claimed node_5
  });

  it('is reproducible: two fresh generators produce the same sequence', () => {
    const a = new SequentialIdGenerator();
    const b = new SequentialIdGenerator();
    const seqA = [a.nextPrefixed('node_'), a.nextPrefixed('node_'), a.nextPrefixed('link_')];
    const seqB = [b.nextPrefixed('node_'), b.nextPrefixed('node_'), b.nextPrefixed('link_')];
    expect(seqA).toEqual(seqB);
  });
});

describe('@d3-polytree/canvas ElementRegistry with an injected generator', () => {
  it('constructs with the default generator (no arg) and mints ids', () => {
    const registry = new ElementRegistry();
    const el = {} as RegisteredElement;
    registry.claimId(el, 'node');
    expect(el.id).toMatch(/^node_/);
  });

  it('uses an injected SequentialIdGenerator for deterministic ids', () => {
    const registry = new ElementRegistry(new SequentialIdGenerator());
    const a = {} as RegisteredElement;
    const b = {} as RegisteredElement;
    registry.claimId(a, 'node');
    registry.claimId(b, 'node');
    expect(a.id).toBe('node_1');
    expect(b.id).toBe('node_2');
  });

  it('preserves and claims a pre-set id so generation skips it', () => {
    const registry = new ElementRegistry(new SequentialIdGenerator());
    const preset = { id: 'node_1' } as RegisteredElement;
    const fresh = {} as RegisteredElement;
    registry.claimId(preset, 'node'); // keeps node_1, claims it
    registry.claimId(fresh, 'node'); // must not re-mint node_1
    expect(preset.id).toBe('node_1');
    expect(fresh.id).toBe('node_2');
  });
});
