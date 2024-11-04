import React from 'react';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars-2';
import SearchList from '../search-list';
import Filters from '../filters/filters';
import NodeListTree from './node-list-tree';
import SplitPanel from '../split-panel';

import './styles/node-list.scss';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodeList = ({
  faded,
  items,
  modularPipelinesTree,
  modularPipelinesSearchResult,
  groups,
  searchValue,
  getGroupState,
  onUpdateSearchValue,
  onGroupToggleChanged,
  onToggleGroupCollapsed,
  groupCollapsed,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onToggleHoveredFocusMode,
  onItemChange,
  onModularPipelineToggleExpanded,
  focusMode,
  disabledModularPipeline,
  onResetFilter,
  isResetFilterActive,
}) => {
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
                    onItemClick={onItemClick}
                    onItemMouseEnter={onItemMouseEnter}
                    onItemMouseLeave={onItemMouseLeave}
                    onToggleHoveredFocusMode={onToggleHoveredFocusMode}
                    onItemChange={onItemChange}
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
                  getGroupState={getGroupState}
                  groupCollapsed={groupCollapsed}
                  groups={groups}
                  isResetFilterActive={isResetFilterActive}
                  items={items}
                  onGroupToggleChanged={onGroupToggleChanged}
                  onItemChange={onItemChange}
                  onItemClick={onItemClick}
                  onItemMouseEnter={onItemMouseEnter}
                  onItemMouseLeave={onItemMouseLeave}
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
