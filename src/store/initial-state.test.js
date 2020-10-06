import getInitialState, {
  createInitialState,
  mergeLocalStorage,
  preparePipelineState,
  prepareNonPipelineState,
  overideInitialState
} from './initial-state';
import { saveState } from './helpers';
import animals from '../utils/data/animals.mock';

describe('createInitialState', () => {
  it('returns an object', () => {
    expect(createInitialState()).toEqual(expect.any(Object));
  });
});

describe('mergeLocalStorage', () => {
  it('overrides state values with localstorage values if provided', () => {
    const localStorageValues = {
      textLabels: false,
      theme: 'light'
    };
    saveState(localStorageValues);
    expect(
      mergeLocalStorage({
        textLabels: true,
        theme: 'dark'
      })
    ).toMatchObject(localStorageValues);
    window.localStorage.clear();
  });

  it('does not add values if localStorage keys do not match state values', () => {
    const extraValues = {
      additional: 1,
      props: '2'
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

describe('preparePipelineState', () => {});

describe('prepareNonPipelineState', () => {});

describe('overideInitialState', () => {
  const getState = () =>
    Object.assign({}, prepareNonPipelineState(), preparePipelineState(animals));

  it('overrides flags with values from URL', () => {
    // In this case, location.href is not provided
    expect(overideInitialState(getState(), {})).toMatchObject({
      flags: {}
    });
  });

  it('overrides theme with value from prop', () => {
    const props = { theme: 'light' };
    expect(overideInitialState(getState(), props)).toMatchObject(props);
  });

  it('overrides visible with values from prop', () => {
    const props = {
      visible: { miniMap: true, sidebar: false, themeBtn: false }
    };
    expect(overideInitialState(getState(), props)).toMatchObject(props);
  });

  it('uses default pipeline, when loading data synchronously, if stored active pipeline from localStorage is not one of the pipelines in the current list', () => {
    saveState({ pipeline: { active: 'unknown' } });
    expect(overideInitialState(getState(), {})).toMatchObject({
      pipeline: {
        active: animals.selected_pipeline
      }
    });
    window.localStorage.clear();
  });
});

describe('getInitialState', () => {
  const props = { data: animals };

  it('throws an error when data prop is empty', () => {
    expect(() => getInitialState({})).toThrow();
  });

  it('returns an object', () => {
    expect(getInitialState(props)).toEqual(expect.any(Object));
  });

  it('returns full initial state', () => {
    expect(getInitialState(props)).toMatchObject({
      chartSize: {},
      textLabels: true,
      theme: 'dark',
      visible: {
        exportBtn: true,
        labelBtn: true,
        layerBtn: true,
        themeBtn: true
      }
    });
  });

  it('uses prop values instead of defaults if provided', () => {
    expect(
      getInitialState({
        ...props,
        theme: 'light',
        visible: { themeBtn: false }
      })
    ).toMatchObject({
      theme: 'light',
      visible: { labelBtn: true, themeBtn: false }
    });
  });

  it('uses localstorage values instead of defaults if provided', () => {
    const storeValues = {
      textLabels: false,
      theme: 'light'
    };
    saveState(storeValues);
    expect(getInitialState(props)).toMatchObject(storeValues);
    window.localStorage.clear();
  });

  it('uses prop values instead of localstorage if provided', () => {
    saveState({ theme: 'light' });
    expect(getInitialState({ ...props, theme: 'dark' })).toMatchObject({
      theme: 'dark'
    });
    window.localStorage.clear();
  });
});
