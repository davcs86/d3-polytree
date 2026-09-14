import { describe, it, expect, beforeEach } from 'vitest';
import type EventEmitter from 'eventemitter3';
import { Canvas, ElementRegistry } from '@d3-polytree/canvas';
import { Diagram } from './Diagram';

describe('Diagram', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('bootstraps the core canvas services and config', () => {
    const options = { container: document.body };
    const diagram = new Diagram(options);
    expect(diagram.get('canvas')).toBeInstanceOf(Canvas);
    expect(diagram.get('elementRegistry')).toBeInstanceOf(ElementRegistry);
    expect(diagram.get('config')).toBe(options);
  });

  it('boots extra modules and resolves their services', () => {
    class Foo {}
    const mod = { __init__: ['foo'], foo: ['type', Foo] };
    const diagram = new Diagram({ container: document.body, modules: [mod] });
    expect(diagram.get('foo')).toBeInstanceOf(Foo);
  });

  it('emits canvas.destroy on destroy()', () => {
    const diagram = new Diagram({ container: document.body });
    const bus = diagram.get<EventEmitter>('eventBus');
    let destroyed = false;
    bus.on('canvas.destroy', () => {
      destroyed = true;
    });
    diagram.destroy();
    expect(destroyed).toBe(true);
  });
});
