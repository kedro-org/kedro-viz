import { getInitialState, loadData } from './load-data';
import { saveState } from '../../utils';
import formatData from '../../utils/format-data';
import loremIpsum from '../../utils/data/lorem-ipsum.mock';
import animals from '../../utils/data/animals.mock';
import demo from '../../utils/data/demo.mock';

describe('load-data', () => {
  describe('getInitialState', () => {
    const loremData = loadData('lorem');

    it('returns an object', () => {
      expect(getInitialState(loremData)).toEqual(expect.any(Object));
    });

    it('does not require the second argument', () => {
      expect(getInitialState(loremData)).toEqual(
        getInitialState(loremData, {})
      );
    });

    it('returns full initial state', () => {
      expect(getInitialState(loremData)).toMatchObject({
        ...loremData,
        chartSize: {},
        parameters: true,
        textLabels: true,
        theme: 'dark',
        view: 'combined',
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
        parameters: false,
        textLabels: false,
        theme: 'light',
        view: 'task'
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

  describe('loadData', () => {
    it('returns the correct dataset when passed a dataset string', () => {
      expect(loadData('random')).toMatchObject({
        nodes: expect.any(Array),
        nodeName: expect.any(Object)
      });
      expect(loadData('lorem')).toEqual(formatData(loremIpsum));
      expect(loadData('animals')).toEqual(formatData(animals));
      expect(loadData('demo')).toEqual(formatData(demo));
    });
  });
});
