import React, { useState } from 'react';
import classnames from 'classnames';

import './accordion.css';

const Accordion = ({
  children,
  heading = 'Heading here',
  headingDetail = null,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="accordion">
      <div className="accordion__heading">
        <div className="accordion__title">
          {heading}
          {headingDetail ? (
            <span className="accordion__title__detail">{headingDetail}</span>
          ) : null}
        </div>
        <button
          aria-label={`${collapsed ? 'Show' : 'Hide'} ${heading.toLowerCase()}`}
          onClick={() => setCollapsed(!collapsed)}
          className={classnames('accordion__toggle', {
            'accordion__toggle--alt': collapsed,
          })}
        />
      </div>
      <div className={collapsed ? 'accordion__content--hide' : null}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;
