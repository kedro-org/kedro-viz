import React from 'react';
import classnames from 'classnames';
import FiltersRow from '../filters-row/filters-row';

const FiltersSectionHeading = ({
  group,
  collapsed,
  groupItems,
  onGroupToggleChanged,
}) => {
  const { id, kind, name, allUnchecked, checked, invisibleIcon, visibleIcon } =
    group;

  return (
    <h3 className="pipeline-nodelist__heading">
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
          className={classnames('pipeline-type-group-toggle', {
            'pipeline-type-group-toggle--alt': collapsed,
          })}
          disabled={groupItems.length === 0}
          onClick={() => onGroupToggleChanged(id)}
        />
      </FiltersRow>
    </h3>
  );
};

export default FiltersSectionHeading;
