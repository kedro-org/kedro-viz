import { getUrl, localStorageName, flags } from './config';

describe('config', () => {
  describe('getUrl', () => {
    it('should throw an error when passed an invalid argument', () => {
      expect(() => getUrl()).toThrow();
      expect(() => getUrl('unknown')).toThrow();
      expect(() => getUrl(null)).toThrow();
    });

    it('should return the "main" json file', () => {
      expect(getUrl('main')).toEqual('./api/main');
    });

    it('should return a "pipeline" json file', () => {
      const id = '123456';
      expect(getUrl('pipeline', id)).toEqual(`./api/pipelines/${id}`);
    });

    it('should always return a relative path', () => {
      expect(getUrl('main').substr(0, 2)).toEqual('./');
      expect(getUrl('pipeline', 123).substr(0, 2)).toEqual('./');
    });
  });

  describe('localStorageName', () => {
    it('should contain KedroViz', () => {
      expect(localStorageName).toEqual(expect.stringContaining('KedroViz'));
    });
  });

  describe('flags', () => {
    test.each(Object.keys(flags))(
      'flags.%s should be an object with description, default and icon keys',
      key => {
        expect(flags[key]).toEqual(
          expect.objectContaining({
            description: expect.any(String),
            default: expect.any(Boolean),
            icon: expect.any(String)
          })
        );
      }
    );
  });
});
