import React from 'react';
import PlotlyChart from './index';
import { setup } from '../../utils/state.mock';
import plot from '../../utils/data/node_plot.mock.json';

describe('PlotlyChart', () => {
  it('renders without crashing', () => {
    const props = {
      data: plot.data,
      layout: plot.layout,
    };
    const wrapper = setup.mount(<PlotlyChart {...props} />);
    expect(wrapper.find('.pipeline-plotly-chart').length).toBe(1);
  });
});
