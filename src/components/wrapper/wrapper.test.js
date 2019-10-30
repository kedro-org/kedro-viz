import { Wrapper, mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const { theme } = mockState.lorem;
const mockProps = { theme };

describe('Wrapper', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kedro-pipeline');
    expect(container.length).toBe(1);
  });

  it('sets a class based on the theme', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kedro-pipeline');
    const { theme } = wrapper.instance().props;
    expect(container.hasClass(`kui-theme--light`)).toBe(theme === 'light');
    expect(container.hasClass(`kui-theme--dark`)).toBe(theme === 'dark');
  });

  it('has sidebar visible by default', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    expect(wrapper.instance().state.visibleNav).toBe(true);
  });

  it('sets visibleNav to false when you run toggleNav', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    wrapper.instance().toggleNav();
    expect(wrapper.instance().state.visibleNav).toBe(false);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.lorem)).toEqual(mockProps);
  });
});
