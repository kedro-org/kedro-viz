import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setView, resetStateForWorkflowView } from '../../actions';
import Workflow from '../workflow/workflow';
import { loadPipelineData } from '../../actions/pipelines';
import { isRunStatusAvailable } from '../../selectors/run-status';
import RunNotFoundWarning from '../run-not-found-warning/run-not-found-warning';
import { VIEW, PIPELINE } from '../../config';

/**
 * Main workflow container.
 * Sets the current view to 'workflow' and resets relevant state on mount.
 */
const WorkflowWrapper = ({
  onSetView,
  onResetState,
  isRunStatusAvailable,
  nodeIds,
}) => {
  useEffect(() => {
    onSetView(VIEW.WORKFLOW);
    // Reset state only after pipelines are loaded
    // This is to ensure that the workflow view is reset correctly
    if (nodeIds.length > 0) {
      onResetState();
    }
  }, [onSetView, onResetState, nodeIds]);

  return <>{isRunStatusAvailable ? <Workflow /> : <RunNotFoundWarning />}</>;
};

export const mapStateToProps = (state) => ({
  isRunStatusAvailable: isRunStatusAvailable(state),
  nodeIds: state.node.ids,
});

const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => dispatch(setView(view)),
  onResetState: () => {
    dispatch(resetStateForWorkflowView());
    dispatch(loadPipelineData(PIPELINE.DEFAULT));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowWrapper);
