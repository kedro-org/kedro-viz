import React from 'react';
import classnames from 'classnames';
import { replaceAngleBracketMatches } from '../../utils';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { ToggleIcon } from '../ui/toggle-icon/toggle-icon';

import './filter-row.scss';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;
export const FilterRow = ({
  allUnchecked,
  checked,
  children,
  container: Container = 'div',
  count,
  id,
  invisibleIcon = InvisibleIcon,
  kind,
  label,
  name,
  onChange,
  onClick,
  onMouseEnter,
  onMouseLeave,
  visible,
  visibleIcon = VisibleIcon,
}) => {
  const VisibilityIcon = checked ? visibleIcon : invisibleIcon;

  return (
    <Container
      className={classnames('filter-row kedro', `filter-row--kind-${kind}`, {
        'filter-row--visible': visible,
        'filter-row--unchecked': !checked,
      })}
      title={name}
      onMouseEnter={visible ? onMouseEnter : null}
      onMouseLeave={visible ? onMouseLeave : null}
    >
      <button
        className={classnames(
          'filter-row__text',
          `filter-row__text--kind-${kind}`
        )}
        //   data-test={`nodelist-${icon}-${children ? null : name}`}
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        title={children ? null : name}
      >
        <span
          className={classnames(
            'filter-row__label',
            `filter-row__label--kind-${kind}`
          )}
          dangerouslySetInnerHTML={{
            __html: replaceAngleBracketMatches(label),
          }}
        />
      </button>
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
    </Container>
  );
};
