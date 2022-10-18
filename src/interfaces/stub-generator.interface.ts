import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';

/**
 * Use this interface if you want to override the behavior of some Generator methods.
 * */
export interface StubGenerator {
  /**
   * Generate a random string (from 3 to 10 words by default).
   * */
  generateString?(column: ColumnMetadataArgs): string;

  /**
   * Generate a random integer (from 0 to 999 by default).
   * Override it if you want to generate a float or a double.
   * */
  generateNumber?(column: ColumnMetadataArgs): number;

  /**
   * Generate date from current timestamp.
   * Override it if you want to change this behavior.
   * */
  generateDate?(column: ColumnMetadataArgs): Date;

  /**
   * Get a random enum value from the default "enum" column property.
   * */
  generateEnum?(column: ColumnMetadataArgs): string | number;

  /**
   * Generate a random UUID.
   * */
  generateUuid?(column: ColumnMetadataArgs): string;

  /**
   * Randomly get true or false.
   * */
  generateBoolean?(column: ColumnMetadataArgs): boolean;
}
