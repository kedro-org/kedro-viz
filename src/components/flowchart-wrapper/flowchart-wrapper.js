import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
import {
  getModularPipelinesTree,
  getNodeFullName,
} from '../../selectors/nodes';
import { getVisibleMetaSidebar } from '../../selectors/metadata';
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
import Button from '../ui/button';
import CircleProgressBar from '../ui/circle-progress-bar';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import {
  localStorageFlowchartLink,
  localStorageName,
  params,
  errorMessages,
} from '../../config';
import { findMatchedPath } from '../../utils/match-path';

import './flowchart-wrapper.css';

const linkToFlowchartInitialVal = {
  fromURL: null,
  showGoBackBtn: false,
};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

const getDecodedPipelineId = (search) => {
  const activePipelineId = search.substring(
    search.indexOf(params.pipeline) + params.pipeline.length,
    search.indexOf('&')
  );
  return decodeURI(activePipelineId);
};

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const FlowChartWrapper = ({
  flags,
  fullNodeNames,
  loading,
  modularPipelinesTree,
  nodes,
  onToggleNodeSelected,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  onUpdateActivePipeline,
  pipelines,
  sidebarVisible,
  metadataVisible,
}) => {
  const history = useHistory();
  const { pathname, search } = useLocation();

  const [errorMessage, setErrorMessage] = useState({});
  const [invalidUrl, setInvalidUrl] = useState(false);
  const [reload, setReload] = useState(false);

  const [counter, setCounter] = React.useState(60);
  const [goBackToExperimentTracking, setGoBackToExperimentTracking] =
    useState(false);

  const {
    matchedFlowchartMainPage,
    matchedSelectedNodeId,
    matchedSelectedNodeName,
    matchedFocusedNode,
  } = findMatchedPath(pathname, search);

  const decodedPipelineId = getDecodedPipelineId(search);

  /**
   * To switch to different pipeline first depending on what is defined in the URL
   */
  useEffect(() => {
    const foundPipeline = pipelines.find((id) => id === decodedPipelineId);

    if (foundPipeline) {
      onUpdateActivePipeline(decodedPipelineId);
    }
  }, [onUpdateActivePipeline, decodedPipelineId, pipelines]);

  const redirectToSelectedNode = (nodeId) => {
    // Reset the focus mode to null when when using the navigation buttons
    onToggleFocusMode(null);

    const foundNode = Object.keys(nodes).find((node) => node === nodeId);
    if (foundNode) {
      const modularPipeline = nodes[nodeId];
      const hasModularPipeline = modularPipeline?.length > 0;

      if (hasModularPipeline) {
        onToggleModularPipelineExpanded(modularPipeline);
      }

      onToggleNodeSelected(nodeId);
    } else {
      setErrorMessage(errorMessages.node);
      setInvalidUrl(true);
    }
  };

  useEffect(() => {
    setReload(true);

    const linkToFlowchart = loadLocalStorage(localStorageFlowchartLink);
    setGoBackToExperimentTracking(linkToFlowchart);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReload(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  /**
   * To handle redirecting to different location via URL, eg: selectedNode, focusNode, etc
   */
  useEffect(() => {
    if (!reload) {
      setErrorMessage({});
      setInvalidUrl(false);
    }

    if (matchedFlowchartMainPage) {
      onToggleNodeSelected(null);
      onToggleFocusMode(null);

      setErrorMessage({});
      setInvalidUrl(false);
    }

    if (matchedSelectedNodeName && Object.keys(fullNodeNames).length > 0) {
      const localStorage = loadLocalStorage(localStorageName);

      // if the pipeline in local storage is not the same as in the URL
      // ensure the page is reloaded so that the fullNodeNames is updated
      if (localStorage.pipeline.active !== decodedPipelineId) {
        history.go(0);
      }

      const nodeName = search.split(params.selectedName)[1];
      const decodedNodeName = decodeURI(nodeName).replace(/['"]+/g, '');
      const foundNodeId = getKeyByValue(fullNodeNames, decodedNodeName);

      if (foundNodeId) {
        redirectToSelectedNode(foundNodeId);
      } else {
        setErrorMessage(errorMessages.nodeName);
        setInvalidUrl(true);
      }
    }

    if (matchedSelectedNodeId && Object.keys(nodes).length > 0) {
      const nodeId = search.split(params.selected)[1];

      redirectToSelectedNode(nodeId);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length > 0) {
      // Reset the node data to null when when using the navigation buttons
      onToggleNodeSelected(null);

      const modularPipelineId = search.split(params.focused)[1];
      const foundModularPipeline = modularPipelinesTree[modularPipelineId];

      if (foundModularPipeline) {
        onToggleModularPipelineActive(modularPipelineId, true);
        onToggleFocusMode(foundModularPipeline.data);
      } else {
        setErrorMessage(errorMessages.modularPipeline);
        setInvalidUrl(true);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search, pathname]);

  const resetLinkingToFlowchartLocalStorage = useCallback(() => {
    saveLocalStorage(localStorageFlowchartLink, linkToFlowchartInitialVal);

    setGoBackToExperimentTracking(linkToFlowchartInitialVal);
  }, []);

  useEffect(() => {
    const timer =
      counter > 0 && setInterval(() => setCounter(counter - 1), 1000);

    if (counter === 0) {
      resetLinkingToFlowchartLocalStorage();
    }

    return () => clearInterval(timer);
  }, [counter, resetLinkingToFlowchartLocalStorage]);

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
                goBackToExperimentTracking?.showGoBackBtn,
              'pipeline-wrapper__go-back-btn--show-sidebar-visible':
                sidebarVisible,
              'pipeline-wrapper__go-back-btn--show-metadata-visible':
                metadataVisible,
            })}
          >
            <Button onClick={onGoBackToExperimentTrackingHandler}>
              <CircleProgressBar>{counter}</CircleProgressBar>
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
  fullNodeNames: getNodeFullName(state),
  loading: isLoading(state),
  modularPipelinesTree: getModularPipelinesTree(state),
  nodes: state.node.modularPipelines,
  pipelines: state.pipeline.ids,
  sidebarVisible: state.visible.sidebar,
  metadataVisible: getVisibleMetaSidebar(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleFocusMode: (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  },
  onToggleNodeSelected: (nodeID) => {
    dispatch(loadNodeData(nodeID));
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
