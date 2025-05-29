import React from 'react';
import classnames from 'classnames';
import SuccessIcon from '../icons/success';
import FailureIcon from '../icons/failure';
import './run-status-notification.scss';

export const RunStatusNotification = ({
  timestamp,
  visibleSidebar,
  status, // 'success' or 'failure'
}) => {
  const Icon = status === 'success' ? SuccessIcon : FailureIcon;
  const statusText =
    status === 'success'
      ? 'Run execution completed successfully'
      : 'Run execution failed';
  const timestampLabel = status === 'success' ? 'Completed on' : 'Failed on';

  return (
    <div
      className={classnames(
        'run-status-notification',
        `run-status-notification--${status}`,
        {
          'run-status-notification--no-sidebar': !visibleSidebar,
        }
      )}
    >
      <div className="run-status-notification__status">
        <span className="run-status-notification__icon">
          <Icon />
        </span>
        <span className="run-status-notification__text">{statusText}</span>
      </div>

      <div className="run-status-notification__divider" />

      <div className="run-status-notification__timestamp">
        {timestampLabel} {timestamp}
      </div>
    </div>
  );
};
