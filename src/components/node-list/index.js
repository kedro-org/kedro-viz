import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import NodeList from './node-list';
import {
  getFilteredItems,
  getGroups,
  isTagType,
  isElementType,
  isGroupType,
} from './node-list-items';
import {
  getNodeTypes,
  isModularPipelineType,
  getTaskNodes,
  getDatasets,
} from '../../selectors/node-types';
import { getTagData, getTagNodeCounts } from '../../selectors/tags';
import {
  getFocusedModularPipeline,
  getModularPipelinesSearchResult,
} from '../../selectors/modular-pipelines';
import {
  getGroupedNodes,
  getNodeSelected,
  getInputOutputNodesForFocusedModularPipeline,
  getModularPipelinesTree,
} from '../../selectors/nodes';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleParametersHovered, toggleFocusMode } from '../../actions';
import {
  toggleModularPipelineActive,
  toggleModularPipelineDisabled,
  toggleModularPipelinesExpanded,
} from '../../actions/modular-pipelines';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
  filterNodes,
  toggleNodeClicked
} from '../../actions/nodes';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import './styles/node-list.scss';

/**
 * Provides data from the store to populate a NodeList component.
 * Also handles user interaction and dispatches updates back to the store.
 */
const NodeListProvider = ({
  flags,
  faded,
  nodes,
  nodeSelected,
  tags,
  tagNodeCounts,
  nodeTypes,
  taskNodes,
  datasets,
  onToggleNodesDisabled,
  onToggleNodeSelected,
  onToggleNodeActive,
  onToggleParametersActive,
  onToggleTagActive,
  onToggleTagFilter,
  onToggleModularPipelineActive,
  onToggleModularPipelineDisabled,
  onToggleModularPipelineExpanded,
  onToggleTypeDisabled,
  onToggleNodeClicked,
  onToggleFocusMode,
  onFilterNodes,
  modularPipelinesTree,
  focusMode,
  disabledModularPipeline,
  inputOutputDataNodes,
}) => {
  const [searchValue, updateSearchValue] = useState('');

  const [toNodes, selectedToNodes] = useState(null);
  const [fromNodes, selectedFromNodes] = useState(null);

  const { toSelectedPipeline, toSelectedNode, toFocusedModularPipeline } =
    useGeneratePathname();

  
  useEffect(() => {
      onFilterNodes(fromNodes,toNodes)
      onToggleNodeClicked(null)
    }, [fromNodes,toNodes, onFilterNodes, onToggleNodeClicked]);


  const items = getFilteredItems({
    nodes,
    tags,
    nodeTypes,
    tagNodeCounts,
    nodeSelected,
    searchValue,
    focusMode,
    inputOutputDataNodes,
  });

  const modularPipelinesSearchResult = searchValue
    ? getModularPipelinesSearchResult(modularPipelinesTree, searchValue)
    : null;

  const groups = getGroups({ items });

  const onItemClick = (item) => {
    if (isGroupType(item.type)) {
      onGroupItemChange(item, item.checked);
    } else if (isModularPipelineType(item.type)) {
      onToggleNodeSelected(null);
    } else {
      if (item.faded || item.selected) {
        onToggleNodeSelected(null);
        toSelectedPipeline();
      } else {
        onToggleNodeSelected(item.id);
        toSelectedNode(item);
      }
    }
  };

  const onItemChange = (item, checked, clickedIconType) => {
    if (isGroupType(item.type) || isModularPipelineType(item.type)) {
      onGroupItemChange(item, checked);

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
      }
    } else {
      if (checked) {
        onToggleNodeActive(null);
      }

      onToggleNodesDisabled([item.id], checked);
    }
  };

  const onItemMouseEnter = (item) => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, true);
    } else if (isModularPipelineType(item.type)) {
      onToggleModularPipelineActive(item.id, true);
    } else if (isElementType(item.type) && item.id === 'parameters') {
      // Show parameters highlight when mouse enter parameters filter item
      onToggleParametersActive(true);
    } else if (item.visible) {
      onToggleNodeActive(item.id);
    }
  };

  const onItemMouseLeave = (item) => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, false);
    } else if (isModularPipelineType(item.type)) {
      onToggleModularPipelineActive(item.id, false);
    } else if (isElementType(item.type) && item.id === 'parameters') {
      // Hide parameters highlight when mouse leave parameters filter item
      onToggleParametersActive(false);
    } else if (item.visible) {
      onToggleNodeActive(null);
    }
  };

  const onGroupToggleChanged = (groupType) => {
    // Enable all items in group if none enabled, otherwise disable all of them
    const groupItems = items[groupType] || [];
    const groupItemsDisabled = groupItems.every(
      (groupItem) => !groupItem.checked
    );

    if (isTagType(groupType)) {
      onToggleTagFilter(
        groupItems.map((item) => item.id),
        groupItemsDisabled
      );
    } else if (isElementType(groupType)) {
      onToggleTypeDisabled(
        groupItems.reduce(
          (state, item) => ({ ...state, [item.id]: !groupItemsDisabled }),
          {}
        )
      );
    }
  };

  const handleToggleModularPipelineExpanded = (expanded) => {
    onToggleModularPipelineExpanded(expanded);
  };

  const onGroupItemChange = (item, wasChecked) => {
    // Toggle the group
    if (isTagType(item.type)) {
      onToggleTagFilter(item.id, !wasChecked);
    } else if (isElementType(item.type)) {
      onToggleTypeDisabled({ [item.id]: wasChecked });
    }

    // Reset node selection
    onToggleNodeSelected(null);
    onToggleNodeActive(null);
  };

  // Deselect node on Escape key
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      onToggleNodeSelected(null);
    }
  };
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <NodeList
      flags={flags}
      faded={faded}
      items={items}
      modularPipelinesTree={modularPipelinesTree}
      modularPipelinesSearchResult={modularPipelinesSearchResult}
      groups={groups}
      taskNodes={taskNodes}
      datasets={datasets}
      searchValue={searchValue}
      toNodes={toNodes}
      fromNodes={fromNodes}
      onUpdateSearchValue={debounce(updateSearchValue, 250)}
      onSelectFromNodes = {selectedFromNodes}
      onSelectToNodes = {selectedToNodes}
      onModularPipelineToggleExpanded={handleToggleModularPipelineExpanded}
      onGroupToggleChanged={onGroupToggleChanged}
      onToggleFocusMode={onToggleFocusMode}
      onItemClick={onItemClick}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
      focusMode={focusMode}
      disabledModularPipeline={disabledModularPipeline}
    />
  );
};

