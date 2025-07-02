import React from 'react';
import classNames from 'classnames';
import Toggle from '../ui/toggle';

import './error-log.scss';

/**
 * ErrorLog component displays error information with a toggleable traceback
 */
export default function ErrorLog({
  errorDetails,
  className = '',
  onToggleCode,
  dataTest = 'error-log',
  visibleTraceback = false,
  isDataNode = false,
  nodeName = '',
}) {
  // Early return if no error details provided
  if (!errorDetails) {
    return (
      <div className={classNames('error-log--wrapper', className)}>
        <div className="error-log--message">No error details available.</div>
      </div>
    );
  }

  const errorMessage = errorDetails.message || 'An unknown error occurred.';

  const getErrorHeader = () => {
    if (isDataNode) {
      const operation = errorDetails.error_operation;
      if (operation) {
        const toOrFrom = operation === 'loading' ? 'from' : 'to';
        return `Failed while ${operation} data ${toOrFrom} dataset.`;
      }
      return 'Failed while loading/saving data to/from dataset.';
    }

    return `Failed while performing function: ${nodeName || 'Unknown'}`;
  };

  return (
    <div className={classNames('error-log--wrapper', className)}>
      <Toggle
        id="code"
        dataTest={dataTest}
        title="Show traceback"
        onChange={onToggleCode}
        checked={visibleTraceback}
      />

      <div className="error-log--header">{getErrorHeader()}</div>

      <div className="error-log--details">
        <pre dangerouslySetInnerHTML={{ __html: errorMessage }} />
      </div>

      <div className="error-log--footer">
        Please refer to the CLI for the full error log and details.
      </div>
    </div>
  );
}
