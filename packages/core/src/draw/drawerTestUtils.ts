import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas, ElementRegistry, ElementBuilder } from '@d3-polytree/canvas';
import { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement } from './types';

/** A moddle-like definition: get/set for `status`, plus direct typed props. */
export function makeDef<T extends Record<string, unknown>>(
  id: string,
  props: T
): DiagramElement & T {
  const store = new Map<string, unknown>(Object.entries({ status: 0, ...props }));
  return {
    id,
    get: (name: string) => store.get(name),
    set: (name: string, value: unknown) => {
      store.set(name, value);
    },
    ...props
  } as DiagramElement & T;
}

export function makeServices() {
  const bus = new EventEmitter<DiagramEventMap>();
  const canvas = new Canvas({ container: document.body }, bus);
  const elementRegistry = new ElementRegistry();
  const elementBuilder = new ElementBuilder(elementRegistry);
  const drawingRegistry = new DrawingRegistry();
  return { bus, canvas, elementRegistry, elementBuilder, drawingRegistry } as const;
}
