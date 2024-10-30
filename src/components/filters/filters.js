import React from 'react';
import FiltersSection from './components/filters-section/filters-section';

const Filters = ({
  groupCollapsed,
  groups,
  isResetFilterActive,
  items,
  onGroupToggleChanged,
  onItemChange,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onResetFilter,
  // onToggleGroupCollapsed,
  searchValue,
}) => {
  return (
    <>
      <div className="pipeline-nodelist-section__filters">
        <h2 className="pipeline-nodelist-section__title">
          <span>Filters</span>
        </h2>
        <button
          disabled={!isResetFilterActive}
          onClick={onResetFilter}
          className="pipeline-nodelist-section__reset-filter"
        >
          Reset
        </button>
      </div>
      <nav className="pipeline-nodelist-section kedro">
        <ul className="pipeline-nodelist__list">
          {Object.values(groups).map((group) => {
            return (
              <FiltersSection
                group={group}
                items={items}
                groupCollapsed={groupCollapsed}
                searchValue={searchValue}
                onGroupToggleChanged={onGroupToggleChanged}
                onItemChange={onItemChange}
                onItemClick={onItemClick}
                onItemMouseEnter={onItemMouseEnter}
                onItemMouseLeave={onItemMouseLeave}
              />
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default Filters;
