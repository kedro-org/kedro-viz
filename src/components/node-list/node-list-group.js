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
  allUnchecked,
  visibleIcon,
  invisibleIcon,
  onToggleChecked,
  onToggleCollapsed,
  onItemClick,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
}) => (
  <li
    className={classnames(
      'pipeline-nodelist__group',
      `pipeline-nodelist__group--type-${id}`,
      `pipeline-nodelist__group--kind-${kind}`,
      {
        'pipeline-nodelist__group--all-unchecked': allUnchecked,
      }
    )}
  >
    <h3 className="pipeline-nodelist__heading">
      <NodeListRow
        id={id}
        kind={kind}
        name={name}
        label={name}
        allUnchecked={allUnchecked}
        checked={checked}
        visibleIcon={visibleIcon}
        invisibleIcon={invisibleIcon}
        rowType="filter"
        onChange={(e) => {
          onToggleChecked(id, !e.target.checked);
        }}
      >
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
