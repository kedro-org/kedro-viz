import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import utils from '@quantumblack/kedro-ui/lib/utils';
import NodeList from './node-list';
import { getFilteredItems, getGroups, getSections } from './node-list-items';
import { toggleTagActive, toggleTagFilter } from '../../actions/tags';
import {
  toggleModularPipelineActive,
  toggleModularPipelineFilter,
} from '../../actions/modular-pipelines';
import { toggleTypeDisabled } from '../../actions/node-type';
import { getNodeTypes } from '../../selectors/node-types';
import { getTagData } from '../../selectors/tags';
import { getModularPipelineData } from '../../selectors/modular-pipelines';
import { getGroupedNodes, getNodeSelected } from '../../selectors/nodes';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import { toggleParametersHovered } from '../../actions';
import './styles/node-list.css';

const isTagType = (type) => type === 'tag';
const isParameterType = (type) => type === 'parameters';
const isModularPipelineType = (type) => type === 'modularPipeline';

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
  tagsEnabled,
  types,
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
  modularPipelinesEnabled,
  modularPipelineFlag,
  sections,
}) => {
  const [searchValue, updateSearchValue] = useState('');
  const items = getFilteredItems({
    nodes,
    tags,
    tagsEnabled,
    modularPipelines,
    modularPipelinesEnabled,
    nodeSelected,
    searchValue,
  });

  const groups = getGroups({ types, items });

  const onItemClick = (item) => {
    if (isTagType(item.type) || isModularPipelineType(item.type)) {
      onCategoryItemChange(item, item.checked);
    } else {
      if (item.faded || item.selected) {
        onToggleNodeSelected(null);
      } else {
        onToggleNodeSelected(item.id);
      }
    }
  };

  const onItemChange = (item, checked) => {
    if (isTagType(item.type) || isModularPipelineType(item.type)) {
      onCategoryItemChange(item, checked);
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

  const onSectionMouseEnter = (item) => {
    if (isParameterType(item)) {
      onToggleParametersActive(true);
    }
  };

  const onSectionMouseLeave = (item) => {
    if (isParameterType(item)) {
      onToggleParametersActive(false);
    }
  };
  const onToggleGroupChecked = (type, checked) => {
    if (isTagType(type) || isModularPipelineType(type)) {
      // Filter all category items if at least one item set, otherwise enable all items
      const categoryItems = items[type] || [];
      const someCategoryItemSet = categoryItems.some(
        (categoryItem) => !categoryItem.unset
      );
      const allCategoryItemsValue = someCategoryItemSet ? undefined : true;

      if (isTagType(type)) {
        onToggleTagFilter(
          categoryItems.map((tag) => tag.id),
          allCategoryItemsValue
        );
      } else {
        onToggleModularPipelineFilter(
          categoryItems.map((item) => item.id),
          allCategoryItemsValue
        );
      }
    } else {
      onToggleTypeDisabled(type, checked);
    }
  };

  const onCategoryItemChange = (item, wasChecked) => {
    const categoryType = item.type;
    const categoryTypeItems = items[categoryType] || [];
    const oneCategoryItemChecked =
      categoryTypeItems.filter((categoryItem) => categoryItem.checked)
        .length === 1;
    const shouldResetCategoryItems = wasChecked && oneCategoryItemChecked;

    if (shouldResetCategoryItems) {
      // Unset all category item
      if (categoryType === 'tag') {
        onToggleTagFilter(
          tags.map((tag) => tag.id),
          undefined
        );
      } else {
        onToggleModularPipelineFilter(
          modularPipelines.map((modularPipeline) => modularPipeline.id),
          undefined
        );
      }
    } else {
      // Toggle the category item
      categoryType === 'tag'
        ? onToggleTagFilter([item.id], !wasChecked)
        : onToggleModularPipelineFilter([item.id], !wasChecked);
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
  tagsEnabled: state.tag.enabled,
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  types: getNodeTypes(state),
  modularPipelines: getModularPipelineData(state),
  modularPipelinesEnabled: state.modularPipeline.enabled,
  modularPipelineFlag: state.flags.modularpipeline,
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
