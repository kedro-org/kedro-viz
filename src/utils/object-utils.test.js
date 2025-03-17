import { getKeyByValue, getKeysByValue } from './object-utils';

test('return the correct key for the value', () => {
  const mockObject = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
    key4: 'value4',
  };

  const mockValue = 'value3';

  const expected = 'key3';
  const result = getKeyByValue(mockObject, mockValue);

  expect(result).toEqual(expected);
});

test('return the correct keys for the value', () => {
  const mockObject = {
    key1: 'value1',
    key2: 'value1',
    key3: 'value2',
    key4: 'value3',
  };

  const mockValue = 'value1';

  const expected = 'key1,key2';
  const result = getKeysByValue(mockObject, mockValue);

  expect(result).toEqual(expected);
});
