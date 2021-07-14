import React, { useState } from 'react';
import { loadState, saveState } from '../../store/helpers';
import NodeListGroup from './node-list-group';

const storedState = loadState();

const NodeListGroups = ({
  items,
  groups,
  searchValue,
  onGroupToggleChanged,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemChange,
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});

  // Collapse/expand node group
  const onToggleGroupCollapsed = (groupID) => {
    const groupsCollapsed = {
      ...collapsed,
      [groupID]: !collapsed[groupID],
    };

    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  return (
    <nav className="pipeline-nodelist-section kedro">
      <ul className="pipeline-nodelist__list">
        {Object.values(groups).map((group) => (
          <NodeListGroup
            group={group}
            items={items[group.id] || []}
            key={group.id}
            id={group.id}
            name={group.name}
            kind={group.kind}
            checked={group.checked}
            allUnchecked={group.allUnchecked}
            visibleIcon={group.visibleIcon}
            invisibleIcon={group.invisibleIcon}
            collapsed={Boolean(searchValue) ? false : collapsed[group.id]}
            onToggleCollapsed={onToggleGroupCollapsed}
            onToggleChecked={onGroupToggleChanged}
            onItemClick={onItemClick}
            onItemChange={onItemChange}
            onItemMouseEnter={onItemMouseEnter}
            onItemMouseLeave={onItemMouseLeave}
          />
        ))}
      </ul>
    </nav>
  );
};

export default NodeListGroups;
