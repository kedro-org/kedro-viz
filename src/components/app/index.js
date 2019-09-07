import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import { resetSnapshotData } from '../../actions';
import Wrapper from '../wrapper';
import formatData from '../../utils/format-data';
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
      this.resetStoreData(formatData(this.props.data));
    }
  }

  /**
   * Quickly determine whether the snapshot has been updated
   * @param {Object} prevData Previous data prop
   * @param {Object} newData New data prop
   */
  dataWasUpdated(prevData, newData) {
    return prevData.schema_id !== newData.schema_id;
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
  ])
};

App.defaultProps = {
  /**
   * Data array containing Pipeline snapshot objects
   */
  data: null
};

export default App;
