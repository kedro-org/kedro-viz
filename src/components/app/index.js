import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import configureStore from '../../store';
import { resetData, updateFontLoaded } from '../../actions';
import { loadInitialPipelineData } from '../../actions/pipelines';
import Wrapper from '../wrapper';
import getInitialState, {
  preparePipelineState,
} from '../../store/initial-state';
import { getFlagsMessage } from '../../utils/flags';
import '@quantumblack/kedro-ui/lib/styles/app-no-webfont.css';
import LoadWebFont from '@quantumblack/kedro-ui/lib/utils/webfont.js';
import './app.css';

/**
 * Main wrapper component. Intialises the Redux store
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    const initialState = getInitialState(props);
    this.store = configureStore(initialState);
  }

  componentDidMount() {
    if (this.props.data === 'json') {
      this.store.dispatch(loadInitialPipelineData());
    }
    this.loadWebFonts();
    this.announceFlags(this.store.getState().flags);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
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
   * Dispatch an action once the webfont has loaded.
   * Uses https://github.com/typekit/webfontloader
   */
  loadWebFonts() {
    const setFontLoaded = () => {
      this.store.dispatch(updateFontLoaded(true));
    };
    LoadWebFont({
      active: setFontLoaded,
      inactive: setFontLoaded,
    });
  }

  /**
   * Dispatch an action to update the store with new pipeline data
   */
  updatePipelineData() {
    const newState = preparePipelineState(this.props.data, true);
    this.store.dispatch(resetData(newState));
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
  /**
   * Determines what pipeline data will be displayed on the chart.
   * You can supply an object containing lists of edges, nodes, tags -
   * See /src/utils/data for examples of the expected data format.
   * Alternatively, the string 'json' indicates that data is being
   * loaded asynchronously from /public/api/nodes.json
   */
  data: PropTypes.oneOfType([
    PropTypes.oneOf(['json']),
    PropTypes.shape({
      edges: PropTypes.array.isRequired,
      layers: PropTypes.array,
      nodes: PropTypes.array.isRequired,
      tags: PropTypes.array,
    }),
  ]),
  /**
   * Specify the theme: Either 'light' or 'dark'.
   * If set, this will override the localStorage value.
   */
  theme: PropTypes.oneOf(['dark', 'light']),
  /**
   * Override visibility of various features, e.g. icon buttons
   */
  visible: PropTypes.shape({
    labelBtn: PropTypes.bool,
    layerBtn: PropTypes.bool,
    exportBtn: PropTypes.bool,
    sidebar: PropTypes.bool,
    themeBtn: PropTypes.bool,
  }),
};

export default App;
