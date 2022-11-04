import React, { useState } from 'react';
import classnames from 'classnames';
import { data } from '../mock-data';

import { ParallelCoordinates } from '../parallel-coordinates/parallel-coordinates.js';
import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

const MetricsPlots = ({ selectedRunIds }) => {
  const [activeTab, setActiveTab] = useState(tabLabels[0]);

  return (
    <div className="metrics-plots-wrapper">
      <div className="kedro chart-types-wrapper">
        {tabLabels.map((tab) => {
          return (
            <div
              className={classnames('chart-types-wrapper__tab', {
                'chart-types-wrapper__tab--active': activeTab === tab,
              })}
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 14, marginTop: 30 }}>
        {activeTab === tabLabels[0] ? (
          'Time-series chart goes here'
        ) : (
          <ParallelCoordinates DATA1={data} selectedRuns={selectedRunIds} />
        )}
      </div>
    </div>
  );
};

export default MetricsPlots;
