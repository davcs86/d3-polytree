import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';

/** An action bound to a side tab: a click callback, or a map of gesture → callback. */
export type SideTabAction =
  | ((content: HTMLElement | null) => void)
  | { [gesture: string]: ((content: HTMLElement | null) => void) | undefined };

/** A registered side tab. */
export interface SideTabEntry {
  title?: string;
  iconClassName?: string;
  action: SideTabAction;
}

/**
 * Registry of side-panel tabs. Consumers register tabs (in order or at an
 * index); the {@link SideTabs} component renders whatever is registered and
 * re-renders on `sidetab.registered`. Ported from `@d3-polytree/side-tabs`'
 * `lib/SideTabsProvider.js`.
 */
export class SideTabsProvider {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private _registeredSideTabs: SideTabEntry[] = [];

  constructor(eventBus: EventEmitter<DiagramEventMap>) {
    this._eventBus = eventBus;
  }

  registerSideTab(sideTab: SideTabEntry, index?: number): void {
    if (index === undefined) {
      this._registeredSideTabs.push(sideTab);
    } else {
      this._registeredSideTabs.splice(index, 0, sideTab);
    }
    this._eventBus.emit('sidetab.registered', sideTab);
  }

  getSideTabsEntries(): SideTabEntry[] {
    return this._registeredSideTabs;
  }
}
