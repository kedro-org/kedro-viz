import React from 'react';
import classNames from 'classnames';
import Toggle from '../ui/toggle';

import './error-log.scss';

const ERROR_MESSAGES = {
  noError: 'No error details available.',
  unknownError: 'An unknown error occurred.',
  genericDataError: 'Failed while loading/saving data to/from dataset.',
  genericFunctionError: (name) =>
    `Failed while performing function: ${name || 'Unknown'}`,
  loadingOrSaving: (operation) =>
    `Failed while ${operation} data ${
      operation === 'loading' ? 'from' : 'to'
    } dataset.`,
  footer: 'Please refer to the CLI for the full error log and details.',
};

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
        <div className="error-log--message">{ERROR_MESSAGES.noError}</div>
      </div>
    );
  }

  const errorMessage = errorDetails.message || ERROR_MESSAGES.unknownError;

  const getErrorHeader = () => {
    if (isDataNode) {
      const operation = errorDetails.error_operation;
      if (operation) {
        return ERROR_MESSAGES.loadingOrSaving(operation);
      }
      return ERROR_MESSAGES.genericDataError;
    }

    return ERROR_MESSAGES.genericFunctionError(nodeName);
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

      <div className="error-log--footer">{ERROR_MESSAGES.footer}</div>
    </div>
  );
}
