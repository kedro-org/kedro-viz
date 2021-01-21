export const pathRoot = './api';

export const localStorageName = 'KedroViz';

// These values are used in both SCSS and JS, and we don't have variable-sharing
// across Sass and JavaScript, so they're defined in two places. If you update their
// value here, please also update their corresponding value in src/styles/_variables.scss
export const metaSidebarWidth = {
  breakpoint: 1200,
  open: 400,
  closed: 0
};
export const sidebarWidth = {
  breakpoint: 700,
  open: 400,
  closed: 56
};

export const chartMinWidth = 1200;

// this value is used within flowchart to determine the amount of nodes in pipeline to
// trigger chonky warning
export const chonkyNodeAmount = 1000;

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
