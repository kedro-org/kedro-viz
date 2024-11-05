import React from 'react';
import FiltersSection from './filters-section/filters-section';

import './filters.scss';

const Filters = ({
  groupCollapsed,
  groups,
  isResetFilterActive,
  items,
  onGroupToggleChanged,
  onItemChange,
  onResetFilter,
  onToggleGroupCollapsed,
  searchValue,
}) => {
  return (
    <>
      <div className="filters__header">
        <h2 className="filters__title">
          <span>Filters</span>
        </h2>
        <button
          disabled={!isResetFilterActive}
          onClick={onResetFilter}
          className="filters__reset-button"
        >
          Reset
        </button>
      </div>
      <ul className="filters__section-wrapper">
        {Object.values(groups).map((group) => {
          return (
            <FiltersSection
              group={group}
              groupCollapsed={groupCollapsed}
              items={items}
              key={group.id}
              onGroupToggleChanged={onGroupToggleChanged}
              onItemChange={onItemChange}
              onToggleGroupCollapsed={onToggleGroupCollapsed}
              searchValue={searchValue}
            />
          );
        })}
      </ul>
    </>
  );
};

export default Filters;
