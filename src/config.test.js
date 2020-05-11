import { dataPath, localStorageName } from './config';

describe('config', () => {
  describe('dataPath', () => {
    it('should return the name of a json file', () => {
      expect(dataPath).toEqual(expect.stringContaining('.json'));
    });

    it('should return a relative path', () => {
      expect(dataPath.substr(0, 2)).toEqual('./');
    });
  });

  describe('localStorageName', () => {
    it('should contain KedroViz', () => {
      expect(localStorageName).toEqual(expect.stringContaining('KedroViz'));
    });
  });
});
