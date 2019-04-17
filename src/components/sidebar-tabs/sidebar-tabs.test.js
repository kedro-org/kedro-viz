import React from 'react';
import { mount, shallow } from 'enzyme';
import SidebarTabs, {
  SidebarTabs as UnconnectedSidebarTabs,
  mapStateToProps
} from './index';
import { mockState, MockProvider } from '../../utils/data.mock';

const setupShallow = (showHistory = true) =>
  shallow(<UnconnectedSidebarTabs showHistory={showHistory} />);

const setupMount = () =>
  mount(
    <MockProvider>
      <SidebarTabs />
    </MockProvider>
  );

describe('SidebarTabs', () => {
  it('renders without crashing', () => {
    const wrapper = setupShallow();
    const container = wrapper.find('.pipeline-tabs');
    expect(container.length).toBe(1);
  });

  describe('showHistory is true', () => {
    const wrapper = setupShallow();

    it('renders both UI and History tabs', () => {
      expect(wrapper.find('.pipeline-tabs_tab').length).toBe(2);
    });

    it('renders tab interface and 2 tabs', () => {
      expect(wrapper.find('.pipeline-tabs').children().length).toBe(3);
    });
  });

  describe('showHistory is false', () => {
    const wrapper = setupShallow(false);

    it('renders just the UI tab', () => {
      expect(wrapper.find('.pipeline-tabs_tab').length).toBe(1);
      expect(wrapper.find('.pipeline-tabs').children().length).toBe(1);
    });
  });

  it('toggles the tabs on click', () => {
    const wrapper = setupMount();
    expect(wrapper.find('#snapshots').props().hidden).toBe(true);
    wrapper
      .find('.cbn-tabs')
      .find('a')
      .at(1)
      .simulate('click');
    expect(wrapper.find('#snapshots').props().hidden).toBe(false);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState)).toEqual({
      showHistory: mockState.showHistory
    });
  });
});
