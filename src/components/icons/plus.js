import React from 'react';
import classnames from 'classnames';

export default ({ className }) => (
  <svg
    className={classnames(className, 'pipeline-icon--stroke')}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path
      transform="translate(-1 1) rotate(90 11.5 12)"
      strokeWidth="2"
      d="M11.5 4L11.5 20"
    />
    <path transform="translate(-1 1)" strokeWidth="2" d="M11.5 4L11.5 20" />
  </svg>
);
