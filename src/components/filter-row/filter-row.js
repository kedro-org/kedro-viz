import React from 'react';
import classnames from 'classnames';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import IndicatorIcon from '../icons/indicator';
import { VisibilityControl } from '../ui/visibility-control/visibility-control';
import { RowText } from '../ui/row-text/row-text';

import './filter-row.scss';

export const FilterRow = ({
  allUnchecked,
  checked,
  children,
  count,
  dataTest,
  id,
  invisibleIcon = InvisibleIcon,
  kind,
  label,
  name,
  onChange,
  onClick,
  parentClassName,
  visible,
  visibleIcon = VisibleIcon,
}) => {
  const Icon = checked ? visibleIcon : invisibleIcon;

  return (
    <div
      className={classnames(
        'filter-row kedro',
        `filter-row--kind-${kind}`,
        parentClassName,
        {
          'filter-row--visible': visible,
          'filter-row--unchecked': !checked,
        }
      )}
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
      <VisibilityControl
        allUnchecked={allUnchecked}
        className={'filter-row__icon'}
        IconComponent={Icon}
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
