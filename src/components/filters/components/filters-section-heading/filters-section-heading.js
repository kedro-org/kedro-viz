import React from 'react';
import classnames from 'classnames';
import FiltersRow from '../filters-row/filters-row';

import './filters-section-heading.scss';

const FiltersSectionHeading = ({
  group,
  collapsed,
  groupItems,
  onGroupToggleChanged,
  onToggleGroupCollapsed,
}) => {
  const { id, kind, name, allUnchecked, checked, invisibleIcon, visibleIcon } =
    group;
  const disabled = groupItems.length === 0;

  return (
    <h3 className="filters-section-heading">
      <FiltersRow
        allUnchecked={allUnchecked}
        checked={checked}
        container="div"
        id={id}
        offIndicatorIcon={invisibleIcon}
        kind={kind}
        label={name}
        name={name}
        onChange={(e) => {
          onGroupToggleChanged(id, !e.target.checked);
        }}
        indicatorIcon={visibleIcon}
      >
        <button
          aria-label={`${collapsed ? 'Show' : 'Hide'} ${name.toLowerCase()}`}
          className={classnames('filters-section-heading__toggle-btn', {
            'filters-section-heading__toggle-btn--alt': collapsed,
            'filters-section-heading__toggle-btn--disabled': disabled,
          })}
          disabled={disabled}
          onClick={() => onToggleGroupCollapsed(id)}
        />
      </FiltersRow>
    </h3>
  );
};

export default FiltersSectionHeading;
