import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
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
import { toggleFocusMode, setView } from '../../actions';
import { loadNodeData } from '../../actions/nodes';
import { loadPipelineData } from '../../actions/pipelines';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import PipelineWarning from '../pipeline-warning';
import PipelineLoading from '../pipeline-loading/pipeline-loading';
import InfoBannerIcon from '../icons/info-banner';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import ShareableUrlMetadata from '../shareable-url-modal/shareable-url-metadata';
import Sidebar from '../sidebar';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import {
  errorMessages,
  localStorageName,
  localStorageBannerStatus,
  params,
  BANNER_METADATA,
  BANNER_KEYS,
  VIEW,
} from '../../config';
import { findMatchedPath } from '../../utils/match-path';
import { getKeyByValue, getKeysByValue } from '../../utils/object-utils';
import { isRunningLocally, mapNodeTypes } from '../../utils';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import './flowchart-wrapper.scss';
import Banner from '../ui/banner';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const FlowChartWrapper = ({
  fullNodeNames,
  displaySidebar,
  graph,
  loading,
  modularPipelinesTree,
  nodes,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  onToggleNodeSelected,
  onUpdateActivePipeline,
  pipelines,
  sidebarVisible,
  activePipeline,
  tag,
  nodeType,
  expandAllPipelines,
  displayMetadataPanel,
  displayExportBtn,
  displayBanner,
  setView,
}) => {
  const { pathname, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const { toSetQueryParam } = useGeneratePathname();

  const [errorMessage, setErrorMessage] = useState({});
  const [isInvalidUrl, setIsInvalidUrl] = useState(false);
  const [usedNavigationBtn, setUsedNavigationBtn] = useState(false);

  const graphRef = useRef(null);

  const {
    matchedFlowchartMainPage,
    matchedSelectedPipeline,
    matchedSelectedNodeId,
    matchedSelectedNodeName,
    matchedFocusedNode,
  } = findMatchedPath(pathname, search);

  /**
   * On initial load & when user switch active pipeline,
   * sets the query params from local storage based on NodeType, tag, expandAllPipelines and active pipeline.
   * @param {string} activePipeline - The active pipeline.
   */
  const setParamsFromLocalStorage = (activePipeline) => {
    const localStorageParams = loadLocalStorage(localStorageName);
    if (localStorageParams) {
      const paramActions = {
        pipeline: (value) => {
          if (activePipeline) {
            toSetQueryParam(params.pipeline, value.active || activePipeline);
          }
        },
        tag: (value) => {
          const enabledKeys = getKeysByValue(value.enabled, true);
          enabledKeys && toSetQueryParam(params.tags, enabledKeys);
        },
        nodeType: (value) => {
          const disabledKeys = getKeysByValue(value.disabled, false);
          // Replace task with node to keep UI label & the URL consistent
          const mappedDisabledNodes = mapNodeTypes(disabledKeys);
          disabledKeys && toSetQueryParam(params.types, mappedDisabledNodes);
        },
        expandAllPipelines: (value) => toSetQueryParam(params.expandAll, value),
      };

      for (const [key, value] of Object.entries(localStorageParams)) {
        if (paramActions[key]) {
          paramActions[key](value);
        }
      }
    }
  };

  useEffect(() => {
    setView(VIEW.FLOWCHART);
  }, [setView]);

  useEffect(() => {
    setParamsFromLocalStorage(activePipeline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePipeline, tag, nodeType, expandAllPipelines]);

  const resetErrorMessage = () => {
    setErrorMessage({});
    setIsInvalidUrl(false);
  };

  const checkIfPipelineExists = () => {
    const pipelineId = searchParams.get(params.pipeline);
    const foundPipeline = pipelines.find((id) => id === pipelineId);

    if (!foundPipeline) {
      setErrorMessage(errorMessages.pipeline);
      setIsInvalidUrl(true);
    }
  };

  const redirectSelectedPipeline = () => {
    const pipelineId = searchParams.get(params.pipeline);
    const foundPipeline = pipelines.find((id) => id === pipelineId);

    if (foundPipeline) {
      onUpdateActivePipeline(foundPipeline);
      onToggleNodeSelected(null);
      onToggleFocusMode(null);
    } else {
      setErrorMessage(errorMessages.pipeline);
      setIsInvalidUrl(true);
    }
  };

  const redirectToSelectedNode = () => {
    const node =
      searchParams.get(params.selected) ||
      searchParams.get(params.selectedName);

    const nodeId =
      getKeyByValue(fullNodeNames, node) ||
      Object.keys(nodes).find((nodeId) => nodeId === node);

    if (nodeId) {
      const modularPipeline = nodes[nodeId];
      const modularPipelineTree = modularPipelinesTree[modularPipeline];
      const isModularPipelineChild =
        modularPipelineTree?.children?.includes(nodeId);

      const isParameterType =
        graph.nodes &&
        graph.nodes.find(
          (node) => node.id === nodeId && node.type === 'parameters'
        );

      if (isModularPipelineChild && !isParameterType) {
        onToggleModularPipelineExpanded(modularPipeline);
      }
      onToggleNodeSelected(nodeId);

      if (isInvalidUrl) {
        resetErrorMessage();
      }
    } else {
      setErrorMessage(errorMessages.node);
      setIsInvalidUrl(true);
    }

    checkIfPipelineExists();
  };

  const redirectToFocusedNode = () => {
    const focusedId = searchParams.get(params.focused);
    const foundModularPipeline = modularPipelinesTree[focusedId];

    if (foundModularPipeline) {
      onToggleModularPipelineActive(focusedId, true);
      onToggleFocusMode(foundModularPipeline.data);

      if (isInvalidUrl) {
        resetErrorMessage();
      }
    } else {
      setErrorMessage(errorMessages.modularPipeline);
      setIsInvalidUrl(true);
    }

    checkIfPipelineExists();
  };

  const handlePopState = useCallback(() => {
    setUsedNavigationBtn((usedNavigationBtn) => !usedNavigationBtn);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);

  /**
   * To handle redirecting to a different location via the URL (e.g. selectedNode,
   * focusNode, etc.) we only need to call the matchPath actions when:
   * 1. graphRef.current is null, meaning the page has just loaded
   * 2. or when the user navigates using the back and forward buttons
   * 3. or when invalidUrl is true, meaning the user entered something wrong in
   * the URL and we should allow them to reset by clicking on a different node.
   */
  useEffect(() => {
    const isGraphEmpty = Object.keys(graph).length === 0;
    if (
      (graphRef.current === null || usedNavigationBtn || isInvalidUrl) &&
      !isGraphEmpty
    ) {
      if (matchedFlowchartMainPage) {
        onToggleNodeSelected(null);
        onToggleFocusMode(null);

        resetErrorMessage();
      }

      if (matchedSelectedPipeline()) {
        // Redirecting to a different pipeline is also handled at `preparePipelineState`
        // to ensure the data is ready before being passed to here
        redirectSelectedPipeline();
      }

      if (matchedSelectedNodeName() || matchedSelectedNodeId()) {
        redirectToSelectedNode();
      }

      if (matchedFocusedNode()) {
        redirectToFocusedNode();
      }

      // Once all the matchPath checks are finished
      // ensure the local states are reset
      graphRef.current = graph;
      setUsedNavigationBtn(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, usedNavigationBtn, isInvalidUrl]);

  const handleBannerClose = (bannerKey) => {
    saveLocalStorage(localStorageBannerStatus, { [bannerKey]: false });
  };

  const showBanner = (bannerKey) => {
    const bannerStatus = loadLocalStorage(localStorageBannerStatus);
    const shouldShowBanner =
      displayBanner[bannerKey] &&
      (bannerStatus[bannerKey] || bannerStatus[bannerKey] === undefined);
    return shouldShowBanner;
  };

  if (isInvalidUrl) {
    return (
      <div className="kedro-pipeline">
        {displaySidebar && <Sidebar />}
        {displayMetadataPanel && <MetaData />}
        <PipelineWarning
          errorMessage={errorMessage}
          invalidUrl={isInvalidUrl}
          onResetClick={() => setIsInvalidUrl(false)}
        />
      </div>
    );
  } else {
    return (
      <div className="kedro-pipeline">
        {displaySidebar && <Sidebar />}
        {displayMetadataPanel && <MetaData />}
        {showBanner(BANNER_KEYS.LITE) && (
          <Banner
            icon={<InfoBannerIcon />}
            message={{
              title: BANNER_METADATA.liteModeWarning.title,
              body: BANNER_METADATA.liteModeWarning.body,
            }}
            btnUrl={BANNER_METADATA.liteModeWarning.docsLink}
            onClose={() => handleBannerClose(BANNER_KEYS.LITE)}
            dataTest={getDataTestAttribute('flowchart-wrapper', 'lite-banner')}
          />
        )}
        <div className="pipeline-wrapper">
          <PipelineWarning />
          <FlowChart />
          <PipelineLoading loading={loading} sidebarVisible={sidebarVisible} />
          {isRunningLocally() ? null : <ShareableUrlMetadata />}
        </div>
        {displayExportBtn && <ExportModal />}
        <MetadataModal />
      </div>
    );
  }
};

export const mapStateToProps = (state) => ({
  fullNodeNames: getNodeFullName(state),
  displaySidebar: state.display.sidebar,
  graph: state.graph,
  loading: isLoading(state),
  metadataVisible: getVisibleMetaSidebar(state),
  modularPipelinesTree: getModularPipelinesTree(state),
  nodes: state.node.modularPipelines,
  pipelines: state.pipeline.ids,
  activePipeline: state.pipeline.active,
  sidebarVisible: state.visible.sidebar,
  tag: state.tag.enabled,
  nodeType: state.nodeType.disabled,
  expandAllPipelines: state.expandAllPipelines,
  displayMetadataPanel: state.display.metadataPanel,
  displayExportBtn: state.display.exportBtn,
  displayBanner: state.showBanner,
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
  setView: (view) => dispatch(setView(view)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChartWrapper);
