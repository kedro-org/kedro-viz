import React from 'react';
import classnames from 'classnames';
import NodeIcon from '../../../icons/node-icon';
import VisibleIcon from '../../../icons/visible';
import InvisibleIcon from '../../../icons/invisible';
import FocusModeIcon from '../../../icons/focus-mode';
import { ToggleControl } from '../../../ui/toggle-control/toggle-control';
import { RowText } from '../../../ui/row-text/row-text';

import './row.scss';

const Row = ({
  active,
  checked,
  children,
  dataTest,
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
  parentClassName,
  rowType,
  selected,
  type,
  visibleIcon = VisibleIcon,
}) => {
  const isModularPipeline = type === 'modularPipeline';
  const FocusIcon = isModularPipeline ? focusModeIcon : null;
  const isChecked = isModularPipeline ? checked || focused : checked;
  const VisibilityIcon = isChecked ? visibleIcon : invisibleIcon;

  return (
    <form
      className={classnames('row kedro', `row--kind-${kind}`, parentClassName, {
        'row--active': active,
        'row--selected': selected || (!isSlicingPipelineApplied && highlight),
        'row--overwrite': !(active || selected),
      })}
      data-test={dataTest}
      title={name}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
      <RowText
        dataTest={dataTest}
        disabled={disabled}
        faded={faded}
        kind={kind}
        label={label}
        name={name}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        rowType={rowType}
      />
      {VisibilityIcon && (
        <ToggleControl
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
        <ToggleControl
          className={'row__icon'}
          disabled={disabled}
          focusChecked={focused}
          IconComponent={FocusIcon}
          id={id + '-focus'}
          isChecked={isChecked}
          kind={kind}
          name={name}
          onChange={onChange}
          onToggleHoveredFocusMode={onToggleHoveredFocusMode}
          selected={selected}
          dataIconType="focus"
        />
      )}
    </form>
  );
};

export default Row;
