import React from 'react';
import { Wrapper, mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

const { theme } = mockState.lorem;
const mockProps = {
  theme,
  fontLoaded: true
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

  it("doesn't show the chart if fontLoaded is false", () => {
    const wrapper = setup.mount(<Wrapper fontLoaded={false} />);
    expect(wrapper.find('FlowChart').exists()).toBe(false);
  });

  it('only shows the chart if fontLoaded is true', () => {
    const wrapper = setup.mount(<Wrapper fontLoaded={true} />);
    expect(wrapper.find('FlowChart').exists()).toBe(true);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.lorem)).toEqual({
      theme,
      fontLoaded: false
    });
  });
});
