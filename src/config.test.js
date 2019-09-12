import config from './config';

describe('config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.REACT_APP_DATA_SOURCE;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should return a properly-formatted object', () => {
    expect(config()).toEqual({
      dataPath: expect.stringContaining('.json'),
      dataSource: expect.stringMatching(/random|json/),
      localStorageName: expect.stringContaining('KedroViz')
    });
  });

  it('should return "json" as the datasource if undefined', () => {
    expect(config().dataSource).toBe('json');
  });

  it('should throw an error if the given source is unknown', () => {
    process.env.REACT_APP_DATA_SOURCE = 'qwertyuiop';
    expect(() => {
      config().dataSource();
    }).toThrow();
  });

  it('should return the given datasource if set', () => {
    process.env.REACT_APP_DATA_SOURCE = 'random';
    expect(config().dataSource).toBe('random');
  });
});
