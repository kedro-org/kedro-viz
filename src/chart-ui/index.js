import React, { Component } from 'react';
import './chart-ui.css';

class ChartUI extends Component {
  render() {
    const { textLabels, onToggleTextLabels } = this.props;
    return (
      <div className="chart-ui">
        <button onClick={onToggleTextLabels}>Toggle labels</button>
      </div>
    );
  }
}

export default ChartUI;
