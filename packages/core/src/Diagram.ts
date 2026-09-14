import { Injector, type ModuleDeclaration } from 'didi';
import type EventEmitter from 'eventemitter3';
import { canvasModule } from '@d3-polytree/canvas';

/** A didi module descriptor as consumed by {@link Diagram}. */
export interface DiagramModule {
  __init__?: string[];
  __depends__?: DiagramModule[];
  [name: string]: unknown;
}

export interface DiagramOptions {
  /** Extra modules to bootstrap alongside the core. */
  modules?: DiagramModule[];
  [key: string]: unknown;
}

/**
 * Bootstrap an injector from `bootstrapModules`, eagerly instantiating each
 * module's `__init__` components (depth-first over `__depends__`).
 * (Ported from the diagram-js bootstrap the original was derived from.)
 */
function bootstrap(bootstrapModules: DiagramModule[]): Injector {
  const modules: DiagramModule[] = [];
  const components: string[] = [];

  const visit = (m: DiagramModule): void => {
    if (modules.includes(m)) {
      return;
    }
    (m.__depends__ ?? []).forEach(visit);
    if (modules.includes(m)) {
      return;
    }
    modules.push(m);
    (m.__init__ ?? []).forEach((c) => components.push(c));
  };

  bootstrapModules.forEach(visit);

  const injector = new Injector(modules as unknown as ModuleDeclaration[]);
  components.forEach((c) => injector.get(c));
  return injector;
}

function createInjector(options: DiagramOptions): Injector {
  const configModule: DiagramModule = { config: ['value', options] };
  const modules: DiagramModule[] = [
    configModule,
    canvasModule as unknown as DiagramModule,
    ...(options.modules ?? [])
  ];
  return bootstrap(modules);
}

/**
 * The engine entry point: bootstraps the core (canvas) plus any extra modules
 * into a didi injector and signals readiness via `d3canvas.init`.
 */
export class Diagram {
  readonly injector: Injector;

  constructor(options: DiagramOptions = {}, injector?: Injector) {
    this.injector = injector ?? createInjector(options);
    this.get<EventEmitter>('eventBus').emit('d3canvas.init');
  }

  /** Resolve a service by name. */
  get<T>(name: string, strict?: boolean): T {
    return this.injector.get<T>(name, strict);
  }

  destroy(): void {
    this.get<EventEmitter>('eventBus').emit('d3canvas.destroy');
  }

  clear(): void {
    this.get<EventEmitter>('eventBus').emit('d3canvas.clear');
  }
}
