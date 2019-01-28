import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import ChartWrapper from '../chart-wrapper';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';

class Store extends Component {
  // componentDidUpdate(prevProps) {
  //   const newData = this.props.data;
  //   if (prevProps.data !== newData) {
  //     this.setState({
  //       activePipelineData: newData[0],
  //       pipelineData: newData,
  //     });
  //   }
  // }

  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }

    const initialState = {
      activePipelineData: data[0],
      pipelineData: data,
      parameters: true,
      textLabels: false,
      view: 'combined',
      theme: 'dark'
    };

    return (
      <Provider store={store(initialState)}>
        <ChartWrapper {...this.props} />
      </Provider>
    );
  }
}

Store.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    nodes: PropTypes.array.isRequired,
    edges: PropTypes.array.isRequired,
    json_schema: PropTypes.array.isRequired,
    message: PropTypes.string,
    created_ts: PropTypes.number.isRequired,
    kernel_ai_schema_id: PropTypes.number,
  })),
  allowUploads: PropTypes.bool,
  showHistory: PropTypes.bool,
  allowHistoryDeletion: PropTypes.bool,
  onDeleteSnapshot: PropTypes.func,
};

Store.defaultProps = {
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

export default Store;
