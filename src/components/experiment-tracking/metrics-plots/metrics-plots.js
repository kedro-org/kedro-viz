import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { TimeSeries } from '../time-series/time-series.js';

import { ParallelCoordinates } from '../parallel-coordinates/parallel-coordinates.js';
import { GET_METRIC_PLOT_DATA } from '../../../apollo/queries';
import { useApolloQuery } from '../../../apollo/utils';
import SelectDropdown from '../select-dropdown';

import { metricLimit } from '../../../config';

import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

// shoudl rename to be more generic
function removeElementFromMetrics(originalObj, array) {
  let res = { ...originalObj };
  // eslint-disable-next-line array-callback-return
  array.map((each) => {
    const { [each]: unused, ...rest } = res;

    return (res = { ...rest });
  });

  return res;
}

// shoudl rename to be more generic
const removeElementsFromRuns = (obj, array) => {
  let res = {};
  for (const [key, value] of Object.entries(obj)) {
    let newVal = [...value];

    // eslint-disable-next-line array-callback-return
    // array.map((each, index) => {
    //   newVal.splice(array[index], 1);
    // });

    newVal = newVal.filter(function (value, index) {
      return array.indexOf(index) === -1;
    });

    res[key] = newVal;
  }

  return res;
};

const MetricsPlots = ({ selectedRunIds, sidebarVisible }) => {
  const [activeTab, setActiveTab] = useState(tabLabels[0]);
  const [chartHeight, setChartHeight] = useState(0);
  const [parCoordsWidth, setParCoordsWidth] = useState(0);
  const [timeSeriesWidth, setTimeSeriesWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState('auto');

  // states for SelectDropdown component
  const [runData, setRunData] = useState({});
  const [selectedDropdownValues, setSelectedDropdownValues] = useState(0);

  const { data: { runMetricsData = [] } = [] } = useApolloQuery(
    GET_METRIC_PLOT_DATA,
    {
      variables: { limit: metricLimit },
    }
  );

  const metrics =
    runMetricsData?.data && Object.keys(runMetricsData?.data.metrics);

  const originalMetricsData =
    runMetricsData?.data && runMetricsData?.data.metrics;

  const originalRunsData = runMetricsData?.data && runMetricsData?.data.runs;

  const numberOfMetrics = runMetricsData?.data
    ? Object.keys(runMetricsData?.data.metrics).length
    : 0;

  // set data to component state so we can hide/show without changing data from BE
  // for SelectDropdown component
  useEffect(() => {
    if (runMetricsData?.data) {
      setRunData(runMetricsData?.data);
      setSelectedDropdownValues(Object.keys(runMetricsData.data.metrics));
    }
  }, [runMetricsData, numberOfMetrics]);

  // manipulate the runMetricsData here
  const onSelectedDropdownChanged = (selectedValues) => {
    setSelectedDropdownValues(selectedValues);
    const missing = {};

    // eslint-disable-next-line array-callback-return
    metrics.map((metric, index) => {
      if (selectedValues.indexOf(metric) === -1) {
        missing[metric] = index;
      }
      return missing;
    });

    // here can be we decide to remove or add metrics?
    const updatedMetrics = removeElementFromMetrics(
      originalMetricsData,
      Object.keys(missing)
    );

    // here can be we decide to remove or add runs?
    const updatedRuns = removeElementsFromRuns(
      originalRunsData,
      Object.values(missing)
    );

    const updatedRunData = {
      ...runData,
      metrics: updatedMetrics,
      runs: updatedRuns,
    };

    debugger;
    setRunData(updatedRunData);
  };

  useEffect(() => {
    if (numberOfMetrics > 0) {
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
  }, [activeTab, numberOfMetrics]);

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
      <div className="metrics-plots-wrapper__header">
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
        <SelectDropdown
          dropdownValues={metrics}
          selectedDropdownValues={selectedDropdownValues}
          onChange={onSelectedDropdownChanged}
        />
      </div>

      <div
        className="metrics-plots-wrapper__charts"
        style={{ width: containerWidth }}
      >
        {Object.keys(runData).length > 0 ? (
          activeTab === tabLabels[0] ? (
            <TimeSeries
              chartWidth={timeSeriesWidth - 100}
              metricsData={runData}
              selectedRuns={selectedRunIds}
              sidebarVisible={sidebarVisible}
            />
          ) : (
            <ParallelCoordinates
              chartHeight={chartHeight}
              chartWidth={parCoordsWidth}
              metricsData={runData}
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
