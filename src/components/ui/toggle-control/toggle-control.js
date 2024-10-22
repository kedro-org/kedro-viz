import React from 'react';
import classnames from 'classnames';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

import './toggle-control.scss';

export const ToggleControl = ({
  // allUnchecked,
  className,
  disabled,
  focusChecked,
  IconComponent,
  id,
  isChecked,
  // children,
  kind,
  name,
  onChange,
  onToggleHoveredFocusMode,
  selected,
  dataIconType,
}) => {
  const handleMouseHover = (isEntering) =>
    onToggleHoveredFocusMode && onToggleHoveredFocusMode(isEntering);

  const iconClassNames = classnames(
    className,
    'toggle-control--icon',
    `toggle-control--icon--kind-${kind}`,
    {
      // 'toggle-control--icon--parent': Boolean(children),
      // 'toggle-control--icon--child': Boolean(children),
      'toggle-control--icon--checked': isChecked,
      'toggle-control--icon--unchecked': !isChecked,
      // 'toggle-control--icon--all-unchecked': allUnchecked,
      'toggle-control--icon--focus-checked': focusChecked,
    }
  );

  const labelClassNames = classnames(
    'toggle-control',
    `toggle-control--kind-${kind}`,
    {
      'toggle-control--disabled': disabled,
      'toggle-control--selected': selected,
    }
  );

  const dataTestValue = getDataTestAttribute(
    'toggle-control',
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
        className="toggle-control__checkbox"
        data-test={dataTestValue}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        name={name}
        onChange={onChange}
        data-icon-type={dataIconType}
      />
      <IconComponent
        aria-label={name}
        checked={isChecked}
        className={iconClassNames}
      />
    </label>
  );
};
