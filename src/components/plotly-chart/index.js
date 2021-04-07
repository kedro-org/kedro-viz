import React from 'react';
import Plot from 'react-plotly.js';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import { dark_metadata } from '../../utils/chart_templates/dark';
import { light_metadata } from '../../utils/chart_templates/light';
/**
 * Display plotly chart
 */

const PlotlyChart = ({ theme, data, layout }) => {
  return (
    <div>
      <Plot
        data={data}
        layout={updateLayout(theme, layout)}
        config={{ displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

PlotlyChart.defaultProps = {
  data: {},
  layout: {},
};

const updateLayout = (theme, layout) => {
  const template = theme === 'light' ? light_metadata : dark_metadata;
  return deepmerge(layout, template);
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
