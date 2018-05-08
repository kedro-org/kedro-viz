import React, { Component } from 'react';
import ChartUI from '../chart-ui';
import FlowChart from '../flowchart';
import generateRandomData from '../../utils/randomData';
import './app.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: generateRandomData(),
      textLabels: false,
      theme: 'dark'
    };
  }

  componentWillMount() {
    // Setup transitions for theme change and menu toggle, but only after mounting
    document.body.style.transition =
      'background ease 0.2s, transform ease 0.4s';
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

  onToggleTextLabels(textLabels) {
    this.setState({ textLabels });
  }

  render() {
    const { data, textLabels, theme } = this.state;

    return (
      <div className="app">
        <FlowChart
          data={data}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          textLabels={textLabels}
        />
        <ChartUI
          data={data}
          onNodeUpdate={this.onNodeUpdate.bind(this)}
          onToggleTextLabels={this.onToggleTextLabels.bind(this)}
          textLabels={textLabels}
          theme={theme}
        />
      </div>
    );
  }
}

export default App;
