import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import { resetSnapshotData } from '../../actions';
import ChartWrapper from '../chart-wrapper';
import formatSnapshots from '../../utils/format-data';
import { getInitialState, loadData } from './load-data';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import './app.css';

/**
 * Main wrapper component. Handles store, and loads/formats snapshot data
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    const pipelineData = loadData(props.data, this.resetStoreData.bind(this));
    const initialState = getInitialState(pipelineData, props);
    this.store = store(initialState);
  }

  componentDidUpdate(prevProps) {
    const newData = this.props.data;
    const dataID = snapshots =>
      Array.isArray(snapshots) &&
      snapshots.map(d => d.kernel_ai_schema_id).join('');

    if (dataID(prevProps.data) !== dataID(newData)) {
      this.store.dispatch(resetSnapshotData(formatSnapshots(newData)));
    }
  }

  resetStoreData(formattedData) {
    this.store.dispatch(resetSnapshotData(formattedData));
  }

  render() {
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
    PropTypes.arrayOf(
      PropTypes.shape({
        created_ts: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        json_schema: PropTypes.array.isRequired,
        kernel_ai_schema_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
        message: PropTypes.string
      })
    )
  ]),
  onDeleteSnapshot: PropTypes.func,
  showHistory: PropTypes.bool
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
  onDeleteSnapshot: null
};

export default App;
