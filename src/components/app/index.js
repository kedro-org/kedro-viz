import React, { Component } from 'react';
import ChartWrapper from '../chart-wrapper';
import FlowChart from '../flowchart';
import fetchData from '../../utils/fetch-data';
import generateRandomData from '../../utils/randomData';
import config from '../../config';
import '@quantumblack/carbon-ui-components/dist/carbon-ui.min.css';
import '../../styles/index.css';
import './app.css';

const { env } = config;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: env === 'test' ? generateRandomData() : null,
      parameters: true,
      textLabels: false,
      view: 'combined',
      theme: 'dark'
    };

    if (env !== 'test') {
      fetchData().then(data => {
        this.setState({ data });
      });
    }
  }

  onChangeView(e, { value }) {
    this.setState({
      view: value
    });
  }

  onNodeUpdate(nodeID, property, value) {
    const { data } = this.state;
    const nodes = data.nodes.map(node => {
      if (node.id === nodeID) {
        node[property] = value;
      }
      return node;
    });
    this.setState({
      data: Object.assign({}, data, { nodes })
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

  render() {
    const { data, parameters, textLabels, theme, view } = this.state;

    if (!data) {
      return null;
    }

    return (
      <ChartWrapper
        data={data}
        onChangeView={this.onChangeView.bind(this)}
        onNodeUpdate={this.onNodeUpdate.bind(this)}
        onToggleParameters={this.onToggleParameters.bind(this)}
        onToggleTextLabels={this.onToggleTextLabels.bind(this)}
        parameters={parameters}
        textLabels={textLabels}
        theme={theme}
        view={view}>
        <FlowChart
          data={data}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          parameters={parameters}
          textLabels={textLabels}
          view={view}
        />
      </ChartWrapper>
    );
  }
}

export default App;
