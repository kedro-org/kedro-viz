import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { TimeSeries } from '../time-series/time-series.js';

import { ParallelCoordinates } from '../parallel-coordinates/parallel-coordinates.js';
import { GET_METRIC_PLOT_DATA } from '../../../apollo/queries';
import { useApolloQuery } from '../../../apollo/utils';
import SelectDropdown from '../select-dropdown';
import { saveLocalStorage, loadLocalStorage } from '../../../store/helpers';
import { metricLimit, localStorageMetricsSelect } from '../../../config';
import {
  removeChildFromObject,
  removeElementsFromObjectValues,
} from '../../../utils/sorting-data';

import './metrics-plots.css';

const tabLabels = ['Time-series', 'Parallel coordinates'];

const getData = (runMetricsData, runData, selectedMetrics) => {
  const metrics =
    runMetricsData?.data && Object.keys(runMetricsData?.data.metrics);
  const originalMetricsData =
    runMetricsData?.data && runMetricsData?.data.metrics;
  const originalRunsData = runMetricsData?.data && runMetricsData?.data.runs;

  const missing = {};

  metrics.map((metric, index) => {
    if (selectedMetrics.indexOf(metric) === -1) {
      missing[metric] = index;
    }
    return missing;
  });

  const updatedMetrics = removeChildFromObject(originalMetricsData, missing);
  const updatedRuns = removeElementsFromObjectValues(originalRunsData, missing);

  return {
    ...runData,
    metrics: updatedMetrics,
    runs: updatedRuns,
  };
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
  const numberOfMetrics = metrics ? metrics.length : 0;

  // set data to component state so we can hide/show without changing data from BE
  // for SelectDropdown component
  // it gets the value stored in localStorage
  useEffect(() => {
    if (runMetricsData?.data) {
      const selectMetricsValues = loadLocalStorage(localStorageMetricsSelect);

      setSelectedDropdownValues(selectMetricsValues[0]);

      const updatedRunData = getData(
        runMetricsData,
        runData,
        selectMetricsValues[0]
      );

      setRunData(updatedRunData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runMetricsData, numberOfMetrics]);

  // manipulate the runMetricsData here
  const onSelectedDropdownChanged = (selectedValues) => {
    // Aside from setting the selected values to the state
    // we also want to store this localStorage
    setSelectedDropdownValues(selectedValues);
    saveLocalStorage(localStorageMetricsSelect, [selectedValues]);
    const updatedRunData = getData(runMetricsData, runData, selectedValues);

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
