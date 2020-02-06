import EasterEgg from './index';
import { setup } from '../../utils/state.mock';

describe('EasterEgg', () => {
  const OLD_AUDIO_PLAY = Audio.prototype.play;

  beforeEach(() => {
    Audio.prototype.play = () => {};
  });

  afterEach(() => {
    Audio.prototype.play = OLD_AUDIO_PLAY;
  });

  it('renders nothing by default', () => {
    const wrapper = setup.shallow(EasterEgg);
    expect(wrapper.find('.easter-egg').length).toBe(0);
    expect(wrapper.find('img').length).toBe(0);
  });

  it('renders image when play is true', () => {
    const wrapper = setup.shallow(EasterEgg);
    wrapper.setState({ play: true });
    expect(wrapper.find('.easter-egg').length).toBe(1);
    expect(wrapper.find('img').length).toBe(1);
  });
});
