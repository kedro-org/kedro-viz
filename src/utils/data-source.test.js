import getPipelineData, { getSourceID, getDataValue } from './data-source';
import spaceflights from './data/spaceflights.mock.json';
import demo from './data/demo.mock.json';

describe('getSourceID', () => {

  it("should return 'json' by default if no source is supplied", () => {
    expect(getSourceID()).toBe('json');
  });
});

describe('getDataValue', () => {
  it('should return the correct dataset when passed a dataset string', () => {
    expect(getDataValue('spaceflights')).toEqual(spaceflights);
    expect(getDataValue('demo')).toEqual(demo);
  });

  it("should return the string 'json' when passed 'json'", () => {
    expect(getDataValue('json')).toEqual('json');
  });

  it("should return a dataset object when passed 'random'", () => {
    expect(getDataValue('random')).toEqual(
      expect.objectContaining({
        edges: expect.any(Array),
        nodes: expect.any(Array),
        tags: expect.any(Array),
        layers: expect.any(Array),
      })
    );
  });

  it('should throw an error if the given source is unknown', () => {
    expect(() => getDataValue('qwertyuiop')).toThrow();
    expect(() => getDataValue(null)).toThrow();
    expect(() => getDataValue(undefined)).toThrow();
  });
});

describe('getPipelineData', () => {
  it('should return "json" as the datasource if undefined', () => {
    expect(getPipelineData()).toBe('json');
  });
});
