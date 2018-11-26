import React from 'react';
import PropTypes from 'prop-types';
import Store from '../store';
import formatData from '../../utils/format-data';

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
  data: PropTypes.arrayOf(PropTypes.shape({
    json_schema: PropTypes.string.isRequired,
    message: PropTypes.string,
    created_ts: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  })),
  allowUploads: PropTypes.bool,
  showHistory: PropTypes.bool,
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
};

export default App;
