import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import { resetData } from '../../actions';
import Wrapper from '../wrapper';
import formatData from '../../utils/format-data';
import { getInitialState, loadData } from './load-data';
import '@quantumblack/kedro-ui/lib/styles/app.css';
import './app.css';

/**
 * Main wrapper component. Handles store, and loads/formats pipeline data
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    const pipelineData = loadData(props.data, this.resetStoreData.bind(this));
    const initialState = getInitialState(pipelineData, props);
    this.store = store(initialState);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data.schema_id !== this.props.data.schema_id) {
      this.resetStoreData(formatData(this.props.data));
    }
  }

  /**
   * Dispatch an action to update the store with new pipeline data
   * @param {Object} formattedData Normalised state data
   */
  resetStoreData(formattedData) {
    this.store.dispatch(resetData(formattedData));
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
    PropTypes.oneOf(['random', 'lorem', 'animals', 'demo', 'json']),
    PropTypes.shape({
      schema_id: PropTypes.string,
      edges: PropTypes.array.isRequired,
      nodes: PropTypes.array.isRequired,
      tags: PropTypes.array
    })
  ]),
  theme: PropTypes.oneOf(['dark', 'light']),
  visible: PropTypes.shape({
    labelBtn: PropTypes.bool,
    themeBtn: PropTypes.bool
  })
};

App.defaultProps = {
  /**
   * Determines what pipeline data will be displayed on the chart.
   * You can supply one of the following strings:
     - 'random': Use randomly-generated data
     - 'lorem': Use data from the 'lorem-ipsum' test dataset
     - 'animals': Use data from the 'animals' test dataset
     - 'demo': Use data from the 'demo' test dataset
     - 'json': Load data from a local json file (in /public/api/nodes.json)
   * Alternatively, you can supply an object containing lists of edges, nodes, tags.
   * See /src/utils/data for examples of the expected data format.
   */
  data: null,
  /**
   * Specify the theme: Either 'light' or 'dark'.
   * If set, this will override the localStorage value.
   */
  theme: null,
  /**
   * Show/hide the icon buttons with { labelBtn:false } and/or { themeBtn:false }
   */
  visible: {}
};

export default App;
