import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { CommandStack } from './CommandStack';
import type { CommandContext, CommandHandler } from './CommandHandler';

/** A trivial model the fake handlers mutate, so undo/redo are observable. */
interface Model {
  value: number;
}

/** `add`: execute += amount (captured), revert -= amount. */
function addHandler(model: Model): CommandHandler {
  return {
    execute(ctx: CommandContext) {
      ctx.applied = ctx.amount; // capture what we did onto the memento
      model.value += ctx.amount as number;
    },
    revert(ctx: CommandContext) {
      model.value -= ctx.applied as number;
    }
  };
}

describe('@d3-polytree/core CommandStack', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let stack: CommandStack;
  let model: Model;

  beforeEach(() => {
    bus = new EventEmitter<DiagramEventMap>();
    stack = new CommandStack(bus);
    model = { value: 0 };
    stack.registerHandler('add', addHandler(model));
    bus.emit('d3canvas.init'); // enable the latch for these cases
  });

  it('is disabled until d3canvas.init — canUndo() is false on a fresh boot', () => {
    const b2 = new EventEmitter<DiagramEventMap>();
    const s2 = new CommandStack(b2);
    const m2: Model = { value: 0 };
    s2.registerHandler('add', addHandler(m2));
    s2.execute('add', { amount: 5 });
    expect(m2.value).toBe(5); // mutation applied
    expect(s2.canUndo()).toBe(false); // but nothing recorded pre-init
    b2.emit('d3canvas.init');
    expect(s2.canUndo()).toBe(false); // still nothing — the pre-init execute was not recorded
  });

  it('executes, then undo reverts and redo re-applies', () => {
    stack.execute('add', { amount: 3 });
    expect(model.value).toBe(3);
    expect(stack.canUndo()).toBe(true);
    stack.undo();
    expect(model.value).toBe(0);
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(true);
    stack.redo();
    expect(model.value).toBe(3);
  });

  it('collapses a nested (preExecute) sub-command into ONE stack entry', () => {
    // `pair` adds `amount` and, in preExecute, dispatches a joining `add` of 10.
    stack.registerHandler('pair', {
      preExecute() {
        stack.execute('add', { amount: 10 });
      },
      execute(ctx: CommandContext) {
        ctx.applied = ctx.amount;
        model.value += ctx.amount as number;
      },
      revert(ctx: CommandContext) {
        model.value -= ctx.applied as number;
      }
    });
    stack.execute('pair', { amount: 1 });
    expect(model.value).toBe(11);
    stack.undo(); // one undo reverts both
    expect(model.value).toBe(0);
    expect(stack.canUndo()).toBe(false);
  });

  it('truncates the redo tail when a new command is executed after undo', () => {
    stack.execute('add', { amount: 1 });
    stack.execute('add', { amount: 2 });
    stack.undo(); // undo the +2
    expect(stack.canRedo()).toBe(true);
    stack.execute('add', { amount: 100 }); // new branch
    expect(stack.canRedo()).toBe(false); // redo tail gone
    expect(model.value).toBe(101);
  });

  it('best-effort reverts a throwing execute mid-transaction and records nothing', () => {
    stack.registerHandler('boom', {
      execute() {
        throw new Error('execute failed');
      },
      revert() {
        /* never reached */
      }
    });
    // A transaction whose second command throws: the first must be rolled back.
    stack.registerHandler('outer', {
      preExecute() {
        stack.execute('add', { amount: 7 });
      },
      execute() {
        stack.execute('boom', {});
      },
      revert() {
        /* n/a */
      }
    });
    expect(() => stack.execute('outer', {})).toThrow('execute failed');
    expect(model.value).toBe(0); // the +7 was unwound
    expect(stack.canUndo()).toBe(false); // nothing recorded
  });

  it('quarantines the stack and emits document.inconsistent when a revert throws', () => {
    const inconsistent = vi.fn();
    bus.on('document.inconsistent', inconsistent);
    stack.registerHandler('badRevert', {
      execute(ctx: CommandContext) {
        ctx.applied = 1;
        model.value += 1;
      },
      revert() {
        throw new Error('revert failed');
      }
    });
    stack.execute('add', { amount: 5 });
    stack.execute('badRevert', {});
    expect(model.value).toBe(6);
    expect(() => stack.undo()).toThrow(/document may be inconsistent/);
    expect(inconsistent).toHaveBeenCalledOnce();
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
  });

  it('quarantines on d3canvas.destroy', () => {
    stack.execute('add', { amount: 1 });
    expect(stack.canUndo()).toBe(true);
    bus.emit('d3canvas.destroy');
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
  });

  it('emits commandStack.changed on execute/undo/redo', () => {
    const changed = vi.fn();
    bus.on('commandStack.changed', changed);
    stack.execute('add', { amount: 1 });
    stack.undo();
    stack.redo();
    expect(changed).toHaveBeenCalledTimes(3);
  });
});

/**
 * A mergeable handler (mirrors editor `element.updateProperties`, C15): the
 * memento carries `before`/`after`; execute sets the model to `after`, revert
 * restores `before`, and `merge` folds the newer `after` into the surviving
 * memento while keeping its earliest `before`.
 */
function setHandler(model: Model): CommandHandler {
  return {
    execute(ctx: CommandContext) {
      model.value = ctx.after as number;
    },
    revert(ctx: CommandContext) {
      model.value = ctx.before as number;
    },
    merge(prev: CommandContext, next: CommandContext) {
      prev.after = next.after;
      return true;
    }
  };
}

