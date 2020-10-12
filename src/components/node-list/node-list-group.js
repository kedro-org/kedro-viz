import React from 'react';
import classnames from 'classnames';
import NodeListRow from './node-list-row';

export const NodeListGroup = ({
  container: Container = 'div',
  childrenContainer: ChildrenContainer = 'div',
  childrenClassName,
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
  <Container
    className={classnames(
      'pipeline-nodelist__group',
      `pipeline-nodelist__group--type-${id}`,
      `pipeline-nodelist__group--kind-${kind}`,
      {
        'pipeline-nodelist__group--all-unset': allUnset
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

    <ChildrenContainer
      className={classnames(childrenClassName, 'pipeline-nodelist__children', {
        'pipeline-nodelist__children--closed': collapsed
      })}>
      {children}
    </ChildrenContainer>
  </Container>
);

export default NodeListGroup;
