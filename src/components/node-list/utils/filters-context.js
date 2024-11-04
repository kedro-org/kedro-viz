import React, { useState, createContext } from 'react';
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

import { params, localStorageName } from '../../../config';
import { getFilteredItems, isTagType, isElementType } from '../node-list-items';

const storedState = loadLocalStorage(localStorageName);

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

  const [groupCollapsed, setGroupCollapsed] = useState(
    storedState.groupsCollapsed || {}
  );

  const {
    toUpdateUrlParamsOnResetFilter,
    toUpdateUrlParamsOnFilter,
    toSetQueryParam,
  } = useGeneratePathname();

  // Reset applied filters to default
  const onResetFilter = () => {
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

  // Collapse/expand node group of filters
  const onToggleGroupCollapsed = (groupID) => {
    const res = {
      ...groupCollapsed,
      [groupID]: !groupCollapsed[groupID],
    };

    setGroupCollapsed(res);
    saveLocalStorage(localStorageName, { groupsCollapsed: res });
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

  // duplicated in index.js

  // To get existing values from URL query parameters
  const getExistingValuesFromUrlQueryParams = (paramName, searchParams) => {
    const paramValues = searchParams.get(paramName);
    return new Set(paramValues ? paramValues.split(',') : []);
  };
  const handleUrlParamsUpdateOnFilter = (item) => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramName = isElementType(item.type) ? params.types : params.tags;
    const existingValues = getExistingValuesFromUrlQueryParams(
      paramName,
      searchParams
    );

    toUpdateUrlParamsOnFilter(item, paramName, existingValues);
  };

  // To update URL query parameters when a filter group is clicked
  const handleUrlParamsUpdateOnGroupFilter = (
    groupType,
    groupItems,
    groupItemsDisabled
  ) => {
    if (groupItemsDisabled) {
      // If all items in group are disabled
      groupItems.forEach((item) => {
        handleUrlParamsUpdateOnFilter(item);
      });
    } else {
      // If some items in group are enabled
      const paramName = isElementType(groupType) ? params.types : params.tags;
      toSetQueryParam(paramName, []);
    }
  };

  const onGroupToggleChanged = (groupType) => {
    // Enable all items in group if none enabled, otherwise disable all of them
    const groupItems = items[groupType] || [];
    const groupItemsDisabled = groupItems.every(
      (groupItem) => !groupItem.checked
    );

    // Update URL query parameters when a filter group is clicked
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
        onResetFilter,
        onGroupToggleChanged,
        onToggleGroupCollapsed,
        groupCollapsed,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