describe('@d3-polytree/core CommandStack — coalescing (C15)', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let stack: CommandStack;
  let model: Model;

  beforeEach(() => {
    bus = new EventEmitter<DiagramEventMap>();
    stack = new CommandStack(bus);
    model = { value: 0 };
    stack.registerHandler('set', setHandler(model));
    stack.registerHandler('add', addHandler(model));
    bus.emit('d3canvas.init');
  });

  it('collapses a same-key burst into ONE undo entry restoring the pre-burst value', () => {
    stack.execute('set', { before: 0, after: 1 }, 'k');
    stack.execute('set', { before: 1, after: 2 }, 'k');
    stack.execute('set', { before: 2, after: 3 }, 'k');
    expect(model.value).toBe(3);
    stack.undo(); // one undo spans the whole burst
    expect(model.value).toBe(0);
    expect(stack.canUndo()).toBe(false);
  });

  it('does not merge into an entry left behind by an undo (redo-tail resets the burst)', () => {
    stack.execute('set', { before: 0, after: 1 }, 'k');
    stack.execute('set', { before: 1, after: 2 }, 'k'); // merged → one entry, model 2
    stack.undo(); // model 0, redo tail now holds the merged entry
    expect(stack.canRedo()).toBe(true);
    stack.execute('set', { before: 0, after: 9 }, 'k'); // must NOT merge behind
    expect(model.value).toBe(9);
    expect(stack.canRedo()).toBe(false); // redo tail truncated
    stack.undo();
    expect(model.value).toBe(0);
  });

  it('starts a new entry when the merge key differs (X→Y→X = three entries)', () => {
    stack.execute('set', { before: 0, after: 1 }, 'x');
    stack.execute('set', { before: 1, after: 2 }, 'y');
    stack.execute('set', { before: 2, after: 3 }, 'x');
    expect(model.value).toBe(3);
    stack.undo();
    stack.undo();
    stack.undo();
    expect(model.value).toBe(0);
    expect(stack.canUndo()).toBe(false);
  });

  it('breaks the burst when a non-mergeable command runs mid-stream', () => {
    stack.execute('set', { before: 0, after: 1 }, 'k');
    stack.execute('add', { amount: 5 }); // 2-arg, no key → clears the burst
    stack.execute('set', { before: 6, after: 7 }, 'k'); // same key, but chain broken
    expect(model.value).toBe(7);
    stack.undo();
    expect(model.value).toBe(6); // set back to its before
    stack.undo();
    expect(model.value).toBe(1); // add undone
    stack.undo();
    expect(model.value).toBe(0); // first set undone → three entries
  });

  it('never merges two-argument (keyless) executes', () => {
    stack.execute('set', { before: 0, after: 1 });
    stack.execute('set', { before: 1, after: 2 });
    stack.undo();
    expect(model.value).toBe(1);
    stack.undo();
    expect(model.value).toBe(0);
  });

  it('falls back to a push when the handler has no merge hook', () => {
    const m2: Model = { value: 0 };
    stack.registerHandler('nomerge', {
      execute: (ctx: CommandContext) => {
        m2.value = ctx.after as number;
      },
      revert: (ctx: CommandContext) => {
        m2.value = ctx.before as number;
      }
    });
    stack.execute('nomerge', { before: 0, after: 1 }, 'k');
    stack.execute('nomerge', { before: 1, after: 2 }, 'k'); // same key, no merge hook
    stack.undo();
    expect(m2.value).toBe(1);
    stack.undo();
    expect(m2.value).toBe(0); // two entries
  });

  it('quarantines a coalesced entry whose revert throws', () => {
    const inconsistent = vi.fn();
    bus.on('document.inconsistent', inconsistent);
    stack.registerHandler('setBad', {
      execute: (ctx: CommandContext) => {
        model.value = ctx.after as number;
      },
      revert: () => {
        throw new Error('revert failed');
      },
      merge: (prev: CommandContext, next: CommandContext) => {
        prev.after = next.after;
        return true;
      }
    });
    stack.execute('setBad', { before: 0, after: 1 }, 'k');
    stack.execute('setBad', { before: 1, after: 2 }, 'k'); // merged
    expect(() => stack.undo()).toThrow(/document may be inconsistent/);
    expect(inconsistent).toHaveBeenCalledOnce();
    expect(stack.canUndo()).toBe(false);
  });

  it('emits commandStack.changed and keeps document dirty on a coalesce', () => {
    const changed = vi.fn();
    const doc = vi.fn();
    bus.on('commandStack.changed', changed);
    bus.on('document.changed', doc);
    stack.execute('set', { before: 0, after: 1 }, 'k');
    stack.execute('set', { before: 1, after: 2 }, 'k'); // coalesce still emits
    expect(changed).toHaveBeenCalledTimes(2);
    expect(doc).toHaveBeenLastCalledWith({ dirty: true });
    expect(stack.canUndo()).toBe(true);
  });
});

describe('DiagramEventMap (compile-time contract, core surface)', () => {
  // Checked by `tsc --noEmit` (tsconfig include: ["src"]). Each @ts-expect-error
  // fails the typecheck before the bus is typed and passes after — a real
  // fail-before/pass-after test for this type-only change.
  it('enforces core event names and payloads at emit sites', () => {
    const bus = new EventEmitter<DiagramEventMap>();

    // correct usages compile
    bus.emit('commandStack.changed', { canUndo: true, canRedo: false });
    bus.emit('document.changed', { dirty: true });
    bus.emit('element.updated', 'id-1', {});

    // @ts-expect-error 'commandStack.changed' requires { canUndo, canRedo }
    bus.emit('commandStack.changed', { canUndo: true });
    // @ts-expect-error 'element.updated' first arg is the id string
    bus.emit('element.updated', 123, {});
    // @ts-expect-error unknown event names are rejected
    bus.emit('command.stack.changd', {});

    expect(bus).toBeInstanceOf(EventEmitter);
  });
});
