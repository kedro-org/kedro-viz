import React from 'react';
import FontLoadChecker from './index';
import { shallow } from 'enzyme';

describe('FontLoadChecker', () => {
  const getWrapper = () =>
    shallow(
      <FontLoadChecker>
        <div className="child" />
      </FontLoadChecker>
    );

  describe('if document.fonts is not supported', () => {
    it('renders children immediately', () => {
      const container = getWrapper().find('.child');
      expect(container.length).toBe(1);
    });
  });

  describe('if document.fonts is supported', () => {
    const OLD_FONTS = document.fonts;

    beforeEach(() => {
      jest.resetModules();

      // Force useEffect to run sychronously, because Enzyme doesn't support it yet.
      // via https://blog.carbonfive.com/2019/08/05/shallow-testing-hooks-with-enzyme/
      jest.spyOn(React, 'useEffect').mockImplementation(f => f());

      document.fonts = {
        check: () => false,
        ready: new Promise(() => {})
      };
    });

    afterEach(() => {
      document.fonts = OLD_FONTS;
    });

    it("renders null when the font hasn't loaded yet", () => {
      const container = getWrapper().find('.child');
      expect(container.length).toBe(0);
    });

    it('renders children when the font has already loaded', () => {
      document.fonts.check = () => true;
      const container = getWrapper().find('.child');
      expect(container.length).toBe(1);
    });

    it('renders children when document.fonts.ready returns', () => {
      document.fonts.ready = new Promise(resolve => {
        setTimeout(() => {
          document.fonts.check = () => true;
          resolve();
        }, 500);
      });
      const wrapper = getWrapper();
      expect(wrapper.find('.child').length).toBe(0);
      return document.fonts.ready.then(() => {
        expect(wrapper.find('.child').length).toBe(1);
      });
    });

    it('renders children when document.fonts.onloadingdone returns', () => {
      const wrapper = getWrapper();
      expect(wrapper.find('.child').length).toBe(0);
      document.fonts.check = () => true;
      document.fonts.onloadingdone();
      expect(wrapper.find('.child').length).toBe(1);
    });

    it('renders children when setInterval returns', () =>
      new Promise(resolve => {
        const wrapper = getWrapper();
        expect(wrapper.find('.child').length).toBe(0);
        document.fonts.check = () => true;
        setTimeout(() => resolve(wrapper), 300);
      }).then(wrapper => {
        expect(wrapper.find('.child').length).toBe(1);
      }));

    it('renders children when setTimeout returns', () =>
      new Promise(resolve => {
        const wrapper = getWrapper();
        expect(wrapper.find('.child').length).toBe(0);
        setTimeout(() => resolve(wrapper), 1500);
      }).then(wrapper => {
        expect(wrapper.find('.child').length).toBe(1);
      }));
  });
});
