import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { JoinColumnMetadataArgs } from 'typeorm/metadata-args/JoinColumnMetadataArgs';
import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { isNumber, isConstructor, isFunction, isNotNull, isObject, isString } from './type-guards';
import { Singleton } from './singleton';
import { Generator } from './generator';
import { ColumnValue, ObjectType, StubOptions } from './interfaces';
import { ARRAY_RELATION_TYPE } from './constants';
import { getParentClass } from './utils';

export class Parser extends Singleton {
  public constructor(private readonly generator: Generator) {
    super();
  }

  public parseMetadata<T extends object>(
    stub: T,
    entity: ObjectType<T>,
    metadataStorage: MetadataArgsStorage,
    addedRelations: string[],
    options: StubOptions,
  ): void {
    this.parseColumns(stub, entity, metadataStorage);

    if (options.deep) {
      this.parseRelations(stub, entity, metadataStorage, addedRelations, options);
    }
  }

  private parseColumns<T extends object>(stub: T, entity: ObjectType<T>, metadataStorage: MetadataArgsStorage): void {
    const columns = metadataStorage.filterColumns(entity);

    for (const column of columns) {
      if (Reflect.get(stub, column.propertyName) !== undefined) {
        continue;
      }

      const designType = this.getDesignType(entity.prototype, column.propertyName);

      Reflect.set(stub, column.propertyName, this.getValueByType(column, designType));
    }
  }

  private parseRelations<T extends object>(
    stub: T,
    entity: ObjectType<T>,
    metadataStorage: MetadataArgsStorage,
    addedRelations: string[],
    options: StubOptions,
  ): void {
    const relations = metadataStorage.filterRelations(entity);
    const columns = metadataStorage.filterColumns(entity);
    const parent = getParentClass(entity);

    if (parent) {
      columns.push(...metadataStorage.filterColumns(parent));
    }

    const primaryColumns = columns.filter(({ options }) => options.primary);

    for (const relation of relations) {
      const isArray = ARRAY_RELATION_TYPE.includes(relation.relationType);
      const relationEntity = isFunction(relation.type) ? relation.type() : relation.type;
      const relationName = isFunction(relationEntity) ? relationEntity.name : relationEntity;

      if (
        !isString(relationName) ||
        addedRelations.includes(relationName) ||
        relationName === entity.name ||
        !isConstructor(relationEntity)
      ) {
        continue;
      }

      const addedRelationsWithCurrent = [...addedRelations, entity.name];

      const params = [
        relationEntity,
        metadataStorage,
        addedRelationsWithCurrent,
        entity.name,
        primaryColumns,
        stub,
        options,
      ] as const;

      Reflect.set(
        stub,
        relation.propertyName,
        isArray
          ? Array(this.generator.generateRandomNumber(3, 10))
              .fill('')
              .map(() => this.createRelation(...params))
          : this.createRelation(...params),
      );

      for (const relationArgs of relations) {
        const joinColumns = metadataStorage.filterJoinColumns(entity, relationArgs.propertyName);

        for (let i = 0; i < joinColumns.length; i++) {
          const joinColumnArgs = joinColumns[i];

          if (!joinColumnArgs) {
            continue;
          }

          const column = this.findJoinColumn(joinColumnArgs, columns);

          if (!column) {
            continue;
          }

          const relationConstructor = this.getRelationConstructor(relationArgs);

          if (!relationConstructor) {
            continue;
          }

          const primaryColumns = metadataStorage
            .filterColumns(relationConstructor)
            .filter(({ options }) => options.primary);

          const parent = !isString(relationConstructor) ? getParentClass(relationConstructor) : null;

          if (parent) {
            primaryColumns.push(...metadataStorage.filterColumns(parent).filter(({ options }) => options.primary));
          }

          const primaryColumn = primaryColumns[i];
          const relationObject = Reflect.get(stub, relationArgs.propertyName);

          if (primaryColumn && isObject(relationObject)) {
            Reflect.set(stub, column.propertyName, Reflect.get(relationObject, primaryColumn.propertyName));
          }
        }
      }
    }

    addedRelations.push(entity.name);
  }

