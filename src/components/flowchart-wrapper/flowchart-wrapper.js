import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation, matchPath } from 'react-router-dom';
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
// import { useRedirectLocationInFlowchart } from '../../utils/hooks/use-redirect-location';
import Button from '../ui/button';
import CircleProgressBar from '../ui/circle-progress-bar';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import {
  localStorageFlowchartLink,
  params,
  routes,
  errorMessages,
} from '../../config';

import './flowchart-wrapper.css';

const linkToFlowchartInitialVal = {
  fromURL: null,
  showGoBackBtn: false,
};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
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
  onLoadNodeData,
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
  const [pageReloaded, setPageReloaded] = useState(false);
  const [reload, setReload] = useState(false);
  const [counter, setCounter] = React.useState(60);
  const [goBackToExperimentTracking, setGoBackToExperimentTracking] =
    useState(false);

  // find match path
  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.main],
  });

  const matchedSelectedNodeId = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  const matchedSelectedNodeName = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedName],
  });

  const matchedFocusedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.focusedNode],
  });

  const activePipelineId = search.substring(
    search.indexOf(params.pipeline) + params.pipeline.length,
    search.indexOf('&')
  );
  const decodedPipelineId = decodeURI(activePipelineId);

  const updatePipeline = useCallback(
    (pipelines, decodedPipelineId) => {
      const foundPipeline = pipelines.find((id) => id === decodedPipelineId);

      if (foundPipeline) {
        onUpdateActivePipeline(decodedPipelineId);
      }
    },
    [onUpdateActivePipeline]
  );

  const redirectToSelectedNode = (nodeId) => {
    // Reset the focus mode to null when when using the navigation buttons
    onToggleFocusMode(null);

    const foundNode = Object.keys(nodes).find((node) => node === nodeId);
    if (foundNode) {
      const modularPipeline = nodes[nodeId];
      const hasModularPipeline = modularPipeline?.length > 0;

      // We only want to call this function specifically when the page is reloaded
      // to ensure the modular pipeline list is expanded
      // but we don't want this action to happen on any other on click, go back etc
      if (pageReloaded && hasModularPipeline) {
        onToggleModularPipelineExpanded(modularPipeline);
      }

      // then upload the node data
      onLoadNodeData(nodeId);
    } else {
      setErrorMessage(errorMessages.node);
      setInvalidUrl(true);
    }
  };

  useEffect(() => {
    setReload(true);
    // updatePipeline needs to happen here first before the redirectLocation hook happens
    // so just all the relevant data is fully loaded first then passing it to the hook.
    updatePipeline(pipelines, decodedPipelineId);

    const linkToFlowchart = loadLocalStorage(localStorageFlowchartLink);
    setGoBackToExperimentTracking(linkToFlowchart);
  }, [pipelines, decodedPipelineId, updatePipeline]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReload(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reload) {
      setPageReloaded(true);
    }

    // This timeout is to ensure it has enough time to
    // load the data after the page is reloaded
    const setPageReloadedTimeOut = setTimeout(() => {
      pageReloaded && setPageReloaded(false);
    }, 500);

    return () => clearTimeout(setPageReloadedTimeOut);
  }, [pageReloaded, reload]);

  useEffect(() => {
    if (pageReloaded) {
      setErrorMessage({});
      setInvalidUrl(false);
    }

    if (matchedFlowchartMainPage) {
      onLoadNodeData(null);
      onToggleFocusMode(null);

      setErrorMessage({});
      setInvalidUrl(false);
    }

    if (matchedSelectedNodeName) {
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
      onLoadNodeData(null);

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
