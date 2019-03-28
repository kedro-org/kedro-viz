import config from './config';

describe('config', () => {
  it('should return a properly-formatted object', () => {
    expect(config).toEqual(
      expect.objectContaining({
        dataPath: expect.stringContaining('.json'),
        dataSource: expect.stringMatching(/random|json/),
        syncEndpoint: expect.stringContaining('http'),
        localStorageName: expect.stringContaining('KernelAIPipelineViz_')
      })
    );
  });
});
