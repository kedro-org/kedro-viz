import React from 'react';
import classnames from 'classnames';
import './runner.scss';

/**
 * RunnerIcon: simple play triangle for the Runner page.
 */
const RunnerIcon = ({ className }) => {
  return (
    <svg
      className={classnames('pipeline-runner-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 6 L8 18 L18 12 Z" />
    </svg>
  );
};

export default RunnerIcon;
