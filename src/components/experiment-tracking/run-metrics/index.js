import React, { useState } from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';

import './run-metrics.css';

const RunMetrics = ({ runs }) => {
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
            ([objectName, valuesArray], rowIndex) => {
              return (
                <Accordion
                  className="details-dataset__accordion"
                  heading={objectName}
                  headingClassName="details-dataset__accordion-header"
                  hideContent={collapseAccordion[rowIndex]}
                  hideHeading={runIndex >= 1 ? true : false}
                  key={objectName + rowIndex}
                  layout="left"
                  onCallback={() => onAccordionClick(rowIndex)}
                  size="large"
                >
                  {valuesArray.map((data, dataIndex) => {
                    return buildDatasetDataMarkup(
                      data,
                      dataIndex,
                      rowIndex,
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

function buildDatasetDataMarkup(
  data,
  dataIndex,
  rowIndex,
  runIndex,
  isSingleRun
) {
  for (const [key, value] of Object.entries(data)) {
    const isFirstRow = dataIndex === 0 && rowIndex === 0;
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

export default RunMetrics;
