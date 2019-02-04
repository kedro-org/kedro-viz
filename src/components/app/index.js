import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import { resetSnapshotData } from '../../actions';
import ChartWrapper from '../chart-wrapper';
import formatData from '../../utils/format-data';
import { json } from 'd3-fetch';
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
      activePipelineData: pipelineData[0],
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
    const dataID = snapshots => snapshots.map(d => d.message).join('');

    if (dataID(prevProps.data) !== dataID(newData)) {
      this.store.dispatch(resetSnapshotData(this.formatData(newData)));
    }
  }

  loadData(data) {
    switch (data) {
      case 'random':
        return this.formatData(getRandomHistory());
      case 'json':
        return this.loadJsonData();
      default:
        return this.formatData(data);
    }
  }

  formatData(data) {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(pipeline => Object.assign({}, pipeline, {
        created_ts: +pipeline.created_ts,
        ...formatData(pipeline.json_schema)
      }))
      .sort((a, b) => b.created_ts - a.created_ts);
  }

  loadJsonData() {
    const { dataPath } = config;
    json(dataPath)
      .then(json_schema => this.formatData([{ json_schema }]))
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
  data: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.shape({
      json_schema: PropTypes.array.isRequired,
      message: PropTypes.string,
      created_ts: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
    }))
  ]),
  allowUploads: PropTypes.bool,
  showHistory: PropTypes.bool,
  allowHistoryDeletion: PropTypes.bool,
  onDeleteSnapshot: PropTypes.func,
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
