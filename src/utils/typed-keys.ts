export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  const keys: (keyof T)[] = [];

  for (const key in obj) {
    keys.push(key);
  }

  return keys;
}
