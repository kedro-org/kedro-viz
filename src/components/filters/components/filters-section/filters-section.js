import React from 'react';
import classnames from 'classnames';
import FiltersSectionHeading from '../filters-section-heading/filters-section-heading';
import FiltersGroup from '../filters-group/filters-group';

/** Represents a section within the filters. */
const FiltersSection = ({
  group,
  items,
  groupCollapsed,
  searchValue,
  onGroupToggleChanged,
  onToggleGroupCollapsed,
  onItemChange,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
}) => {
  const { id, kind, allUnchecked } = group;
  const collapsed = Boolean(searchValue) ? false : groupCollapsed[id];
  const groupItems = items[id] || [];

  return (
    <li
      className={classnames(
        'pipeline-nodelist__group',
        `pipeline-nodelist__group--type-${id}`,
        `pipeline-nodelist__group--kind-${kind}`,
        {
          'pipeline-nodelist__group--all-unchecked': allUnchecked,
        }
      )}
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
        onItemClick={onItemClick}
        onItemMouseEnter={onItemMouseEnter}
        onItemMouseLeave={onItemMouseLeave}
      />
    </li>
  );
};

export default FiltersSection;
