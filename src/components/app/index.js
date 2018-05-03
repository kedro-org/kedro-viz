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

  onHighlightNodes(nodeID, highlighted) {
    const { data } = this.state;
    const nodes = data.nodes.map(node => {
      node.highlighted = node.id === nodeID;
      return node;
    });
    this.setState({
      data: Object.assign({}, data, { nodes })
    });
  }

  onToggleNodes(nodeID, disabled) {
    const { data } = this.state;
    const nodes = data.nodes.map(node => {
      if (node.id === nodeID) {
        node.disabled = disabled;
      }
      return node;
    });
    this.setState({
      data: Object.assign({}, data, { nodes })
    });
  }

  render() {
    const { data, textLabels, theme } = this.state;

    return (
      <div className="App">
        <FlowChart data={data} textLabels={textLabels} />
        <ChartUI
          data={data}
          onHighlightNodes={this.onHighlightNodes.bind(this)}
          onToggleTextLabels={textLabels => {
            this.setState({ textLabels });
          }}
          onToggleNodes={this.onToggleNodes.bind(this)}
          textLabels={textLabels}
          theme={theme}
        />
      </div>
    );
  }
}

export default App;
