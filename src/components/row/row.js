import React from 'react';
import classnames from 'classnames';
import { replaceAngleBracketMatches } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';
import { ToggleIcon } from '../ui/toggle-icon/toggle-icon';

import './row.scss';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;

export const Row = ({
  active,
  checked,
  children,
  container: Container = 'div',
  disabled,
  faded,
  focused,
  focusModeIcon = FocusModeIcon,
  highlight,
  icon,
  id,
  invisibleIcon = InvisibleIcon,
  isSlicingPipelineApplied,
  kind,
  label,
  name,
  onChange,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onToggleHoveredFocusMode,
  rowType,
  selected,
  type,
  visible,
  visibleIcon = VisibleIcon,
}) => {
  const isModularPipeline = type === 'modularPipeline';
  const FocusIcon = isModularPipeline ? focusModeIcon : null;
  const isChecked = isModularPipeline ? checked || focused : checked;
  const VisibilityIcon = isChecked ? visibleIcon : invisibleIcon;
  const isButton = onClick && kind !== 'filter';
  const TextButton = isButton ? 'button' : 'div';

  return (
    <Container
      className={classnames('row kedro', `row--kind-${kind}`, {
        'row--visible': visible,
        'row--active': active,
        'row--selected': selected || (!isSlicingPipelineApplied && highlight),
        'row--disabled': disabled,
        'row--unchecked': !isChecked,
        'row--overwrite': !(active || selected),
      })}
      title={name}
      onMouseEnter={visible ? onMouseEnter : null}
      onMouseLeave={visible ? onMouseLeave : null}
    >
      <NodeIcon
        className={classnames('row__type-icon', 'row__icon', {
          'row__type-icon--faded': faded,
          'row__type-icon--disabled': disabled,
          'row__type-icon--nested': !children,
          'row__type-icon--active': active,
          'row__type-icon--selected': selected,
        })}
        icon={icon}
      />
      <TextButton
        className={classnames(
          'row__text',
          `row__text--kind-${kind}`,
          `row__text--${rowType}`
        )}
        //   data-test={`nodelist-${icon}-${children ? null : name}`}
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        title={name}
      >
        <span
          className={classnames('row__label', `row__label--kind-${kind}`, {
            'row__label--faded': faded,
            'row__label--disabled': disabled,
          })}
          dangerouslySetInnerHTML={{
            __html: replaceAngleBracketMatches(label),
          }}
        />
      </TextButton>
      {VisibilityIcon && (
        <ToggleIcon
          className={'row__icon'}
          disabled={isModularPipeline ? focused : disabled}
          focusChecked={isModularPipeline ? false : focused}
          IconComponent={VisibilityIcon}
          id={id}
          isChecked={isChecked}
          kind={kind}
          name={name}
          onChange={onChange}
          selected={selected}
        />
      )}
      {FocusIcon && (
        <ToggleIcon
          className={'row__icon'}
          disabled={disabled}
          focusChecked={focused}
          IconComponent={FocusIcon}
          id={`${id}-focus`}
          isChecked={isChecked}
          kind={kind}
          name={name}
          onChange={onChange}
          onToggleHoveredFocusMode={onToggleHoveredFocusMode}
          selected={selected}
          dataIconType="focus"
        />
      )}
      {children}
    </Container>
  );
};
