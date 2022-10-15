export type ObjectType<T, P = unknown> = {
  new (...args: P[]): T;
};
