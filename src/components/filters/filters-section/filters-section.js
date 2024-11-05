import React from 'react';
import classnames from 'classnames';
import FiltersSectionHeading from '../filters-section-heading/filters-section-heading';
import FiltersGroup from '../filters-group/filters-group';

import './filters-section.scss';

/** Represents a section within the filters. */
const FiltersSection = ({
  group,
  groupCollapsed,
  items,
  onGroupToggleChanged,
  onItemChange,
  onToggleGroupCollapsed,
  searchValue,
}) => {
  const { id, allUnchecked } = group;
  const collapsed = Boolean(searchValue) ? false : groupCollapsed[id];
  const groupItems = items[id] || [];

  return (
    <li
      className={classnames('filters-section', `filters-section--type-${id}`, {
        'filters-section--all-unchecked': allUnchecked,
      })}
      key={id}
    >
      <FiltersSectionHeading
        group={group}
        collapsed={collapsed}
        groupItems={groupItems}
        onGroupToggleChanged={onGroupToggleChanged}
        onToggleGroupCollapsed={onToggleGroupCollapsed}
      />
      <FiltersGroup
        collapsed={collapsed}
        group={group}
        items={groupItems}
        onItemChange={onItemChange}
      />
    </li>
  );
};

export default FiltersSection;
