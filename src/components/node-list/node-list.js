import React from 'react';
import classnames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import NodeListSearch from './node-list-search';
import NodeListGroups from './node-list-groups';
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
  onItemChange
}) => (
  <div
    className={classnames('pipeline-nodelist', {
      'pipeline-nodelist--fade': faded
    })}>
    <NodeListSearch
      onUpdateSearchValue={onUpdateSearchValue}
      searchValue={searchValue}
    />
    <Scrollbars
      className="pipeline-nodelist-scrollbars"
      style={{ width: 'auto' }}
      autoHide
      hideTracksWhenNotNeeded>
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
    </Scrollbars>
  </div>
);

export default NodeList;
