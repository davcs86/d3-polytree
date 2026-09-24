import { describe, it, expect } from 'vitest';
import type { PfdnDocument } from '@d3-polytree/pfdn-moddle';
import { diff, DiffError, type DiffOp } from './diff';

// Canonical (toJson-shaped) document builders: refs as id strings, defaults omitted.
const dia = (props: Record<string, unknown> = {}): PfdnDocument =>
  ({ $type: 'pfdn:Diagram', id: 'D', ...props }) as unknown as PfdnDocument;
const pos = (x: number, y: number) => ({ $type: 'pfdn:Coordinates', x, y });
const node = (id: string, extra: Record<string, unknown> = {}) => ({
  $type: 'pfdn:Node',
  id,
  ...extra
});
const link = (id: string, extra: Record<string, unknown> = {}) => ({
  $type: 'pfdn:Link',
  id,
  ...extra
});

const only = (ops: DiffOp[], op: string) => ops.filter((o) => o.op === op);

describe('@d3-polytree/diff', () => {
  it('identical documents diff to nothing', () => {
    const a = dia({ node: [node('n1', { position: pos(1, 2), name: 'A' })] });
    expect(diff(a, structuredClone(a))).toEqual([]);
  });

  it('added / removed elements', () => {
    const a = dia({ node: [node('n1')] });
    const b = dia({ node: [node('n1'), node('n2')] });
    expect(diff(a, b)).toEqual([{ op: 'added', kind: 'Node', id: 'n2' }]);
    expect(diff(b, a)).toEqual([{ op: 'removed', kind: 'Node', id: 'n2' }]);
  });

  it('moved — a position change (not also reported as modified)', () => {
    const a = dia({ node: [node('n1', { position: pos(0, 0), name: 'A' })] });
    const b = dia({ node: [node('n1', { position: pos(10, 5), name: 'A' })] });
    const ops = diff(a, b);
    expect(only(ops, 'moved')).toEqual([
      { op: 'moved', kind: 'Node', id: 'n1', from: pos(0, 0), to: pos(10, 5) }
    ]);
    expect(ops.some((o) => o.op === 'modified' && o.field === 'position')).toBe(false);
  });

  it('retyped — Node.type only', () => {
    const a = dia({ node: [node('n1', { type: 'task' })] });
    const b = dia({ node: [node('n1', { type: 'gateway' })] });
    expect(diff(a, b)).toEqual([
      { op: 'retyped', kind: 'Node', id: 'n1', from: 'task', to: 'gateway' }
    ]);
  });

  it('reattached — only the changed Link endpoint appears', () => {
    const a = dia({ link: [link('e1', { source: 'n1', target: 'n2' })] });
    const b = dia({ link: [link('e1', { source: 'n1', target: 'n3' })] });
    expect(only(diff(a, b), 'reattached')).toEqual([
      { op: 'reattached', kind: 'Link', id: 'e1', from: { target: 'n2' }, to: { target: 'n3' } }
    ]);
  });

  it('modified — a scalar and a single-reference leaf', () => {
    const a = dia({ node: [node('n1', { name: 'A', label: 'L1' })] });
    const b = dia({ node: [node('n1', { name: 'B', label: 'L2' })] });
    const mods = only(diff(a, b), 'modified');
    expect(mods).toContainEqual({
      op: 'modified',
      kind: 'Node',
      id: 'n1',
      field: 'name',
      from: 'A',
      to: 'B'
    });
    expect(mods).toContainEqual({
      op: 'modified',
      kind: 'Node',
      id: 'n1',
      field: 'label',
      from: 'L1',
      to: 'L2'
    });
  });

  it('modified — Diagram root scalars (status/name)', () => {
    const a = dia({ name: 'Old', status: 0 });
    const b = dia({ name: 'New', status: 2 });
    const mods = only(diff(a, b), 'modified');
    expect(mods).toContainEqual({
      op: 'modified',
      kind: 'Diagram',
      id: 'D',
      field: 'name',
      from: 'Old',
      to: 'New'
    });
    expect(mods).toContainEqual({
      op: 'modified',
      kind: 'Diagram',
      id: 'D',
      field: 'status',
      from: 0,
      to: 2
    });
  });

  it('modified — a Link pinned toggle', () => {
    const a = dia({ link: [link('e1', { source: 'n1', target: 'n2', pinned: true })] });
    const b = dia({ link: [link('e1', { source: 'n1', target: 'n2' })] });
    expect(only(diff(a, b), 'modified')).toContainEqual({
      op: 'modified',
      kind: 'Link',
      id: 'e1',
      field: 'pinned',
      from: true,
      to: undefined
    });
  });

  it('pinned-link waypoint change is reported; an unpinned one is not', () => {
    const wpA = [pos(0, 0), pos(5, 5)];
    const wpB = [pos(0, 0), pos(9, 9)];
    const pinned = (wp: unknown) =>
      dia({ link: [link('e1', { source: 'n1', target: 'n2', pinned: true, waypoint: wp })] });
    const unpinned = (wp: unknown) =>
      dia({ link: [link('e1', { source: 'n1', target: 'n2', waypoint: wp })] });

    expect(only(diff(pinned(wpA), pinned(wpB)), 'modified')).toContainEqual({
      op: 'modified',
      kind: 'Link',
      id: 'e1',
      field: 'waypoint',
      from: wpA,
      to: wpB
    });
    expect(diff(unpinned(wpA), unpinned(wpB))).toEqual([]); // routing artifact, skipped
  });

  it('NaN coordinates do not produce a phantom moved', () => {
    const a = dia({ node: [node('n1', { position: pos(NaN, 0) })] });
    const b = dia({ node: [node('n1', { position: pos(NaN, 0) })] });
    expect(diff(a, b)).toEqual([]);
  });

  it('is deterministic and order-stable (shuffling b yields identical ops)', () => {
    const a = dia({
      node: [node('a', { name: 'A' }), node('b', { name: 'B' }), node('c', { name: 'C' })]
    });
    const b1 = dia({
      node: [node('a', { name: 'A2' }), node('b', { name: 'B2' }), node('c', { name: 'C2' })]
    });
    const b2 = dia({
      node: [node('c', { name: 'C2' }), node('a', { name: 'A2' }), node('b', { name: 'B2' })]
    });
    const ops = diff(a, b1);
    expect(diff(a, b1)).toEqual(ops); // pure
    expect(diff(a, b2)).toEqual(ops); // array order does not affect output
    expect(ops.map((o) => o.op === 'modified' && o.id)).toEqual(['a', 'b', 'c']); // sorted by id
  });

  it('throws DiffError on a collection member without an id', () => {
    const a = dia({ node: [node('n1')] });
    const b = dia({ node: [{ $type: 'pfdn:Node', name: 'no id' }] });
    expect(() => diff(a, b)).toThrow(DiffError);
  });

  it('throws DiffError on mismatched root ids', () => {
    expect(() => diff(dia({ id: 'X' } as never), dia({ id: 'Y' } as never))).toThrow(DiffError);
  });
});
