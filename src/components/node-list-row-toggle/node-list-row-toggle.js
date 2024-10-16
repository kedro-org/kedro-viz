import React from 'react';
import classnames from 'classnames';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './node-list-row-toggle.scss';

export const NodeListRowToggle = ({
  allUnchecked,
  className,
  disabled,
  focusChecked,
  IconComponent,
  id,
  isChecked,
  isParent,
  kind,
  name,
  onChange,
  onToggleHoveredFocusMode,
  selected,
}) => {
  const handleMouseHover = (isEntering) =>
    onToggleHoveredFocusMode && onToggleHoveredFocusMode(isEntering);

  const iconClassNames = classnames(
    className,
    'node-list-row-toggle--icon',
    `node-list-row-toggle--icon--kind-${kind}`,
    {
      'node-list-row-toggle--icon--parent': isParent,
      'node-list-row-toggle--icon--child': !isParent,
      'node-list-row-toggle--icon--checked': isChecked,
      'node-list-row-toggle--icon--unchecked': !isChecked,
      'node-list-row-toggle--icon--all-unchecked': allUnchecked,
      'node-list-row-toggle--icon--focus-checked': focusChecked,
    }
  );

  const labelClassNames = classnames(
    'node-list-row-toggle',
    `node-list-row-toggle--kind-${kind}`,
    {
      'node-list-row-toggle--disabled': disabled,
      'node-list-row-toggle--selected': selected,
    }
  );

  const dataTestValue = getDataTestAttribute(
    'node-list-row-toggle',
    kind === 'focus' ? 'focusMode' : 'visible',
    name
  );

  return (
    <label
      htmlFor={id}
      className={labelClassNames}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => handleMouseHover(true)}
      onMouseLeave={() => handleMouseHover(false)}
    >
      <input
        id={id}
        className="node-list-row__checkbox"
        data-test={dataTestValue}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        name={name}
        onChange={onChange}
        data--icon-type={kind}
      />
      <IconComponent
        aria-label={name}
        checked={isChecked}
        className={iconClassNames}
      />
    </label>
  );
};
