/** A moddle model element as read/written by the properties panel. */
export interface Definition {
  id?: string;
  label?: Definition;
  $instanceOf(type: string): boolean;
  get(property: string): unknown;
  [key: string]: unknown;
}

/** `definition.$instanceOf(elementType)` — ported from `utils/modelUtils`. */
export function is(definition: Definition, elementType: string): boolean {
  return definition.$instanceOf(elementType);
}

/** Read a dotted property path (`label.text`) by plain property access. */
export function deepGet(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]),
      obj
    );
}

/** Write a dotted property path, creating intermediate objects as needed. */
export function deepSet(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

/** Trailing-nothing leading-edge? No — trailing debounce, like lodash's default. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Title-case a token (`lineColor` → `Line Color`, `aws-ec2` → `Aws Ec 2`). */
export function startCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Whether a string is a `#rrggbb` colour (accepted by `<input type=color>`). */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
