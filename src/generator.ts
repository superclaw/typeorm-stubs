import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { Singleton } from './singleton';
import { ColumnValue, StubGenerator } from './interfaces';
import { isNotNull, isNumber, isObject, isString } from './type-guards';
import { typedKeys } from './utils';
import { ABSTRACT_TEXT, MAX_ARR_LENGTH, MAX_WORDS_COUNT, MIN_ARR_LENGTH, MIN_WORDS_COUNT } from './constants';
import * as crypto from 'crypto';

export class Generator extends Singleton implements StubGenerator {
  public generateDate(_column: ColumnMetadataArgs): Date {
    return new Date();
  }

  public generateEnum(column: ColumnMetadataArgs): string | number {
    const columnEnum = column.options.enum;

    if (!isNotNull(columnEnum)) {
      throw new Error(`Enum for column "${column.propertyName}" was not provided`);
    }

    if (Array.isArray(columnEnum)) {
      const index = this.generateRandomNumber(0, columnEnum.length - 1);
      return columnEnum[index];
    }

    if (isObject(columnEnum)) {
      const keys = typedKeys(columnEnum);
      const index = this.generateRandomNumber(0, keys.length - 1);
      const key = keys[index];
      const val = key ? columnEnum[key] : 0;
      return isString(val) || isNumber(val) ? val : 0;
    }

    return 0;
  }

  public generateNumber(_column: ColumnMetadataArgs): number {
    return this.generateRandomNumber(0, 999);
  }

  public generateString(_column: ColumnMetadataArgs): string {
    const words = ABSTRACT_TEXT.split(' ');

    return (
      [...Array(this.generateRandomNumber(MIN_WORDS_COUNT, MAX_WORDS_COUNT))]
        .map((_, i) => this.getRandomWord(i === 0, words))
        .join(' ')
        .trim() + '.'
    );
  }

  public generateUuid(_column: ColumnMetadataArgs): string {
    return crypto.randomUUID();
  }

  public generateBoolean(_column: ColumnMetadataArgs): boolean {
    const num = this.generateRandomNumber(1, 10);
    return Boolean(num % 2);
  }

  public generateRandomNumber(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min);
  }

  public generate(
    column: ColumnMetadataArgs,
    method: keyof StubGenerator,
    designType: Function,
  ): ColumnValue | ColumnValue[] {
    if (column.options.array || designType === Array) {
      return Array(this.generateRandomNumber(MIN_ARR_LENGTH, MAX_ARR_LENGTH))
        .fill('')
        .map(() => {
          const val = this[method](column);

          if (designType === Array) {
            return val;
          }

          return designType(val);
        });
    }

    const val = this[method](column);

    if (val instanceof Date && designType === String) {
      return val.toISOString();
    }

    return designType(val);
  }

  private getRandomWord(firstLetterToUppercase: boolean, words: string[]): string {
    const word = words[this.generateRandomNumber(0, words.length - 1)] ?? '';
    return firstLetterToUppercase ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }
}