export const mapStateToProps = (state) => ({
  flags: state.flags,
  tags: getTagData(state),
  tagNodeCounts: getTagNodeCounts(state),
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeTypes: getNodeTypes(state),
  taskNodes: getTaskNodes(state),
  datasets: getDatasets(state),
  focusMode: getFocusedModularPipeline(state),
  disabledModularPipeline: state.modularPipeline.disabled,
  inputOutputDataNodes: getInputOutputNodesForFocusedModularPipeline(state),
  modularPipelinesTree: getModularPipelinesTree(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleTagActive: (tagIDs, active) => {
    dispatch(toggleTagActive(tagIDs, active));
  },
  onToggleTagFilter: (tagIDs, enabled) => {
    dispatch(toggleTagFilter(tagIDs, enabled));
  },
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleModularPipelineDisabled: (modularPipelineIDs, disabled) => {
    dispatch(toggleModularPipelineDisabled(modularPipelineIDs, disabled));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  },
  onToggleNodeSelected: (nodeID) => {
    dispatch(loadNodeData(nodeID));
  },
  onToggleModularPipelineExpanded: (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  },
  onToggleNodeActive: (nodeID) => {
    dispatch(toggleNodeHovered(nodeID));
  },
  onToggleParametersActive: (active) => {
    dispatch(toggleParametersHovered(active));
  },
  onToggleNodesDisabled: (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  },
  onToggleFocusMode: (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  },
  onToggleNodeClicked: (nodeID) =>{
    dispatch(toggleNodeClicked(nodeID))
  },
  onFilterNodes: (from,to) => {
    dispatch(filterNodes({from,to}));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeListProvider);
