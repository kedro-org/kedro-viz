import { Wrapper, mapStateToProps } from './index';
import { mockState, setup } from '../../utils/data.mock';

const { showHistory, theme } = mockState;
const mockProps = { showHistory, theme };

describe('Wrapper', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kernel-pipeline');
    expect(container.length).toBe(1);
  });

  it('sets a class based on the theme', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    const container = wrapper.find('.kernel-pipeline');
    const { theme } = mockState;
    expect(container.hasClass(`cbn-theme--light`)).toBe(theme === 'light');
    expect(container.hasClass(`cbn-theme--dark`)).toBe(theme === 'dark');
  });

  it('has an open sidebar by default', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    expect(
      wrapper.find('.pipeline-sidebar').hasClass('pipeline-sidebar--visible')
    ).toBe(true);
  });

  it('closes the sidebar when you click the hide button', () => {
    const wrapper = setup.shallow(Wrapper, mockProps);
    wrapper.find('.pipeline-sidebar__hide-menu').simulate('click');
    expect(
      wrapper.find('.pipeline-sidebar').hasClass('pipeline-sidebar--visible')
    ).toBe(false);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState)).toEqual(mockProps);
  });
});
