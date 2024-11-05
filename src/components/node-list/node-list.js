import React, { useContext, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars-2';
import SearchList from '../search-list';
import Filters from '../filters/filters';
import NodeListTree from './node-list-tree';
import SplitPanel from '../split-panel';
import { FiltersContext } from './utils/filters-context';
import { NodeListContext } from './utils/node-list-context';
import { getModularPipelinesSearchResult } from '../../selectors/modular-pipelines';

import './styles/node-list.scss';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodeList = ({ faded }) => {
  const [searchValue, updateSearchValue] = useState('');

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
    handleModularPipelineToggleExpanded,
    handleNodeListRowClicked,
    handleNodeListRowChanged,
    handleItemMouseEnter,
    handleItemMouseLeave,
    handleToggleHoveredFocusMode,
    focusMode,
    disabledModularPipeline,
    handleKeyDown,
  } = useContext(NodeListContext);

  const modularPipelinesSearchResult = searchValue
    ? getModularPipelinesSearchResult(modularPipelinesTree, searchValue)
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
                    modularPipelinesSearchResult={modularPipelinesSearchResult}
                    modularPipelinesTree={modularPipelinesTree}
                    searchValue={searchValue}
                    faded={faded}
                    onItemClick={handleNodeListRowClicked}
                    onItemMouseEnter={handleItemMouseEnter}
                    onItemMouseLeave={handleItemMouseLeave}
                    onToggleHoveredFocusMode={handleToggleHoveredFocusMode}
                    onItemChange={handleNodeListRowChanged}
                    onNodeToggleExpanded={handleModularPipelineToggleExpanded}
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
