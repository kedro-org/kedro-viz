import React, { useState } from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';

import './run-dataset.css';

/**
 * Display the dataset of the experiment tracking run.
 * @param {array} props.runs The experiment tracking run data.
 */
const RunDataset = ({ runs }) => {
  const isSingleRun = runs.length === 1 ? true : false;

  let initialState = {};
  for (let i = 0; i < runs.length; i++) {
    initialState[i] = false;
  }

  const [collapseAccordion, setCollapseAccordion] = useState(initialState);

  const onAccordionClick = (key) => {
    setCollapseAccordion({
      ...collapseAccordion,
      [key]: !collapseAccordion[key],
    });
  };

  return (
    <div
      className={classnames('details-dataset', {
        'details-dataset--single': isSingleRun,
      })}
    >
      {runs.map((run, runIndex) => {
        const { details: runDetails } = run;
        let markup = null;

        if (runDetails && Object.keys(runDetails).length !== 0) {
          markup = Object.entries(runDetails).map(
            ([objectName, valuesArray], datasetIndex) => {
              return (
                <Accordion
                  className="details-dataset__accordion"
                  heading={objectName}
                  headingClassName="details-dataset__accordion-header"
                  hideHeading={runIndex >= 1 ? true : false}
                  isCollapsed={collapseAccordion[datasetIndex]}
                  key={objectName + datasetIndex}
                  layout="left"
                  onCallback={() => onAccordionClick(datasetIndex)}
                  size="large"
                >
                  {valuesArray.map((data, dataIndex) => {
                    return buildDatasetDataMarkup(
                      data,
                      dataIndex,
                      datasetIndex,
                      runIndex,
                      isSingleRun
                    );
                  })}
                </Accordion>
              );
            }
          );
        }

        return (
          <div className="details-dataset__run" key={run.id}>
            {markup}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Build the necessary markup used to display the run dataset.
 * @param {object} data A single dataset object from a run.
 * @param {number} dataIndex The array index of the dataset data.
 * @param {number} datasetIndex The array index of the datasets.
 * @param {number} runIndex The array index of the experiment runs.
 * @param {boolean} isSingleRun Whether or not this is a single run or multiple.
 */
function buildDatasetDataMarkup(
  data,
  dataIndex,
  datasetIndex,
  runIndex,
  isSingleRun
) {
  for (const [key, value] of Object.entries(data)) {
    const isFirstRow = dataIndex === 0 && datasetIndex === 0;
    const valueLabelMarkup = (
      <span
        className={classnames('details-dataset__value-header', {
          'details-dataset__value-header--single': isSingleRun,
        })}
      >
        Value
      </span>
    );
    let labelsMarkup;

    if (isFirstRow) {
      if (runIndex === 0) {
        labelsMarkup = (
          <div className="details-dataset__labels">
            <span
              className={classnames('details-dataset__name-header', {
                'details-dataset__value-header--single': isSingleRun,
              })}
            >
              Name
            </span>
            {valueLabelMarkup}
          </div>
        );
      } else {
        labelsMarkup = (
          <div className="details-dataset__labels">{valueLabelMarkup}</div>
        );
      }
    }

    return (
      <div className="details-dataset__data" key={key}>
        {labelsMarkup}
        <div className="details-dataset__values">
          {runIndex === 0 ? (
            <span
              className={classnames('details-dataset__label', {
                'details-dataset__label--single': isSingleRun,
              })}
            >
              {key}
            </span>
          ) : null}
          <span
            className={classnames('details-dataset__value', {
              'details-dataset__value--single': isSingleRun,
            })}
          >
            {value}
          </span>
        </div>
      </div>
    );
  }
}

export default RunDataset;
