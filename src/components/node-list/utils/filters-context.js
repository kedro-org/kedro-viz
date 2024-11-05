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

import { params, localStorageName, NODE_TYPES } from '../../../config';
import {
  getFilteredItems,
  isTagType,
  isElementType,
  getGroups,
} from '../node-list-items';

// Load the stored state from local storage
const storedState = loadLocalStorage(localStorageName);

// Create a context for filters
export const FiltersContext = createContext();

export const FiltersContextProvider = ({ children, value }) => {
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

  // State to manage collapsed groups
  const [groupCollapsed, setGroupCollapsed] = useState(
    storedState.groupsCollapsed || {}
  );
  // State to manage the reset filter button status
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
    dispatch(
      toggleTypeDisabled({ task: false, data: false, parameters: true })
    );
    dispatch(
      toggleTagFilter(
        tags.map((item) => item.id),
        false
      )
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
      dispatch(
        toggleTagFilter(
          groupItems.map((item) => item.id),
          groupItemsDisabled
        )
      );
    } else if (isElementType(groupType)) {
      dispatch(
        toggleTypeDisabled(
          groupItems.reduce(
            (state, item) => ({ ...state, [item.id]: !groupItemsDisabled }),
            {}
          )
        )
      );
    }
  };

  return (
    <FiltersContext.Provider
      value={{
        groupCollapsed,
        groups,
        isResetFilterActive,
        items,
        onGroupToggleChanged: handleGroupToggleChanged,
        onResetFilter: handleResetFilter,
        onToggleGroupCollapsed: handleToggleGroupCollapsed,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
