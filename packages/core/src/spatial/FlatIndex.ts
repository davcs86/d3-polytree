import type { Bounds, SpatialIndex } from './types';

/**
 * Flat typed-array {@link SpatialIndex}: a linear scan, ascending slot order (deterministic).
 * A removed id's slot is tombstoned and revived in place on re-`upsert`; there is no free-list
 * (design §9: promoted only if the churn measurement fires).
 */
export class FlatIndex implements SpatialIndex {
  private x0 = new Float64Array(64);
  private y0 = new Float64Array(64);
  private x1 = new Float64Array(64);
  private y1 = new Float64Array(64);
  private live = new Uint8Array(64);
  private ids: string[] = [];
  /** Lookup only — never iterated for output (PLAT-06). */
  private slots = new Map<string, number>();

  /** Allocated slot count (live + tombstoned). */
  get capacity(): number {
    return this.ids.length;
  }

  private grow(): void {
    const n = this.x0.length * 2;
    const g = (a: Float64Array) => {
      const b = new Float64Array(n);
      b.set(a);
      return b;
    };
    this.x0 = g(this.x0);
    this.y0 = g(this.y0);
    this.x1 = g(this.x1);
    this.y1 = g(this.y1);
    const l = new Uint8Array(n);
    l.set(this.live);
    this.live = l;
  }

  upsert(id: string, b: Bounds): number {
    let slot = this.slots.get(id);
    if (slot === undefined) {
      slot = this.ids.length;
      if (slot >= this.x0.length) this.grow();
      this.ids.push(id);
      this.slots.set(id, slot);
    }
    this.x0[slot] = b.x0;
    this.y0[slot] = b.y0;
    this.x1[slot] = b.x1;
    this.y1[slot] = b.y1;
    this.live[slot] = 1;
    return slot;
  }

  remove(id: string): void {
    const slot = this.slots.get(id);
    if (slot !== undefined) this.live[slot] = 0;
  }

  scan(rect: Bounds, visit: (slot: number, inside: boolean) => void): void {
    const n = this.ids.length;
    for (let i = 0; i < n; i++) {
      if (!this.live[i]) continue;
      visit(
        i,
        this.x0[i] <= rect.x1 &&
          this.x1[i] >= rect.x0 &&
          this.y0[i] <= rect.y1 &&
          this.y1[i] >= rect.y0
      );
    }
  }
}
