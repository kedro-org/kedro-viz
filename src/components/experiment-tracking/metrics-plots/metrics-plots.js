import React, { useState } from 'react';
import classnames from 'classnames';

import { GET_METRIC_PLOT_DATA } from '../../../apollo/queries';
import { useApolloQuery } from '../../../apollo/utils';

import { METRIC_LIMIT } from '../../../config';

import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

const MetricsPlots = () => {
  const [activeTab, setActiveTab] = useState(tabLabels[0]);

  // Fetch metric plot data for
  const { data: { runMetricsData = [] } = [] } = useApolloQuery(
    GET_METRIC_PLOT_DATA,
    {
      variables: { limit: METRIC_LIMIT },
    }
  );

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
        {activeTab === tabLabels[0]
          ? 'Time-series chart goes here'
          : 'Parallel-coordinates chart goes here'}
      </div>
    </div>
  );
};

export default MetricsPlots;
