export const pathRoot = './api';

export const localStorageName = 'KedroViz';

// These values are used in both SCSS and JS, and we don't have variable-sharing
// across Sass and JavaScript, so they're defined in two places. If you update their
// value here, please also update their corresponding value in src/styles/_variables.scss
export const globalToolbarWidth = 80;

export const metaSidebarWidth = {
  open: 400,
  closed: 0,
};

export const sidebarWidth = {
  open: 400 + globalToolbarWidth,
  closed: 56 + globalToolbarWidth,
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
  sizewarning: {
    name: 'Size Warning',
    description: 'Show a warning before rendering very large graphs',
    default: true,
    icon: '🐳',
  },
};

export const settings = {
  prettyName: {
    name: 'Pretty Name',
    description: 'Display a formatted name for the kedro nodes',
    default: true,
  },
};

// Sidebar groups is an ordered map of { id: label }
export const sidebarGroups = {
  elementType: 'Element types',
  tag: 'Tags',
};

// Sidebar element types is an ordered map of { id: label }
export const sidebarElementTypes = {
  task: 'Nodes',
  data: 'Datasets',
  parameters: 'Parameters',
};

export const shortTypeMapping = {
  'kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet': 'plotly',
  'kedro.extras.datasets.plotly.json_dataset.JSONDataSet': 'plotly',
};
