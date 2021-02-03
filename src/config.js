export const pathRoot = './api';

export const localStorageName = 'KedroViz';

// These values are used in both SCSS and JS, and we don't have variable-sharing
// across Sass and JavaScript, so they're defined in two places. If you update their
// value here, please also update their corresponding value in src/styles/_variables.scss
export const metaSidebarWidth = {
  open: 400,
  closed: 0
};
export const sidebarWidth = {
  open: 400,
  closed: 56
};

export const chartMinWidthScale = 0.25;

// Remember to update the 'Flags' section in the README when updating these:
export const flags = {
  oldgraph: {
    description: 'Use older Dagre graphing algorithm',
    default: false,
    private: false,
    icon: '📈'
  },
  lazy: {
    description: 'Improved sidebar performance',
    default: false,
    icon: '😴'
  }
};

export const sidebar = {
  Categories: {
    Tags: 'tag'
  },
  Elements: {
    Nodes: 'task',
    Datasets: 'data',
    Parameters: 'parameters'
  }
};
