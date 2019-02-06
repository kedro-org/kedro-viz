import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { json } from 'd3-fetch';
import store from '../../store';
import { resetSnapshotData } from '../../actions';
import ChartWrapper from '../chart-wrapper';
import formatSnapshots from '../../utils/format-data';
import config from '../../config';
import getRandomHistory from '../../utils/randomData';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import './app.scss';

class App extends React.Component {
  constructor(props) {
    super(props);

    const pipelineData = this.loadData(props.data);

    const {
      allowHistoryDeletion,
      allowUploads,
      onDeleteSnapshot,
      showHistory,
    } = props;

    const initialState = {
      activePipeline: pipelineData.allIds[0],
      allowHistoryDeletion,
      allowUploads,
      onDeleteSnapshot,
      pipelineData,
      parameters: true,
      showHistory,
      textLabels: false,
      view: 'combined',
      theme: 'dark',
    };
  
    this.store = store(initialState);
  }

  componentDidUpdate(prevProps) {
    const newData = this.props.data;
    const dataID = snapshots =>
      Array.isArray(snapshots) && snapshots.map(d => d.kernel_ai_schema_id).join('');

    if (dataID(prevProps.data) !== dataID(newData)) {
      this.store.dispatch(resetSnapshotData(formatSnapshots(newData)));
    }
  }

  loadData(data) {
    switch (data) {
      case 'random':
        return formatSnapshots(getRandomHistory());
      case 'json':
        return this.loadJsonData();
      default:
        return formatSnapshots(data);
    }
  }

  loadJsonData() {
    const { dataPath } = config;
    json(dataPath)
      .then(json_schema => formatSnapshots([{ json_schema }]))
      .then(formattedData => {
        this.store.dispatch(resetSnapshotData(formattedData));
      })
      .catch(() => {
        console.error(`Unable to load pipeline data. Please check that you have placed a file at ${dataPath}`)
      });
    return [];
  }

  render () {
    return this.props.data ? (
      <Provider store={this.store}>
        <ChartWrapper />
      </Provider>
    ) : null;
  }
}

App.propTypes = {
  allowHistoryDeletion: PropTypes.bool,
  allowUploads: PropTypes.bool,
  data: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.shape({
      created_ts: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
      json_schema: PropTypes.array.isRequired,
      kernel_ai_schema_id: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
      message: PropTypes.string,
    }))
  ]),
  onDeleteSnapshot: PropTypes.func,
  showHistory: PropTypes.bool,
};

App.defaultProps = {
  /**
   * Data array containing Pipeline snapshot objects
   */
  data: null,
  /**
   * Show/hide button to upload data snapshots to StudioAI
   */
  allowUploads: true,
  /**
   * Show/hide snapshot history tab in sidebar
   */
  showHistory: false,
  /**
   * Allow users to delete a snapshot from the history tab
   */
  allowHistoryDeletion: false,
  /**
   * Callback on deletion of a snapshot from the history tab
   */
  onDeleteSnapshot: null,
};

export default App;
