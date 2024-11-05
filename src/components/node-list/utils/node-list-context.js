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

  const onModularPipelineToggleExpanded = (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  };

  const onToggleFocusMode = (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  };

  const onToggleNodeSelected = (nodeID) => {
    dispatch(loadNodeData(nodeID));
  };

  // const onToggleModularPipelineDisable = (modularPipelineIDs, disabled) => {
  //     dispatch(toggleModularPipelineDisabled(modularPipelineIDs, disabled));
  // }

  const onNodeListRowClicked = (event, item) => {
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
          dispatch(resetSlicePipeline());
        }
      }
    }

    // to prevent page reload on form submission
    event.preventDefault();
  };

  const onNodeListRowChanged = (item, checked, clickedIconType) => {
    dispatch(toggleNodesDisabled([item.id], checked));
    if (clickedIconType === 'focus') {
      if (focusMode === null) {
        onToggleFocusMode(item);
        toFocusedModularPipeline(item);

        if (disabledModularPipeline[item.id]) {
          dispatch(toggleModularPipelineDisabled([item.id], checked));
        }
      } else {
        onToggleFocusMode(null);
        toSelectedPipeline();
      }
    } else {
      dispatch(toggleModularPipelineDisabled([item.id], checked));
      dispatch(toggleModularPipelineActive([item.id], false));
    }
    if (checked) {
      dispatch(toggleNodeHovered(null));
    }
  };

  const onItemMouseEnter = (item) => {
    if (isModularPipelineType(item.type)) {
      // onToggleModularPipelineActive(item.id, true);
      dispatch(toggleModularPipelineActive(item.id, true));
    }

    if (item.visible) {
      // onToggleNodeActive(item.id);
      dispatch(toggleNodeHovered(item.id));
    }
  };

  const onItemMouseLeave = (item) => {
    if (isModularPipelineType(item.type)) {
      // onToggleModularPipelineActive(item.id, false);
      dispatch(toggleModularPipelineActive(item.id, false));
    }
    if (item.visible) {
      // onToggleNodeActive(null);
      dispatch(toggleNodeHovered(null));
    }
  };

  const onToggleHoveredFocusMode = (active) => {
    dispatch(toggleHoveredFocusMode(active));
  };

  // Deselect node on Escape key
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      //   onToggleNodeSelected(null);
      dispatch(loadNodeData(null));
    }
  };

  return (
    <NodeListContext.Provider
      value={{
        modularPipelinesTree,
        onModularPipelineToggleExpanded,
        onToggleFocusMode,
        onNodeListRowClicked,
        onNodeListRowChanged,
        onItemMouseEnter,
        onItemMouseLeave,
        onToggleHoveredFocusMode,
        focusMode,
        disabledModularPipeline,
        handleKeyDown,
      }}
    >
      {children}
    </NodeListContext.Provider>
  );
};
