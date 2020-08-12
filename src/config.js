export const dataPath = './api/main';
export const fullDataPath = `/public${dataPath.substr(1)}`;

export const localStorageName = 'KedroViz';

// Also set in src/styles/_variables.scss:
export const sidebarBreakpoint = 700;
export const sidebarWidth = {
  open: 400,
  closed: 60
};

export const flags = {
  newgraph: {
    description: 'Improved graphing algorithm',
    default: false,
    icon: '📈'
  }
};
