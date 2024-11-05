import React from 'react';
import classnames from 'classnames';
import FiltersRow from '../filters-row/filters-row';
import { nodeListRowHeight } from '../../../config';
import LazyList from '../../lazy-list';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

import './filters-group.scss';

/** A group collection of FiltersRow */
const FiltersGroup = ({ items = [], group, collapsed, onItemChange }) => (
  <LazyList
    height={(start, end) => (end - start) * nodeListRowHeight}
    total={items.length}
  >
    {({ start, end, listRef, listStyle }) => (
      <ul
        ref={listRef}
        style={listStyle}
        className={classnames('filters-group', {
          'filters-group--closed': collapsed,
        })}
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
            onChange={(e) => onItemChange(e, item)}
            onClick={(e) => onItemChange(e, item)}
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
