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
} from '../../actions/nodes';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import './styles/node-list.scss';
import { params, NODE_TYPES } from '../../config';
import { useHistory } from 'react-router-dom';

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
  onToggleModularPipelineDisabled,
  onToggleModularPipelineExpanded,
  onToggleTypeDisabled,
  onToggleFocusMode,
  modularPipelinesTree,
  focusMode,
  disabledModularPipeline,
  inputOutputDataNodes,
}) => {
  const [searchValue, updateSearchValue] = useState('');
  const [isResetFilterActive, setIsResetFilterActive] = useState(false);

  const history = useHistory();

  const {
    toSelectedPipeline,
    toSelectedNode,
    toFocusedModularPipeline,
    toSetQueryParam,
  } = useGeneratePathname();

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

  // To determine the parameter name based on the item type
  const getParamName = (item) => {
    return isElementType(item.type) ? params.types : params.tags;
  };

  // To get existing values from search parameters
  const getExistingValues = (paramName, searchParams) => {
    const paramValues = searchParams.get(paramName);
    return new Set(paramValues ? paramValues.split(',') : []);
  };

  // To update the URL parameters
  const updateUrlParams = (item, paramName, existingValues) => {
    if (item.checked) {
      existingValues.delete(item.id);
    } else {
      existingValues.add(item.id);
    }

    toSetQueryParam(paramName, Array.from(existingValues));
  };

  const handleUrlParams = (item) => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramName = getParamName(item);
    const existingValues = getExistingValues(paramName, searchParams);

    updateUrlParams(item, paramName, existingValues);
  };

  const onItemChange = (item, checked, clickedIconType) => {
    if (isGroupType(item.type) || isModularPipelineType(item.type)) {
      onGroupItemChange(item, checked);
      if (!clickedIconType) {
        handleUrlParams(item);
      }

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

    groupItems.forEach((item) => {
      handleUrlParams(item);
    });

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

  // Updates the URL parameters when the filter is reset.
  const updateUrlParamsOnResetFilter = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete(params.tags);
    searchParams.set(params.types, `${NODE_TYPES.task},${NODE_TYPES.data}`);

    history.push(
      decodeURIComponent(
        `${window.location.pathname}?${searchParams.toString()}`
      )
    );
  };

  // Reset applied filters to default
  const onResetFilter = () => {
    onToggleTypeDisabled({ task: false, data: false, parameters: true });
    onToggleTagFilter(
      tags.map((item) => item.id),
      false
    );

    updateUrlParamsOnResetFilter();
  };

  // Updates the reset filter button status based on the node types and tags.
  useEffect(() => {
    const nodeTypesAcc = nodeTypes.reduce((acc, item) => {
      if (item.id === NODE_TYPES.task) {
        acc.task = item;
      } else if (item.id === NODE_TYPES.data) {
        acc.dataItem = item;
      } else if (item.id === NODE_TYPES.parameters) {
        acc.parameters = item;
      }
      return acc;
    }, {});

    const { task, dataItem, parameters } = nodeTypesAcc;
    const isNodeTypeModified =
      task.disabled || dataItem.disabled || !parameters.disabled;

    const isNodeTagModified = tags.some((item) => item.enabled);
    setIsResetFilterActive(isNodeTypeModified || isNodeTagModified);
  }, [tags, nodeTypes]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <NodeList
      faded={faded}
      items={items}
      modularPipelinesTree={modularPipelinesTree}
      modularPipelinesSearchResult={modularPipelinesSearchResult}
      groups={groups}
      searchValue={searchValue}
      onUpdateSearchValue={debounce(updateSearchValue, 250)}
      onModularPipelineToggleExpanded={handleToggleModularPipelineExpanded}
      onGroupToggleChanged={onGroupToggleChanged}
      onToggleFocusMode={onToggleFocusMode}
      onItemClick={onItemClick}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
      onItemChange={onItemChange}
      focusMode={focusMode}
      disabledModularPipeline={disabledModularPipeline}
      onResetFilter={onResetFilter}
      isResetFilterActive={isResetFilterActive}
    />
  );
};

export const mapStateToProps = (state) => ({
  tags: getTagData(state),
  tagNodeCounts: getTagNodeCounts(state),
  nodes: getGroupedNodes(state),
  nodeSelected: getNodeSelected(state),
  nodeTypes: getNodeTypes(state),
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
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeListProvider);
