import {
  loadState,
  saveState,
  mergeLocalStorage,
  pruneFalseyKeys,
} from './helpers';

describe('loadState and saveState', () => {
  it('saves and retrieves localStorage values', () => {
    expect(loadState()).toEqual({});
    const localStorageValues = {
      textLabels: false,
      theme: 'light',
      tag: { enabled: 'medium' },
    };
    saveState(localStorageValues);
    expect(loadState()).toEqual(localStorageValues);
  });
});

describe('mergeLocalStorage', () => {
  it('overrides state values with localstorage values if provided', () => {
    const localStorageValues = {
      textLabels: false,
      theme: 'light',
      tag: { enabled: 'medium' },
    };
    saveState(localStorageValues);
    expect(
      mergeLocalStorage({
        textLabels: true,
        theme: 'dark',
        tag: { enabled: 'large' },
      })
    ).toMatchObject(localStorageValues);
    window.localStorage.clear();
  });

  it('does not add values if localStorage keys do not match state values', () => {
    const extraValues = {
      additional: 1,
      props: '2',
    };
    expect(mergeLocalStorage(extraValues)).toMatchObject(extraValues);
  });

  it('deep-merges nested objects', () => {
    saveState({ foo: { bar: 1, baz: 2 } });
    expect(
      mergeLocalStorage({ quz: 'quux', foo: { bar: 30, foo: 'foo' } })
    ).toMatchObject({ quz: 'quux', foo: { bar: 1, baz: 2, foo: 'foo' } });
  });
});

describe('pruneFalseyKeys', () => {
  it('removes only falsey keys from an object', () => {
    expect(pruneFalseyKeys({})).toEqual({});
    expect(pruneFalseyKeys({ foo: true, bar: false })).toEqual({ foo: true });
    expect(pruneFalseyKeys({ foo: 'hello', bar: undefined })).toEqual({
      foo: 'hello',
    });
    expect(pruneFalseyKeys({ foo: 1, bar: 0 })).toEqual({ foo: 1 });
    expect(pruneFalseyKeys({ foo: Infinity, bar: null })).toEqual({
      foo: Infinity,
    });
  });
});
