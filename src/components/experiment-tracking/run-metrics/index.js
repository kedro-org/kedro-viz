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
      className={classnames('details-stats', {
        'details-stats--single': isSingleRun,
      })}
    >
      {runs.map((run, runIndex) => {
        const { details: runDetails } = run;
        let markup = null;

        if (runDetails && Object.keys(runDetails).length !== 0) {
          markup = Object.entries(runDetails).map(([key, value], rowIndex) => {
            return (
              <Accordion
                className="run-details__accordion"
                heading={key}
                headingClassName="run-details__accordion-header"
                hideContent={collapseAccordion[rowIndex]}
                hideHeading={runIndex >= 1 ? true : false}
                key={key + rowIndex}
                layout="left"
                onCallback={() => onAccordionClick(rowIndex)}
                size="large"
              >
                {value.map((metric, metricIndex) => {
                  return nameThis();

                  function nameThis() {
                    for (const [key, value] of Object.entries(metric)) {
                      return (
                        <div className="metric-data-wrapper" key={key}>
                          {metricIndex === 0 &&
                          rowIndex === 0 &&
                          runIndex === 0 ? (
                            <div className="row-labels">
                              <span
                                className={classnames(
                                  'metric-label metric-label--small',
                                  {
                                    'metric-label--single': isSingleRun,
                                  }
                                )}
                              >
                                Name
                              </span>
                              <span
                                className={classnames(
                                  'metric-label metric-label--small',
                                  {
                                    'metric-label--single': isSingleRun,
                                  }
                                )}
                              >
                                Value
                              </span>
                            </div>
                          ) : metricIndex === 0 &&
                            rowIndex === 0 &&
                            runIndex === 1 ? (
                            <div className="row-labels">
                              <span
                                className={classnames(
                                  'metric-label metric-label--small',
                                  {
                                    'metric-label--single': isSingleRun,
                                  }
                                )}
                              >
                                Value
                              </span>
                            </div>
                          ) : metricIndex === 0 &&
                            rowIndex === 0 &&
                            runIndex === 2 ? (
                            <div className="row-labels">
                              <span
                                className={classnames(
                                  'metric-label metric-label--small',
                                  {
                                    'metric-label--single': isSingleRun,
                                  }
                                )}
                              >
                                Value
                              </span>
                            </div>
                          ) : null}
                          <div className="row-values">
                            {runIndex === 0 ? (
                              <span
                                className={classnames('metric-label', {
                                  'metric-label--single': isSingleRun,
                                })}
                              >
                                {key}
                              </span>
                            ) : null}
                            <span
                              className={classnames('metric-value', {
                                'metric-value--single': isSingleRun,
                              })}
                            >
                              {value}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  }
                })}
              </Accordion>
            );
          });
        }

        return (
          <div className="run" key={run.id}>
            {markup}
          </div>
        );
      })}
    </div>
  );
};

export default RunMetrics;
