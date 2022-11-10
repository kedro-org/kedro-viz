import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './icon-button.css';
import { useOutsideClick } from '../../../utils/hooks';

const labelPositionTypes = ['right', 'left', 'bottom', 'top'];

/**
 * Icon button component
 */
const IconButton = ({
  active,
  ariaLabel,
  ariaLive,
  children,
  className,
  container = 'li',
  dataHeapEvent,
  disabled,
  icon,
  labelText,
  labelTextPosition = 'right',
  onClick,
  visible,
}) => {
  const Icon = icon;
  let inTimeout;
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const labelPosition = labelPositionTypes.includes(
    labelTextPosition.toLowerCase()
  )
    ? labelTextPosition.toLocaleLowerCase()
    : 'right';

  const clearLocalStorage = () => {
    window.localStorage.removeItem('kedro-viz-tooltip-show');
  };

  useEffect(() => {
    clearLocalStorage();
  }, []);

  const showTooltip = () => {
    if (localStorage.getItem('kedro-viz-tooltip-show') === null) {
      inTimeout = setTimeout(() => {
        window.localStorage.setItem('kedro-viz-tooltip-show', true);
        setIsTooltipVisible(true);
      }, 1000);
    } else {
      setIsTooltipVisible(true);
    }
  };

  const hideTooltip = () => {
    clearTimeout(inTimeout);
    setIsTooltipVisible(false);
  };

  const iconBtnRef = useOutsideClick(clearLocalStorage);

  return visible ? (
    <Wrapper container={container}>
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
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        ref={iconBtnRef}
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

const Wrapper = ({ children, container: Container = 'li' }) => {
  if (typeof Container === 'symbol') {
    return <React.Fragment>{children}</React.Fragment>;
  } else {
    return (
      <Container className="pipeline-icon--container">{children}</Container>
    );
  }
};

IconButton.propTypes = {
  active: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  children: PropTypes.node,
  dataHeapEvent: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
};

IconButton.defaultProps = {
  active: false,
  ariaLabel: null,
  ariaLive: null,
  children: null,
  dataHeapEvent: null,
  disabled: false,
  icon: null,
  labelText: null,
  onClick: null,
  visible: true,
};

export default IconButton;
