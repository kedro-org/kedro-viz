import React from 'react';
import PropTypes from 'prop-types';
import LabelIcon from '../icons/label';
import ThemeIcon from '../icons/theme';
import ExportIcon from '../icons/export';

const icons = {
  label: LabelIcon,
  theme: ThemeIcon,
  export: ExportIcon
};

/**
 * Icon button component
 * @param {Function} onToggle Handle toggling theme between light/dark
 * @param {string} theme Kedro UI light/dark theme
 */
const IconButton = ({
  ariaLabel,
  ariaLive,
  icon,
  labelText,
  onClick,
  visible
}) => {
  const Icon = icons[icon];

  return visible ? (
    <li>
      <button
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className="pipeline-icon-button"
        onClick={onClick}>
        <span>{labelText}</span>
        <Icon className="pipeline-icon" />
      </button>
    </li>
  ) : null;
};

IconButton.propTypes = {
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  icon: PropTypes.string,
  labelText: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool
};

IconButton.defaultProps = {
  ariaLabel: null,
  ariaLive: null,
  icon: 'label',
  labelText: null,
  onClick: null,
  visible: true
};

export default IconButton;
