import { camelToSnakeCase, cyrb53 } from './string';

describe('cyrb53(string, seed = 0)', () => {

  it('should return hash code 5211024121371232 with \'Hello world!\'', () => {
    expect(cyrb53('Hello world!')).toBe(5211024121371232);
  });

  it('should return hash code 23061388323667 with \'ScriptGameInstance\'', () => {
    expect(cyrb53('ScriptGameInstance')).toBe(23061388323667);
  });
});

describe('camelToSnakeCase(string)', () => {
  it("should return array_sort_ints with 'ArraySortInts'", () => {
    expect(camelToSnakeCase('ArraySortInts')).toBe('array_sort_ints');
  });

  it("should return is_after with 'IsAfter'", () => {
    expect(camelToSnakeCase('IsAfter')).toBe('is_after');
  });
});