  private createRelation<T extends object>(
    constructor: ObjectType<T>,
    metadataStorage: MetadataArgsStorage,
    addedRelations: string[],
    externalEntityName: string,
    externalPrimaryColumns: ColumnMetadataArgs[],
    stub: T,
    options: StubOptions,
  ): T {
    const relation = new constructor();
    const parent = getParentClass(constructor);
    const relationColumns = metadataStorage.filterColumns(constructor);
    const deepRelations = metadataStorage.filterRelations(constructor);
    const parentRelations: RelationMetadataArgs[] = [];

    if (parent) {
      this.parseMetadata(relation, parent, metadataStorage, addedRelations, options);

      relationColumns.push(...metadataStorage.filterColumns(parent));
      parentRelations.push(...metadataStorage.filterRelations(parent));
    }

    this.parseMetadata(relation, constructor, metadataStorage, addedRelations, options);

    if (parent) {
      parentRelations.forEach((relationArgs) => {
        this.parseDeepRelations(
          metadataStorage,
          relation,
          parent,
          relationArgs,
          relationColumns,
          externalEntityName,
          externalPrimaryColumns,
          stub,
        );
      });
    }

    deepRelations.forEach((relationArgs) => {
      this.parseDeepRelations(
        metadataStorage,
        relation,
        constructor,
        relationArgs,
        relationColumns,
        externalEntityName,
        externalPrimaryColumns,
        stub,
      );
    });

    return relation;
  }

  private parseDeepRelations<T extends object>(
    metadataStorage: MetadataArgsStorage,
    relation: T,
    constructor: ObjectType<T>,
    relationArgs: RelationMetadataArgs,
    columns: ColumnMetadataArgs[],
    externalEntityName: string,
    externalPrimaryColumns: ColumnMetadataArgs[],
    stub: T,
  ): void {
    const joinColumns = metadataStorage.filterJoinColumns(constructor, relationArgs.propertyName);

    for (let i = 0; i < joinColumns.length; i++) {
      const joinColumnArgs = joinColumns[i];

      if (!joinColumnArgs) {
        continue;
      }

      const column = this.findJoinColumn(joinColumnArgs, columns);

      if (!column || !this.isJoinColumnTarget(relationArgs, externalEntityName)) {
        continue;
      }

      const primaryColumn = externalPrimaryColumns[i];

      if (!primaryColumn) {
        continue;
      }

      Reflect.set(relation, column.propertyName, Reflect.get(stub, primaryColumn.propertyName));
    }
  }

  private isJoinColumnTarget(relationArgs: RelationMetadataArgs, name: string): boolean {
    if (isString(relationArgs.type)) {
      return relationArgs.type === name;
    }

    if (isConstructor(relationArgs.type) || isObject(relationArgs.type)) {
      return relationArgs.type.name === name;
    }

    if (isFunction(relationArgs.type)) {
      const target = relationArgs.type();
      return isConstructor(target) && target.name === name;
    }

    return false;
  }

  private findJoinColumn(
    joinColumnArgs: JoinColumnMetadataArgs,
    columns: ColumnMetadataArgs[],
  ): ColumnMetadataArgs | undefined {
    return columns.find((column) => {
      if (isNotNull(joinColumnArgs.name)) {
        return joinColumnArgs.name === (column.options.name ?? column.propertyName);
      }

      return joinColumnArgs.propertyName === (column.options.name ?? column.propertyName);
    });
  }

  private getRelationConstructor(relationArgs: RelationMetadataArgs): ObjectType<{}> | string | null {
    if (isString(relationArgs.type) || isConstructor(relationArgs.type)) {
      return relationArgs.type;
    }

    if (isFunction(relationArgs.type)) {
      const constructor = relationArgs.type();
      return isConstructor(constructor) ? constructor : null;
    }

    return null;
  }

  private getDesignType<T extends object>(entity: T, propertyName: string | symbol): Function {
    const designType = Reflect.getMetadata('design:type', entity, propertyName);

    switch (designType) {
      case String:
      case Number:
      case Boolean:
      case Array:
        return designType;
      case Date:
        return (val: unknown) => {
          if (val instanceof Date) return val;
          if (isString(val) || isNumber(val)) return new Date(val);
          return new Date();
        };
      default:
        return (val: unknown) => {
          if (isConstructor(designType)) return this.parseNested(designType);
          if (isObject(val)) return this.parseJson(val);
          return val ?? null;
        };
    }
  }

