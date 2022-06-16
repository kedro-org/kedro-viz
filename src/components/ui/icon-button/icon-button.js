import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './icon-button.css';

/**
 * Icon button component
 */
const IconButton = ({
  active,
  ariaLabel,
  ariaLive,
  className,
  container: Container = 'li',
  dataHeapEvent,
  disabled,
  hasReminder,
  icon,
  labelText,
  onClick,
  visible,
}) => {
  const Icon = icon;

  return visible ? (
    <Container>
      <button
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className={classnames(className, {
          'pipeline-icon-toolbar__button': true,
          'pipeline-icon-toolbar__button--active': active,
        })}
        data-heap-event={dataHeapEvent}
        disabled={disabled}
        onClick={onClick}
      >
        {Icon && <Icon className="pipeline-icon" hasReminder={hasReminder} />}
        {labelText && (
          <span className="pipeline-toolbar__label">{labelText}</span>
        )}
      </button>
    </Container>
  ) : null;
};

IconButton.propTypes = {
  active: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  dataHeapEvent: PropTypes.string,
  disabled: PropTypes.bool,
  hasReminder: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
};

IconButton.defaultProps = {
  active: false,
  ariaLabel: null,
  ariaLive: null,
  dataHeapEvent: null,
  disabled: false,
  hasReminder: false,
  icon: null,
  labelText: null,
  onClick: null,
  visible: true,
};

export default IconButton;
