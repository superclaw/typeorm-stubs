import { ObjectType } from '../interfaces';
import { isConstructor, isEmptyObject } from '../type-guards';

export function getParentClass<T extends object>(entity: ObjectType<T>): ObjectType<T> | null {
  const parent = Object.getPrototypeOf(entity);

  if (isConstructor(parent) && !isEmptyObject(parent)) {
    return parent;
  }

  return null;
}
