import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import NodeList from './node-list';
import {
  getFilteredItems,
  getGroups,
  isTagType,
  isModularPipelineType,
  isElementType,
  isGroupType,
} from './node-list-items';
import { getNodeTypes } from '../../selectors/node-types';
import { getTagData, getTagNodeCounts } from '../../selectors/tags';
import { getModularPipelineData } from '../../selectors/modular-pipelines';
import { getGroupedNodes, getNodeSelected } from '../../selectors/nodes';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleParametersHovered } from '../../actions';
import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter
} from '../../actions/modular-pipelines';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import './styles/node-list.css';

/**
 * Provides data from the store to populate a NodeList component.
 * Also handles user interaction and dispatches updates back to the store.
 */
const NodeListProvider = ({
  faded,
  nodes,
  nodeSelected,
  tags,
  tagNodeCounts,
  nodeTypes,
  onToggleNodesDisabled,
  onToggleNodeSelected,
  onToggleNodeActive,
  onToggleParametersActive,
  onToggleTagActive,
  onToggleTagFilter,
  onToggleModularPipelineActive,
  onToggleTypeDisabled,
  modularPipelines,
}) => {
  const [searchValue, updateSearchValue] = useState('');

  const items = getFilteredItems({
    nodes,
    tags,
    nodeTypes,
    tagNodeCounts,
    modularPipelines,
    nodeSelected,
    searchValue,
  });

  const groups = getGroups({ items });

  const onItemClick = (item) => {
    if (isGroupType(item.type)) {
      onGroupItemChange(item, item.checked);
    } else {
      if (item.faded || item.selected) {
        onToggleNodeSelected(null);
      } else {
        onToggleNodeSelected(item.id);
      }
    }
  };

  const onItemChange = (item, checked) => {
    if (isGroupType(item.type)) {
      onGroupItemChange(item, checked);
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
    utils.handleKeyEvent(event.keyCode, {
      escape: () => onToggleNodeSelected(null),
    });
  };
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <NodeList
      faded={faded}
      items={items}
      groups={groups}
      searchValue={searchValue}
      onUpdateSearchValue={updateSearchValue}
      onGroupToggleChanged={onGroupToggleChanged}
      onItemClick={onItemClick}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
    />
  );
};

export const mapStateToProps = (state) => ({
  tags: getTagData(state),
  tagNodeCounts: getTagNodeCounts(state),
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeTypes: getNodeTypes(state),
  modularPipelines: getModularPipelineData(state),
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
  onToggleModularPipelineFilter: (modularPipelineIDs, enabled) => {
    dispatch(toggleModularPipelineFilter(modularPipelineIDs, enabled));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  },
  onToggleNodeSelected: (nodeID) => {
    dispatch(loadNodeData(nodeID));
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
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeListProvider);
