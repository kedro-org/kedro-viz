import React, { useEffect, useState } from 'react';
import { generatePath } from 'react-router-dom';
import classnames from 'classnames';
import { routes } from '../../../config';
import {
  ExperimentTrackingTooltip,
  tooltipDefaultProps,
} from '../tooltip/tooltip';

import './accordion.css';

/**
 * A collapsable container component.
 * @param {Object} children React children
 * @param {String|null} className A top-level class name for the component.
 * @param {String} heading Text to display on the top-level.
 * @param {String|null} headingClassName A class name for the accordion header.
 * @param {String|null} headingDetail Text to display on the top-level.
 * @param {Boolean} isCollapsed Control to collapse or expand the content.
 * @param {String|null} layout A secondary text string for additional context
 * @param {Function} onCallback Fire a function on click from a parent.
 * @param {String} size Set the header font size.
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
  const [showTooltip, setShowTooltip] = useState(tooltipDefaultProps);

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const onClick = () => {
    setCollapsed(!collapsed);
    onCallback && onCallback();
  };

  const onMouseOverTitleMedium = (e) => {
    if (e) {
      e.persist();
      const elementWidth = e.currentTarget?.clientWidth + 30;

      const tooltipTimeout = setTimeout(() => {
        setShowTooltip({
          content: {
            label1: 'Link out destination:',
            value1: 'Show me where this dataset is located  in the flowchart',
          },
          direction: 'right-middle',
          position: { x: elementWidth + 10, y: -20 },
          visible: true,
        });
      }, 300);

      return () => clearTimeout(tooltipTimeout);
    }
  };

  return (
    <div
      className={classnames('accordion', {
        'accordion--left': layout === 'left',
        [`${className}`]: className,
      })}
    >
      <ExperimentTrackingTooltip
        content={showTooltip.content}
        direction={showTooltip.direction}
        position={showTooltip.position}
        visible={showTooltip.visible}
      />
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
          onClick={() => {
            // maybe we should get an extra flag to show if this is a sub-heading?
            // rather just relying on the size
            if (size === 'medium') {
              const url = generatePath(routes.flowchart.selectedName, {
                pipelineId: '__default__',
                fullName: heading,
              });

              window.open(url, '_blank');
            }
          }}
          onMouseOver={onMouseOverTitleMedium}
          onMouseLeave={() => setShowTooltip(tooltipDefaultProps)}
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
