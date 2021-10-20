import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import './accordion.css';

/**
 * A collapsable container component.
 * @param {object} children React children
 * @param {string} heading Text to display on the top-level
 * @param {string|null} headingDetail A secondary text string for additional context
 * @param {string} layout Left or right toggle button
 * @param {string} size Set the header font size
 */
const Accordion = ({
  children,
  className = null,
  heading = '',
  headingClassName = null,
  headingDetail = null,
  hideContent = false,
  hideHeading = false,
  layout = 'right',
  onCallback,
  size = 'small',
}) => {
  const [collapsed, setCollapsed] = useState(hideContent);

  useEffect(() => {
    setCollapsed(hideContent);
  }, [hideContent]);

  const onClick = () => {
    setCollapsed(!collapsed);
    onCallback && onCallback();
  };

  return (
    <div
      className={classnames('accordion', {
        'accordion--left': layout === 'left',
        [`${className}`]: className,
      })}
    >
      <div
        className={classnames('accordion__heading', {
          'accordion__heading--hide': hideHeading,
          [`${headingClassName}`]: headingClassName,
        })}
      >
        {layout === 'left' && (
          <button
            aria-label={`${
              collapsed ? 'Show' : 'Hide'
            } ${heading.toLowerCase()}`}
            onClick={onClick}
            className={classnames('accordion__toggle', {
              'accordion__toggle--alt': collapsed,
            })}
          />
        )}
        <div
          className={classnames('accordion__title', {
            'accordion__title--medium': size === 'medium',
            'accordion__title--large': size === 'large',
          })}
        >
          {heading}
          {headingDetail && (
            <span className="accordion__title__detail">{headingDetail}</span>
          )}
        </div>
        {layout === 'right' && (
          <button
            aria-label={`${
              collapsed ? 'Show' : 'Hide'
            } ${heading.toLowerCase()}`}
            onClick={onClick}
            className={classnames('accordion__toggle', {
              'accordion__toggle--alt': collapsed,
            })}
          />
        )}
      </div>
      <div className={collapsed ? 'accordion__content--hide' : null}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;
