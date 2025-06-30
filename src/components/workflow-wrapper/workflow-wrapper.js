import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setView, resetStateForWorkflowView } from '../../actions';
import Workflow from '../workflow/workflow';
import { loadPipelineData } from '../../actions/pipelines';
import { VIEW, PIPELINE } from '../../config';

/**
 * Main workflow container.
 * Sets the current view to 'workflow' and resets relevant state on mount.
 */
const WorkflowWrapper = ({ onSetView, onResetState }) => {
  useEffect(() => {
    onSetView(VIEW.WORKFLOW);
    onResetState();
  }, [onSetView, onResetState]);

  return <Workflow />;

  // To enable run status fallback later:
  // import { isRunStatusAvailable } from '../../selectors/run-status';
  // import NoRunStatus from '../no-run-status/no-run-status';
  // return <>{isRunStatusAvailable ? <Workflow /> : <NoRunStatus />}</>;
};

const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => dispatch(setView(view)),
  onResetState: () => {
    dispatch(resetStateForWorkflowView());
    dispatch(loadPipelineData(PIPELINE.DEFAULT));
  },
});

export default connect(null, mapDispatchToProps)(WorkflowWrapper);
