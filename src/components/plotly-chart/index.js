import React from 'react';
import Plot from 'react-plotly.js';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import { darkPreviewTemplate } from '../../utils/plot-templates/dark';
import { lightPreviewTemplate } from '../../utils/plot-templates/light';
import './plotly-chart.css';
/**
 * Display plotly chart
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */
const PlotlyChart = ({ theme, data = {}, layout = {} }) => {
  const hideToolBar = { displayModeBar: false };
  return (
    <div className="pipeline-plotly-chart">
      <Plot
        data={data}
        layout={updateLayout(theme, layout)}
        config={hideToolBar}
      />
    </div>
  );
};

const updateLayout = (theme, layout) => {
  const template =
    theme === 'light' ? lightPreviewTemplate : darkPreviewTemplate;
  return deepmerge(layout, template);
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
