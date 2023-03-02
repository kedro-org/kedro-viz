import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
import {
  getModularPipelinesTree,
  getNodeFullName,
} from '../../selectors/nodes';
import {
  toggleModularPipelineActive,
  toggleModularPipelinesExpanded,
} from '../../actions/modular-pipelines';
import { toggleFocusMode } from '../../actions';
import { loadNodeData } from '../../actions/nodes';
import { loadPipelineData } from '../../actions/pipelines';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import PipelineWarning from '../pipeline-warning';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import Sidebar from '../sidebar';
import { useRedirectLocationInFlowchart } from '../../utils/hooks/use-redirect-location';
import Button from '../ui/button';

import './flowchart-wrapper.css';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const FlowChartWrapper = ({
  flags,
  fullNames,
  loading,
  modularPipelinesTree,
  nodes,
  onLoadNodeData,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  onUpdateActivePipeline,
  pipelines,
  sidebarVisible,
}) => {
  const history = useHistory();

  // Reload state is to ensure it will call redirectLocation
  // only when the page is reloaded.
  const [reload, setReload] = useState(false);

  const [counter, setCounter] = React.useState(5);
  const [goBackToExperimentTracking, setGoBackToExperimentTracking] =
    useState(false);

  useEffect(() => {
    setReload(true);

    const storage = window.localStorage.getItem('kedro-viz-link-to-flowchart');
    setGoBackToExperimentTracking(JSON.parse(storage));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReload(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const { errorMessage, invalidUrl } = useRedirectLocationInFlowchart(
    flags,
    fullNames,
    modularPipelinesTree,
    nodes,
    onLoadNodeData,
    onToggleFocusMode,
    onToggleModularPipelineActive,
    onToggleModularPipelineExpanded,
    onUpdateActivePipeline,
    pipelines,
    reload
  );

  useEffect(() => {
    const timer =
      counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const resetLinkingToFlowchartLocalStorage = () => {
    const storage = {
      fromURL: null,
      showGoBackBtn: false,
    };
    window.localStorage.setItem(
      'kedro-viz-link-to-flowchart',
      JSON.stringify(storage)
    );

    setGoBackToExperimentTracking(storage);
  };

  useEffect(() => {
    if (counter === 0) {
      // debugger;
      resetLinkingToFlowchartLocalStorage();
    }
  }, [counter]);

  const onGoBackToExperimentTrackingHandler = () => {
    const url = goBackToExperimentTracking.fromURL;
    history.push(url);

    resetLinkingToFlowchartLocalStorage();
  };

  if (invalidUrl) {
    return (
      <div className="kedro-pipeline">
        <Sidebar />
        <MetaData />
        <PipelineWarning errorMessage={errorMessage} invalidUrl={invalidUrl} />
      </div>
    );
  } else {
    return (
      <div className="kedro-pipeline">
        <Sidebar />
        <MetaData />
        <div className="pipeline-wrapper">
          <PipelineWarning />
          <FlowChart />
          <div
            className={classnames('pipeline-wrapper__go-back-btn', {
              'pipeline-wrapper__go-back-btn--show':
                goBackToExperimentTracking.showGoBackBtn,
              'pipeline-wrapper__go-back-btn--sidebar-visible': sidebarVisible,
            })}
          >
            <Button onClick={onGoBackToExperimentTrackingHandler}>
              <span className="pipeline-wrapper__go-back-btn-timer">
                {counter}
              </span>
              Return to Experiment Tracking
            </Button>
          </div>
          <div
            className={classnames('pipeline-wrapper__loading', {
              'pipeline-wrapper__loading--sidebar-visible': sidebarVisible,
            })}
          >
            <LoadingIcon visible={loading} />
          </div>
        </div>
        <ExportModal />
        <MetadataModal />
      </div>
    );
  }
};

export const mapStateToProps = (state) => ({
  flags: state.flags,
  fullNames: getNodeFullName(state),
  loading: isLoading(state),
  modularPipelinesTree: getModularPipelinesTree(state),
  nodes: state.node.modularPipelines,
  pipelines: state.pipeline.ids,
  sidebarVisible: state.visible.sidebar,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleFocusMode: (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  },
  onLoadNodeData: (nodeClicked) => {
    dispatch(loadNodeData(nodeClicked));
  },
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleModularPipelineExpanded: (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  },
  onUpdateActivePipeline: (pipelineId) => {
    dispatch(loadPipelineData(pipelineId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChartWrapper);
