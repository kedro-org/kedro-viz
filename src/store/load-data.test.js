import loadData from './load-data';
import normalizeData from './normalize-data';
import loremIpsum from '../utils/data/lorem-ipsum.mock';
import animals from '../utils/data/animals.mock';
import demo from '../utils/data/demo.mock';

describe('loadData', () => {
  it('returns the correct dataset when passed a dataset string', () => {
    expect(loadData('random')).toMatchObject({
      nodes: expect.any(Array),
      nodeName: expect.any(Object)
    });
    expect(loadData('lorem')).toEqual(normalizeData(loremIpsum));
    expect(loadData('animals')).toEqual(normalizeData(animals));
    expect(loadData('demo')).toEqual(normalizeData(demo));
  });
});
