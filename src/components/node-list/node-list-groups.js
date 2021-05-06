import React, { useState } from 'react';
import { loadState, saveState } from '../../store/helpers';
import NodeListGroup from './node-list-group';

const storedState = loadState();

const NodeListGroups = ({
  items,
  sections,
  groups,
  searchValue,
  onToggleGroupChecked,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onSectionMouseEnter,
  onSectionMouseLeave,
  onItemChange,
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});

  // Collapse/expand node group
  const onToggleGroupCollapsed = (typeID) => {
    const groupsCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID],
    });
    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  return sections.map((section) => (
    <nav className="pipeline-nodelist-section kedro" key={section.name}>
      <h2 className="pipeline-nodelist-section__title">{section.name}</h2>
      <ul className="pipeline-nodelist__list">
        {section.types.map((typeId) => {
          const group = groups[typeId];
          return (
            <NodeListGroup
              group={group}
              items={items[group.id] || []}
              key={group.id}
              id={group.id}
              name={group.name}
              kind={group.kind}
              checked={group.checked}
              childCount={group.count}
              allUnset={group.allUnset}
              visibleIcon={group.visibleIcon}
              invisibleIcon={group.invisibleIcon}
              collapsed={Boolean(searchValue) ? false : collapsed[group.id]}
              onToggleCollapsed={onToggleGroupCollapsed}
              onToggleChecked={onToggleGroupChecked}
              onItemClick={onItemClick}
              onItemChange={onItemChange}
              onSectionMouseEnter={onSectionMouseEnter}
              onSectionMouseLeave={onSectionMouseLeave}
              onItemMouseEnter={onItemMouseEnter}
              onItemMouseLeave={onItemMouseLeave}
            />
          );
        })}
      </ul>
    </nav>
  ));
};

export default NodeListGroups;
