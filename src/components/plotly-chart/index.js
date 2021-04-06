import React from 'react';
import Plot from 'react-plotly.js';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import dark from '../../utils/chart_templates/metadata_dark.json';
import light from '../../utils/chart_templates/metadata_light.json';
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
      />
    </div>
  );
};

PlotlyChart.defaultProps = {
  data: {},
  layout: {},
};

const updateLayout = (theme, layout) => {
  const template = theme === 'light' ? light : dark;
  return deepmerge(layout, template);
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
