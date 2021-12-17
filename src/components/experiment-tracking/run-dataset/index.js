import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';

import './run-dataset.css';

const sanitizeValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '-';
  } else if (typeof value === 'object' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  return value;
};

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
 * @param {array} props.isSingleRun Whether or not this is a single run.
 * @param {array} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({
  isSingleRun,
  trackingData = [],
  pinnedRun,
  enableShowChanges,
}) => {
  return (
    <div
      className={classnames('details-dataset', {
        'details-dataset--single': isSingleRun,
      })}
    >
      {trackingData.map((dataset) => {
        const { data, datasetName } = dataset;

        return (
          <Accordion
            className="details-dataset__accordion"
            heading={datasetName}
            headingClassName="details-dataset__accordion-header"
            key={dataset.datasetName}
            layout="left"
            size="large"
          >
            {Object.keys(data)
              .sort()
              .map((key, rowIndex) => {
                return buildDatasetDataMarkup(
                  key,
                  dataset.data[key],
                  rowIndex,
                  isSingleRun,
                  pinnedRun,
                  enableShowChanges
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
 */
function buildDatasetDataMarkup(
  datasetKey,
  datasetValues,
  rowIndex,
  isSingleRun,
  pinnedRun,
  enableShowChanges
) {
  // function to return new set of runData with appropriate pin from datasetValues and pinnedRun
  const runDataWithPin = resolveRunDataWithPin(datasetValues, pinnedRun);

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

export default RunDataset;
