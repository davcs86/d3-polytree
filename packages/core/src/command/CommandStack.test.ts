import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
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
  let bus: EventEmitter;
  let stack: CommandStack;
  let model: Model;

  beforeEach(() => {
    bus = new EventEmitter();
    stack = new CommandStack(bus);
    model = { value: 0 };
    stack.registerHandler('add', addHandler(model));
    bus.emit('d3canvas.init'); // enable the latch for these cases
  });

  it('is disabled until d3canvas.init — canUndo() is false on a fresh boot', () => {
    const b2 = new EventEmitter();
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
