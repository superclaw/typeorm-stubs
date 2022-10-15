export function isConstructor(val: unknown): val is new (...args: unknown[]) => {} {
  if (typeof val !== 'function') {
    return false;
  }

  try {
    Reflect.construct(val, []);
  } catch (err) {
    return false;
  }

  return true;
}
