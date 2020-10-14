import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import NodeListSearch from './node-list-search';
import NodeListGroups from './node-list-groups';
import './styles/node-list.css';

/**
 * Scrollable list of toggleable items, with search & filter functionality
 */
const NodeList = ({
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
  onItemChange
}) => (
  <>
    <NodeListSearch
      onUpdateSearchValue={onUpdateSearchValue}
      searchValue={searchValue}
    />
    <Scrollbars
      className="pipeline-nodelist-scrollbars"
      style={{ width: 'auto' }}
      autoHide
      hideTracksWhenNotNeeded>
      <div className="pipeline-nodelist-container">
        <NodeListGroups
          items={items}
          sections={sections}
          groups={groups}
          searchValue={searchValue}
          getGroupState={getGroupState}
          onItemClick={onItemClick}
          onItemMouseEnter={onItemMouseEnter}
          onItemMouseLeave={onItemMouseLeave}
          onItemChange={onItemChange}
          onToggleGroupChecked={onToggleGroupChecked}
        />
      </div>
    </Scrollbars>
  </>
);

export default NodeList;
