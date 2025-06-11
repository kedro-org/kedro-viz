import React, { useContext, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars-2';
import SearchList from '../search-list';
import Filters from '../filters/filters';
import NodeListTree from '../node-list-tree/node-list-tree';
import SplitPanel from '../split-panel';
import { FiltersContext } from './utils/filters-context';
import { NodeListContext } from './utils/node-list-context';
import { getModularPipelinesSearchResult } from '../../selectors/modular-pipelines';
import { getFiltersSearchResult } from '../../selectors/filtered-node-list-items';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodesPanel = ({ faded }) => {
  const [searchValue, updateSearchValue] = useState('');

  const {
    groupCollapsed,
    groups,
    isResetFilterActive,
    items,
    handleGroupToggleChanged,
    handleResetFilter,
    handleToggleGroupCollapsed,
    handleFiltersRowClicked,
  } = useContext(FiltersContext);

  const {
    hoveredNode,
    expanded,
    focusMode,
    handleItemMouseEnter,
    handleItemMouseLeave,
    handleKeyDown,
    handleModularPipelineToggleExpanded,
    handleNodeListRowChanged,
    handleNodeListRowClicked,
    handleToggleHoveredFocusMode,
    isSlicingPipelineApplied,
    modularPipelinesTree,
    selectedNodes,
    slicedPipeline,
    nodesDisabledViaModularPipeline,
  } = useContext(NodeListContext);

  const modularPipelinesSearchResult = searchValue
    ? getModularPipelinesSearchResult(modularPipelinesTree, searchValue)
    : null;

  const filtersSearchResult = searchValue
    ? getFiltersSearchResult(items, searchValue)
    : null;

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className={classnames('pipeline-nodelist', {
        'pipeline-nodelist--fade': faded,
      })}
    >
      <SearchList
        onUpdateSearchValue={debounce(updateSearchValue, 250)}
        searchValue={searchValue}
      />
      <SplitPanel>
        {({ isResizing, props: { container, panelA, panelB, handle } }) => (
          <div
            className={classnames('pipeline-nodelist__split', {
              'pipeline-nodelist__split--resizing': isResizing,
            })}
            {...container}
          >
            <div className="pipeline-nodelist__elements-panel" {...panelA}>
              <Scrollbars
                className="pipeline-nodelist-scrollbars"
                style={{ width: 'auto' }}
                autoHide
                hideTracksWhenNotNeeded
              >
                <div className="pipeline-nodelist-section">
                  <NodeListTree
                    hoveredNode={hoveredNode}
                    expanded={expanded}
                    faded={faded}
                    focusMode={focusMode}
                    isSlicingPipelineApplied={isSlicingPipelineApplied}
                    modularPipelinesSearchResult={modularPipelinesSearchResult}
                    modularPipelinesTree={modularPipelinesTree}
                    nodeSelected={selectedNodes}
                    onItemChange={handleNodeListRowChanged}
                    onItemClick={handleNodeListRowClicked}
                    onItemMouseEnter={handleItemMouseEnter}
                    onItemMouseLeave={handleItemMouseLeave}
                    onNodeToggleExpanded={handleModularPipelineToggleExpanded}
                    onToggleHoveredFocusMode={handleToggleHoveredFocusMode}
                    searchValue={searchValue}
                    slicedPipeline={slicedPipeline}
                    nodesDisabledViaModularPipeline={
                      nodesDisabledViaModularPipeline
                    }
                  />
                </div>
              </Scrollbars>
            </div>
            <div className="pipeline-nodelist__filter-panel" {...panelB}>
              <div className="pipeline-nodelist__split-handle" {...handle} />
              <Scrollbars
                className="pipeline-nodelist-scrollbars"
                style={{ width: 'auto' }}
                autoHide
                hideTracksWhenNotNeeded
              >
                <Filters
                  groupCollapsed={groupCollapsed}
                  groups={groups}
                  isResetFilterActive={isResetFilterActive}
                  items={searchValue.length > 0 ? filtersSearchResult : items}
                  onGroupToggleChanged={handleGroupToggleChanged}
                  onItemChange={handleFiltersRowClicked}
                  onResetFilter={handleResetFilter}
                  onToggleGroupCollapsed={handleToggleGroupCollapsed}
                  searchValue={searchValue}
                />
              </Scrollbars>
            </div>
          </div>
        )}
      </SplitPanel>
    </div>
  );
};

export default NodesPanel;
