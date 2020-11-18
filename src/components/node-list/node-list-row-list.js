import React from 'react';
import modifiers from '../../utils/modifiers';
import NodeListRow, { nodeListRowHeight } from './node-list-row';
import LazyList from '../lazy-list';

export const NodeRowList = ({
  items,
  group,
  collapsed,
  onItemClick,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave
}) => (
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
);

export default NodeRowList;
