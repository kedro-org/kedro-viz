import React from 'react';
import lodash from 'lodash';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';
import { sanitizeValue } from '../../../utils/experiment-tracking-utils';

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
            heading={lodash.startCase(group)}
            key={group}
            layout="left"
            size="large"
          >
            {trackingData[group].map((dataset) => {
              const { data, datasetName } = dataset;

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
                        rowIndex,
                        isSingleRun,
                        pinnedRun,
                        enableShowChanges,
                        selectedRunIds
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
  rowIndex,
  isSingleRun,
  pinnedRun,
  enableShowChanges,
  selectedRunIds
) {
  const updatedDatasetValues = fillEmptyMetrics(datasetValues, selectedRunIds);
  const runDataWithPin = resolveRunDataWithPin(updatedDatasetValues, pinnedRun);

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
        {runDataWithPin.map((data, index) => (
          <span
            className={classnames('details-dataset__value', {
              'details-dataset__value--single': isSingleRun,
            })}
            key={data.runId + index}
          >
            {sanitizeValue(data.value)}
            {enableShowChanges && <PinArrowIcon icon={data.pinIcon} />}
          </span>
        ))}
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
