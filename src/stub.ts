import { getMetadataArgsStorage } from 'typeorm';
import { Parser } from './parser';
import { Generator } from './generator';
import { StubGenerator, ObjectType, StubOptions } from './interfaces';
import { isFunction, isNotNull, isNumber } from './type-guards';
import { DEFAULT_STUB_OPTIONS, MAX_ARR_LENGTH, MIN_ARR_LENGTH, STUB_GENERATOR_METHODS } from './constants';
import { getParentClass } from './utils';

/**
 * Stub creator.
 * */
export class Stub {
  private readonly parser: Parser;
  private readonly generator: Generator;

  /**
   * If you want to override the behavior of some Generator methods,
   * pass a class that implements the "StubGenerator" interface.
   * */
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

  public createOne<T extends object>(entity: ObjectType<T>, options: StubOptions = DEFAULT_STUB_OPTIONS): T {
    const stub = new entity();
    const metadataStorage = getMetadataArgsStorage();
    if (!isNotNull(metadataStorage)) return stub;
    const addedRelations: string[] = [];
    const parent = getParentClass(entity);

    if (parent) {
      this.parser.parseMetadata(stub, parent, metadataStorage, addedRelations, options);
    }

    this.parser.parseMetadata(stub, entity, metadataStorage, addedRelations, options);
    return stub;
  }

  public createMany<T extends object>(entity: ObjectType<T>, options: StubOptions): T[];
  public createMany<T extends object>(entity: ObjectType<T>, count?: number, options?: StubOptions): T[];
  public createMany<T extends object>(
    entity: ObjectType<T>,
    countOrOptions?: number | StubOptions,
    maybeOptions?: StubOptions,
  ): T[] {
    const count = isNumber(countOrOptions)
      ? countOrOptions
      : this.generator.generateRandomNumber?.(MIN_ARR_LENGTH, MAX_ARR_LENGTH) ?? MIN_ARR_LENGTH;

    const options = isNumber(countOrOptions) ? maybeOptions : countOrOptions;

    return Array(count ?? MIN_ARR_LENGTH)
      .fill('')
      .map(() => this.createOne(entity, options));
  }
}
