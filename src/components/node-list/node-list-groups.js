import React, { useState } from 'react';
import { loadState, saveState } from '../../store/helpers';
import NodeListGroup from './node-list-group';
import NodeListRow from './node-list-row';

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
  onItemChange
}) => {
  const [collapsed, setCollapsed] = useState(storedState.groupsCollapsed || {});

  // Collapse/expand node group
  const onToggleGroupCollapsed = typeID => {
    const groupsCollapsed = Object.assign({}, collapsed, {
      [typeID]: !collapsed[typeID]
    });
    setCollapsed(groupsCollapsed);
    saveState({ groupsCollapsed });
  };

  return sections.map(section => (
    <nav className="pipeline-nodelist-section kedro" key={section.name}>
      <h2 className="pipeline-nodelist-section__title">{section.name}</h2>
      <ul className="pipeline-nodelist">
        {section.types.map(typeId => {
          const group = groups[typeId];
          return (
            <NodeListGroup
              container="li"
              childrenContainer="ul"
              childrenClassName="pipeline-nodelist pipeline-nodelist--nested"
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
              onToggleChecked={onToggleGroupChecked}>
              {(items[group.id] || []).map(item => (
                <NodeListRow
                  container="li"
                  key={item.id}
                  id={item.id}
                  kind={group.kind}
                  label={item.highlightedLabel}
                  name={item.name}
                  type={item.type}
                  active={item.active}
                  checked={item.checked}
                  disabled={item.disabled}
                  faded={item.faded}
                  visible={item.visible}
                  selected={item.selected}
                  unset={item.unset}
                  visibleIcon={item.visibleIcon}
                  invisibleIcon={item.invisibleIcon}
                  onClick={() => onItemClick(item)}
                  onMouseEnter={() => onItemMouseEnter(item)}
                  onMouseLeave={() => onItemMouseLeave(item)}
                  onChange={e => onItemChange(item, !e.target.checked)}
                />
              ))}
            </NodeListGroup>
          );
        })}
      </ul>
    </nav>
  ));
};

export default NodeListGroups;
