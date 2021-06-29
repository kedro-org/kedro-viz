export const pathRoot = './api';

export const localStorageName = 'KedroViz';

// These values are used in both SCSS and JS, and we don't have variable-sharing
// across Sass and JavaScript, so they're defined in two places. If you update their
// value here, please also update their corresponding value in src/styles/_variables.scss
export const metaSidebarWidth = {
  open: 400,
  closed: 0,
};
export const sidebarWidth = {
  open: 400,
  closed: 56,
  breakpoint: 700,
};
export const codeSidebarWidth = {
  open: 480,
  closed: 0,
};

export const chartMinWidthScale = 0.25;

// Determine the number of nodes and edges in pipeline to trigger size warning
export const largeGraphThreshold = 1000;

// Remember to update the 'Flags' section in the README when updating these:
export const flags = {
  oldgraph: {
    description: 'Use older Dagre graphing algorithm',
    default: false,
    private: false,
    icon: '📈',
  },
  newparams: {
    description: `Disable parameters on page load and highlight parameter connections.`,
    default: true,
    icon: '🎛️',
  },
  sizewarning: {
    description: 'Show a warning before rendering very large graphs',
    default: true,
    icon: '🐳',
  },
};

export const sidebar = {
  Categories: {
    Tags: 'tag',
  },
  Elements: {
    Nodes: 'task',
    Datasets: 'data',
    Parameters: 'parameters',
  },
};

export const shortTypeMapping = {
  'kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet': 'plotly',
};
