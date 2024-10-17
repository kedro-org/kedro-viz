import React from 'react';
import classnames from 'classnames';
import { replaceAngleBracketMatches } from '../../utils';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { ToggleIcon } from '../ui/toggle-icon/toggle-icon';
import { RowText } from '../ui/row-text/row-text';

import './filter-row.scss';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;
export const FilterRow = ({
  allUnchecked,
  checked,
  children,
  dataTest,
  count,
  id,
  invisibleIcon = InvisibleIcon,
  kind,
  label,
  name,
  onChange,
  onClick,
  visible,
  visibleIcon = VisibleIcon,
}) => {
  const VisibilityIcon = checked ? visibleIcon : invisibleIcon;

  return (
    <div
      className={classnames('filter-row kedro', `filter-row--kind-${kind}`, {
        'filter-row--visible': visible,
        'filter-row--unchecked': !checked,
      })}
      title={name}
    >
      <RowText
        kind={kind}
        dataTest={dataTest}
        onClick={onClick}
        name={children ? null : name}
        label={label}
      />
      <span onClick={onClick} className={'filter-row__count'}>
        {count}
      </span>
      <ToggleIcon
        allUnchecked={allUnchecked}
        className={'filter-row__icon'}
        IconComponent={VisibilityIcon}
        id={id}
        isChecked={checked}
        kind={kind}
        name={name}
        onChange={onChange}
      />
      {children}
    </div>
  );
};
