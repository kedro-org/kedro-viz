import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './icon-button.css';

const labelPositionTypes = ['right', 'left', 'bottom', 'top'];

/**
 * Icon button component
 */
const IconButton = ({
  active,
  ariaLabel,
  ariaLive,
  className,
  container: Container = 'li',
  disabled,
  hasReminder,
  icon,
  labelText,
  labelTextPosition = 'right',
  dataHeapEvent,
  onClick,
  visible,
}) => {
  const Icon = icon;

  const labelPosition = labelPositionTypes.includes(
    labelTextPosition.toLowerCase()
  )
    ? labelTextPosition.toLocaleLowerCase()
    : 'right';

  return visible ? (
    <Container>
      <button
        data-heap-event={dataHeapEvent}
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className={classnames(className, {
          'pipeline-icon-toolbar__button': true,
          'pipeline-icon-toolbar__button--active': active,
        })}
        disabled={disabled}
        onClick={onClick}
      >
        {Icon && <Icon className="pipeline-icon" hasReminder={hasReminder} />}
        {labelText && (
          <span
            className={classnames(
              'pipeline-toolbar__label',
              `pipeline-toolbar__label-${labelPosition}`
            )}
          >
            {labelText}
          </span>
        )}
      </button>
    </Container>
  ) : null;
};

IconButton.propTypes = {
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.string,
  dataHeapEvent: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
  active: PropTypes.bool,
  hasReminder: PropTypes.bool,
};

IconButton.defaultProps = {
  ariaLabel: null,
  ariaLive: null,
  disabled: false,
  icon: null,
  labelText: null,
  dataHeapEvent: null,
  onClick: null,
  visible: true,
  active: false,
  hasReminder: false,
};

export default IconButton;
