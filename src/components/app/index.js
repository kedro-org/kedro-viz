import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import configureStore from '../../store';
import { resetData, updateFontLoaded } from '../../actions';
import checkFontLoaded from '../../actions/check-font-loaded';
import Wrapper from '../wrapper';
import getInitialState from '../../store/initial-state';
import loadData from '../../store/load-data';
import normalizeData from '../../store/normalize-data';
import { getFlagsMessage } from '../../utils/flags';
import '@quantumblack/kedro-ui/lib/styles/app.css';
import './app.css';

/**
 * Main wrapper component. Intialises the Redux store
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    const initialState = getInitialState(props);
    this.store = configureStore(initialState);
    this.announceFlags(initialState.flags);
  }

  componentDidMount() {
    this.asyncLoadJsonData();
    this.checkWebFontLoading();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data.schema_id !== this.props.data.schema_id) {
      this.updatePipelineData();
    }
  }

  /**
   * Shows a console message regarding the given flags
   */
  announceFlags(flags) {
    const message = getFlagsMessage(flags);

    if (message && typeof jest === 'undefined') {
      console.info(message);
    }
  }

  /**
   * Load data asynchronously from a JSON file then update the store
   */
  asyncLoadJsonData() {
    if (this.props.data === 'json') {
      loadData()
        .then(normalizeData)
        .then(data => {
          this.store.dispatch(resetData(data));
        });
    }
  }

  /**
   * Dispatch an action once the webfont has loaded
   */
  checkWebFontLoading() {
    checkFontLoaded().then(() => {
      this.store.dispatch(updateFontLoaded(true));
    });
  }

  /**
   * Dispatch an action to update the store with new pipeline data
   */
  updatePipelineData() {
    const normalizedData = normalizeData(this.props.data);
    this.store.dispatch(resetData(normalizedData));
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
    PropTypes.oneOf(['random', 'lorem', 'animals', 'demo', 'json', 'layers']),
    PropTypes.shape({
      schema_id: PropTypes.string,
      edges: PropTypes.array.isRequired,
      layers: PropTypes.array,
      nodes: PropTypes.array.isRequired,
      tags: PropTypes.array
    })
  ]),
  theme: PropTypes.oneOf(['dark', 'light']),
  visible: PropTypes.shape({
    labelBtn: PropTypes.bool,
    layerBtn: PropTypes.bool,
    layers: PropTypes.bool,
    exportBtn: PropTypes.bool,
    sidebar: PropTypes.bool,
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
