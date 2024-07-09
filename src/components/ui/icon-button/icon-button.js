import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './icon-button.scss';

const labelPositionTypes = ['right', 'left', 'bottom', 'top'];

/**
 * Icon button component
 */
const IconButton = ({
  active = false,
  ariaLabel,
  ariaLive,
  children,
  className,
  container = 'li',
  dataTest = 'TestDefaultDataValue',
  dataHeapEvent,
  disabled = false,
  icon,
  labelText,
  labelTextPosition = 'right',
  onClick,
  visible = true,
  ...rest
}) => {
  const Icon = icon;
  let inTimeout;
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const labelPosition = labelPositionTypes.includes(
    labelTextPosition.toLowerCase()
  )
    ? labelTextPosition.toLocaleLowerCase()
    : 'right';

  const showTooltip = () => {
    inTimeout = setTimeout(() => {
      window.localStorage.setItem('kedro-viz-tooltip-show', true);
      setIsTooltipVisible(true);
    }, 333);
  };

  const hideTooltip = () => {
    clearTimeout(inTimeout);
    setIsTooltipVisible(false);
  };

  return visible ? (
    <Wrapper container={container} {...rest}>
      <button
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className={classnames(className, {
          'pipeline-icon-toolbar__button': true,
          'pipeline-icon-toolbar__button--active': active,
        })}
        data-test={dataTest}
        data-heap-event={dataHeapEvent}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {Icon && <Icon className="pipeline-icon" />}
        {labelText && (
          <span
            className={classnames(
              'pipeline-toolbar__label',
              {
                'pipeline-toolbar__label__visible': isTooltipVisible,
              },
              `pipeline-toolbar__label-${labelPosition}`
            )}
          >
            {labelText}
          </span>
        )}
      </button>
      {children}
    </Wrapper>
  ) : null;
};

const Wrapper = ({ children, container: Container = 'li', ...rest }) => {
  if (typeof Container === 'symbol') {
    return <React.Fragment>{children}</React.Fragment>;
  } else {
    return (
      <Container className="pipeline-icon--container" {...rest}>
        {children}
      </Container>
    );
  }
};

IconButton.propTypes = {
  active: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  children: PropTypes.node,
  dataTest: PropTypes.string,
  dataHeapEvent: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // it takes a string or a JSX element
  onClick: PropTypes.func,
  visible: PropTypes.bool,
};

export default IconButton;
