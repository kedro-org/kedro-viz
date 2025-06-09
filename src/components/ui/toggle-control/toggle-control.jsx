import React from 'react';
import classnames from 'classnames';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

import './toggle-control.scss';

export const ToggleControl = ({
  className,
  focusChecked,
  IconComponent,
  disabled,
  id,
  isChecked,
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
      'toggle-control--icon--checked': isChecked,
      'toggle-control--icon--unchecked': !isChecked,
      'toggle-control--icon--focus-checked': focusChecked,
      'toggle-control--icon--disabled': disabled,
    }
  );

  const labelClassNames = classnames(
    'toggle-control',
    `toggle-control--kind-${kind}`,
    {
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
