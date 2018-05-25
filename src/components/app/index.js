import React, { Component } from 'react';
import ChartUI from '../chart-ui';
import FlowChart from '../flowchart';
import fetchData from '../../utils/fetch-data';
import generateRandomData from '../../utils/randomData';
import config from '../../config';
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

  componentWillMount() {
    // Setup transitions for theme change and menu toggle, but only after mounting
    document.body.style.transition =
      'background ease 0.2s, transform ease 0.4s';
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
      <div className="app">
        <ChartUI
          data={data}
          onChangeView={this.onChangeView.bind(this)}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          onToggleParameters={this.onToggleParameters.bind(this)}
          onToggleTextLabels={this.onToggleTextLabels.bind(this)}
          parameters={parameters}
          textLabels={textLabels}
          theme={theme}
          view={view}
        />
        <FlowChart
          data={data}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          parameters={parameters}
          textLabels={textLabels}
          view={view}
        />
      </div>
    );
  }
}

export default App;
