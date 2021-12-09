import React from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-cartesian-dist';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import './plotly-chart.css';
import {
  darkPreviewTemplate,
  darkModalTemplate,
} from '../../utils/plot-templates/dark';
import {
  lightPreviewTemplate,
  lightModalTemplate,
} from '../../utils/plot-templates/light';

/**
 * Display plotly chart
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */

const Plot = createPlotlyComponent(Plotly);

const PlotlyChart = ({ theme, view, data = [], layout = {} }) => {
  const plotConfig = view === 'preview' ? { staticPlot: true } : undefined;

  return (
    <div className="pipeline-plotly-chart">
      <Plot
        data={data}
        layout={updateLayout(theme, view, layout)}
        config={plotConfig}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

const updateLayout = (theme, view, layout) => {
  if (theme === 'dark') {
    if (view === 'modal') {
      return deepmerge(layout, darkModalTemplate);
    } else {
      return deepmerge(layout, darkPreviewTemplate);
    }
  } else {
    if (view === 'modal') {
      return deepmerge(layout, lightModalTemplate);
    } else {
      return deepmerge(layout, lightPreviewTemplate);
    }
  }
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
