import { json } from 'd3-fetch';
import config from '../../config';
import getRandomHistory from '../../utils/random-data';
import formatSnapshots from '../../utils/format-data';
import mockData from '../../utils/data.mock';
import { loadState } from '../../utils';

/**
 * Configure the redux store's initial state
 * @param {Object}   pipelineData Formatted pipeline data
 * @param {Object}   props App component props
 * @param {Boolean}  props.allowHistoryDeletion Whether to allow snapshots to be deleted
 * @param {Function} props.onDeleteSnapshot Event handler for deleting snapshots
 * @param {Boolean}  props.showHistory Whether to show History panel
 */
export const getInitialState = (
  pipelineData,
  { allowHistoryDeletion, onDeleteSnapshot, showHistory }
) => {
  // Load properties from localStorage if defined, else use defaults
  const {
    parameters = true,
    textLabels = false,
    theme = 'dark',
    view = 'combined'
  } = loadState();

  return {
    ...pipelineData,
    activeSnapshot: pipelineData.snapshotIDs[0],
    allowHistoryDeletion,
    chartSize: {},
    onDeleteSnapshot,
    parameters,
    showHistory,
    textLabels,
    view,
    theme
  };
};

/**
 * Determine how data should be loaded (i.e. async from JSON, or randomly-generated,
 * or directly via props), then load and format it.
 * @param {string|Array} data Either raw data itself, or a 'json'/'random' string
 * @param {Function} onLoadData Callback for adding data to the store once loaded
 */
export const loadData = (data, onLoadData) => {
  switch (data) {
    case 'random':
      return formatSnapshots(getRandomHistory());
    case 'mock':
      return formatSnapshots(mockData);
    case 'json':
      loadJsonData().then(onLoadData);
      return formatSnapshots({ snapshots: [] });
    case null:
      throw new Error('No data was provided to App component via props');
    default:
      return formatSnapshots(data);
  }
};

/**
 * Asynchronously load, parse and format data from json file using D3
 */
export const loadJsonData = () => {
  const { dataPath } = config();
  return json(dataPath)
    .catch(() => {
      throw new Error(
        `Unable to load pipeline data. Please check that you have placed a file at ${dataPath}`
      );
    })
    .then(formatSnapshots);
};
