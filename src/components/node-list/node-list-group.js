import React from 'react';
import classnames from 'classnames';
import NodeListRow from './node-list-row';
import NodeRowList from './node-list-row-list';

export const NodeListGroup = ({
  items,
  group,
  collapsed,
  id,
  name,
  kind,
  checked,
  unset,
  childCount,
  allUnset,
  visibleIcon,
  invisibleIcon,
  onToggleChecked,
  onToggleCollapsed,
  onItemClick,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
  onSectionMouseEnter,
  onSectionMouseLeave,
}) => (
  <li
    className={classnames(
      'pipeline-nodelist__group',
      `pipeline-nodelist__group--type-${id}`,
      `pipeline-nodelist__group--kind-${kind}`,
      {
        'pipeline-nodelist__group--all-unset': allUnset,
      }
    )}
    onMouseEnter={() => onSectionMouseEnter(id)}
    onMouseLeave={() => onSectionMouseLeave(id)}>
    <h3 className="pipeline-nodelist__heading">
      <NodeListRow
        id={id}
        kind={kind}
        name={name}
        label={`${name} <i>${childCount}</i>`}
        allUnset={allUnset}
        unset={unset}
        checked={checked}
        visibleIcon={visibleIcon}
        invisibleIcon={invisibleIcon}
        rowType="filter"
        onChange={(e) => {
          onToggleChecked(id, !e.target.checked);
        }}>
        <button
          aria-label={`${collapsed ? 'Show' : 'Hide'} ${name.toLowerCase()}`}
          onClick={() => onToggleCollapsed(id)}
          className={classnames('pipeline-type-group-toggle', {
            'pipeline-type-group-toggle--alt': collapsed,
          })}
        />
      </NodeListRow>
    </h3>
    <NodeRowList
      items={items}
      group={group}
      collapsed={collapsed}
      onItemClick={onItemClick}
      onItemChange={onItemChange}
      onItemMouseEnter={onItemMouseEnter}
      onItemMouseLeave={onItemMouseLeave}
    />
  </li>
);

export default NodeListGroup;
