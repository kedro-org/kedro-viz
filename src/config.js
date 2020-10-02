/**
 * Determine where to load data from
 * @param {string} type Data type
 * @param {string=} id
 */
export const getUrl = (type, id) => {
  const path = ext => `./api/${ext}`;
  switch (type) {
    case 'main':
      return path('main');
    case 'pipeline':
      if (!id) throw new Error('No pipeline ID provided');
      return path(`pipelines/${id}`);
    default:
      throw new Error('Unknown URL type');
  }
};

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
  },
  pipelines: {
    description: 'Select from multiple pipelines',
    default: false,
    icon: '🔀'
  }
};
