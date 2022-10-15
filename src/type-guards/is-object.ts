import { isNotNull } from './is-not-null';

export function isObject(val: unknown): val is Record<string, unknown> {
  return isNotNull(val) && !Array.isArray(val) && typeof val === 'object';
}
