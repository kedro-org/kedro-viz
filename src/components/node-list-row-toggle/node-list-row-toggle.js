import React from 'react';
import classnames from 'classnames';

import './node-list-row-toggle.scss';

export const NodeListRowToggle = ({
    allUnchecked,
    isParent,
    disabled,
    focusChecked,
    IconComponent,
    id,
    isChecked,
    kind,
    name,
    onChange,
    onToggleHoveredFocusMode,
    selected,
}) => {
    return (
        <label
            htmlFor={id}
            className={classnames(
            'node-list-row__toggle',
            `node-list-row__toggle--kind-${kind}`,
            {
                'node-list-row__toggle--disabled': disabled,
                'node-list-row__toggle--selected': selected,
            }
            )}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={onToggleHoveredFocusMode ? () => onToggleHoveredFocusMode(true) : undefined}
            onMouseLeave={onToggleHoveredFocusMode ? () => onToggleHoveredFocusMode(false) : undefined}
        >
            <input
            id={id}
            className="node-list-row__checkbox"
            data-test={kind === `nodelist-${kind === 'focus' ? 'focusMode' : 'visible'}-${name}-${isChecked}`}
            type="checkbox"
            checked={isChecked}
            disabled={disabled}
            name={name}
            onChange={onChange}
            data-icon-type={kind}
            />
            <IconComponent
                aria-label={name}
                checked={isChecked}
                className={classnames(
                    'node-list-row__icon',
                    'node-list-row__toggle-icon',
                    `node-list-row__toggle-icon--kind-${kind}`,
                    {
                        'node-list-row__toggle-icon--parent': isParent,
                        'node-list-row__toggle-icon--child': !isParent,
                        'node-list-row__toggle-icon--checked': isChecked,
                        'node-list-row__toggle-icon--unchecked': !isChecked,
                        'node-list-row__toggle-icon--all-unchecked': allUnchecked,
                        'node-list-row__toggle-icon--focus-checked': focusChecked,
                    }
                )}
            />
        </label>
    )
}