import React from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import './plotly-renderer.scss';
import {
  darkPreviewTemplate,
  darkModalTemplate,
} from '../../utils/plot-templates/dark';
import {
  lightPreviewTemplate,
  lightModalTemplate,
} from '../../utils/plot-templates/light';
import classNames from 'classnames';

/**
 * Display plotly chart
 * @param {Object} chartSize Chart dimensions in pixels
 * @param {Object} targetRect event.target.getBoundingClientRect()
 * @param {Boolean} visible Whether to show the tooltip
 * @param {String} text Tooltip display label
 */

const Plot = createPlotlyComponent(Plotly);

const PlotlyChart = ({ theme, view = '', data = [], layout = {} }) => {
  const plotConfig = view.includes('preview')
    ? { staticPlot: true }
    : undefined;

  return (
    <div
      className={classNames(
        'pipeline-plotly-chart',
        `pipeline-plotly__${view}`
      )}
    >
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
    }
    return deepmerge(layout, darkPreviewTemplate);
  } else {
    if (view === 'modal') {
      return deepmerge(layout, lightModalTemplate);
    }
    return deepmerge(layout, lightPreviewTemplate);
  }
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(PlotlyChart);
