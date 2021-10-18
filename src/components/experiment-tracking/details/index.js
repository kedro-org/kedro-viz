import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { runs } from './mock-data';
import Accordion from '../accordion';
import RunMetadata from '../run-metadata';

import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking, the display of experiment details,
 * as well as the comparison view.
 */
const Details = ({ sidebarVisible }) => {
  const isSingleRun = runs.length === 1 ? true : false;

  return (
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata isSingleRun={isSingleRun} runs={runs} />
        <div className="details-stats">
          <Accordion heading="Metrics" layout="left" size="large">
            <Accordion
              heading="Digital Analysis"
              layout="left"
              size="medium"
            ></Accordion>
          </Accordion>
        </div>
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
