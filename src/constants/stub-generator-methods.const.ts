import { StubGenerator } from '../interfaces';

export const STUB_GENERATOR_METHODS: (keyof StubGenerator)[] = [
  'generateBoolean',
  'generateDate',
  'generateUuid',
  'generateString',
  'generateNumber',
  'generateEnum',
];
