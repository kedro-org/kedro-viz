import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import NodeListSearch from './node-list-search';
import NodeListGroups from './node-list-groups';
import NodeListTree from './node-list-tree';
import SplitPanel from '../split-panel';
import './styles/node-list.css';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodeList = ({
  faded,
  items,
  sections,
  groups,
  searchValue,
  getGroupState,
  onUpdateSearchValue,
  onToggleGroupChecked,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onSectionMouseEnter,
  onSectionMouseLeave,
  onItemChange,
}) => {
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setSearching(searchValue !== '');
  }, [searchValue]);

  return (
    <div
      className={classnames('pipeline-nodelist', {
        'pipeline-nodelist--fade': faded,
      })}>
      <NodeListSearch
        onUpdateSearchValue={onUpdateSearchValue}
        searchValue={searchValue}
      />
      <SplitPanel>
        {({ isResizing, props: { container, panelA, panelB, handle } }) => (
          <div
            className={classnames('pipeline-nodelist__split', {
              'pipeline-nodelist__split--resizing': isResizing,
            })}
            {...container}>
            <div className="pipeline-nodelist__elements-panel" {...panelA}>
              <Scrollbars
                className="pipeline-nodelist-scrollbars"
                style={{ width: 'auto' }}
                autoHide
                hideTracksWhenNotNeeded>
                <div className="pipeline-nodelist-section">
                  <NodeListTree
                    searchValue={searchValue}
                    faded={faded}
                    onItemClick={onItemClick}
                    onItemMouseEnter={onItemMouseEnter}
                    onItemMouseLeave={onItemMouseLeave}
                    onItemChange={onItemChange}
                    searching={searching}
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
                hideTracksWhenNotNeeded>
                <h2 className="pipeline-nodelist-section__title">Filters</h2>
                <NodeListGroups
                  items={items}
                  sections={sections.Categories}
                  groups={groups}
                  searchValue={searchValue}
                  getGroupState={getGroupState}
                  onItemClick={onItemClick}
                  onItemMouseEnter={onItemMouseEnter}
                  onItemMouseLeave={onItemMouseLeave}
                  onSectionMouseEnter={onSectionMouseEnter}
                  onSectionMouseLeave={onSectionMouseLeave}
                  onItemChange={onItemChange}
                  onToggleGroupChecked={onToggleGroupChecked}
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
