import React from 'react';
import classnames from 'classnames';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

import './visibility-control.scss';

export const VisibilityControl = ({
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
  dataIconType,
}) => {
  const handleMouseHover = (isEntering) =>
    onToggleHoveredFocusMode && onToggleHoveredFocusMode(isEntering);

  // update classname here
  const iconClassNames = classnames(
    className,
    'visibility-control--icon',
    `visibility-control--icon--kind-${kind}`,
    {
      'visibility-control--icon--parent': isParent,
      'visibility-control--icon--child': !isParent,
      'visibility-control--icon--checked': isChecked,
      'visibility-control--icon--unchecked': !isChecked,
      'visibility-control--icon--all-unchecked': allUnchecked,
      'visibility-control--icon--focus-checked': focusChecked,
    }
  );

  const labelClassNames = classnames(
    'visibility-control',
    `visibility-control--kind-${kind}`,
    {
      'visibility-control--disabled': disabled,
      'visibility-control--selected': selected,
    }
  );

  const dataTestValue = getDataTestAttribute(
    'visibility-control',
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
        className="visibility-control__checkbox"
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
