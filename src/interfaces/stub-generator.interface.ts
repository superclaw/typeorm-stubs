import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';

export interface StubGenerator {
  generateString?(column: ColumnMetadataArgs): string;
  generateNumber?(column: ColumnMetadataArgs): number;
  generateDate?(column: ColumnMetadataArgs): Date;
  generateEnum?(column: ColumnMetadataArgs): string | number;
  generateUuid?(column: ColumnMetadataArgs): string;
  generateBoolean?(column: ColumnMetadataArgs): boolean;
}
