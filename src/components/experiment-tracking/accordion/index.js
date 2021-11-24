import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import './accordion.css';

/**
 * A collapsable container component.
 * @param {object} children React children
 * @param {string|null} className A top-level class name for the component.
 * @param {string} heading Text to display on the top-level.
 * @param {string|null} headingClassName A class name for the accordion header.
 * @param {string|null} headingDetail Text to display on the top-level.
 * @param {boolean} isCollapsed Control to collapse or expand the content.
 * @param {string|null} layout A secondary text string for additional context
 * @param {function} onCallback Fire a function on click from a parent.
 * @param {string} size Set the header font size.
 */
const Accordion = ({
  children,
  className = null,
  heading = '',
  headingClassName = null,
  headingDetail = null,
  isCollapsed = false,
  layout = 'right',
  onCallback,
  size = 'small',
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

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
