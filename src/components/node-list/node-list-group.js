import React from 'react';
import classnames from 'classnames';
import NodeListRow from './node-list-row';

export const NodeListGroup = ({
  children,
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
  onToggleCollapsed
}) => (
  <li
    className={classnames(
      'pipeline-nodelist__item',
      `pipeline-nodelist__item--type-${id}`,
      `pipeline-nodelist__item--is-${kind}`,
      {
        'pipeline-nodelist__item--all-unset': allUnset
      }
    )}>
    <h3 className="pipeline-nodelist__heading">
      <NodeListRow
        id={id}
        kind={kind}
        name={name}
        label={`${name} <i>${childCount}</i>`}
        unset={unset}
        checked={checked}
        visibleIcon={visibleIcon}
        invisibleIcon={invisibleIcon}
        onChange={e => {
          onToggleChecked(id, !e.target.checked);
        }}>
        <button
          aria-label={`${collapsed ? 'Show' : 'Hide'} ${name.toLowerCase()}`}
          onClick={() => onToggleCollapsed(id)}
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
