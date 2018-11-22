import React from 'react';
import PropTypes from 'prop-types';
import Store from '../store';
import formatData from '../../utils/format-data';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import './app.css';

const App = (props) => {
  const { data } = props; 

  if (!data) {
    return null;
  }

  const formattedData = data
    .map(pipeline => Object.assign(
      {},
      pipeline,
      {
        created_ts: +pipeline.created_ts,
        ...formatData(pipeline.json_schema)
      }
    ))
    .sort((a, b) => b.created_ts - a.created_ts);

  return (
    <Store
      {...props}
      data={formattedData} />
  );
}

App.propTypes = {
  data: PropTypes.array,
  allowUploads: PropTypes.bool,
  showHistory: PropTypes.bool,
};

App.defaultProps = {
  data: null,
  /**
   * Show/hide button to upload data snapshots to StudioAI
   */
  allowUploads: true,
  showHistory: false,
};

export default App;
