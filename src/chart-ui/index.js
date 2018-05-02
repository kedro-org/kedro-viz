import React, { Component } from 'react';
import { Button } from '@quantumblack/carbon-ui-components';
import './chart-ui.css';

class ChartUI extends Component {
  render() {
    const { textLabels, onToggleTextLabels } = this.props;
    return (
      <div className="chart-ui">
        <Button onClick={onToggleTextLabels} theme="dark">
          Toggle labels
        </Button>
      </div>
    );
  }
}

export default ChartUI;
