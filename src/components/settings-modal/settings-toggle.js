import React from 'react';
import classnames from 'classnames';
import modifiers from '../../utils/modifiers';
import './settings-modal.css';

/**
 * Shows a toggle button for code panel
 */
const SettingsToggle = ({ id, checked, onChange, className }) => {
  const toggleLabel = checked ? 'On' : 'Off';
  return (
    <div className={classnames('pipeline-settings-modal-toggles', className)}>
      <label
        className={classnames(
          modifiers('pipeline-settings-modal-toggle-label', {
            checked: checked,
          }),
          id
        )}>
        <input
          id={classnames('pipeline-settings-modal-toggle-input', id)}
          className={classnames('pipeline-settings-modal-toggle-input', id)}
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />{' '}
        {toggleLabel}
      </label>
    </div>
  );
};

export default SettingsToggle;
