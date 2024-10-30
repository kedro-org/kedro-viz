import React from 'react';
import modifiers from '../../../../utils/modifiers';
import FiltersRow from '../filters-row/filters-row';
import { nodeListRowHeight } from '../../../../config';
import LazyList from '../../../lazy-list';
import { getDataTestAttribute } from '../../../../utils/get-data-test-attribute';

import './filters-group.scss';

const FiltersGroup = ({
  items = [],
  group,
  collapsed,
  onItemClick,
  onItemChange,
}) => (
  <LazyList
    height={(start, end) => (end - start) * nodeListRowHeight}
    total={items.length}
  >
    {({ start, end, listRef, listStyle }) => (
      <ul
        ref={listRef}
        style={listStyle}
        className={modifiers(
          'pipeline-nodelist__children',
          { closed: collapsed },
          'pipeline-nodelist__list pipeline-nodelist__list-s-nested'
        )}
      >
        {items.slice(start, end).map((item) => (
          <FiltersRow
            allUnchecked={group.allUnchecked}
            checked={item.checked}
            container={'li'}
            count={item.count}
            dataTest={getDataTestAttribute('node-list-row', 'filter-row')}
            id={item.id}
            offIndicatorIcon={item.invisibleIcon}
            key={item.id}
            kind={group.kind}
            label={item.highlightedLabel}
            name={item.name}
            onChange={(e) => onItemChange(item, !e.target.checked)}
            onClick={() => onItemClick(item)}
            parentClassName={'node-list-filter-row'}
            visible={item.visible}
            indicatorIcon={item.visibleIcon}
          />
        ))}
      </ul>
    )}
  </LazyList>
);

export default FiltersGroup;
