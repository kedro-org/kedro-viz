import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';
import PlotlyChart from '../../plotly-chart';
import { sanitizeValue } from '../../../utils/experiment-tracking-utils';
import getShortType from '../../../utils/short-type';
import './run-dataset.css';

const determinePinIcon = (data, pinValue, pinnedRun) => {
  if (data.runId !== pinnedRun && typeof data.value === 'number') {
    if (data.value > pinValue) {
      return 'upArrow';
    }
    if (data.value < pinValue) {
      return 'downArrow';
    }
  }
  return null;
};

const resolveRunDataWithPin = (runData, pinnedRun) => {
  const pinValue = runData.filter((data) => data.runId === pinnedRun)[0]?.value;

  if (typeof pinValue === 'number') {
    return runData.map((data) => ({
      pinIcon: determinePinIcon(data, pinValue, pinnedRun),
      ...data,
    }));
  }

  return runData;
};

/**
 * Display the dataset of the experiment tracking run.
 * @param {boolean} props.enableShowChanges Are changes enabled or not.
 * @param {boolean} props.isSingleRun Indication to display a single run.
 * @param {string} props.pinnedRun ID of the pinned run.
 * @param {array} props.selectedRunIds Array of strings of runIds.
 * @param {array} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({
  enableShowChanges,
  isSingleRun,
  pinnedRun,
  selectedRunIds,
  setRunDatasetToShow,
  setRunDatasetType,
  setShowRunPlotsModal,
  trackingData,
}) => {
  return (
    <div
      className={classnames('details-dataset', {
        'details-dataset--single': isSingleRun,
      })}
    >
      {Object.keys(trackingData).map((group) => {
        return (
          <Accordion
            className="details-dataset__accordion"
            headingClassName="details-dataset__accordion-header"
            heading={group}
            key={group}
            layout="left"
            size="large"
          >
            {trackingData[group].map((dataset) => {
              const { data, datasetType, datasetName } = dataset;

              return (
                <Accordion
                  className="details-dataset__accordion"
                  heading={datasetName}
                  headingClassName="details-dataset__accordion-header"
                  key={datasetName}
                  layout="left"
                  size="medium"
                >
                  {Object.keys(data)
                    .sort((a, b) => {
                      return a.localeCompare(b);
                    })
                    .map((key, rowIndex) => {
                      return buildDatasetDataMarkup(
                        key,
                        dataset.data[key],
                        datasetType,
                        rowIndex,
                        isSingleRun,
                        pinnedRun,
                        enableShowChanges,
                        selectedRunIds,
                        setRunDatasetToShow,
                        setShowRunPlotsModal,
                        setRunDatasetType
                      );
                    })}
                </Accordion>
              );
            })}
          </Accordion>
        );
      })}
    </div>
  );
};

/**
 * Build the necessary markup used to display the run dataset.
 * @param {string} datasetKey The row label of the data.
 * @param {array} datasetValues A single dataset array from a run.
 * @param {number} rowIndex The array index of the dataset data.
 * @param {boolean} isSingleRun Whether or not this is a single run.
 * @param {string} pinnedRun ID of the pinned run.
 * @param {boolean} enableShowChanges Are changes enabled or not.
 * @param {array} selectedRunIds Array of strings of runIds.
 */
function buildDatasetDataMarkup(
  datasetKey,
  datasetValues,
  datasetType,
  rowIndex,
  isSingleRun,
  pinnedRun,
  enableShowChanges,
  selectedRunIds,
  setRunDatasetToShow,
  setShowRunPlotsModal
) {
  const updatedDatasetValues = fillEmptyMetrics(datasetValues, selectedRunIds);
  const runDataWithPin = resolveRunDataWithPin(updatedDatasetValues, pinnedRun);

  const isPlotlyDataset = getShortType(datasetType) === 'plotly';
  const isImageDataset = getShortType(datasetType) === 'image';
  const isTrackingDataset = getShortType(datasetType) === 'tracking';

  const onExpandVizClick = () => {
    setShowRunPlotsModal(true);
    setRunDatasetToShow({ datasetKey, datasetType, runDataWithPin });
  };

  return (
    <React.Fragment key={datasetKey + rowIndex}>
      {rowIndex === 0 ? (
        <div className="details-dataset__row">
          <span
            className={classnames('details-dataset__name-header', {
              'details-dataset__value-header--single': isSingleRun,
            })}
          >
            Name
          </span>
          {datasetValues.map((value, index) => (
            <span
              className={classnames('details-dataset__value-header', {
                'details-dataset__value-header--single': isSingleRun,
              })}
              key={value.runId + index}
            >
              Value
            </span>
          ))}
        </div>
      ) : null}
      <div className="details-dataset__row">
        <span
          className={classnames('details-dataset__label', {
            'details-dataset__label--single': isSingleRun,
          })}
        >
          {datasetKey}
        </span>
        {isTrackingDataset &&
          runDataWithPin.map((data) => (
            <span
              className={classnames('details-dataset__value', {
                'details-dataset__value--single': isSingleRun,
              })}
              key={data.runId}
            >
              {sanitizeValue(data.value)}
              {enableShowChanges && <PinArrowIcon icon={data.pinIcon} />}
            </span>
          ))}
        {isPlotlyDataset &&
          runDataWithPin.map((data) => {
            return (
              <React.Fragment key={data.runId}>
                <span
                  className={classnames('details-dataset__value', {
                    'details-dataset__value--single': isSingleRun,
                  })}
                  key={data.runId}
                >
                  <div onClick={onExpandVizClick}>
                    {data.value && (
                      <PlotlyChart
                        data={data.value.data}
                        layout={data.value.layout}
                        view="experiment_preview"
                      />
                    )}
                  </div>
                </span>
              </React.Fragment>
            );
          })}
        {isImageDataset &&
          runDataWithPin.map((data) => {
            return (
              <React.Fragment key={data.runId}>
                <span
                  className={classnames('details-dataset__value', {
                    'details-dataset__value--single': isSingleRun,
                  })}
                >
                  <div
                    className="details-dataset__image-container"
                    onClick={onExpandVizClick}
                  >
                    {data.value && (
                      <img
                        alt="Matplotlib rendering"
                        className="details-dataset__image"
                        src={`data:image/png;base64,${data.value}`}
                      />
                    )}
                  </div>
                </span>
              </React.Fragment>
            );
          })}
      </div>
    </React.Fragment>
  );
}

/**
 * Fill in missing run metrics if they don't match the number of runIds.
 * @param {array} datasetValues Array of objects for a metric, e.g. r2_score.
 * @param {array} selectedRunIds Array of strings of runIds.
 * @returns Array of objects, the length of which matches the length
 * of the selectedRunIds.
 */
function fillEmptyMetrics(datasetValues, selectedRunIds) {
  if (datasetValues.length === selectedRunIds.length) {
    return datasetValues;
  }

  const metrics = [];

  selectedRunIds.forEach((id) => {
    const foundIdIndex = datasetValues.findIndex((item) => {
      return item.runId === id;
    });

    // We didn't find a metric with this runId, so add a placeholder.
    if (foundIdIndex === -1) {
      metrics.push({ runId: id, value: null });
    } else {
      metrics.push(datasetValues[foundIdIndex]);
    }
  });

  return metrics;
}

export default RunDataset;
