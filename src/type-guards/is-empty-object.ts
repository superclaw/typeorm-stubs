import { isObject } from './is-object';
import { isFunction } from './is-function';

export function isEmptyObject(val: unknown): val is {} {
  if (!isObject(val) || !isFunction(val)) return false;
  return Object.keys(val).length === 0;
}
