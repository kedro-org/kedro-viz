import React from 'react';
import PlotlyChart from './index';
import { setup } from '../../utils/state.mock';

describe('PlotlyChart', () => {
  it('renders without crashing', () => {
    const props = {
      data: [],
      layout: {},
    };
    const wrapper = setup.mount(<PlotlyChart {...props} />);
    expect(wrapper.find('.pipeline-plotly-chart').length).toBe(1);
  });
  it('', () => {
    const props = {
      data: [],
      layout: {},
      theme: 'dark',
      view: 'preview',
    };
    const wrapper = setup.mount(<PlotlyChart {...props} />);
    const instance = wrapper.find('PlotlyComponent').instance();
    const preview_height = 300;
    const preview_bg = '#111111';
    const layout = instance.props.layout;
    expect(layout.height).toBe(preview_height);
    expect(layout.paper_bgcolor).toBe(preview_bg);
  });
});
