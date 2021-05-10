import { saveState, mergeLocalStorage } from './helpers';

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
