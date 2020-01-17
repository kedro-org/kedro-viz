import getInitialState from './initial-state';
import loadData from './load-data';
import { saveState } from '../../utils';

describe('getInitialState', () => {
  const loremData = loadData('lorem');

  it('returns an object', () => {
    expect(getInitialState(loremData)).toEqual(expect.any(Object));
  });

  it('does not require the second argument', () => {
    expect(getInitialState(loremData)).toEqual(getInitialState(loremData, {}));
  });

  it('returns full initial state', () => {
    expect(getInitialState(loremData)).toMatchObject({
      ...loremData,
      chartSize: {},
      textLabels: true,
      theme: 'dark',
      visible: { labelBtn: true, themeBtn: true }
    });
  });

  it('uses prop values instead of defaults if provided', () => {
    expect(
      getInitialState(loremData, {
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
    expect(getInitialState(loremData)).toMatchObject(storeValues);
  });

  it('uses prop values instead of localstorage if provided', () => {
    saveState({ theme: 'light' });
    expect(getInitialState(loremData, { theme: 'dark' })).toMatchObject({
      theme: 'dark'
    });
  });
});
