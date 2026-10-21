/** JSON values only: content is data, never a callback or live service. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type ObjectValue = { [key: string]: Json };
export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T
  : T extends readonly (infer U)[] ? readonly DeepReadonly<U>[]
  : T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } : T;

export function isObject(value: unknown): value is ObjectValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function freeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== null && prototype !== Object.prototype) throw new TypeError('Expected plain JSON object');
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol'
    || typeof value === 'bigint' || (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER))) {
    throw new TypeError('Expected finite, safe JSON data');
  }
  return JSON.stringify(value);
}

export function objectAt(value: Json | undefined, path: string): ObjectValue {
  if (!isObject(value)) throw new TypeError(`Expected object at ${path}`);
  return value;
}

export function arrayAt(value: Json | undefined, path: string): Json[] {
  if (!Array.isArray(value)) throw new TypeError(`Expected array at ${path}`);
  return value;
}
