import React, { Component } from 'react';
import ChartUI from '../chart-ui';
import FlowChart from '../flowchart';
import generateRandomData from '../utils/randomData';
import './app.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.data = generateRandomData();
    this.state = {
      textLabels: false
    };
  }

  render() {
    const { textLabels } = this.state;

    return (
      <div className="App">
        <FlowChart textLabels={textLabels} data={this.data} />
        <ChartUI
          textLabels={textLabels}
          onToggleTextLabels={() => {
            this.setState({
              textLabels: !textLabels
            });
          }}
        />
      </div>
    );
  }
}

export default App;
