import { loadState } from '../../utils';

/**
 * Configure the redux store's initial state
 * @param {Object}   pipelineData Formatted pipeline data
 * @param {Object}   props App component props
 */
const getInitialState = (pipelineData, props = {}) => {
  // Load properties from localStorage if defined, else use defaults
  const {
    parameters = true,
    textLabels = true,
    theme = 'dark',
    view = 'combined'
  } = loadState();

  const visible = Object.assign(
    { exportBtn: true, labelBtn: true, themeBtn: true },
    props.visible
  );

  return {
    ...pipelineData,
    chartSize: {},
    fontLoaded: false,
    parameters,
    textLabels,
    view,
    visible,
    theme: props.theme || theme
  };
};

export default getInitialState;
