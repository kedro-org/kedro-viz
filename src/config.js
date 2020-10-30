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

export const flags = {
  newgraph: {
    description: 'Improved graphing algorithm',
    default: false,
    icon: '📈'
  },
  pipelines: {
    description: 'Select from multiple pipelines',
    default: typeof jest !== 'undefined',
    icon: '🔀'
  },
  meta: {
    description: 'Show the metadata panel',
    default: false,
    icon: '🔮'
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
