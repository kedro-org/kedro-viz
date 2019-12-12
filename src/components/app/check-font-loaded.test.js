import configureStore from '../../store';
import getInitialState from './initial-state';
import loadData from './load-data';
import checkFontLoaded from './check-font-loaded';

describe('checkFontLoaded', () => {
  const OLD_FONTS = document.fonts;
  let initialState;
  let store;

  beforeEach(() => {
    initialState = getInitialState(loadData('lorem'));
    store = configureStore(initialState);
    jest.resetModules();
    document.fonts = {
      check: () => false,
      ready: new Promise(() => {})
    };
  });

  afterEach(() => {
    document.fonts = OLD_FONTS;
  });

  describe('if document.fonts is not supported', () => {
    it('sets fontLoaded to true immediately', () => {
      document.fonts = undefined;
      expect(store.getState().fontLoaded).toBe(false);
      checkFontLoaded(store);
      expect(store.getState().fontLoaded).toBe(true);
    });
  });

  describe('if document.fonts is supported', () => {
    it("sets fontLoaded to false when the font hasn't loaded yet", () => {
      checkFontLoaded(store);
      expect(store.getState().fontLoaded).toBe(false);
    });

    it('sets fontLoaded to true once the font has loaded', () => {
      document.fonts.check = () => true;
      return checkFontLoaded(store).then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });

    it('sets fontLoaded to true when document.fonts.ready returns', () => {
      document.fonts.ready = new Promise(resolve => {
        setTimeout(() => {
          document.fonts.check = () => true;
          resolve();
        }, 500);
      });
      return Promise.all([checkFontLoaded(store), document.fonts.ready]).then(
        () => {
          expect(store.getState().fontLoaded).toBe(true);
        }
      );
    });

    it('sets fontLoaded to true when document.fonts.onloadingdone returns', () => {
      const check = checkFontLoaded(store);
      document.fonts.check = () => true;
      document.fonts.onloadingdone();
      return check.then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });

    it('sets fontLoaded to true with requestAnimationFrame once the font loads', () => {
      const timeout = new Promise(resolve => {
        setTimeout(() => {
          document.fonts.check = () => true;
          resolve();
        }, 500);
      });
      return Promise.all([checkFontLoaded(store), timeout]).then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });

    it('sets fontLoaded to true regardless once >8 seconds have passed', () => {
      const check = checkFontLoaded(store);
      performance.now = () => 9999; // hurry up
      return check.then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });
  });
});