  private parseJson<T extends object>(obj: T): T {
    const keys = Reflect.ownKeys(obj);
    const newObj: T = { ...obj };

    for (const key of keys) {
      if (!isNotNull(Reflect.get(obj, key))) {
        Reflect.set(newObj, key, null);
        continue;
      }

      const designType = this.getDesignType(obj, key);
      Reflect.set(newObj, key, designType(Reflect.get(obj, key)));
    }

    return newObj;
  }

  private parseNested<T extends object>(constructor: ObjectType<T>): T {
    const val = new constructor();

    Object.keys(val).forEach((key) => {
      const designType = Reflect.getMetadata('design:type', constructor.prototype, key);

      const column: ColumnMetadataArgs = {
        target: constructor,
        propertyName: key,
        mode: 'regular',
        options: {},
      };

      Reflect.set(val, key, this.getValueByDesignType(column, designType));
    });

    return val;
  }

  private getValueByDesignType(column: ColumnMetadataArgs, designType: Function): ColumnValue | ColumnValue[] | {} {
    switch (designType) {
      case String:
        return this.generator.generate(column, 'generateString', designType);
      case Number:
        return this.generator.generate(column, 'generateNumber', designType);
      case Boolean:
        return this.generator.generate(column, 'generateBoolean', designType);
      case Date:
        return this.generator.generate(column, 'generateDate', designType);
      case Array:
        return [];
    }

    if (isConstructor(designType)) return this.parseNested(designType);
    return null;
  }

  private getValueByType(column: ColumnMetadataArgs, designType: Function): ColumnValue | ColumnValue[] {
    switch (column.mode) {
      case 'createDate':
      case 'updateDate':
        return this.generator.generate(column, 'generateDate', designType);
      case 'deleteDate':
        return null;
    }

    switch (column.options.type) {
      case 'uuid':
        return this.generator.generate(column, 'generateUuid', designType);
      case 'int':
      case 'int2':
      case 'int4':
      case 'int8':
      case 'int64':
      case 'integer':
      case 'unsigned big int':
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
      case 'bigint':
      case 'dec':
      case 'decimal':
      case 'smalldecimal':
      case 'fixed':
      case 'numeric':
      case 'number':
      case 'float':
      case 'float4':
      case 'float8':
      case 'double':
      case 'double precision':
      case 'real':
        return this.generator.generate(column, 'generateNumber', designType);
      case 'character varying':
      case 'varying':
      case 'nvarchar':
      case 'national':
      case 'character':
      case 'native':
      case 'varchar':
      case 'char':
      case 'nchar':
      case 'varchar2':
      case 'nvarchar2':
      case 'alphanum':
      case 'shorttext':
      case 'raw':
      case 'binary':
      case 'varbinary':
      case 'string':
      case 'tinytext':
      case 'mediumtext':
      case 'text':
      case 'ntext':
      case 'citext':
      case 'longtext':
        return this.generator.generate(column, 'generateString', designType);
      case 'date':
      case 'datetime':
      case 'datetime2':
      case 'datetimeoffset':
      case 'time':
      case 'time with time zone':
      case 'time without time zone':
      case 'timestamp':
      case 'timestamptz':
      case 'timestamp without time zone':
      case 'timestamp with time zone':
      case 'timestamp with local time zone':
        return this.generator.generate(column, 'generateDate', designType);
      case 'boolean':
      case 'bool':
        return this.generator.generate(column, 'generateBoolean', designType);
      case 'enum':
      case 'simple-enum':
        return this.generator.generate(column, 'generateEnum', designType);
      case 'simple-array':
      case 'array':
        return [];
    }

    switch (designType) {
      case String:
        return this.generator.generate(column, 'generateString', designType);
      case Number:
        return this.generator.generate(column, 'generateNumber', designType);
      case Boolean:
        return this.generator.generate(column, 'generateBoolean', designType);
      case Array:
        return [];
    }

    return designType();
  }
}
