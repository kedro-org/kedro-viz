import React, { useState } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import Accordion from '../accordion';
import RunMetadata from '../run-metadata';

import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking, the display of experiment details,
 * as well as the comparison view.
 */
const Details = ({ runs, sidebarVisible }) => {
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
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata isSingleRun={isSingleRun} runs={runs} />
        <div className="details-stats">
          {runs.map((run, runIndex) => {
            const { details: runDetails } = run;
            let markup = null;

            if (runDetails && Object.keys(runDetails).length !== 0) {
              markup = Object.entries(runDetails).map(
                ([key, value], rowIndex) => {
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
                                    <span className="metric-label metric-label--small">
                                      Name
                                    </span>
                                    <span className="metric-value metric-value--small">
                                      Value
                                    </span>
                                  </div>
                                ) : metricIndex === 0 &&
                                  rowIndex === 0 &&
                                  runIndex === 1 ? (
                                  <div className="row-labels">
                                    <span className="metric-value metric-value--small">
                                      Value
                                    </span>
                                  </div>
                                ) : metricIndex === 0 &&
                                  rowIndex === 0 &&
                                  runIndex === 2 ? (
                                  <div className="row-labels">
                                    <span className="metric-value metric-value--small">
                                      Value
                                    </span>
                                  </div>
                                ) : null}
                                <div className="row-values">
                                  {runIndex === 0 ? (
                                    <span className="metric-label">{key}</span>
                                  ) : null}
                                  <span className="metric-value">{value}</span>
                                </div>
                              </div>
                            );
                          }
                        }
                      })}
                    </Accordion>
                  );
                }
              );
            }

            return (
              <div className="run" key={run.id}>
                {markup}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
