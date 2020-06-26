import getDataSource from './data-source';

describe('getDataSource', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.REACT_APP_DATA_SOURCE;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should return "json" as the datasource if undefined', () => {
    expect(getDataSource()).toBe('json');
  });

  it('should throw an error if the given source is unknown', () => {
    process.env.REACT_APP_DATA_SOURCE = 'qwertyuiop';
    expect(() => {
      getDataSource();
    }).toThrow();
  });

  it('should return the given datasource if set', () => {
    process.env.REACT_APP_DATA_SOURCE = 'animals';
    expect(getDataSource()).toBe('animals');
  });

  it('should return random data if requested', () => {
    process.env.REACT_APP_DATA_SOURCE = 'random';
    expect(getDataSource()).toEqual(expect.objectContaining({}));
  });
});
