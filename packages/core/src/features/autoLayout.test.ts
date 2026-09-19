import { describe, expect, it, vi } from 'vitest';
import { createSyncLayoutRunner } from '@d3-polytree/layout';
import { AutoLayout } from './autoLayout';
import type { MoveContext } from '../modelling/commands';

interface FakeNode {
  id: string;
  position: { x: number; y: number };
  label?: FakeNode;
  source?: FakeNode;
  target?: FakeNode;
  get(name: string): unknown;
}

function node(
  id: string,
  x: number,
  y: number,
  extra: Partial<FakeNode> = {},
  size = 40
): FakeNode {
  return {
    id,
    position: { x, y },
    get: (name: string) => (name === 'size' ? size : name === 'status' ? 1 : undefined),
    ...extra
  };
}

function link(id: string, source: FakeNode, target: FakeNode): FakeNode {
  return { id, position: { x: 0, y: 0 }, source, target, get: () => 1 };
}

function setup(nodes: FakeNode[], links: FakeNode[]) {
  const execute = vi.fn();
  const commandStack = { execute } as never;
  const known = new Set([...nodes, ...links].map((n) => n.id));
  const drawingRegistry = { get: (id: string) => (known.has(id) ? {} : false) } as never;
  const model = { definitions: { node: nodes, link: links } } as never;
  const auto = new AutoLayout(model, drawingRegistry, commandStack, createSyncLayoutRunner());
  return { auto, execute };
}

describe('AutoLayout', () => {
  it('commits exactly one element.move for the re-laid-out nodes', async () => {
    const a = node('a', 500, 500);
    const b = node('b', 10, 10);
    const { auto, execute } = setup([a, b], [link('ab', a, b)]);

    await auto.apply();

    expect(execute).toHaveBeenCalledTimes(1);
    const [command, context] = execute.mock.calls[0] as [string, MoveContext];
    expect(command).toBe('element.move');
    expect(context.items.length).toBeGreaterThan(0);
    // Every item is a node carrying a from/to placement with rounded coords.
    for (const item of context.items) {
      expect(item.className).toBe('node');
      expect(Number.isInteger(item.to.position.x)).toBe(true);
      expect(Number.isInteger(item.to.position.y)).toBe(true);
    }
  });

  it('moves an associated label in lockstep with its node', async () => {
    const label = node('la', 505, 560);
    const a = node('a', 500, 500, { label });
    const b = node('b', 10, 10);
    const { auto, execute } = setup([a, b, label], [link('ab', a, b)]);

    await auto.apply();

    const context = execute.mock.calls[0][1] as MoveContext;
    const aItem = context.items.find((i) => (i.def as unknown as FakeNode).id === 'a');
    expect(aItem?.label).toBeDefined();
    const dx = aItem!.to.position.x - aItem!.from.position.x;
    const dy = aItem!.to.position.y - aItem!.from.position.y;
    expect(aItem!.label!.to.position.x).toBe(aItem!.label!.from.position.x + dx);
    expect(aItem!.label!.to.position.y).toBe(aItem!.label!.from.position.y + dy);
  });

  it('is a no-op on an empty diagram', async () => {
    const { auto, execute } = setup([], []);
    await auto.apply();
    expect(execute).not.toHaveBeenCalled();
  });

  it('ignores links whose endpoints are missing', async () => {
    const a = node('a', 0, 0);
    const orphan = node('ghost', 0, 0);
    // link references a node not in the diagram's node list
    const { auto, execute } = setup([a], [link('bad', a, orphan)]);
    await auto.apply();
    // single node → nothing to move relative to a one-node layout, but must not throw
    expect(execute.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
