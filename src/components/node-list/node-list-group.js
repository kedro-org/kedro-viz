import React from 'react';
import classnames from 'classnames';
import NodeListRow from './node-list-row';

export const NodeListGroup = ({
  children,
  collapsed,
  onToggleChecked,
  onToggleCollapsed,
  type,
  checked,
  childCount,
  allUnset,
  visibleIcon,
  invisibleIcon
}) => (
  <li
    className={classnames(
      'pipeline-nodelist__item',
      `pipeline-nodelist__item--${type.name.toLowerCase()}`,
      {
        'pipeline-nodelist__item--all-checked': allUnset
      }
    )}>
    <h3 className="pipeline-nodelist__heading">
      <NodeListRow
        checked={checked}
        id={type.id}
        label={`${type.name} <i>${childCount}</i>`}
        name={type.name}
        visibleIcon={visibleIcon}
        invisibleIcon={invisibleIcon}
        onChange={e => {
          onToggleChecked(type.id, !e.target.checked);
        }}>
        <button
          aria-label={`${
            collapsed ? 'Show' : 'Hide'
          } ${type.name.toLowerCase()}`}
          onClick={() => onToggleCollapsed(type.id)}
          className={classnames('pipeline-type-group-toggle', {
            'pipeline-type-group-toggle--alt': collapsed
          })}
        />
      </NodeListRow>
    </h3>

    <div
      className={classnames({
        'pipeline-nodelist__children': true,
        'pipeline-nodelist__children--open': !collapsed,
        'pipeline-nodelist__children--closed': collapsed
      })}>
      {children}
    </div>
  </li>
);

export default NodeListGroup;
