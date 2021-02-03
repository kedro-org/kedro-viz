import { Wrapper, mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const { theme } = mockState.animals;
const mockProps = {
  theme
};

describe('Wrapper', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kedro-pipeline');
    expect(container.length).toBe(1);
  });

  it('sets a class based on the theme', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kedro-pipeline');
    expect(container.hasClass(`kui-theme--light`)).toBe(theme === 'light');
    expect(container.hasClass(`kui-theme--dark`)).toBe(theme === 'dark');
  });

  it('renders warning modal for large pipeines', () => {
    const newProps = {
      isLarge: true,
      displayLargeGraph: false
    };
    const wrapper = setup.shallow(Wrapper, newProps);
    expect(wrapper.find('.renderButton')).to.have.lengthOf(1);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.animals)).toEqual({
      loading: false,
      theme,
      displayLargeGraph: false,
      isLarge: false
    });
  });
});
