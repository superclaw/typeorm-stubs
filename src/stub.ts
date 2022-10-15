import { getMetadataArgsStorage } from 'typeorm';
import { Parser } from './parser';
import { Generator } from './generator';
import { StubGenerator, ObjectType } from './interfaces';
import { isFunction, isNotNull } from './type-guards';
import { MAX_ARR_LENGTH, MIN_ARR_LENGTH, STUB_GENERATOR_METHODS } from './constants';
import { getParentClass } from './utils';

export class Stub {
  private readonly parser: Parser;
  private readonly generator: Generator;

  public constructor(generator?: StubGenerator) {
    this.generator = Generator.getInstance();

    if (generator) {
      STUB_GENERATOR_METHODS.forEach((method) => {
        if (isFunction(generator[method])) {
          Reflect.set(this.generator, method, generator[method]);
        }
      });
    }

    this.parser = Parser.getInstance(this.generator);
  }

  public createOne<T extends object>(entity: ObjectType<T>): T {
    const stub = new entity();
    const metadataStorage = getMetadataArgsStorage();
    if (!isNotNull(metadataStorage)) return stub;
    const addedRelations: string[] = [];
    const parent = getParentClass(entity);

    if (parent) {
      this.parser.parseMetadata(stub, parent, metadataStorage, addedRelations);
    }

    this.parser.parseMetadata(stub, entity, metadataStorage, addedRelations);
    return stub;
  }

  public createMany<T extends object>(entity: ObjectType<T>, count?: number): T[] {
    if (!isNotNull(count)) {
      count = this.generator.generateRandomNumber?.(MIN_ARR_LENGTH, MAX_ARR_LENGTH) ?? MIN_ARR_LENGTH;
    }

    return Array(count ?? MIN_ARR_LENGTH)
      .fill('')
      .map(() => this.createOne(entity));
  }
}
