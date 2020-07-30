import React from 'react';
import classnames from 'classnames';
import './loading.css';

const d =
  'M11.4 90.3q-1.4-2.4 0-4.7l42.3-73.3q1.3-2.3 4-2.3h84.6q2.7 0 4 2.3l42.4 73.3q1.3 2.3 0 4.7l-42.3 73.2q-1.4 2.4-4.1 2.4H57.7q-2.7 0-4-2.4z';

export default ({ className, visible }) => (
  <svg
    className={classnames(className, 'pipeline-loading-icon', {
      'pipeline-loading-icon--visible': visible
    })}
    viewBox="0 0 200 180">
    <path d={d} />
    <path d={d} />
  </svg>
);
