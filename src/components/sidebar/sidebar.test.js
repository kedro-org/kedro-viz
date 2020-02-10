import React from 'react';
import Sidebar, { ShowMenuButton, HideMenuButton } from './index';
import { mockState, setup } from '../../utils/state.mock';

const mockProps = {
  theme: mockState.lorem.theme,
  onToggle: () => {},
  visible: true
};

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

describe('Sidebar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Sidebar, mockProps);
    const container = wrapper.find('.pipeline-sidebar');
    expect(container.length).toBe(1);
  });

  it('has an open sidebar by default', () => {
    const wrapper = setup.shallow(Sidebar, mockProps);
    expect(
      wrapper.find('.pipeline-sidebar').hasClass('pipeline-sidebar--visible')
    ).toBe(true);
  });
});
