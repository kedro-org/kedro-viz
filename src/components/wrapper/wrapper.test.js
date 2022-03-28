import { Wrapper, mapStateToProps } from './wrapper';
import { mockState, setup } from '../../utils/state.mock';

const { theme } = mockState.spaceflights;
const mockProps = {
  theme,
  displayGlobalToolbar: true,
};

const mockPropsNoGlobalToolbar = {
  theme,
  displayGlobalToolbar: false,
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

  it('does not display the global toolbar when displayGlobalToolbar is false', () => {
    const wrapper = setup.mount(Wrapper, mockPropsNoGlobalToolbar);
    const container = wrapper.find('.pipeline-global-toolbar');
    expect(container.length).toBe(0);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.spaceflights)).toEqual({
      loading: false,
      theme,
      displayGlobalToolbar: true,
    });
  });
});
