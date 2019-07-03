import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import { resetSnapshotData } from '../../actions';
import Wrapper from '../wrapper';
import formatSnapshots from '../../utils/format-data';
import { getInitialState, loadData } from './load-data';
import '@quantumblack/kedro-ui/lib/styles/app.css';
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
    if (this.dataWasUpdated(prevProps.data, this.props.data)) {
      this.store.dispatch(resetSnapshotData(formatSnapshots(this.props.data)));
    }
  }

  /**
   * Quickly determine whether snapshots have been updated
   * @param {Object} prevData Previous data prop
   * @param {Object} newData New data prop
   */
  dataWasUpdated(prevData, newData) {
    // Check just the schema IDs of incoming data updates
    const dataID = ({ snapshots }) =>
      Array.isArray(snapshots) && snapshots.map(d => d.schema_id).join('');

    return dataID(prevData) !== dataID(newData);
  }

  /**
   * Dispatch an action to update the store with all new snapshot data
   * @param {Object} formattedData The formatted snapshots
   */
  resetStoreData(formattedData) {
    this.store.dispatch(resetSnapshotData(formattedData));
  }

  render() {
    return this.props.data ? (
      <Provider store={this.store}>
        <Wrapper />
      </Provider>
    ) : null;
  }
}

App.propTypes = {
  allowHistoryDeletion: PropTypes.bool,
  data: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      snapshots: PropTypes.arrayOf(
        PropTypes.shape({
          created_ts: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          edges: PropTypes.array.isRequired,
          message: PropTypes.string,
          nodes: PropTypes.array.isRequired,
          tags: PropTypes.array
        })
      )
    })
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
