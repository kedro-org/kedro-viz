import React from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import deepmerge from 'deepmerge';
import { connect } from 'react-redux';
import classnames from 'classnames';
import './plotly-renderer.scss';
import {
  darkPreviewTemplate,
  darkModalTemplate,
} from '../../utils/plot-templates/dark';
import {
  lightPreviewTemplate,
  lightModalTemplate,
} from '../../utils/plot-templates/light';

const Plot = createPlotlyComponent(Plotly);

/**
 * PlotlyRenderer component for rendering Plotly charts
 * @param {string} theme - Current theme (light/dark)
 * @param {string} view - View mode ('preview' or 'modal')
 * @param {Array} data - Plotly data traces
 * @param {Object} layout - Plotly layout configuration
 */
const PlotlyRenderer = ({
  theme,
  view = 'preview',
  data = [],
  layout = {},
}) => {
  const plotConfig = view === 'preview' ? { staticPlot: true } : undefined;

  return (
    <div
      className={classnames(
        'pipeline-plotly-renderer',
        `pipeline-plotly-renderer--${view}`
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

export default connect(mapStateToProps)(PlotlyRenderer);
