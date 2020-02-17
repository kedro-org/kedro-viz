import { createStore } from 'redux';
import reducer from '../reducers';
import { mockState } from '../utils/state.mock';
import checkFontLoaded from './check-font-loaded';
import { updateFontLoaded } from '.';

describe('checkFontLoaded', () => {
  const OLD_FONTS = document.fonts;
  let store;

  const setLoaded = () => {
    store.dispatch(updateFontLoaded(true));
  };

  beforeEach(() => {
    store = createStore(reducer, mockState.lorem);
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
    it('sets fontLoaded to true', () => {
      document.fonts = undefined;
      return checkFontLoaded()
        .then(setLoaded)
        .then(() => {
          expect(store.getState().fontLoaded).toBe(true);
        });
    });
  });

  describe('if document.fonts is supported', () => {
    it("sets fontLoaded to false when the font hasn't loaded yet", () => {
      checkFontLoaded().then(setLoaded);
      expect(store.getState().fontLoaded).toBe(false);
    });

    it('sets fontLoaded to true once the font has loaded', () => {
      document.fonts.check = () => true;
      return checkFontLoaded()
        .then(setLoaded)
        .then(() => {
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
      return Promise.all([
        checkFontLoaded().then(setLoaded),
        document.fonts.ready
      ]).then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });

    it('sets fontLoaded to true when document.fonts.onloadingdone returns', () => {
      const check = checkFontLoaded().then(setLoaded);
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
      return Promise.all([checkFontLoaded().then(setLoaded), timeout]).then(
        () => {
          expect(store.getState().fontLoaded).toBe(true);
        }
      );
    });

    it('sets fontLoaded to true regardless once >8 seconds have passed', () => {
      const check = checkFontLoaded().then(setLoaded);
      performance.now = () => 9999; // hurry up
      return check.then(() => {
        expect(store.getState().fontLoaded).toBe(true);
      });
    });
  });
});
