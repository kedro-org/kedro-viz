import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { TimeSeries } from '../time-series/time-series.js';

import { ParallelCoordinates } from '../parallel-coordinates/parallel-coordinates.js';
import { GET_METRIC_PLOT_DATA } from '../../../apollo/queries';
import { useApolloQuery } from '../../../apollo/utils';

import { metricLimit } from '../../../config';

import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

const MetricsPlots = ({ selectedRunIds, sidebarVisible }) => {
  const [activeTab, setActiveTab] = useState(tabLabels[0]);
  const [chartHeight, setChartHeight] = useState(0);
  const [parCoordsWidth, setParCoordsWidth] = useState(0);
  const [timeSeriesWidth, setTimeSeriesWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState('auto');

  const { data: { runMetricsData = [] } = [] } = useApolloQuery(
    GET_METRIC_PLOT_DATA,
    {
      variables: { limit: metricLimit },
    }
  );

  useEffect(() => {
    if (runMetricsData?.data) {
      const numberOfMetrics = Object.keys(runMetricsData?.data.metrics).length;

      if (numberOfMetrics > 5 && activeTab === tabLabels[1]) {
        setContainerWidth(numberOfMetrics * 200);
        setParCoordsWidth(numberOfMetrics * 200);
      } else {
        setContainerWidth('auto');
        setParCoordsWidth(
          document.querySelector('.metrics-plots-wrapper__charts').clientWidth
        );
      }
    }
  }, [activeTab, runMetricsData]);

  useEffect(() => {
    setTimeSeriesWidth(
      document.querySelector('.metrics-plots-wrapper__charts').clientWidth
    );
    setChartHeight(
      document.querySelector('.metrics-plots-wrapper__charts').clientHeight
    );
  }, []);

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
      <div
        className="metrics-plots-wrapper__charts"
        style={{ width: containerWidth }}
      >
        {runMetricsData?.data ? (
          activeTab === tabLabels[0] ? (
            <TimeSeries
              chartWidth={timeSeriesWidth - 100}
              metricsData={runMetricsData?.data}
              selectedRuns={selectedRunIds}
              sidebarVisible={sidebarVisible}
            />
          ) : (
            <ParallelCoordinates
              chartHeight={chartHeight}
              chartWidth={parCoordsWidth}
              metricsData={runMetricsData?.data}
              selectedRuns={selectedRunIds}
              sidebarVisible={sidebarVisible}
            />
          )
        ) : null}
      </div>
    </div>
  );
};

export default MetricsPlots;
