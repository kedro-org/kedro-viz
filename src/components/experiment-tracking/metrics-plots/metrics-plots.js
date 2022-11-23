import React, { useState } from 'react';
import classnames from 'classnames';
import { data } from '../mock-data';
import { TimeSeries } from '../time-series/time-series.js';
import { ParallelCoordinates } from '../parallel-coordinates/parallel-coordinates.js';
import { GET_METRIC_PLOT_DATA } from '../../../apollo/queries';
import { useApolloQuery } from '../../../apollo/utils';

import { metricLimit } from '../../../config';

import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

const MetricsPlots = ({ selectedRunIds }) => {
  const [activeTab, setActiveTab] = useState(tabLabels[0]);

  // Fetch metric plot data for
  const { data: { runMetricsData = [] } = [] } = useApolloQuery(
    GET_METRIC_PLOT_DATA,
    {
      variables: { limit: metricLimit },
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
      <div className="metrics-plots-wrapper__charts">
        {activeTab === tabLabels[0] ? (
          <TimeSeries DATA={data} selectedRuns={selectedRunIds} />
        ) : (
          <ParallelCoordinates DATA={data} selectedRuns={selectedRunIds} />
        )}
      </div>
      <div>{JSON.stringify(runMetricsData, null, 2)}</div>
    </div>
  );
};

export default MetricsPlots;
