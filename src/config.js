export const dataPath = './api/main';
export const fullDataPath = `/public${dataPath.substr(1)}`;

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

export const chartMinWidth = 300;

export const flags = {
  newgraph: {
    description: 'Improved graphing algorithm',
    default: false,
    icon: '📈'
  },
  pipelines: {
    description: 'Select from multiple pipelines',
    default: typeof jest !== undefined,
    icon: '🔀'
  },
  metadata: {
    description: 'Show metadata panel',
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

export const runCommandTemplates = {
  data: name => `kedro run --to-inputs ${name}`,
  task: name => `kedro run --to-nodes ${name}`
};
