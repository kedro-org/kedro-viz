import React from 'react';
import classnames from 'classnames';

import './sliced-pipeline-notification.scss';

export const SlicedPipelineNotification = ({
  notification,
  visibleSidebar,
}) => {
  return (
    <div
      className={classnames('sliced-pipeline-notification', {
        'sliced-pipeline-notification--no-sidebar': !visibleSidebar,
      })}
    >
      {notification}
    </div>
  );
};
