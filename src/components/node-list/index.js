import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import NodeList from './node-list';
import { isTagType, isElementType, isGroupType } from './node-list-items';
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
import {
  toggleParametersHovered,
  toggleFocusMode,
  toggleHoveredFocusMode,
} from '../../actions';
import {
  toggleModularPipelineActive,
  toggleModularPipelineDisabled,
  toggleModularPipelinesExpanded,
} from '../../actions/modular-pipelines';
import { resetSlicePipeline } from '../../actions/slice';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../../actions/nodes';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import './styles/node-list.scss';
import { params } from '../../config';
import { FiltersContextProvider } from './utils/filters-context';

/**
 * Provides data from the store to populate a NodeList component.
 * Also handles user interaction and dispatches updates back to the store.
 */
const NodeListProvider = ({
  faded,
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
  onToggleHoveredFocusMode,
  modularPipelinesTree,
  focusMode,
  disabledModularPipeline,
  onResetSlicePipeline,
  isSlicingPipelineApplied,
}) => {
  const [searchValue, updateSearchValue] = useState('');

  const {
    toSelectedPipeline,
    toSelectedNode,
    toFocusedModularPipeline,
    toUpdateUrlParamsOnFilter,
  } = useGeneratePathname();

  const modularPipelinesSearchResult = searchValue
    ? getModularPipelinesSearchResult(modularPipelinesTree, searchValue)
    : null;

  const onItemClick = (event, item) => {
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
        // Reset the pipeline slicing filters if no slicing is currently applied
        if (!isSlicingPipelineApplied) {
          onResetSlicePipeline();
        }
      }
    }

    // to prevent page reload on form submission
    event.preventDefault();
  };

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

  const onItemChange = (item, checked, clickedIconType) => {
    if (isGroupType(item.type) || isModularPipelineType(item.type)) {
      onGroupItemChange(item, checked);

      // Update URL query parameters when a filter item is clicked
      if (!clickedIconType) {
        handleUrlParamsUpdateOnFilter(item);
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
    <FiltersContextProvider>
      <NodeList
        faded={faded}
        modularPipelinesTree={modularPipelinesTree}
        modularPipelinesSearchResult={modularPipelinesSearchResult}
        searchValue={searchValue}
        onUpdateSearchValue={debounce(updateSearchValue, 250)}
        onModularPipelineToggleExpanded={handleToggleModularPipelineExpanded}
        onToggleFocusMode={onToggleFocusMode}
        onItemClick={onItemClick}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
        onToggleHoveredFocusMode={onToggleHoveredFocusMode}
        onItemChange={onItemChange}
        focusMode={focusMode}
        disabledModularPipeline={disabledModularPipeline}
      />
    </FiltersContextProvider>
  );
};

export const mapStateToProps = (state) => ({
  focusMode: getFocusedModularPipeline(state),
  disabledModularPipeline: state.modularPipeline.disabled,
  modularPipelinesTree: getModularPipelinesTree(state),
  isSlicingPipelineApplied: state.slice.apply,
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
  onToggleHoveredFocusMode: (active) => {
    dispatch(toggleHoveredFocusMode(active));
  },
  onResetSlicePipeline: () => {
    dispatch(resetSlicePipeline());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeListProvider);
