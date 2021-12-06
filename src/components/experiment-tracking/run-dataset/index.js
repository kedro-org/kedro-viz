import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';

import './run-dataset.css';

const santizeValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '-';
  } else if (typeof value === 'object' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  return value;
};

/**
 * Display the dataset of the experiment tracking run.
 * @param {array} props.isSingleRun Whether or not this is a single run.
 * @param {array} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({ isSingleRun, trackingData = [] }) => {
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
                  isSingleRun
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
  isSingleRun
) {
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
        {datasetValues.map((data, index) => (
          <span
            className={classnames('details-dataset__value', {
              'details-dataset__value--single': isSingleRun,
            })}
            key={data.runId + index}
          >
            {santizeValue(data.value)}
          </span>
        ))}
      </div>
    </React.Fragment>
  );
}

export default RunDataset;
