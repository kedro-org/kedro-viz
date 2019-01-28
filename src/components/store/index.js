import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from '../../store';
import ChartWrapper from '../chart-wrapper';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';

class Store extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activePipelineData: props.data[0],
      pipelineData: props.data,
      parameters: true,
      textLabels: false,
      view: 'combined',
      theme: 'dark'
    };
  }

  componentDidUpdate(prevProps) {
    const newData = this.props.data;
    if (prevProps.data !== newData) {
      this.setState({
        activePipelineData: newData[0],
        pipelineData: newData,
      });
    }
  }

  /**
   * Update a specific property for all of the nodes when a condition is met
   * @param {Function} matchNode Conditional. Returns true if node should be updated.
   * @param {string} property The node prop to be updated
   * @param {any} value The new value for the updated node property
   * @param {Boolean} parameters True if the parameters state should be updated
   */
  onNodeUpdate(matchNode, property, value, parameters) {
    const { activePipelineData } = this.state;
    const nodes = activePipelineData.nodes.map(node => {
      if (matchNode(node)) {
        node[property] = value;
      }
      return node;
    });
    this.setState({
      activePipelineData: Object.assign({}, activePipelineData, { nodes })
    });
    if (parameters) {
      this.setState({
        parameters: !value
      });
    }
  }

  render() {
    const { data } = this.props;
    const {
      parameters,
    } = this.state;

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
        <ChartWrapper
          {...this.props}
          {...this.state}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          chartParams={{
            onNodeUpdate: this.onNodeUpdate.bind(this),
            parameters,
          }} />
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
