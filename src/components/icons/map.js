import React from 'react';
import classnames from 'classnames';

export default ({ className }) => (
  <svg
    className={classnames(className, 'pipeline-icon--stroke')}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20">
    <path
      transform="translate(-3 -4)"
      strokeWidth="2"
      d="M20.573 6.875L15.352 8.75l-6-3.75L4 6.875v12.96l5.352-2.085 6 3.75 5.221-2.736zM15.352 8v12.75M9.352 5v12.75"
    />
  </svg>
);
