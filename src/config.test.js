import config from './config';

const prodEndpoint = 'https://studio.quantumblack.com/api/public/kernelai';

describe('config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.REACT_APP_DATA_SOURCE;
    delete process.env.REACT_APP_ENDPOINT;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should return a properly-formatted object', () => {
    expect(config()).toEqual({
      dataPath: expect.stringContaining('.json'),
      dataSource: expect.stringMatching(/random|json/),
      syncEndpoint: expect.stringContaining('http'),
      localStorageName: expect.stringContaining('KernelAIPipelineViz_')
    });
  });

  it('should return "json" as the datasource if undefined', () => {
    expect(config().dataSource).toBe('json');
  });

  it('should return the given datasource if set', () => {
    process.env.REACT_APP_DATA_SOURCE = 'qwertyuiop';
    expect(config().dataSource).toBe('qwertyuiop');
  });

  it('should use prod for the endpoint by default if undefined', () => {
    expect(config().syncEndpoint).toBe(prodEndpoint);
  });

  it("should use prod for the endpoint by default if the given endpoint doesn't match", () => {
    process.env.REACT_APP_ENDPOINT = 'qwertyuiop';
    expect(config().syncEndpoint).toBe(prodEndpoint);
  });

  it('should include the endpoint name in the local storage key', () => {
    process.env.REACT_APP_ENDPOINT = 'qwertyuiop';
    expect(config().localStorageName).toEqual(
      expect.stringContaining('qwertyuiop')
    );
  });
});
