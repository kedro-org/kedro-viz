import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import ChartWrapper from '../chart-wrapper';
import formatData from '../../utils/format-data';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import './app.css';

const App = (props) => {
  const { data } = props; 

  if (!data) {
    return null;
  }

  const formattedData = data.map(pipeline => Object.assign({}, pipeline, {
      created_ts: +pipeline.created_ts,
      ...formatData(pipeline.json_schema)
    }))
    .sort((a, b) => b.created_ts - a.created_ts);

  const initialState = {
    ...props,
    activePipelineData: formattedData[0],
    pipelineData: formattedData,
    parameters: true,
    textLabels: false,
    view: 'combined',
    theme: 'dark'
  };

  return (
    <Provider store={store(initialState)}>
      <ChartWrapper />
    </Provider>
  );
}

App.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    json_schema: PropTypes.array.isRequired,
    message: PropTypes.string,
    created_ts: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  })),
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
  onDeleteSnapshot: () => {},
};

export default App;
