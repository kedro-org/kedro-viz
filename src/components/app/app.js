import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import 'what-input';
import configureStore from '../../store';
import { isEqual } from 'lodash/fp';
import { resetData, updateStateFromOptions } from '../../actions';
import {
  loadInitialPipelineData,
  loadPipelineData,
} from '../../actions/pipelines';
import {
  loadRunStatusData,
  updateRunStatusData,
} from '../../actions/run-status';
import Wrapper from '../wrapper';
import getInitialState, {
  preparePipelineState,
} from '../../store/initial-state';
import { getFlagsMessage } from '../../utils/flags';
import { processRunStatus } from '../../utils/normalizeRunStatus';
import './app.scss';

/**
 * Entry-point component for the use-case where Kedro-Viz is imported as a
 * library/package into a larger application, rather than run as a standalone
 * app. If run as a standalone then 'Container' is the top-level component.
 *
 * This component intialises anything that might be needed in both use-cases,
 * e.g. the Redux store, webfont loading, announcing flags, etc.
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    const initialState = getInitialState(props);
    this.store = configureStore(
      initialState,
      this.props.data,
      this.props.onActionCallback
    );
  }

  componentDidMount() {
    if (this.props.data === 'json') {
      this.store.dispatch(loadInitialPipelineData());
    }

    // If runData is provided, update the store with it or load it from the API
    if (this.props.runData) {
      const processedData = processRunStatus(this.props.runData);
      this.store.dispatch(updateRunStatusData(processedData));
    } else {
      this.store.dispatch(loadRunStatusData());
    }
    this.announceFlags(this.store.getState().flags);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.updatePipelineData();
    }
    if (this.props.runData && prevProps.runData !== this.props.runData) {
      const processedData = processRunStatus(this.props.runData);
      this.store.dispatch(updateRunStatusData(processedData));
    }
    if (!isEqual(prevProps.options, this.props.options)) {
      this.store.dispatch(updateStateFromOptions(this.props.options));
    }

    // If the selected pipeline has changed, load the new pipeline data
    if (
      this.props.data &&
      this.props.data.selected_pipeline !== prevProps.data.selected_pipeline
    ) {
      this.store.dispatch(loadPipelineData(this.props.data.selected_pipeline));
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
   * Determines what run status data will be displayed on the chart.
   * You can supply an object with run status information -
   * Alternatively, the string 'json' indicates that data is being
   * loaded asynchronously from /api/run-status
   */
  runData: PropTypes.oneOfType([PropTypes.oneOf(['json']), PropTypes.object]),
  options: PropTypes.shape({
    /**
     * Specify the theme: Either 'light' or 'dark'.
     * If set, this will override the localStorage value.
     */
    theme: PropTypes.oneOf(['dark', 'light']),
    /**
     * Determines if certain elements are displayed, e.g globalNavigation, sidebar
     */
    display: PropTypes.shape({
      globalNavigation: PropTypes.bool,
      sidebar: PropTypes.bool,
      miniMap: PropTypes.bool,
      expandPipelinesBtn: PropTypes.bool,
      exportBtn: PropTypes.bool,
      labelBtn: PropTypes.bool,
      layerBtn: PropTypes.bool,
      zoomToolBar: PropTypes.bool,
      metadataPanel: PropTypes.bool,
      filterBtn: PropTypes.bool,
    }),
    /**
     * Override the default enabled/disabled tags
     */
    tag: PropTypes.shape({
      enabled: PropTypes.objectOf(PropTypes.bool),
    }),
    /**
     * Whether to re-focus the graph when a node is clicked
     */
    behaviour: PropTypes.shape({
      reFocus: PropTypes.bool,
    }),
    /**
     * Override the default enabled/disabled node types
     */
    nodeType: PropTypes.shape({
      disabled: PropTypes.shape({
        parameters: PropTypes.bool,
        task: PropTypes.bool,
        data: PropTypes.bool,
      }),
    }),
  }),
  expandAllPipelines: PropTypes.bool,
};

export default App;
