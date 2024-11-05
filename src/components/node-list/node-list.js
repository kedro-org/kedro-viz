import React, { useContext, useEffect } from 'react';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars-2';
import SearchList from '../search-list';
import Filters from '../filters/filters';
import NodeListTree from './node-list-tree';
import SplitPanel from '../split-panel';
import { FiltersContext } from './utils/filters-context';
import { NodeListContext } from './utils/node-list-context';

import './styles/node-list.scss';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodeList = ({
  faded,
  modularPipelinesSearchResult,
  searchValue,
  onUpdateSearchValue,
}) => {
  const {
    groupCollapsed,
    groups,
    isResetFilterActive,
    items,
    onGroupToggleChanged,
    onResetFilter,
    onToggleGroupCollapsed,
    onFiltersRowClicked,
  } = useContext(FiltersContext);

  const {
    modularPipelinesTree,
    onModularPipelineToggleExpanded,
    // onToggleFocusMode,
    onNodeListRowClicked,
    onNodeListRowChanged,
    onItemMouseEnter,
    onItemMouseLeave,
    onToggleHoveredFocusMode,
    focusMode,
    disabledModularPipeline,
    handleKeyDown,
  } = useContext(NodeListContext);

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
        onUpdateSearchValue={onUpdateSearchValue}
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
                    modularPipelinesSearchResult={modularPipelinesSearchResult}
                    modularPipelinesTree={modularPipelinesTree}
                    searchValue={searchValue}
                    faded={faded}
                    onItemClick={onNodeListRowClicked}
                    onItemMouseEnter={onItemMouseEnter}
                    onItemMouseLeave={onItemMouseLeave}
                    onToggleHoveredFocusMode={onToggleHoveredFocusMode}
                    onItemChange={onNodeListRowChanged}
                    onNodeToggleExpanded={onModularPipelineToggleExpanded}
                    focusMode={focusMode}
                    disabledModularPipeline={disabledModularPipeline}
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
                  items={items}
                  onGroupToggleChanged={onGroupToggleChanged}
                  onItemChange={onFiltersRowClicked}
                  onResetFilter={onResetFilter}
                  onToggleGroupCollapsed={onToggleGroupCollapsed}
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

export default NodeList;
