import React, { createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useGeneratePathname } from '../../../utils/hooks/use-generate-pathname';

import {
  getFocusedModularPipeline,
  getModularPipelinesTree,
} from '../../../selectors/modular-pipelines';
import { isModularPipelineType } from '../../../selectors/node-types';
import { getNodeSelected } from '../../../selectors/nodes';
import { getSlicedPipeline } from '../../../selectors/sliced-pipeline';

import {
  toggleModularPipelinesExpanded,
  toggleModularPipelineActive,
  toggleModularPipelineDisabled,
} from '../../../actions/modular-pipelines';
import { toggleFocusMode, toggleHoveredFocusMode } from '../../../actions';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../../actions/nodes';
import { resetSlicePipeline } from '../../../actions/slice';
import { getnodesDisabledViaModularPipeline } from '../../../selectors/disabled';

// Custom hook to group useSelector calls
const useNodeListContextSelector = () => {
  const dispatch = useDispatch();
  const hoveredNode = useSelector((state) => state.node.hovered);
  const selectedNodes = useSelector(getNodeSelected);
  const nodesDisabledViaModularPipeline = useSelector(
    getnodesDisabledViaModularPipeline
  );
  const expanded = useSelector((state) => state.modularPipeline.expanded);
  const slicedPipeline = useSelector(getSlicedPipeline);
  const modularPipelinesTree = useSelector(getModularPipelinesTree);
  const isSlicingPipelineApplied = useSelector((state) => state.slice.apply);
  const focusMode = useSelector(getFocusedModularPipeline);
  const disabledModularPipeline = useSelector(
    (state) => state.modularPipeline.disabled
  );

  const onToggleFocusMode = (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  };
  const onToggleHoveredFocusMode = (active) => {
    dispatch(toggleHoveredFocusMode(active));
  };
  const onToggleNodeSelected = (nodeID) => {
    dispatch(loadNodeData(nodeID));
  };
  const onToggleNodeHovered = (nodeID) => {
    dispatch(toggleNodeHovered(nodeID));
  };
  const onToggleNodesDisabled = (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  };
  const onToggleModularPipelineExpanded = (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  };
  const onToggleModularPipelineDisabled = (modularPipelineIDs, disabled) => {
    dispatch(toggleModularPipelineDisabled(modularPipelineIDs, disabled));
  };
  const onToggleModularPipelineActive = (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  };
  const onResetSlicePipeline = () => {
    dispatch(resetSlicePipeline());
  };

  return {
    disabledModularPipeline,
    expanded,
    focusMode,
    hoveredNode,
    isSlicingPipelineApplied,
    modularPipelinesTree,
    selectedNodes,
    slicedPipeline,
    nodesDisabledViaModularPipeline,
    onResetSlicePipeline,
    onToggleFocusMode,
    onToggleHoveredFocusMode,
    onToggleModularPipelineActive,
    onToggleModularPipelineDisabled,
    onToggleModularPipelineExpanded,
    onToggleNodeHovered,
    onToggleNodesDisabled,
    onToggleNodeSelected,
  };
};

export const NodeListContext = createContext();

export const NodeListContextProvider = ({ children }) => {
  const {
    disabledModularPipeline,
    expanded,
    focusMode,
    hoveredNode,
    isSlicingPipelineApplied,
    modularPipelinesTree,
    selectedNodes,
    slicedPipeline,
    nodesDisabledViaModularPipeline,
    onResetSlicePipeline,
    onToggleFocusMode,
    onToggleHoveredFocusMode,
    onToggleModularPipelineActive,
    onToggleModularPipelineDisabled,
    onToggleModularPipelineExpanded,
    onToggleNodeHovered,
    onToggleNodesDisabled,
    onToggleNodeSelected,
  } = useNodeListContextSelector();
  const { toSelectedPipeline, toSelectedNode, toFocusedModularPipeline } =
    useGeneratePathname();

  // Handle row click in the node list
  const handleNodeListRowClicked = (event, item) => {
    if (isModularPipelineType(item.type)) {
      onToggleNodeSelected(null);
    } else {
      if (item.faded || item.selected) {
        onToggleNodeSelected(null);
        toSelectedPipeline();
      } else {
        onToggleNodeSelected(item.id);
        toSelectedNode(item);
        // Reset the pipeline slicing filters if no slicing is currently applied
        if (!isSlicingPipelineApplied) {
          onResetSlicePipeline();
        }
      }
    }

    // Prevent page reload on form submission
    event.preventDefault();
  };

  // Handle changes in the node list row
  const handleNodeListRowChanged = (item, checked, clickedIconType) => {
    if (isModularPipelineType(item.type)) {
      if (clickedIconType === 'focus') {
        if (focusMode === null) {
          onToggleFocusMode(item);
          toFocusedModularPipeline(item);

          if (disabledModularPipeline[item.id]) {
            onToggleModularPipelineDisabled([item.id], checked);
          }
        } else {
          onToggleFocusMode(null);
          toSelectedPipeline();
        }
      } else {
        onToggleModularPipelineDisabled([item.id], checked);
        onToggleModularPipelineActive([item.id], false);
      }
    } else {
      if (checked) {
        onToggleNodeHovered(null);
      }

      onToggleNodesDisabled([item.id], checked);
    }
    // reset the node data
    onToggleNodeSelected(null);
    onToggleNodeHovered(null);
  };

  // Handle mouse enter event on an item
  const handleItemMouseEnter = (item) => {
    if (isModularPipelineType(item.type)) {
      onToggleModularPipelineActive(item.id, true);
      return;
    }

    if (item.visible) {
      onToggleNodeHovered(item.id);
    }
  };

  // Handle mouse leave event on an item
  const handleItemMouseLeave = (item) => {
    if (isModularPipelineType(item.type)) {
      onToggleModularPipelineActive(item.id, false);
      return;
    }
    if (item.visible) {
      onToggleNodeHovered(null);
    }
  };

  // Toggle hovered focus mode
  const handleToggleHoveredFocusMode = (active) => {
    onToggleHoveredFocusMode(active);
  };

  // Deselect node on Escape key
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      onToggleNodeSelected(null);
    }
  };

  return (
    <NodeListContext.Provider
      value={{
        expanded,
        focusMode,
        hoveredNode,
        isSlicingPipelineApplied,
        modularPipelinesTree,
        selectedNodes,
        slicedPipeline,
        nodesDisabledViaModularPipeline,
        handleModularPipelineToggleExpanded: onToggleModularPipelineExpanded,
        handleNodeListRowClicked,
        handleNodeListRowChanged,
        handleItemMouseEnter,
        handleItemMouseLeave,
        handleToggleHoveredFocusMode,
        handleKeyDown,
      }}
    >
      {children}
    </NodeListContext.Provider>
  );
};
