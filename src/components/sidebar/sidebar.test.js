import React from 'react';
import MountSidebar, { Sidebar } from './index';
import { ShowMenuButton, HideMenuButton } from './menu-buttons';
import { mockState, setup } from '../../utils/state.mock';

const mockProps = {
  theme: mockState.lorem.theme,
  onToggle: () => {},
  visible: true
};

describe('Sidebar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Sidebar, mockProps);
    const container = wrapper.find('.pipeline-sidebar');
    expect(container.length).toBe(1);
  });

  it('is open by default', () => {
    const sidebar = setup.shallow(Sidebar, mockProps).find('.pipeline-sidebar');
    expect(sidebar.hasClass('pipeline-sidebar--visible')).toBe(true);
  });

  it('hides when clicking the hide menu button', () => {
    const wrapper = setup.mount(<MountSidebar />, {
      visible: { sidebar: true }
    });
    wrapper.find('.pipeline-sidebar__hide-menu').simulate('click');
    const sidebar = wrapper.find('.pipeline-sidebar');
    expect(sidebar.hasClass('pipeline-sidebar--visible')).toBe(false);
  });

  it('shows when clicking the show menu button', () => {
    const wrapper = setup.mount(<MountSidebar />, {
      visible: { sidebar: false }
    });
    wrapper.find('.pipeline-sidebar__show-menu').simulate('click');
    const sidebar = wrapper.find('.pipeline-sidebar');
    expect(sidebar.hasClass('pipeline-sidebar--visible')).toBe(true);
  });
});

describe('ShowMenuButton', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ShowMenuButton {...mockProps} />);
    const container = wrapper.find('button');
    expect(container.length).toBe(1);
  });
});

describe('HideMenuButton', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(HideMenuButton, mockProps);
    const container = wrapper.find('button');
    expect(container.length).toBe(1);
  });
});
