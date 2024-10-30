import React from 'react';
import classnames from 'classnames';
import FiltersRow from './components/filters-row/filters-row';
import FiltersGroup from './components/filters-group/filters-group';

const Filters = ({
  groups,
  items,
  onGroupToggleChanged,
  onItemChange,
  onItemClick,
  onItemMouseEnter,
  onItemMouseLeave,
  searchValue,
  onToggleGroupCollapsed,
  groupCollapsed,
}) => {
  return (
    <nav className="pipeline-nodelist-section kedro">
      <ul className="pipeline-nodelist__list">
        {Object.values(groups).map((group) => {
          const { id, kind, name } = group;

          const allUnchecked = group.allUnchecked;
          const checked = group.checked;
          const collapsed = Boolean(searchValue)
            ? false
            : groupCollapsed[group.id];
          const invisibleIcon = group.invisibleIcon;
          const groupItems = items[group.id] || [];
          const onToggleCollapsed = onToggleGroupCollapsed;
          const visibleIcon = group.visibleIcon;

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
                  rowType="filter"
                  indicatorIcon={visibleIcon}
                >
                  <button
                    aria-label={`${
                      collapsed ? 'Show' : 'Hide'
                    } ${name.toLowerCase()}`}
                    className={classnames('pipeline-type-group-toggle', {
                      'pipeline-type-group-toggle--alt': collapsed,
                    })}
                    disabled={groupItems.length === 0}
                    onClick={() => onToggleCollapsed(id)}
                  />
                </FiltersRow>
              </h3>
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
        })}
      </ul>
    </nav>
  );
};

export default Filters;
