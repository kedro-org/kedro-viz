import React from 'react';
import classNames from 'classnames';
import Toggle from '../ui/toggle';

import './error-log.scss';

export default function ErrorLog({
  errorHeader = '',
  errorDetails = '',
  className = '',
  onToggleCode,
  dataTest = 'error-log',
}) {
  return (
    <div className={classNames('error-log--wrapper', className)}>
      <Toggle
        id="code"
        dataTest={dataTest}
        title="Show traceback"
        onChange={onToggleCode}
      />

      <div className="error-log--header">{errorHeader}</div>

      <div className="error-log--details">
        <pre dangerouslySetInnerHTML={{ __html: errorDetails }} />
      </div>

      <div className="error-log--footer">
        Please refer to the CLI for the full error log and details.
      </div>
    </div>
  );
}
