import React, { Component } from 'react';
import ChartUI from '../chart-ui';
import FlowChart from '../flowchart';
import generateRandomData from '../../utils/randomData';
import './app.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.data = generateRandomData();
    this.state = {
      textLabels: false,
      theme: 'dark'
    };
  }

  componentWillMount() {
    // Setup transitions for theme change and menu toggle, but only after mounting
    document.body.style.transition =
      'background ease 0.2s, transform ease 0.4s';
  }

  render() {
    const { textLabels, theme } = this.state;

    return (
      <div className="App">
        <FlowChart textLabels={textLabels} data={this.data} />
        <ChartUI
          textLabels={textLabels}
          theme={theme}
          onToggleTextLabels={textLabels => {
            this.setState({ textLabels });
          }}
        />
      </div>
    );
  }
}

export default App;
