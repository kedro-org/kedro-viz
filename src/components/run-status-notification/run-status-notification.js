import React from 'react';
import classnames from 'classnames';
import SuccessIcon from '../icons/success';
import FailureIcon from '../icons/failure';
import './run-status-notification.scss';
import { formatDuration } from '../workflow/workflow-utils/format';

const STATUS_CONFIG = {
  success: {
    icon: SuccessIcon,
    text: 'Run execution completed successfully',
    timestampLabel: 'Completed on',
  },
  failed: {
    icon: FailureIcon,
    text: 'Run execution failed',
    timestampLabel: 'Failed on',
  },
};

export const RunStatusNotification = ({
  timestamp,
  visibleSidebar,
  visibleMetaSidebar,
  status,
  duration = 0,
}) => {
  const config = STATUS_CONFIG[status] || {};
  const Icon = config.icon;
  const statusText = config.text;
  const timestampLabel = config.timestampLabel;

  return (
    <div
      className={classnames(
        'run-status-notification',
        `run-status-notification--${status}`,
        {
          'run-status-notification--no-sidebar': !visibleSidebar,
          'run-status-notification--with-meta-sidebar': visibleMetaSidebar,
        }
      )}
    >
      <div className="run-status-notification__status">
        <span className="run-status-notification__icon">
          {Icon && <Icon />}
        </span>
        <span className="run-status-notification__text">
          {statusText}
          {status === 'success' && duration > 0 && (
            <> in {formatDuration(duration)}</>
          )}
        </span>
      </div>

      <div className="run-status-notification__divider" />

      <div className="run-status-notification__timestamp">
        {timestampLabel} {timestamp}
      </div>
    </div>
  );
};
