import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChartWrapper from '../chart-wrapper';

class Store extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeData: props.data[0],
      data: props.data,
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
        activeData: newData[0],
        data: newData,
      });
    }
  }

  onChangeView(e, { value }) {
    this.setState({
      view: value
    });
  }

  onNodeUpdate(nodeID, property, value) {
    const { activeData } = this.state;
    const nodes = activeData.nodes.map(node => {
      if (node.id === nodeID) {
        node[property] = value;
      }
      return node;
    });
    this.setState({
      activeData: Object.assign({}, activeData, { nodes })
    });
  }

  onToggleParameters(parameters) {
    const { data } = this.state;
    const nodes = data.nodes.map(node => {
      if (node.id.includes('param')) {
        node.disabled = !parameters;
      }
      return node;
    });
    this.setState({
      data: Object.assign({}, data, { nodes }),
      parameters
    });
  }

  onToggleTextLabels(textLabels) {
    this.setState({ textLabels });
  }

  onChangeActivePipeline(activeData) {
    this.setState({ activeData });
  }

  render() {
    const { activeData, data, parameters, textLabels, view } = this.state;

    if (!data) {
      return null;
    }

    return (
      <ChartWrapper
        {...this.props}
        {...this.state}
        onChangeActivePipeline={this.onChangeActivePipeline.bind(this)}
        onChangeView={this.onChangeView.bind(this)}
        onNodeUpdate={this.onNodeUpdate.bind(this)}
        onToggleParameters={this.onToggleParameters.bind(this)}
        onToggleTextLabels={this.onToggleTextLabels.bind(this)}
        chartParams={{
          data: activeData,
          onNodeUpdate: this.onNodeUpdate.bind(this),
          parameters,
          textLabels,
          view,
        }} />
    );
  }
}

Store.propTypes = {
  data: PropTypes.array,
  allowUploads: PropTypes.bool,
  showHistory: PropTypes.bool,
};

Store.defaultProps = {
  data: null,
  /**
   * Show/hide button to upload data snapshots to StudioAI
   */
  allowUploads: true,
  showHistory: false,
};

export default Store;
