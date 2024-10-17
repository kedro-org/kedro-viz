import React from 'react';
import classnames from 'classnames';
import { replaceAngleBracketMatches } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';
import { NodeListRowToggle } from '../node-list-row-toggle/node-list-row-toggle';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;

export const Row = ({
  active,
  allUnchecked,
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
      className={classnames(
        'node-list-row kedro',
        `node-list-row--kind-${kind}`,
        {
          'node-list-row--visible': visible,
          'node-list-row--active': active,
          'node-list-row--selected':
            selected || (!isSlicingPipelineApplied && highlight),
          'node-list-row--disabled': disabled,
          'node-list-row--unchecked': !isChecked,
          'node-list-row--overwrite': !(active || selected),
        }
      )}
      title={name}
      onMouseEnter={visible ? onMouseEnter : null}
      onMouseLeave={visible ? onMouseLeave : null}
    >
      <NodeIcon
        className={classnames(
          'node-list-row__type-icon',
          'node-list-row__icon',
          {
            'node-list-row__type-icon--faded': faded,
            'node-list-row__type-icon--disabled': disabled,
            // 'node-list-row__type-icon--nested': !children,
            'node-list-row__type-icon--active': active,
            'node-list-row__type-icon--selected': selected,
          }
        )}
        icon={icon}
      />
      <TextButton
        className={classnames(
          'node-list-row__text',
          `node-list-row__text--kind-${kind}`,
          `node-list-row__text--${rowType}`
        )}
        //   data-test={`nodelist-${icon}-${children ? null : name}`}
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        title={name}
      >
        <span
          className={classnames(
            'node-list-row__label',
            `node-list-row__label--kind-${kind}`,
            {
              'node-list-row__label--faded': faded,
              'node-list-row__label--disabled': disabled,
            }
          )}
          dangerouslySetInnerHTML={{
            __html: replaceAngleBracketMatches(label),
          }}
        />
      </TextButton>
      {VisibilityIcon && (
        <NodeListRowToggle
          allUnchecked={allUnchecked}
          className={'node-list-row__icon'}
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
        <NodeListRowToggle
          allUnchecked={allUnchecked}
          className={'node-list-row__icon'}
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
