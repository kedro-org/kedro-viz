import React, { createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useGeneratePathname } from '../../../utils/hooks/use-generate-pathname';

import {
  getFocusedModularPipeline,
  getModularPipelinesTree,
} from '../../../selectors/modular-pipelines';
import { isModularPipelineType } from '../../../selectors/node-types';

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

export const NodeListContext = createContext();

export const NodeListContextProvider = ({ children }) => {
  const dispatch = useDispatch();
  const modularPipelinesTree = useSelector(getModularPipelinesTree);
  const isSlicingPipelineApplied = useSelector((state) => state.slice.apply);
  const focusMode = useSelector(getFocusedModularPipeline);
  const disabledModularPipeline = useSelector(
    (state) => state.modularPipeline.disabled
  );

  const { toSelectedPipeline, toSelectedNode, toFocusedModularPipeline } =
    useGeneratePathname();

  // Toggle the expanded state of modular pipelines
  const handleModularPipelineToggleExpanded = (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  };

  // Toggle the focus mode for a modular pipeline
  const handleToggleFocusMode = (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  };

  // Select or deselect a node
  const handleToggleNodeSelected = (nodeID) => {
    dispatch(loadNodeData(nodeID));
  };

  // Handle row click in the node list
  const handleNodeListRowClicked = (event, item) => {
    if (isModularPipelineType(item.type)) {
      handleToggleNodeSelected(null);
    } else {
      if (item.faded || item.selected) {
        handleToggleNodeSelected(null);
        toSelectedPipeline();
      } else {
        handleToggleNodeSelected(item.id);
        toSelectedNode(item);
        // Reset the pipeline slicing filters if no slicing is currently applied
        if (!isSlicingPipelineApplied) {
          dispatch(resetSlicePipeline());
        }
      }
    }

    // Prevent page reload on form submission
    event.preventDefault();
  };

  // Handle changes in the node list row
  const handleNodeListRowChanged = (item, checked, clickedIconType) => {
    // reset the node data
    dispatch(loadNodeData(null));
    dispatch(toggleNodeHovered(null));

    if (isModularPipelineType(item.type)) {
      debugger;
      if (clickedIconType === 'focus') {
        if (focusMode === null) {
          handleToggleFocusMode(item);
          toFocusedModularPipeline(item);

          if (disabledModularPipeline[item.id]) {
            dispatch(toggleModularPipelineDisabled([item.id], checked));
          }
        } else {
          handleToggleFocusMode(null);
          toSelectedPipeline();
        }
      } else {
        dispatch(toggleModularPipelineDisabled([item.id], checked));
        dispatch(toggleModularPipelineActive([item.id], false));
      }
    } else {
      if (checked) {
        dispatch(toggleNodeHovered(null));
      }
      dispatch(toggleNodesDisabled([item.id], checked));
    }
  };

  // Handle mouse enter event on an item
  const handleItemMouseEnter = (item) => {
    if (isModularPipelineType(item.type)) {
      dispatch(toggleModularPipelineActive(item.id, true));
    }

    if (item.visible) {
      dispatch(toggleNodeHovered(item.id));
    }
  };

  // Handle mouse leave event on an item
  const handleItemMouseLeave = (item) => {
    if (isModularPipelineType(item.type)) {
      dispatch(toggleModularPipelineActive(item.id, false));
    }
    if (item.visible) {
      dispatch(toggleNodeHovered(null));
    }
  };

  // Toggle hovered focus mode
  const handleToggleHoveredFocusMode = (active) => {
    dispatch(toggleHoveredFocusMode(active));
  };

  // Deselect node on Escape key
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      dispatch(loadNodeData(null));
    }
  };

  return (
    <NodeListContext.Provider
      value={{
        modularPipelinesTree,
        handleModularPipelineToggleExpanded,
        //   handleToggleFocusMode,
        handleNodeListRowClicked,
        handleNodeListRowChanged,
        handleItemMouseEnter,
        handleItemMouseLeave,
        handleToggleHoveredFocusMode,
        focusMode,
        disabledModularPipeline,
        handleKeyDown,
      }}
    >
      {children}
    </NodeListContext.Provider>
  );
};
