import React from 'react';
import modifiers from '../../utils/modifiers';
import { FilterRow, nodeListRowHeight } from '../filter-row/filter-row';
import LazyList from '../lazy-list';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

const NodeRowList = ({
  items = [],
  group,
  collapsed,
  onItemClick,
  onItemChange,
  onItemMouseEnter,
  onItemMouseLeave,
}) => (
  <LazyList
    height={(start, end) => (end - start) * nodeListRowHeight}
    total={items.length}
  >
    {({
      start,
      end,
      total,
      listRef,
      upperRef,
      lowerRef,
      listStyle,
      upperStyle,
      lowerStyle,
    }) => (
      <ul
        ref={listRef}
        style={listStyle}
        className={modifiers(
          'pipeline-nodelist__children',
          { closed: collapsed },
          'pipeline-nodelist__list pipeline-nodelist__list--nested'
        )}
      >
        <li
          className={modifiers('pipeline-nodelist__placeholder-upper', {
            fade: start !== end && start > 0,
          })}
          ref={upperRef}
          style={upperStyle}
        />
        <li
          className={modifiers('pipeline-nodelist__placeholder-lower', {
            fade: start !== end && end < total,
          })}
          ref={lowerRef}
          style={lowerStyle}
        />
        {items.slice(start, end).map((item) => (
          <FilterRow
            allUnchecked={group.allUnchecked}
            checked={item.checked}
            count={item.count}
            dataTest={getDataTestAttribute('node-list-row', 'filter-row')}
            id={item.id}
            invisibleIcon={item.invisibleIcon}
            key={item.id}
            kind={group.kind}
            label={item.highlightedLabel}
            name={item.name}
            onChange={(e) => onItemChange(item, !e.target.checked)}
            onClick={() => onItemClick(item)}
            parentClassName={'node-list-filter-row'}
            visible={item.visible}
            visibleIcon={item.visibleIcon}
          />
        ))}
      </ul>
    )}
  </LazyList>
);

export default NodeRowList;
