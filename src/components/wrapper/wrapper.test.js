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

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.animals)).toEqual({
      theme
    });
  });
});
