import { ObjectType } from './interfaces';

export abstract class Singleton {
  protected static instance: Singleton;

  public static getInstance<T extends Singleton, P = unknown>(this: ObjectType<T, P>, ...args: P[]): T {
    if (!Reflect.has(this, 'instance')) {
      Reflect.set(this, 'instance', new this(...args));
    }

    return Reflect.get(this, 'instance');
  }
}
