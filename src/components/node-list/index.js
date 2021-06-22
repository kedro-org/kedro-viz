import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import NodeList from './node-list';
import { getFilteredItems, getGroups, getSections } from './node-list-items';
import { getNodeTypes } from '../../selectors/node-types';
import { getTagData, getTagNodeCounts } from '../../selectors/tags';
import { getModularPipelineData } from '../../selectors/modular-pipelines';
import { getGroupedNodes, getNodeSelected } from '../../selectors/nodes';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleParametersHovered } from '../../actions';
import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter,
} from '../../actions/modular-pipelines';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import './styles/node-list.css';

const isTagType = (type) => type === 'tag';
const isParameterType = (type) => type === 'parameters';
const isModularPipelineType = (type) => type === 'modularPipeline';
const isElementType = (type) => type === 'elementType';

const isGroupType = (type) =>
  isElementType(type) || isTagType(type) || isModularPipelineType(type);

/**
 * Provides data from the store to populate a NodeList component.
 * Also handles user interaction and dispatches updates back to the store.
 *
 * The data are hierarchical but provided through flat lists in the form of:
 *
 * Sections (first level) e.g. Categories, Elements
 * Groups (second level) e.g. Tags, Nodes, Datasets, Parameters
 * Items (third level) e.g. 'Data Engineering', 'Content Optimisation'
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
  onToggleModularPipelineFilter,
  onToggleTypeDisabled,
  modularPipelines,
  sections,
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

  const groups = getGroups({ nodeTypes, items });

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
    } else if (item.visible) {
      onToggleNodeActive(item.id);
    }
  };

  const onItemMouseLeave = (item) => {
    if (isTagType(item.type)) {
      onToggleTagActive(item.id, false);
    } else if (isModularPipelineType(item.type)) {
      onToggleModularPipelineActive(item.id, false);
    } else if (item.visible) {
      onToggleNodeActive(null);
    }
  };

  const onToggleGroupChecked = (type, checked) => {
    const groupItems = items[type] || [];
    const someItemChecked = groupItems.some((groupItem) => groupItem.checked);

    if (isTagType(type)) {
      onToggleTagFilter(
        groupItems.map((item) => item.id),
        !someItemChecked
      );
    } else if (isElementType(type)) {
      onToggleTypeDisabled(
        groupItems.reduce(
          (o, item) => ({
            ...o,
            [item.id]: someItemChecked,
          }),
          {}
        )
      );
    } else if (isModularPipelineType(type)) {
      onToggleModularPipelineFilter(
        groupItems.map((item) => item.id),
        !someItemChecked
      );
    } else {
      onToggleTypeDisabled({ [type]: checked });
    }
  };

  const onGroupItemChange = (item, wasChecked) => {
    // Toggle the item
    if (isTagType(item.type)) {
      onToggleTagFilter(item.id, !wasChecked);
    } else if (isModularPipelineType(item.type)) {
      onToggleModularPipelineFilter(item.id, !wasChecked);
    } else if (isElementType(item.type)) {
      onToggleTypeDisabled({ [item.id]: wasChecked });
    }

    // Reset node selection
    onToggleNodeSelected(null);
    onToggleNodeActive(null);
  };

  const onSectionMouseEnter = (type) => {
    if (isParameterType(type)) {
      onToggleParametersActive(true);
    }
  };

  const onSectionMouseLeave = (type) => {
    if (isParameterType(type)) {
      onToggleParametersActive(false);
    }
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
      sections={sections}
      groups={groups}
      searchValue={searchValue}
      onUpdateSearchValue={updateSearchValue}
      onToggleGroupChecked={onToggleGroupChecked}
      onItemClick={onItemClick}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onSectionMouseEnter={onSectionMouseEnter}
      onSectionMouseLeave={onSectionMouseLeave}
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
  sections: getSections(state),
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
