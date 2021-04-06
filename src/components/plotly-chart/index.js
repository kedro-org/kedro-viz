import React from 'react';
import Plot from 'react-plotly.js';

/**
 * Display plotly chart
 */
const PlotlyChart = ({ data, layout }) => {
  return (
    <div>
      <Plot data={data} layout={layout} config={{ displayModeBar: false }} />
    </div>
  );
};

PlotlyChart.defaultProps = {
  data: {},
  layout: {},
};

export default PlotlyChart;
