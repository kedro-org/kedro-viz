import React from 'react';
import classnames from 'classnames';
import modifiers from '../../utils/modifiers';
import NodeListRow, { nodeListRowHeight } from './node-list-row';
import LazyList from '../lazy-list';

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
  onItemMouseLeave
}) => (
  <li
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
    <LazyList
      height={(start, end) => (end - start) * nodeListRowHeight}
      total={items.length}
      onChange={({ start, end, total }) =>
        console.log(
          `${group.name} ${start} to ${end} (${end - start} of ${total})`
        )
      }>
      {({
        start,
        end,
        total,
        listRef,
        upperRef,
        lowerRef,
        listStyle,
        upperStyle,
        lowerStyle
      }) => (
        <ul
          ref={listRef}
          style={listStyle}
          className={modifiers(
            'pipeline-nodelist__children',
            { closed: collapsed },
            'pipeline-nodelist__list'
          )}>
          <li
            className={modifiers('pipeline-nodelist__placeholder-upper', {
              fade: start !== end && start > 0
            })}
            ref={upperRef}
            style={upperStyle}
          />
          <li
            className={modifiers('pipeline-nodelist__placeholder-lower', {
              fade: start !== end && end < total
            })}
            ref={lowerRef}
            style={lowerStyle}
          />
          {items.slice(start, end).map(item => (
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
              // Disabled to avoid unrelated hover lag for now.
              // onMouseEnter={() => onItemMouseEnter(item)}
              // onMouseLeave={() => onItemMouseLeave(item)}
              onChange={e => onItemChange(item, !e.target.checked)}
            />
          ))}
        </ul>
      )}
    </LazyList>
  </li>
);

export default NodeListGroup;
