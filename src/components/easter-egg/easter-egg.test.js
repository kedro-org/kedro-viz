import EasterEgg from './index';
import { setup } from '../../utils/state.mock';

const keyCodes = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→ba

/**
 * Dispatch a keyboard event
 * @param {number} keyCode
 */
const dispatchKeyDown = keyCode => {
  const event = new KeyboardEvent('keydown', { keyCode });
  document.dispatchEvent(event);
};

describe('EasterEgg', () => {
  const OLD_AUDIO_PLAY = Audio.prototype.play;

  beforeEach(() => {
    Audio.prototype.play = () => {};
    Audio.prototype.pause = () => {};
  });

  afterEach(() => {
    Audio.prototype.play = OLD_AUDIO_PLAY;
  });

  it('renders nothing by default', () => {
    const wrapper = setup.shallow(EasterEgg);
    expect(wrapper.find('.easter-egg').length).toBe(0);
    expect(wrapper.find('img').length).toBe(0);
  });

  it('renders image only when play is true', () => {
    const wrapper = setup.shallow(EasterEgg);
    wrapper.setState({ play: true });
    expect(wrapper.find('.easter-egg').length).toBe(1);
    expect(wrapper.find('img').length).toBe(1);
    wrapper.setState({ play: false });
    expect(wrapper.find('.easter-egg').length).toBe(0);
    expect(wrapper.find('img').length).toBe(0);
  });

  it('toggles on when the konami code is used', () => {
    const wrapper = setup.shallow(EasterEgg);
    keyCodes.forEach(dispatchKeyDown);
    expect(wrapper.find('.easter-egg').length).toBe(1);
  });

  it('toggles off when Escape is pressed', () => {
    const wrapper = setup.shallow(EasterEgg);
    wrapper.setState({ play: true });
    expect(wrapper.find('.easter-egg').length).toBe(1);
    dispatchKeyDown(27); // Escape key
    expect(wrapper.find('.easter-egg').length).toBe(0);
  });

  it('adds body class on play', () => {
    const wrapper = setup.shallow(EasterEgg);
    wrapper.setState({ play: true });
    expect(document.body.classList.contains('easter-theme')).toBe(true);
  });

  it('removes body class when unmounted', () => {
    const wrapper = setup.shallow(EasterEgg);
    wrapper.setState({ play: true });
    wrapper.unmount();
    expect(document.body.classList.contains('easter-theme')).toBe(false);
  });
});
