import React, { useEffect, useRef, useState } from 'react';
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
  dataTest = 'test-default-btn',
  disabled = false,
  icon,
  labelText,
  labelTextPosition = 'right',
  onClick,
  visible = true,
  ...rest
}) => {
  const Icon = icon;
  const inTimeout = useRef(null);
  const isHovered = useRef(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Clear any pending show-timeout when the button unmounts, so the tooltip
  // can't be shown after the pointer has already left.
  useEffect(() => {
    return () => clearTimeout(inTimeout.current);
  }, []);

  const labelPosition = labelPositionTypes.includes(
    labelTextPosition.toLowerCase()
  )
    ? labelTextPosition.toLocaleLowerCase()
    : 'right';

  const showTooltip = () => {
    isHovered.current = true;
    clearTimeout(inTimeout.current);
    inTimeout.current = setTimeout(() => {
      // Bail out if the pointer left while the timeout was pending.
      if (!isHovered.current) {
        return;
      }
      window.localStorage.setItem('kedro-viz-tooltip-show', true);
      setIsTooltipVisible(true);
    }, 333);
  };

  const hideTooltip = () => {
    isHovered.current = false;
    clearTimeout(inTimeout.current);
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
  disabled: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // it takes a string or a JSX element
  onClick: PropTypes.func,
  visible: PropTypes.bool,
};

export default IconButton;
