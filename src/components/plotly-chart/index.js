import React from 'react';
import Plot from 'react-plotly.js';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import { dark_preview, dark_modal } from '../../utils/plot-templates/dark';
import { light_preview, light_modal } from '../../utils/plot-templates/light';

/**
 * Display plotly chart
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */
const PlotlyChart = ({ theme, data, layout, view }) => {
  return (
    <div className="pipeline-plotly-chart">
      <Plot
        data={data}
        layout={updateLayout(theme, view, layout)}
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

const updateLayout = (theme, view, layout) => {
  if (theme === 'dark') {
    if (view === 'modal') {
      return deepmerge(layout, dark_modal);
    } else {
      return deepmerge(layout, dark_preview);
    }
  } else {
    if (view === 'modal') {
      return deepmerge(layout, light_modal);
    } else {
      return deepmerge(layout, light_preview);
    }
  }
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
