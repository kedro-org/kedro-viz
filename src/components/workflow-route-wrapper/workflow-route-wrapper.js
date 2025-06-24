import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setView } from '../../actions';
import { loadPipelineData } from '../../actions/pipelines';
import { toggleFocusMode, toggleExpandAllPipelines } from '../../actions';
import { toggleModularPipelinesVisibilityState } from '../../actions/modular-pipelines';
import { VIEW, PIPELINE } from '../../config';
import Workflow from '../workflow';

/**
 * Workflow route wrapper component that handles its own state initialization
 * This component resets the chart state independently so changes in Flowchart view don't affect it
 */
const WorkflowRouteWrapper = ({
  onSetView,
  onUpdateActivePipeline,
  onToggleExpandAllPipelines,
  onToggleModularPipelinesVisibilityState,
  onToggleFocusMode,
}) => {
  useEffect(() => {
    // Set the view to workflow
    onSetView(VIEW.WORKFLOW);

    // Reset workflow state independently - this ensures that changes in Flowchart
    // view don't affect the Workflow view
    onUpdateActivePipeline(PIPELINE.DEFAULT);
    onToggleFocusMode(null);
    onToggleExpandAllPipelines(true);
    onToggleModularPipelinesVisibilityState(true);
  }, [
    onSetView,
    onUpdateActivePipeline,
    onToggleExpandAllPipelines,
    onToggleModularPipelinesVisibilityState,
    onToggleFocusMode,
  ]);

  return <Workflow />;
};

const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => {
    dispatch(setView(view));
  },
  onUpdateActivePipeline: (pipelineID) => {
    dispatch(loadPipelineData(pipelineID));
  },
  onToggleFocusMode: (focusMode) => {
    dispatch(toggleFocusMode(focusMode));
  },
  onToggleExpandAllPipelines: (isExpanded) => {
    dispatch(toggleExpandAllPipelines(isExpanded));
  },
  onToggleModularPipelinesVisibilityState: (isExpanded) => {
    dispatch(toggleModularPipelinesVisibilityState(isExpanded));
  },
});

export default connect(null, mapDispatchToProps)(WorkflowRouteWrapper);
