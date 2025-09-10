import React from 'react';
import classnames from 'classnames';
import IndicatorIcon from '../../icons/indicator';
import OffIndicatorIcon from '../../icons/indicator-off';
import { ToggleControl } from '../../ui/toggle-control/toggle-control';
import { RowText } from '../../ui/row-text/row-text';

import './filters-row.scss';

const FiltersRow = ({
  allUnchecked,
  checked,
  children,
  container: ContainerWrapper,
  count,
  dataTest,
  id,
  indicatorIcon = IndicatorIcon,
  kind,
  label,
  name,
  offIndicatorIcon = OffIndicatorIcon,
  onChange,
  onClick,
  parentClassName,
  visible,
}) => {
  const Icon = checked ? indicatorIcon : offIndicatorIcon;

  return (
    <ContainerWrapper
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
      <ToggleControl
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
    </ContainerWrapper>
  );
};

export default FiltersRow;
