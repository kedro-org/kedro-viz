import React from 'react';
import { connect } from 'react-redux';

import { isRunStatusAvailable } from '../../selectors/run-status';
import Workflow from '../workflow/workflow';
import NoRunStatus from '../no-run-status/no-run-status';

/**
 * Main workflow container. Handles showing/hiding run status and no data messages
 * as well as the display of all related modals.
 */
export const WorkflowWrapper = ({ isRunStatusAvailable }) => {
  return <>{isRunStatusAvailable ? <Workflow /> : <NoRunStatus />}</>;
};

export const mapStateToProps = (state) => ({
  isRunStatusAvailable: isRunStatusAvailable(state),
});

export default connect(mapStateToProps)(WorkflowWrapper);
