import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';

import './run-dataset.css';

/**
 * Display the dataset of the experiment tracking run.
 * @param {array} props.isSingleRun Whether or not this is a single run.
 * @param {array} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({ isSingleRun, trackingData }) => {
  return (
    <div
      className={classnames('details-dataset', {
        'details-dataset--single': isSingleRun,
      })}
    >
      {trackingData.map((dataset) => {
        return (
          <Accordion
            className="details-dataset__accordion"
            heading={dataset.datasetName}
            headingClassName="details-dataset__accordion-header"
            key={dataset.datasetName}
            layout="left"
            size="large"
          >
            {dataset.data.map((dataObject, rowIndex) => {
              return buildDatasetDataMarkup(dataObject, rowIndex, isSingleRun);
            })}
          </Accordion>
        );
      })}
    </div>
  );
};

/**
 * Build the necessary markup used to display the run dataset.
 * @param {object} data A single dataset object from a run.
 * @param {number} rowIndex The array index of the dataset data.
 * @param {boolean} isSingleRun Whether or not this is a single run.
 */
function buildDatasetDataMarkup(data, rowIndex, isSingleRun) {
  for (const [datasetKey, datasetValues] of Object.entries(data)) {
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
          {datasetValues.map((value, index) => (
            <span
              className={classnames('details-dataset__value', {
                'details-dataset__value--single': isSingleRun,
              })}
              key={value.runId + index}
            >
              {value.value}
            </span>
          ))}
        </div>
      </React.Fragment>
    );
  }
}

export default RunDataset;
