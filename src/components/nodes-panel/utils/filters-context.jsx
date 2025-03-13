import React, { useState, useEffect, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useGeneratePathname } from '../../../utils/hooks/use-generate-pathname';
import { loadLocalStorage, saveLocalStorage } from '../../../store/helpers';

import { getTagData, getTagNodeCounts } from '../../../selectors/tags';
import {
  getGroupedNodes,
  getNodeSelected,
  getInputOutputNodesForFocusedModularPipeline,
} from '../../../selectors/nodes';
import { getNodeTypes } from '../../../selectors/node-types';
import { getFocusedModularPipeline } from '../../../selectors/modular-pipelines';

import { toggleTagFilter } from '../../../actions/tags';
import { toggleTypeDisabled } from '../../../actions/node-type';
import { loadNodeData, toggleNodeHovered } from '../../../actions/nodes';

import { params, localStorageName, NODE_TYPES } from '../../../config';
import {
  getFilteredItems,
  isTagType,
  isElementType,
  getGroups,
} from '../../../selectors/filtered-node-list-items';

// Load the stored state from local storage
const storedState = loadLocalStorage(localStorageName);

// Custom hook to group useSelector calls
const useFiltersContextSelector = () => {
  const dispatch = useDispatch();
  const tags = useSelector(getTagData);
  const nodes = useSelector(getGroupedNodes);
  const nodeTypes = useSelector(getNodeTypes);
  const tagNodeCounts = useSelector(getTagNodeCounts);
  const nodeSelected = useSelector(getNodeSelected);
  const focusMode = useSelector(getFocusedModularPipeline);
  const inputOutputDataNodes = useSelector(
    getInputOutputNodesForFocusedModularPipeline
  );

  const onToggleTypeDisabled = (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  };

  const onToggleTagFilter = (tagIDs, enabled) => {
    dispatch(toggleTagFilter(tagIDs, enabled));
  };

  const onToggleNodeSelected = (nodeID) => {
    dispatch(loadNodeData(nodeID));
  };

  const onToggleNodeHovered = (nodeID) => {
    dispatch(toggleNodeHovered(nodeID));
  };

  return {
    tags,
    nodes,
    nodeTypes,
    tagNodeCounts,
    nodeSelected,
    focusMode,
    inputOutputDataNodes,
    onToggleTypeDisabled,
    onToggleTagFilter,
    onToggleNodeSelected,
    onToggleNodeHovered,
  };
};

// Create a context for filters
export const FiltersContext = createContext();

export const FiltersContextProvider = ({ children }) => {
  const {
    tags,
    nodes,
    nodeTypes,
    tagNodeCounts,
    nodeSelected,
    focusMode,
    inputOutputDataNodes,
    onToggleTypeDisabled,
    onToggleTagFilter,
    onToggleNodeSelected,
    onToggleNodeHovered,
  } = useFiltersContextSelector();

  const [groupCollapsed, setGroupCollapsed] = useState(
    storedState.groupsCollapsed || {}
  );
  const [isResetFilterActive, setIsResetFilterActive] = useState(false);

  // Helper function to check if NodeTypes are modified
  const hasModifiedNodeTypes = (nodeTypes) => {
    return nodeTypes.some(
      (item) => NODE_TYPES[item.id]?.defaultState !== item.disabled
    );
  };

  // Effect to update the reset filter button status based on node types and tags
  useEffect(() => {
    const isNodeTypeModified = hasModifiedNodeTypes(nodeTypes);
    const isNodeTagModified = tags.some((tag) => tag.enabled);
    setIsResetFilterActive(isNodeTypeModified || isNodeTagModified);
  }, [tags, nodeTypes]);

  const {
    toUpdateUrlParamsOnResetFilter,
    toUpdateUrlParamsOnFilter,
    toSetQueryParam,
  } = useGeneratePathname();

  // Function to reset applied filters to default
  const handleResetFilter = () => {
    onToggleTypeDisabled({ task: false, data: false, parameters: true });
    onToggleTagFilter(
      tags.map((item) => item.id),
      false
    );
    toUpdateUrlParamsOnResetFilter();
  };

  // Function to collapse/expand node group of filters
  const handleToggleGroupCollapsed = (groupID) => {
    const updatedGroupCollapsed = {
      ...groupCollapsed,
      [groupID]: !groupCollapsed[groupID],
    };
    setGroupCollapsed(updatedGroupCollapsed);
    saveLocalStorage(localStorageName, {
      groupsCollapsed: updatedGroupCollapsed,
    });
  };

  const items = getFilteredItems({
    nodes,
    tags,
    nodeTypes,
    tagNodeCounts,
    nodeSelected,
    searchValue: '',
    focusMode,
    inputOutputDataNodes,
  });

  const groups = getGroups({ items });

  // Function to get existing values from URL query parameters
  const getExistingValuesFromUrlQueryParams = (paramName, searchParams) => {
    const paramValues = searchParams.get(paramName);
    return new Set(paramValues ? paramValues.split(',') : []);
  };

  // Function to update URL query parameters when a filter is applied
  const handleUrlParamsUpdateOnFilter = (item) => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramName = isElementType(item.type) ? params.types : params.tags;
    const existingValues = getExistingValuesFromUrlQueryParams(
      paramName,
      searchParams
    );
    toUpdateUrlParamsOnFilter(item, paramName, existingValues);
  };

  // Function to update URL query parameters when a filter group is clicked
  const handleUrlParamsUpdateOnGroupFilter = (
    groupType,
    groupItems,
    groupItemsDisabled
  ) => {
    if (groupItemsDisabled) {
      groupItems.forEach((item) => {
        handleUrlParamsUpdateOnFilter(item);
      });
    } else {
      const paramName = isElementType(groupType) ? params.types : params.tags;
      toSetQueryParam(paramName, []);
    }
  };

  // Function to handle group toggle change
  const handleGroupToggleChanged = (groupType) => {
    const groupItems = items[groupType] || [];
    const groupItemsDisabled = groupItems.every(
      (groupItem) => !groupItem.checked
    );

    handleUrlParamsUpdateOnGroupFilter(
      groupType,
      groupItems,
      groupItemsDisabled
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
    onToggleNodeHovered(null);
  };

  const handleFiltersRowClicked = (event, item) => {
    onGroupItemChange(item, item.checked);
    handleUrlParamsUpdateOnFilter(item);

    // to prevent page reload on form submission
    event.preventDefault();
  };

  return (
    <FiltersContext.Provider
      value={{
        groupCollapsed,
        groups,
        isResetFilterActive,
        items,
        handleGroupToggleChanged,
        handleResetFilter,
        handleToggleGroupCollapsed,
        handleFiltersRowClicked,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
