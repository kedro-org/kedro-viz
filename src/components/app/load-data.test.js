import loadData from './load-data';
import formatData from '../../utils/format-data';
import loremIpsum from '../../utils/data/lorem-ipsum.mock';
import animals from '../../utils/data/animals.mock';
import demo from '../../utils/data/demo.mock';

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
