import getInitialState, { getPipelineData } from './initial-state';
import { saveState } from './helpers';
import getRandomPipeline from '../utils/random-data';
import loremIpsum from '../utils/data/lorem-ipsum.mock';
import animals from '../utils/data/animals.mock';
import demo from '../utils/data/demo.mock';
import layers from '../utils/data/layers.mock';

describe('getPipelineData', () => {
  it('returns the correct dataset when passed a dataset string', () => {
    expect(getPipelineData('lorem')).toEqual(loremIpsum);
    expect(getPipelineData('animals')).toEqual(animals);
    expect(getPipelineData('demo')).toEqual(demo);
    expect(getPipelineData('layers')).toEqual(layers);
  });

  it("returns null when passed 'json'", () => {
    expect(getPipelineData('json')).toEqual(null);
  });

  it('returns original data', () => {
    const randomPipeline = getRandomPipeline();
    expect(getPipelineData(randomPipeline)).toEqual(randomPipeline);
  });

  it('throws an error when passed random', () => {
    expect(() => getPipelineData('random')).toThrow();
  });

  it('throws an error when passed null or undefined', () => {
    expect(() => getPipelineData(null)).toThrow();
    expect(() => getPipelineData(undefined)).toThrow();
  });
});

describe('getInitialState', () => {
  const props = { data: 'lorem' };

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
  });

  it('uses prop values instead of localstorage if provided', () => {
    saveState({ theme: 'light' });
    expect(getInitialState({ ...props, theme: 'dark' })).toMatchObject({
      theme: 'dark'
    });
  });
});
